import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";

import type { EntitlementDenialReason } from "@/lib/server/entitlements/errors";
import { entitlementErrorPayload, statusForDenialReason } from "@/lib/server/entitlements/errors";
import { getAnonymousLimits, getToolLimits } from "@/lib/server/entitlements/policy";
import {
  confirmUsage,
  releaseUsage,
  reserveUsage,
  resolveActor,
} from "@/lib/server/entitlements/service";
import {
  createExtractedAudioFileName,
  extractMp3Audio,
  ExtractAudioError,
  assertAudibleAudio,
  verifyExtractedMp3,
} from "@/lib/server/extract-audio";
import { analyzeWithFfprobe } from "@/lib/server/ffprobe";
import {
  enforceApiSecurity,
  logSecurityEvent,
  securityJson,
} from "@/lib/server/security";
import { validateFileIdentity } from "@/lib/server/upload-validation";
import { MIN_UPLOAD_BYTES, type UploadValidationError } from "@/lib/upload-policy";

export const runtime = "nodejs";

const fileNameHeader = "x-qavelix-file-name";
const fileSizeHeader = "x-qavelix-file-size";
const fileTypeHeader = "x-qavelix-file-type";
const signatureByteLength = 16;
const extractionDirectory = path.join(os.tmpdir(), "qavelix-extract-audio");

class ExtractAudioRouteError extends Error {
  constructor(
    readonly event: string,
    readonly error: UploadValidationError,
    readonly status = 400,
  ) {
    super(error.message);
  }
}

function errorResponse(error: UploadValidationError, status = 400, requestId?: string) {
  return securityJson({ ok: false, error }, { status, requestId });
}

// Same response shape as errorResponse(), but for entitlement denials — these carry
// their own code space (EntitlementDenialReason), not UploadValidationErrorCode, since
// "you're out of quota" is a different kind of rejection than "this file is invalid".
function entitlementErrorResponse(reason: EntitlementDenialReason, requestId: string) {
  return securityJson(
    { ok: false, error: entitlementErrorPayload(reason) },
    { status: statusForDenialReason(reason), requestId },
  );
}

function sanitizeFileName(fileName: string) {
  return path
    .basename(fileName)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .trim();
}

function decodeHeaderValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeExtension(fileName: string) {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
}

function parseDeclaredSize(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  return Number.isSafeInteger(parsed) ? parsed : null;
}

function getUploadMetadata(request: Request, maxUploadBytes: number) {
  const rawFileName = request.headers.get(fileNameHeader);
  const fileType = request.headers.get(fileTypeHeader)?.trim() ?? "";
  const declaredSize = parseDeclaredSize(request.headers.get(fileSizeHeader));

  if (!rawFileName?.trim()) {
    throw new ExtractAudioRouteError("extract_audio_header_invalid", {
      code: "missing_file",
      message: "Upload a single video file for audio extraction.",
    });
  }

  const fileName = sanitizeFileName(decodeHeaderValue(rawFileName));

  if (!fileName) {
    throw new ExtractAudioRouteError("extract_audio_header_invalid", {
      code: "missing_file",
      message: "Upload a single video file for audio extraction.",
    });
  }

  if (declaredSize === null) {
    throw new ExtractAudioRouteError("extract_audio_size_header_invalid", {
      code: "invalid_size",
      message: "The declared file size is invalid.",
    });
  }

  if (declaredSize === 0) {
    throw new ExtractAudioRouteError("extract_audio_size_header_invalid", {
      code: "empty_file",
      message: "The selected file is empty.",
    });
  }

  if (declaredSize < MIN_UPLOAD_BYTES) {
    throw new ExtractAudioRouteError("extract_audio_size_header_invalid", {
      code: "file_too_small",
      message: "The selected file is below the minimum upload size.",
    });
  }

  if (declaredSize > maxUploadBytes) {
    throw new ExtractAudioRouteError("extract_audio_declared_size_rejected", {
      code: "file_too_large",
      message: "The selected file exceeds the upload limit.",
    });
  }

  return {
    fileName,
    fileType,
    declaredSize,
    extension: sanitizeExtension(fileName),
  };
}

async function readSignaturePrefix(filePath: string) {
  const file = await open(filePath, "r");

  try {
    const prefix = new Uint8Array(signatureByteLength);
    const { bytesRead } = await file.read(prefix, 0, signatureByteLength, 0);

    return prefix.slice(0, bytesRead);
  } finally {
    await file.close();
  }
}

async function streamRequestBodyToDisk(
  request: Request,
  filePath: string,
  declaredSize: number,
  maxUploadBytes: number,
) {
  if (!request.body) {
    throw new ExtractAudioRouteError("extract_audio_body_missing", {
      code: "missing_file",
      message: "Upload a single video file for audio extraction.",
    });
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const parsedContentLength = parseDeclaredSize(contentLength);

    if (parsedContentLength === null) {
      throw new ExtractAudioRouteError("extract_audio_content_length_invalid", {
        code: "invalid_size",
        message: "The declared file size is invalid.",
      });
    }

    if (parsedContentLength < MIN_UPLOAD_BYTES) {
      throw new ExtractAudioRouteError("extract_audio_content_length_rejected", {
        code: "file_too_small",
        message: "The selected file is below the minimum upload size.",
      });
    }

    if (parsedContentLength > maxUploadBytes) {
      throw new ExtractAudioRouteError("extract_audio_content_length_rejected", {
        code: "file_too_large",
        message: "The selected file exceeds the upload limit.",
      });
    }

    if (parsedContentLength !== declaredSize) {
      throw new ExtractAudioRouteError("extract_audio_size_mismatch", {
        code: "invalid_size",
        message: "The uploaded file size does not match the declared size.",
      });
    }
  }

  const reader = request.body.getReader();
  const writable = createWriteStream(filePath, {
    flags: "wx",
    mode: 0o600,
  });
  let receivedBytes = 0;
  let streamClosed = false;

  function destroyWritable(error?: Error) {
    if (!streamClosed) {
      writable.destroy(error);
    }
  }

  async function waitForWritableClose() {
    if (streamClosed) {
      return;
    }

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 250);

      writable.once("close", () => {
        clearTimeout(timeout);
        resolve();
      });
      writable.once("error", () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }

  request.signal.addEventListener("abort", () => {
    destroyWritable(new Error("Upload request was aborted."));
  });

  writable.on("close", () => {
    streamClosed = true;
  });

  async function writeChunk(chunk: Uint8Array) {
    if (writable.write(chunk)) {
      return;
    }

    await Promise.race([
      once(writable, "drain"),
      once(writable, "error").then(([error]) => {
        throw error;
      }),
    ]);
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      receivedBytes += value.byteLength;

      if (receivedBytes > maxUploadBytes) {
        throw new ExtractAudioRouteError("extract_audio_real_size_rejected", {
          code: "file_too_large",
          message: "The selected file exceeds the upload limit.",
        });
      }

      if (receivedBytes > declaredSize) {
        throw new ExtractAudioRouteError("extract_audio_size_mismatch", {
          code: "invalid_size",
          message: "The uploaded file size does not match the declared size.",
        });
      }

      await writeChunk(value);
    }

    if (receivedBytes !== declaredSize) {
      throw new ExtractAudioRouteError("extract_audio_truncated", {
        code: "truncated_upload",
        message: "The uploaded file ended before the declared file size was received.",
      });
    }

    if (receivedBytes < MIN_UPLOAD_BYTES) {
      throw new ExtractAudioRouteError("extract_audio_real_size_rejected", {
        code: "file_too_small",
        message: "The selected file is below the minimum upload size.",
      });
    }

    await new Promise<void>((resolve, reject) => {
      writable.once("error", reject);
      writable.end(resolve);
    });

    return receivedBytes;
  } catch (error) {
    destroyWritable(error instanceof Error ? error : undefined);
    await waitForWritableClose();
    throw error;
  } finally {
    reader.releaseLock();
  }
}

function createStreamingDownloadResponse({
  outputPath,
  outputSize,
  fileName,
  requestId,
  workDirectory,
}: {
  outputPath: string;
  outputSize: number;
  fileName: string;
  requestId: string;
  workDirectory: string;
}) {
  const downloadName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const stream = createReadStream(outputPath);

  stream.on("close", () => {
    void rm(workDirectory, { recursive: true, force: true });
  });

  stream.on("error", () => {
    void rm(workDirectory, { recursive: true, force: true });
  });

  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": String(outputSize),
      "Content-Type": "audio/mpeg",
      "X-Content-Type-Options": "nosniff",
      "X-Qavelix-Output-File-Name": encodeURIComponent(fileName),
      "X-Qavelix-Output-File-Size": String(outputSize),
      "X-Request-Id": requestId,
    },
  });
}

export async function POST(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "extract-audio.process",
    limit: 6,
    windowMs: 60_000,
    requireSameOrigin: true,
  });

  if (!security.ok) {
    return security.response;
  }

  let workDirectory: string | null = null;
  let usageEventId: string | null = null;
  let usageConfirmed = false;

  try {
    const actor = await resolveActor(request);
    const limits =
      actor.type === "anonymous" ? getAnonymousLimits() : getToolLimits(actor.plan, "extract-audio");

    const metadata = getUploadMetadata(request, limits.maxUploadBytes);
    const identity = {
      name: metadata.fileName,
      size: metadata.declaredSize,
      type: metadata.fileType,
    };
    const earlyValidationError = validateFileIdentity(identity, new Uint8Array(), limits.maxUploadBytes);

    if (
      earlyValidationError &&
      earlyValidationError.code !== "invalid_signature"
    ) {
      logSecurityEvent("warn", "extract_audio_validation_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: earlyValidationError.code,
      });
      return errorResponse(earlyValidationError, 400, security.requestId);
    }

    // Reserved before accepting the upload body: an actor already out of quota is
    // rejected without spending bandwidth/disk on a file that could never be processed,
    // and this is well before any FFmpeg/ffprobe work starts.
    const reservation = await reserveUsage(actor, "extract-audio", security.requestId);

    if (!reservation.allowed) {
      logSecurityEvent("warn", "extract_audio_usage_denied", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        reason: reservation.reason,
      });
      return entitlementErrorResponse(reservation.reason, security.requestId);
    }

    usageEventId = reservation.usageEventId;

    workDirectory = path.join(extractionDirectory, randomUUID());
    await mkdir(workDirectory, { recursive: true });

    const inputPath = path.join(workDirectory, `input${metadata.extension}`);
    const outputFileName = createExtractedAudioFileName(metadata.fileName);
    const outputPath = path.join(workDirectory, "output.mp3");
    const receivedBytes = await streamRequestBodyToDisk(
      request,
      inputPath,
      metadata.declaredSize,
      limits.maxUploadBytes,
    );
    const signaturePrefix = await readSignaturePrefix(inputPath);
    const validationError = validateFileIdentity(identity, signaturePrefix, limits.maxUploadBytes);

    if (validationError) {
      logSecurityEvent("warn", "extract_audio_validation_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: validationError.code,
      });
      return errorResponse(validationError, 400, security.requestId);
    }

    let media: Awaited<ReturnType<typeof analyzeWithFfprobe>>;

    try {
      media = await analyzeWithFfprobe(inputPath);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "FFprobe could not analyze the selected file.";
      const isUnavailable = message.toLowerCase().includes("enoent");

      logSecurityEvent("warn", "extract_audio_ffprobe_failed", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        unavailable: isUnavailable,
      });

      return errorResponse(
        {
          code: isUnavailable ? "ffprobe_unavailable" : "ffprobe_failed",
          message: isUnavailable
            ? "FFprobe is not available in this runtime."
            : "FFprobe could not analyze the selected file.",
        },
        isUnavailable ? 503 : 422,
        security.requestId,
      );
    }

    if (!media.audioCodec) {
      logSecurityEvent("warn", "extract_audio_no_audio_stream", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
      });
      return errorResponse(
        {
          code: "no_audio",
          message: "The selected video does not include an audio track.",
        },
        422,
        security.requestId,
      );
    }

    try {
      await assertAudibleAudio(inputPath, media.durationSeconds);
    } catch (error) {
      const code = error instanceof ExtractAudioError ? error.code : "ffmpeg_failed";
      const status = code === "timeout" ? 504 : 422;

      logSecurityEvent("warn", "extract_audio_audibility_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code,
      });

      return errorResponse(
        {
          code:
            code === "silent_audio"
              ? "silent_audio"
              : code === "timeout"
                ? "processing_timeout"
                : "ffmpeg_failed",
          message:
            code === "silent_audio"
              ? "The selected video does not contain audible audio."
              : "Audio analysis failed.",
        },
        status,
        security.requestId,
      );
    }

    try {
      await extractMp3Audio(inputPath, outputPath);
      const output = await verifyExtractedMp3(outputPath);

      logSecurityEvent("info", "extract_audio_completed", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        inputSize: receivedBytes,
        outputSize: output.size,
      });

      if (usageEventId) {
        await confirmUsage(usageEventId);
        usageConfirmed = true;
      }

      const response = createStreamingDownloadResponse({
        outputPath,
        outputSize: output.size,
        fileName: outputFileName,
        requestId: security.requestId,
        workDirectory,
      });
      workDirectory = null;

      return response;
    } catch (error) {
      const code =
        error instanceof ExtractAudioError ? error.code : "ffmpeg_failed";
      const status = code === "timeout" ? 504 : 422;

      logSecurityEvent("warn", "extract_audio_ffmpeg_failed", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code,
      });

      return errorResponse(
        {
          code: code === "timeout" ? "processing_timeout" : "ffmpeg_failed",
          message:
            code === "timeout"
              ? "Audio extraction timed out."
              : "Audio extraction failed.",
        },
        status,
        security.requestId,
      );
    }
  } catch (error) {
    if (error instanceof ExtractAudioRouteError) {
      logSecurityEvent("warn", error.event, {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: error.error.code,
      });
      return errorResponse(error.error, error.status, security.requestId);
    }

    logSecurityEvent("error", "extract_audio_unexpected_failure", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
    });
    return errorResponse(
      {
        code: "ffmpeg_failed",
        message: "The upload could not be processed. Try another supported video file.",
      },
      500,
      security.requestId,
    );
  } finally {
    if (workDirectory) {
      try {
        await rm(workDirectory, { recursive: true, force: true });
      } catch {
        logSecurityEvent("error", "extract_audio_cleanup_failed", {
          requestId: security.requestId,
          fingerprint: security.fingerprint,
        });
      }
    }

    // Any path that returns without confirming (validation failure, ffprobe/ffmpeg
    // failure, an uncaught error) gives the reserved slot back rather than leaving it
    // permanently counted against the actor for work that never actually succeeded.
    if (usageEventId && !usageConfirmed) {
      await releaseUsage(usageEventId);
    }
  }
}
