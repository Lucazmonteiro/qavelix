import { cancelCompressionJob, getCompressionJob } from "@/lib/server/compression-queue";
import { resolveActor } from "@/lib/server/entitlements/service";
import {
  assertValidJobId,
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

export async function GET(request: Request, { params }: JobRouteProps) {
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
  // indistinguishable from a nonexistent one: getCompressionJob() returns null for both,
  // so this never discloses that a job ID exists but belongs to someone else.
  const actor = await resolveActor(request);
  const job = await getCompressionJob(id, actor);

  if (!job) {
    return securityJson(
      { ok: false, error: { message: "Compression job was not found." } },
      { status: 404, requestId: security.requestId },
    );
  }

  return securityJson({ ok: true, job }, { requestId: security.requestId });
}

export async function DELETE(request: Request, { params }: JobRouteProps) {
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
}
