import { NextResponse } from "next/server";

import { cancelCompressionJob, getCompressionJob } from "@/lib/server/compression-queue";

export const runtime = "nodejs";

type JobRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: JobRouteProps) {
  const { id } = await params;
  const job = getCompressionJob(id);

  if (!job) {
    return NextResponse.json(
      { ok: false, error: { message: "Compression job was not found." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, job });
}

export async function DELETE(_request: Request, { params }: JobRouteProps) {
  const { id } = await params;
  const job = await cancelCompressionJob(id);

  if (!job) {
    return NextResponse.json(
      { ok: false, error: { message: "Compression job was not found." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, job });
}
