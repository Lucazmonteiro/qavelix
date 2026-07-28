import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdir, open, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { getAnonymousLimits, getToolLimits } from "@/lib/server/entitlements/policy";
import { resolveActor } from "@/lib/server/entitlements/service";
import {
  analyzeAudibleAudio,
  ExtractAudioError,
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

type ExtractAudioAnalysisState =
  | "valid_audio"
  | "no_audio_stream"
  | "silent_audio"
  | "invalid_media"
  | "unsupported_format"
  | "file_too_small"
  | "file_too_large"
  | "analysis_failed";

const fileNameHeader = "x-qavelix-file-name";
const fileSizeHeader = "x-qavelix-file-size";
const fileTypeHeader = "x-qavelix-file-type";
const signatureByteLength = 16;
const analysisDirectory = path.join(os.tmpdir(), "qavelix-extract-audio-analysis");

class ExtractAudioAnalysisRouteError extends Error {
  constructor(
    readonly event: string,
    readonly error: UploadValidationError,
    readonly result: ExtractAudioAnalysisState,
    readonly status = 400,
  ) {
    super(error.message);
  }
}

function resultResponse(
  result: ExtractAudioAnalysisState,
  status = 200,
  requestId?: string,
) {
  return securityJson({ ok: result === "valid_audio", result }, { status, requestId });
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

function mapValidationResult(code: UploadValidationError["code"]) {
  switch (code) {
    case "file_too_small":
      return "file_too_small";
    case "file_too_large":
      return "file_too_large";
    case "invalid_extension":
    case "invalid_mime":
      return "unsupported_format";
    default:
      return "invalid_media";
  }
}

function getUploadMetadata(request: Request, maxUploadBytes: number) {
  const rawFileName = request.headers.get(fileNameHeader);
  const fileType = request.headers.get(fileTypeHeader)?.trim() ?? "";
  const declaredSize = parseDeclaredSize(request.headers.get(fileSizeHeader));

  if (!rawFileName?.trim()) {
    throw new ExtractAudioAnalysisRouteError(
      "extract_audio_analysis_header_invalid",
      {
        code: "missing_file",
        message: "Upload a single video file for audio analysis.",
      },
      "invalid_media",
    );
  }

  const fileName = sanitizeFileName(decodeHeaderValue(rawFileName));

  if (!fileName) {
    throw new ExtractAudioAnalysisRouteError(
      "extract_audio_analysis_header_invalid",
      {
        code: "missing_file",
        message: "Upload a single video file for audio analysis.",
      },
      "invalid_media",
    );
  }

  if (declaredSize === null) {
    throw new ExtractAudioAnalysisRouteError(
      "extract_audio_analysis_size_header_invalid",
      {
        code: "invalid_size",
        message: "The declared file size is invalid.",
      },
      "invalid_media",
    );
  }

  if (declaredSize === 0) {
    throw new ExtractAudioAnalysisRouteError(
      "extract_audio_analysis_size_header_invalid",
      {
        code: "empty_file",
        message: "The selected file is empty.",
      },
      "invalid_media",
    );
  }

  if (declaredSize < MIN_UPLOAD_BYTES) {
    throw new ExtractAudioAnalysisRouteError(
      "extract_audio_analysis_size_header_invalid",
      {
        code: "file_too_small",
        message: "The selected file is below the minimum upload size.",
      },
      "file_too_small",
    );
  }

  if (declaredSize > maxUploadBytes) {
    throw new ExtractAudioAnalysisRouteError(
      "extract_audio_analysis_declared_size_rejected",
      {
        code: "file_too_large",
        message: "The selected file exceeds the upload limit.",
      },
      "file_too_large",
      413,
    );
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
    throw new ExtractAudioAnalysisRouteError(
      "extract_audio_analysis_body_missing",
      {
        code: "missing_file",
        message: "Upload a single video file for audio analysis.",
      },
      "invalid_media",
    );
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

  request.signal.addEventListener("abort", () => {
    destroyWritable(new Error("Audio analysis request was aborted."));
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
        throw new ExtractAudioAnalysisRouteError(
          "extract_audio_analysis_real_size_rejected",
          {
            code: "file_too_large",
            message: "The selected file exceeds the upload limit.",
          },
          "file_too_large",
          413,
        );
      }

      if (receivedBytes > declaredSize) {
        throw new ExtractAudioAnalysisRouteError(
          "extract_audio_analysis_size_mismatch",
          {
            code: "invalid_size",
            message: "The uploaded file size does not match the declared size.",
          },
          "invalid_media",
        );
      }

      await writeChunk(value);
    }

    if (receivedBytes !== declaredSize) {
      throw new ExtractAudioAnalysisRouteError(
        "extract_audio_analysis_truncated",
        {
          code: "truncated_upload",
          message: "The uploaded file ended before the declared file size was received.",
        },
        "invalid_media",
      );
    }

    await new Promise<void>((resolve, reject) => {
      writable.once("error", reject);
      writable.end(resolve);
    });
  } catch (error) {
    destroyWritable(error instanceof Error ? error : undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "extract-audio.analyze",
    limit: 8,
    windowMs: 60_000,
    requireSameOrigin: true,
  });

  if (!security.ok) {
    return security.response;
  }

  let workDirectory: string | null = null;

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
      return resultResponse(
        mapValidationResult(earlyValidationError.code),
        400,
        security.requestId,
      );
    }

    workDirectory = path.join(analysisDirectory, randomUUID());
    await mkdir(workDirectory, { recursive: true });

    const inputPath = path.join(workDirectory, `input${metadata.extension}`);
    await streamRequestBodyToDisk(request, inputPath, metadata.declaredSize, limits.maxUploadBytes);

    const signaturePrefix = await readSignaturePrefix(inputPath);
    const validationError = validateFileIdentity(identity, signaturePrefix, limits.maxUploadBytes);

    if (validationError) {
      return resultResponse(
        mapValidationResult(validationError.code),
        400,
        security.requestId,
      );
    }

    const media = await analyzeWithFfprobe(inputPath);

    if (!media.audioCodec) {
      return resultResponse("no_audio_stream", 422, security.requestId);
    }

    const audibility = await analyzeAudibleAudio(inputPath, media.durationSeconds);

    if (audibility.isSilent) {
      return resultResponse("silent_audio", 422, security.requestId);
    }

    return resultResponse("valid_audio", 200, security.requestId);
  } catch (error) {
    if (error instanceof ExtractAudioAnalysisRouteError) {
      logSecurityEvent("warn", error.event, {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: error.error.code,
      });
      return resultResponse(error.result, error.status, security.requestId);
    }

    if (error instanceof ExtractAudioError) {
      const result =
        error.code === "silent_audio"
          ? "silent_audio"
          : error.code === "timeout"
            ? "analysis_failed"
            : "analysis_failed";

      logSecurityEvent("warn", "extract_audio_analysis_failed", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: error.code,
      });
      return resultResponse(result, error.code === "timeout" ? 504 : 422, security.requestId);
    }

    logSecurityEvent("error", "extract_audio_analysis_unexpected_failure", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
    });
    return resultResponse("analysis_failed", 500, security.requestId);
  } finally {
    if (workDirectory) {
      try {
        await rm(workDirectory, { recursive: true, force: true });
      } catch {
        logSecurityEvent("error", "extract_audio_analysis_cleanup_failed", {
          requestId: security.requestId,
          fingerprint: security.fingerprint,
        });
      }
    }
  }
}
