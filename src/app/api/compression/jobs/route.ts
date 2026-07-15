import { isCompressionPresetId } from "@/lib/compression-policy";
import { createCompressionJob } from "@/lib/server/compression-queue";
import {
  enforceApiSecurity,
  logSecurityEvent,
  rejectOversizedRequest,
  securityJson,
} from "@/lib/server/security";
import { MAX_UPLOAD_BYTES } from "@/lib/upload-policy";

export const runtime = "nodejs";

function jsonError(message: string, status = 400, requestId?: string) {
  return securityJson({ ok: false, error: { message } }, { status, requestId });
}

export async function POST(request: Request) {
  const security = enforceApiSecurity(request, {
    route: "compression.create",
    limit: 5,
    windowMs: 60_000,
    requireSameOrigin: true,
  });

  if (!security.ok) {
    return security.response;
  }

  const oversizedResponse = rejectOversizedRequest(
    request,
    MAX_UPLOAD_BYTES + 2 * 1024 * 1024,
    security.requestId,
  );

  if (oversizedResponse) {
    return oversizedResponse;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const preset = formData.get("preset");

  if (!(file instanceof File)) {
    return jsonError(
      "Upload a single video file for compression.",
      400,
      security.requestId,
    );
  }

  if (typeof preset !== "string" || !isCompressionPresetId(preset)) {
    return jsonError("Choose a supported compression preset.", 400, security.requestId);
  }

  const result = await createCompressionJob(file, preset);

  if (!result.ok) {
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
    size: file.size,
  });

  return securityJson(
    { ok: true, job: result.job },
    { status: 202, requestId: security.requestId },
  );
}
