import { NextResponse } from "next/server";

import { readCompressionDownload } from "@/lib/server/compression-queue";

export const runtime = "nodejs";

type DownloadRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: DownloadRouteProps) {
  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const signature = url.searchParams.get("signature");

  if (!token || !signature) {
    return NextResponse.json(
      { ok: false, error: { message: "A signed download URL is required." } },
      { status: 403 },
    );
  }

  const download = await readCompressionDownload(id, token, signature);

  if (!download) {
    return NextResponse.json(
      { ok: false, error: { message: "The download is unavailable or expired." } },
      { status: 404 },
    );
  }

  return new Response(download.bytes, {
    headers: {
      "Content-Type": download.contentType,
      "Content-Disposition": `attachment; filename="${download.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
