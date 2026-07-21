import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, open, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { once } from "node:events";

import { analyzeWithFfprobe } from "@/lib/server/ffprobe";
import {
  enforceApiSecurity,
  logSecurityEvent,
  securityJson,
} from "@/lib/server/security";
import { validateFileIdentity } from "@/lib/server/upload-validation";
import {
  MAX_UPLOAD_BYTES,
  type UploadAnalysis,
  type UploadValidationError,
} from "@/lib/upload-policy";

export const runtime = "nodejs";

const fileNameHeader = "x-qavelix-file-name";
const fileSizeHeader = "x-qavelix-file-size";
const fileTypeHeader = "x-qavelix-file-type";
const signatureByteLength = 16;
const uploadDirectory = path.join(os.tmpdir(), "qavelix-upload-analysis");

class UploadRouteError extends Error {
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

function getUploadMetadata(request: Request) {
  const rawFileName = request.headers.get(fileNameHeader);
  const fileType = request.headers.get(fileTypeHeader)?.trim() ?? "";
  const declaredSize = parseDeclaredSize(request.headers.get(fileSizeHeader));

  if (!rawFileName?.trim()) {
    throw new UploadRouteError("upload_header_invalid", {
      code: "missing_file",
      message: "Upload a single video file for validation.",
    });
  }

  const fileName = sanitizeFileName(decodeHeaderValue(rawFileName));

  if (!fileName) {
    throw new UploadRouteError("upload_header_invalid", {
      code: "missing_file",
      message: "Upload a single video file for validation.",
    });
  }

  if (declaredSize === null) {
    throw new UploadRouteError("upload_size_header_invalid", {
      code: "invalid_size",
      message: "The declared file size is invalid.",
    });
  }

  if (declaredSize === 0) {
    throw new UploadRouteError("upload_size_header_invalid", {
      code: "empty_file",
      message: "The selected file is empty.",
    });
  }

  if (declaredSize > MAX_UPLOAD_BYTES) {
    throw new UploadRouteError("upload_declared_size_rejected", {
      code: "file_too_large",
      message: `The selected file exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB upload limit.`,
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
) {
  if (!request.body) {
    throw new UploadRouteError("upload_body_missing", {
      code: "missing_file",
      message: "Upload a single video file for validation.",
    });
  }

  const contentLength = request.headers.get("content-length");

  if (contentLength !== null) {
    const parsedContentLength = parseDeclaredSize(contentLength);

    if (parsedContentLength === null) {
      throw new UploadRouteError("upload_content_length_invalid", {
        code: "invalid_size",
        message: "The declared file size is invalid.",
      });
    }

    if (parsedContentLength > MAX_UPLOAD_BYTES) {
      throw new UploadRouteError("upload_content_length_rejected", {
        code: "file_too_large",
        message: `The selected file exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB upload limit.`,
      });
    }

    if (parsedContentLength === 0 && declaredSize > 0) {
      throw new UploadRouteError("upload_body_missing", {
        code: "missing_file",
        message: "Upload a single video file for validation.",
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

      if (receivedBytes > MAX_UPLOAD_BYTES) {
        throw new UploadRouteError("upload_real_size_rejected", {
          code: "file_too_large",
          message: `The selected file exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB upload limit.`,
        });
      }

      if (receivedBytes > declaredSize) {
        throw new UploadRouteError("upload_size_mismatch", {
          code: "invalid_size",
          message: "The uploaded file size does not match the declared size.",
        });
      }

      await writeChunk(value);
    }

    if (receivedBytes !== declaredSize) {
      throw new UploadRouteError("upload_truncated", {
        code: "truncated_upload",
        message: "The uploaded file ended before the declared file size was received.",
      });
    }

    await new Promise<void>((resolve, reject) => {
      writable.once("error", reject);
      writable.end(resolve);
    });

    return receivedBytes;
  } catch (error) {
    destroyWritable(error instanceof Error ? error : undefined);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const security = enforceApiSecurity(request, {
    route: "upload.analyze",
    limit: 10,
    windowMs: 60_000,
    requireSameOrigin: true,
  });

  if (!security.ok) {
    return security.response;
  }

  let temporaryPath: string | null = null;

  try {
    const metadata = getUploadMetadata(request);
    const identity = {
      name: metadata.fileName,
      size: metadata.declaredSize,
      type: metadata.fileType,
    };
    const earlyValidationError = validateFileIdentity(identity, new Uint8Array());

    if (
      earlyValidationError &&
      earlyValidationError.code !== "invalid_signature"
    ) {
      logSecurityEvent("warn", "upload_validation_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: earlyValidationError.code,
      });
      return errorResponse(earlyValidationError, 400, security.requestId);
    }

    await mkdir(uploadDirectory, { recursive: true });

    temporaryPath = path.join(
      uploadDirectory,
      `${randomUUID()}${metadata.extension}`,
    );

    const receivedBytes = await streamRequestBodyToDisk(
      request,
      temporaryPath,
      metadata.declaredSize,
    );
    const signaturePrefix = await readSignaturePrefix(temporaryPath);
    const validationError = validateFileIdentity(identity, signaturePrefix);

    if (validationError) {
      logSecurityEvent("warn", "upload_validation_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: validationError.code,
      });
      return errorResponse(validationError, 400, security.requestId);
    }

    let media: UploadAnalysis["media"];

    try {
      media = await analyzeWithFfprobe(temporaryPath);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "FFprobe could not analyze the selected file.";
      const isUnavailable = message.toLowerCase().includes("enoent");

      logSecurityEvent("warn", "upload_ffprobe_failed", {
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

    logSecurityEvent("info", "upload_analyzed", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      size: receivedBytes,
      mimeType: metadata.fileType,
    });

    return securityJson(
      {
        ok: true,
        analysis: {
          file: {
            name: metadata.fileName,
            size: receivedBytes,
            mimeType: metadata.fileType,
            extension: metadata.extension,
          },
          media,
        } satisfies UploadAnalysis,
      },
      { requestId: security.requestId },
    );
  } catch (error) {
    if (error instanceof UploadRouteError) {
      logSecurityEvent("warn", error.event, {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
      });
      return errorResponse(error.error, error.status, security.requestId);
    }

    logSecurityEvent("error", "upload_stream_failed", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
    });
    return errorResponse(
      {
        code: "ffprobe_failed",
        message: "The upload could not be processed. Try another supported video file.",
      },
      500,
      security.requestId,
    );
  } finally {
    if (temporaryPath) {
      try {
        await rm(temporaryPath, { force: true });
      } catch {
        logSecurityEvent("error", "upload_cleanup_failed", {
          requestId: security.requestId,
          fingerprint: security.fingerprint,
        });
      }
    }
  }
}
