import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { NextResponse } from "next/server";

import { analyzeWithFfprobe } from "@/lib/server/ffprobe";
import { validateFileIdentity } from "@/lib/server/upload-validation";
import type { UploadAnalysis, UploadValidationError } from "@/lib/upload-policy";

export const runtime = "nodejs";

const uploadFieldName = "file";

function errorResponse(error: UploadValidationError, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function sanitizeExtension(fileName: string) {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
}

export async function POST(request: Request) {
  let temporaryPath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get(uploadFieldName);

    if (!(file instanceof File)) {
      return errorResponse({
        code: "missing_file",
        message: "Upload a single video file for validation.",
      });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const validationError = validateFileIdentity(file, bytes.slice(0, 16));

    if (validationError) {
      return errorResponse(validationError);
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
      );
    }

    return NextResponse.json({
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
    });
  } catch {
    return errorResponse(
      {
        code: "ffprobe_failed",
        message: "The upload could not be processed. Try another supported video file.",
      },
      500,
    );
  } finally {
    if (temporaryPath) {
      await rm(temporaryPath, { force: true });
    }
  }
}
