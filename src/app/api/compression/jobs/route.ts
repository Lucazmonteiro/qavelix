import { NextResponse } from "next/server";

import { isCompressionPresetId } from "@/lib/compression-policy";
import { createCompressionJob } from "@/lib/server/compression-queue";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const preset = formData.get("preset");

  if (!(file instanceof File)) {
    return jsonError("Upload a single video file for compression.");
  }

  if (typeof preset !== "string" || !isCompressionPresetId(preset)) {
    return jsonError("Choose a supported compression preset.");
  }

  const result = await createCompressionJob(file, preset);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, job: result.job }, { status: 202 });
}
