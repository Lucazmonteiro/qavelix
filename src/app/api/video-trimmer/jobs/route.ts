import { consumeAnalyzedUploadReference } from "@/lib/server/analyzed-upload-registry";
import { createVideoTrimmerJobFromAnalyzedUpload } from "@/lib/server/video-trimmer-queue";
import { entitlementErrorPayload, statusForDenialReason } from "@/lib/server/entitlements/errors";
import { releaseUsage, reserveUsage, resolveActor } from "@/lib/server/entitlements/service";
import {
  createRequestId,
  enforceApiSecurity,
  logSecurityEvent,
  securityJson,
} from "@/lib/server/security";
import { isTrimMode } from "@/lib/video-trimmer-policy";

export const runtime = "nodejs";

type CreateVideoTrimmerPayload = {
  uploadReference?: unknown;
  startSeconds?: unknown;
  endSeconds?: unknown;
  trimMode?: unknown;
};

function jsonError(message: string, status = 400, requestId?: string, code?: string) {
  return securityJson({ ok: false, error: { code, message } }, { status, requestId });
}

async function readJsonPayload(request: Request) {
  try {
    return (await request.json()) as CreateVideoTrimmerPayload;
  } catch {
    return null;
  }
}

// Wrapped end-to-end in try/catch from day one — see VIDEOTRIMMER.md "Error Handling" for
// why: an uncaught exception anywhere in this chain (including enforceApiSecurity's own
// durable rate-limit check) has no guaranteed-JSON response, which is exactly the class of
// bug the compression job routes needed a later fix for. requestId is generated up front
// so it's available even if enforceApiSecurity itself fails.
export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const security = await enforceApiSecurity(request, {
      route: "video-trimmer.create",
      limit: 5,
      windowMs: 60_000,
      requireSameOrigin: true,
    });

    if (!security.ok) {
      return security.response;
    }

    const payload = await readJsonPayload(request);

    if (!payload) {
      return jsonError(
        "A validated upload reference and a start/end time are required.",
        400,
        security.requestId,
        "invalid_request",
      );
    }

    const { uploadReference, startSeconds, endSeconds, trimMode } = payload;

    if (typeof startSeconds !== "number" || typeof endSeconds !== "number") {
      return jsonError(
        "Choose a valid start and end time before trimming.",
        400,
        security.requestId,
        "invalid_range",
      );
    }

    const resolvedTrimMode = typeof trimMode === "string" && isTrimMode(trimMode) ? trimMode : "fast";
    const actor = await resolveActor(request);

    // Reserved before the upload reference is consumed, and well before any FFmpeg work
    // (which only happens once the async worker picks this job up) — same ordering as
    // compression/jobs/route.ts, see VIDEOTRIMMER.md "Free / Pro Entitlements".
    const reservation = await reserveUsage(actor, "video-trimmer", security.requestId);

    if (!reservation.allowed) {
      logSecurityEvent("warn", "video_trimmer_usage_denied", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        reason: reservation.reason,
      });
      return securityJson(
        { ok: false, error: entitlementErrorPayload(reservation.reason) },
        { status: statusForDenialReason(reservation.reason), requestId: security.requestId },
      );
    }

    const consumedUpload = await consumeAnalyzedUploadReference(
      typeof uploadReference === "string" ? uploadReference : null,
    );

    if (!consumedUpload.ok) {
      await releaseUsage(reservation.usageEventId);
      logSecurityEvent("warn", "video_trimmer_upload_reference_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: consumedUpload.code,
      });
      return jsonError(consumedUpload.message, 400, security.requestId, consumedUpload.code);
    }

    const result = await createVideoTrimmerJobFromAnalyzedUpload(
      consumedUpload.upload,
      startSeconds,
      endSeconds,
      resolvedTrimMode,
      reservation.usageEventId,
      actor,
    );

    if (!result.ok) {
      // createVideoTrimmerJobFromAnalyzedUpload() already released the reservation on
      // every one of its own failure paths (see its finally block) — nothing to do here.
      logSecurityEvent("warn", "video_trimmer_validation_rejected", {
        requestId: security.requestId,
        fingerprint: security.fingerprint,
        code: result.error.code,
      });
      return securityJson(
        { ok: false, error: result.error },
        { status: 400, requestId: security.requestId },
      );
    }

    logSecurityEvent("info", "video_trimmer_job_created", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      jobId: result.job.id,
      startSeconds,
      endSeconds,
    });

    return securityJson(
      { ok: true, job: result.job },
      { status: 202, requestId: security.requestId },
    );
  } catch (error) {
    logSecurityEvent("error", "video_trimmer_create_unhandled_error", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });

    return securityJson(
      { ok: false, error: { message: "Unable to create the trim job." } },
      { status: 500, requestId },
    );
  }
}
