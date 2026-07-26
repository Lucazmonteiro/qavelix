import { getToolLimits, isToolId } from "@/lib/server/entitlements/policy";
import { checkEntitlement, resolveActor } from "@/lib/server/entitlements/service";
import { enforceApiSecurity, securityJson } from "@/lib/server/security";

export const runtime = "nodejs";

// Read-only entitlement status for the current actor (session or fingerprint) and a
// single tool — lets the client-side tool UIs (CompressionPanel, ExtractAudioTool) know
// the actor's plan and remaining usage without reserving anything, so they can show a
// blocked/upgrade state proactively instead of only after a failed processing attempt.
// This is purely informational: reserveUsage() at actual job-creation/processing time
// remains the only place that can grant or deny a request, so a stale or manipulated
// client response here cannot bypass enforcement.
export async function GET(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "entitlements.status",
    limit: 30,
    windowMs: 60_000,
  });

  if (!security.ok) {
    return security.response;
  }

  const url = new URL(request.url);
  const toolParam = url.searchParams.get("tool");

  if (!toolParam || !isToolId(toolParam)) {
    return securityJson(
      { ok: false, error: { message: "A valid tool id is required." } },
      { status: 400, requestId: security.requestId },
    );
  }

  const actor = await resolveActor(request);
  const check = await checkEntitlement(actor, toolParam);

  // Free/Pro comparison numbers for the upgrade-offer UI — sourced from the same
  // TOOL_POLICY table every route already enforces, never a client-side duplicate of the
  // real limits (see upgrade-modal.tsx, which renders these instead of importing
  // server-only policy data into client bundles).
  return securityJson(
    {
      ok: true,
      ...check,
      freeLimits: getToolLimits("free", toolParam),
      proLimits: getToolLimits("pro", toolParam),
    },
    { status: 200, requestId: security.requestId },
  );
}
