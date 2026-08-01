import { Readable } from "node:stream";

import { readVideoTrimmerDownload } from "@/lib/server/video-trimmer-queue";
import { resolveActor } from "@/lib/server/entitlements/service";
import {
  assertValidJobId,
  assertValidSignedValue,
  createRequestId,
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
  const requestId = createRequestId();

  try {
    const { id } = await params;
    const security = await enforceApiSecurity(request, {
      route: "video-trimmer.download",
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
      logSecurityEvent("warn", "video_trimmer_download_signature_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        jobId: assertValidJobId(id) ? id : null,
      });
      return securityJson(
        { ok: false, error: { message: "A signed download URL is required." } },
        { status: 403, requestId: security.requestId },
      );
    }

    // Security Correction #4 — same defense-in-depth as the compression download route:
    // even a valid, leaked signed URL no longer grants a download unless the requester is
    // also the actor who created the job. Rejected identically to an expired/missing
    // download (404), never a distinct "wrong owner" response.
    const actor = await resolveActor(request);
    const download = await readVideoTrimmerDownload(id, token, signature, actor);

    if (!download) {
      return securityJson(
        { ok: false, error: { message: "The download is unavailable or expired." } },
        { status: 404, requestId: security.requestId },
      );
    }

    logSecurityEvent("info", "video_trimmer_download_served", {
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
  } catch (error) {
    logSecurityEvent("error", "video_trimmer_download_unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });

    return securityJson(
      { ok: false, error: { message: "Unable to prepare the download." } },
      { status: 500, requestId },
    );
  }
}
