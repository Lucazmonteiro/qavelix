import { resolveActor } from "@/lib/server/entitlements/service";
import { enforceApiSecurity, securityJson } from "@/lib/server/security";

export const runtime = "nodejs";

// Read-only, tool-agnostic plan lookup for UI that just needs to know "is this actor Pro"
// (the header's PRO badge) without any per-tool usage-counter context — a lighter sibling
// to /api/entitlements/status, which requires a `tool` param and returns usage data that
// doesn't apply here. Purely informational, same as status: nothing here can grant or
// deny access, and resolveActor() trusts only the server session, never anything the
// client claims about itself.
export async function GET(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "entitlements.plan",
    limit: 30,
    windowMs: 60_000,
  });

  if (!security.ok) {
    return security.response;
  }

  const actor = await resolveActor(request);

  return securityJson(
    {
      ok: true,
      plan: actor.type === "user" ? actor.plan : "anonymous",
    },
    { status: 200, requestId: security.requestId },
  );
}
