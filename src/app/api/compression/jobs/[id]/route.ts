import { cancelCompressionJob, getCompressionJob } from "@/lib/server/compression-queue";
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

export async function GET(_request: Request, { params }: JobRouteProps) {
  const { id } = await params;
  const security = enforceApiSecurity(_request, {
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

  const job = await getCompressionJob(id);

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
  const security = enforceApiSecurity(request, {
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

  const job = await cancelCompressionJob(id);

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
