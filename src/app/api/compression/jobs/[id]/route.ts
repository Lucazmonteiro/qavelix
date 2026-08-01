import { cancelCompressionJob, getCompressionJob } from "@/lib/server/compression-queue";
import { resolveActor } from "@/lib/server/entitlements/service";
import {
  assertValidJobId,
  createRequestId,
  enforceApiSecurity,
  logSecurityEvent,
  securityJson,
} from "@/lib/server/security";

export const runtime = "nodejs";

type JobRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

// Both handlers below are wrapped end-to-end (including enforceApiSecurity itself, which
// hits the database for rate limiting) so that a transient failure anywhere in the chain
// — e.g. a dropped connection to the durable rate-limit/job store — still resolves to a
// real JSON error body instead of an uncaught exception. An uncaught throw from a Route
// Handler has no JSON guarantee (Next.js's own fallback error response isn't one), which
// is exactly what turns into "Unexpected end of JSON input" on any caller that assumes
// every response is JSON, this route's own integration test included. requestId is
// generated up front, before anything that can fail, so it's available either way.
export async function GET(request: Request, { params }: JobRouteProps) {
  const requestId = createRequestId();

  try {
    const { id } = await params;
    const security = await enforceApiSecurity(request, {
      route: "compression.status",
      limit: 120,
      windowMs: 60_000,
    });

    if (!security.ok) {
      return security.response;
    }

    if (!assertValidJobId(id)) {
      return securityJson(
        { ok: false, error: { message: "Compression job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    // Security Correction #4 — a job belonging to a different actor must be
    // indistinguishable from a nonexistent one: getCompressionJob() returns null for
    // both, so this never discloses that a job ID exists but belongs to someone else.
    const actor = await resolveActor(request);
    const job = await getCompressionJob(id, actor);

    if (!job) {
      return securityJson(
        { ok: false, error: { message: "Compression job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    return securityJson({ ok: true, job }, { requestId: security.requestId });
  } catch (error) {
    logSecurityEvent("error", "compression_job_status_unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });

    return securityJson(
      { ok: false, error: { message: "Unable to fetch compression job status." } },
      { status: 500, requestId },
    );
  }
}

export async function DELETE(request: Request, { params }: JobRouteProps) {
  const requestId = createRequestId();

  try {
    const { id } = await params;
    const security = await enforceApiSecurity(request, {
      route: "compression.delete",
      limit: 30,
      windowMs: 60_000,
      requireSameOrigin: true,
    });

    if (!security.ok) {
      return security.response;
    }

    if (!assertValidJobId(id)) {
      return securityJson(
        { ok: false, error: { message: "Compression job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    // Security Correction #4 — same generic-404 authorization boundary as GET above:
    // cancelling someone else's job is rejected identically to cancelling a job that
    // never existed.
    const actor = await resolveActor(request);
    const job = await cancelCompressionJob(id, actor);

    if (!job) {
      return securityJson(
        { ok: false, error: { message: "Compression job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    logSecurityEvent("info", "compression_job_deleted_or_cancelled", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      jobId: job.id,
      status: job.status,
    });

    return securityJson({ ok: true, job }, { requestId: security.requestId });
  } catch (error) {
    logSecurityEvent("error", "compression_job_cancel_unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });

    return securityJson(
      { ok: false, error: { message: "Unable to cancel compression job." } },
      { status: 500, requestId },
    );
  }
}
