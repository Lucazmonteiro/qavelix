import { Readable } from "node:stream";

import { readCompressionDownload } from "@/lib/server/compression-queue";
import {
  assertValidJobId,
  assertValidSignedValue,
  enforceApiSecurity,
  logSecurityEvent,
  securityJson,
} from "@/lib/server/security";

export const runtime = "nodejs";

type DownloadRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: DownloadRouteProps) {
  const { id } = await params;
  const security = enforceApiSecurity(request, {
    route: "compression.download",
    limit: 60,
    windowMs: 60_000,
  });

  if (!security.ok) {
    return security.response;
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const signature = url.searchParams.get("signature");

  if (
    !assertValidJobId(id) ||
    !token ||
    !signature ||
    !assertValidSignedValue(token) ||
    !assertValidSignedValue(signature)
  ) {
    logSecurityEvent("warn", "download_signature_rejected", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      jobId: assertValidJobId(id) ? id : null,
    });
    return securityJson(
      { ok: false, error: { message: "A signed download URL is required." } },
      { status: 403, requestId: security.requestId },
    );
  }

  const download = await readCompressionDownload(id, token, signature);

  if (!download) {
    return securityJson(
      { ok: false, error: { message: "The download is unavailable or expired." } },
      { status: 404, requestId: security.requestId },
    );
  }

  logSecurityEvent("info", "download_served", {
    requestId: security.requestId,
    fingerprint: security.fingerprint,
    jobId: id,
  });

  return new Response(Readable.toWeb(download.stream) as ReadableStream, {
    headers: {
      "Content-Type": download.contentType,
      "Content-Length": String(download.contentLength),
      "Content-Disposition": `attachment; filename="${download.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": security.requestId,
    },
  });
}
