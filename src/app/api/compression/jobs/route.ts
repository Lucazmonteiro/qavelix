import { isCompressionPresetId } from "@/lib/compression-policy";
import { consumeAnalyzedUploadReference } from "@/lib/server/analyzed-upload-registry";
import { createCompressionJobFromAnalyzedUpload } from "@/lib/server/compression-queue";
import { entitlementErrorPayload, statusForDenialReason } from "@/lib/server/entitlements/errors";
import { releaseUsage, reserveUsage, resolveActor } from "@/lib/server/entitlements/service";
import {
  enforceApiSecurity,
  logSecurityEvent,
  securityJson,
} from "@/lib/server/security";

export const runtime = "nodejs";

type CreateCompressionPayload = {
  preset?: unknown;
  uploadReference?: unknown;
};

function jsonError(message: string, status = 400, requestId?: string, code?: string) {
  return securityJson(
    { ok: false, error: { code, message } },
    { status, requestId },
  );
}

async function readJsonPayload(request: Request) {
  try {
    return (await request.json()) as CreateCompressionPayload;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "compression.create",
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
      "A validated upload reference and compression preset are required.",
      400,
      security.requestId,
      "invalid_request",
    );
  }

  const { preset, uploadReference } = payload;

  if (typeof preset !== "string" || !isCompressionPresetId(preset)) {
    return jsonError(
      "Choose a supported compression preset.",
      400,
      security.requestId,
      "invalid_preset",
    );
  }

  const actor = await resolveActor(request);

  // Reserved before the upload reference is consumed (which burns its single-use token)
  // so an actor already out of quota doesn't lose their validated upload for nothing —
  // and well before any FFmpeg work starts, which only happens once the async worker
  // later picks this job up.
  const reservation = await reserveUsage(actor, "video-compressor", security.requestId);

  if (!reservation.allowed) {
    logSecurityEvent("warn", "compression_usage_denied", {
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
    logSecurityEvent("warn", "compression_upload_reference_rejected", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      code: consumedUpload.code,
    });
    return jsonError(
      consumedUpload.message,
      400,
      security.requestId,
      consumedUpload.code,
    );
  }

  const result = await createCompressionJobFromAnalyzedUpload(
    consumedUpload.upload,
    preset,
    reservation.usageEventId,
  );

  if (!result.ok) {
    // createCompressionJobFromAnalyzedUpload() already released the reservation itself
    // on every one of its failure paths (see its own finally block) — nothing to do here.
    logSecurityEvent("warn", "compression_validation_rejected", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      code: result.error.code,
    });
    return securityJson(
      { ok: false, error: result.error },
      { status: 400, requestId: security.requestId },
    );
  }

  logSecurityEvent("info", "compression_job_created", {
    requestId: security.requestId,
    fingerprint: security.fingerprint,
    jobId: result.job.id,
    preset,
    size: result.job.inputSize,
  });

  return securityJson(
    { ok: true, job: result.job },
    { status: 202, requestId: security.requestId },
  );
}
