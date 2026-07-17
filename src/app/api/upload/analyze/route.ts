import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { analyzeWithFfprobe } from "@/lib/server/ffprobe";
import {
  enforceApiSecurity,
  logSecurityEvent,
  rejectOversizedRequest,
  securityJson,
} from "@/lib/server/security";
import { validateFileIdentity } from "@/lib/server/upload-validation";
import {
  MAX_UPLOAD_REQUEST_BYTES,
  type UploadAnalysis,
  type UploadValidationError,
} from "@/lib/upload-policy";

export const runtime = "nodejs";

const uploadFieldName = "file";

function errorResponse(error: UploadValidationError, status = 400, requestId?: string) {
  return securityJson({ ok: false, error }, { status, requestId });
}

function sanitizeExtension(fileName: string) {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
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

  const oversizedResponse = rejectOversizedRequest(
    request,
    MAX_UPLOAD_REQUEST_BYTES,
    security.requestId,
  );

  if (oversizedResponse) {
    return oversizedResponse;
  }

  let temporaryPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get(uploadFieldName);

    if (!(file instanceof File)) {
      return errorResponse(
        {
          code: "missing_file",
          message: "Upload a single video file for validation.",
        },
        400,
        security.requestId,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validationError = validateFileIdentity(file, bytes.slice(0, 16));

    if (validationError) {
      logSecurityEvent("warn", "upload_validation_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: validationError.code,
      });
      return errorResponse(validationError, 400, security.requestId);
    }

    const uploadDirectory = path.join(os.tmpdir(), "qavelix-upload-analysis");
    await mkdir(uploadDirectory, { recursive: true });

    const extension = sanitizeExtension(file.name);
    temporaryPath = path.join(uploadDirectory, `${randomUUID()}${extension}`);

    await writeFile(temporaryPath, bytes, {
      flag: "wx",
      mode: 0o600,
    });

    let media: UploadAnalysis["media"];

    try {
      media = await analyzeWithFfprobe(temporaryPath);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "FFprobe could not analyze the selected file.";
      const isUnavailable = message.toLowerCase().includes("enoent");

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
      size: file.size,
      mimeType: file.type,
    });

    return securityJson(
      {
        ok: true,
        analysis: {
          file: {
            name: file.name,
            size: file.size,
            mimeType: file.type,
            extension,
          },
          media,
        } satisfies UploadAnalysis,
      },
      { requestId: security.requestId },
    );
  } catch {
    logSecurityEvent("error", "upload_analysis_failed", {
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
      await rm(temporaryPath, { force: true });
    }
  }
}
