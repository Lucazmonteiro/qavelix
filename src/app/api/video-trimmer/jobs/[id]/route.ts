import { cancelVideoTrimmerJob, getVideoTrimmerJob } from "@/lib/server/video-trimmer-queue";
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

// Both handlers wrapped end-to-end in try/catch, requestId generated up front — mirrors
// src/app/api/compression/jobs/[id]/route.ts exactly (see that file's own comment for the
// full "why": an uncaught exception has no guaranteed-JSON response otherwise).
export async function GET(request: Request, { params }: JobRouteProps) {
  const requestId = createRequestId();

  try {
    const { id } = await params;
    const security = await enforceApiSecurity(request, {
      route: "video-trimmer.status",
      limit: 120,
      windowMs: 60_000,
    });

    if (!security.ok) {
      return security.response;
    }

    if (!assertValidJobId(id)) {
      return securityJson(
        { ok: false, error: { message: "Trim job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    // Security Correction #4's pattern — a job belonging to a different actor must be
    // indistinguishable from a nonexistent one; getVideoTrimmerJob() returns null for both.
    const actor = await resolveActor(request);
    const job = await getVideoTrimmerJob(id, actor);

    if (!job) {
      return securityJson(
        { ok: false, error: { message: "Trim job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    return securityJson({ ok: true, job }, { requestId: security.requestId });
  } catch (error) {
    logSecurityEvent("error", "video_trimmer_status_unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });

    return securityJson(
      { ok: false, error: { message: "Unable to fetch trim job status." } },
      { status: 500, requestId },
    );
  }
}

export async function DELETE(request: Request, { params }: JobRouteProps) {
  const requestId = createRequestId();

  try {
    const { id } = await params;
    const security = await enforceApiSecurity(request, {
      route: "video-trimmer.delete",
      limit: 30,
      windowMs: 60_000,
      requireSameOrigin: true,
    });

    if (!security.ok) {
      return security.response;
    }

    if (!assertValidJobId(id)) {
      return securityJson(
        { ok: false, error: { message: "Trim job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    const actor = await resolveActor(request);
    const job = await cancelVideoTrimmerJob(id, actor);

    if (!job) {
      return securityJson(
        { ok: false, error: { message: "Trim job was not found." } },
        { status: 404, requestId: security.requestId },
      );
    }

    logSecurityEvent("info", "video_trimmer_job_deleted_or_cancelled", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      jobId: job.id,
      status: job.status,
    });

    return securityJson({ ok: true, job }, { requestId: security.requestId });
  } catch (error) {
    logSecurityEvent("error", "video_trimmer_cancel_unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });

    return securityJson(
      { ok: false, error: { message: "Unable to cancel the trim job." } },
      { status: 500, requestId },
    );
  }
}
