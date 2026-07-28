import type { PlanType, ToolId, UsagePeriod } from "@/lib/server/entitlements/policy";

// account_required: the anonymous 5-use lifetime pool is exhausted — the remedy is
//   signing up, not waiting for a period to reset, so it's kept distinct from
//   usage_limit_reached even though both are "no, not right now" outcomes.
// usage_limit_reached: an authenticated user's plan quota is exhausted for the current
//   period.
// tool_unavailable_for_plan: reserved for a future Pro-only tool; neither current tool
//   uses this reason today, but the type exists so the architecture doesn't need to
//   change shape when one does.
// invalid_entitlement_state: a user_entitlement row exists with a plan value this system
//   doesn't recognize (e.g. a future migration in progress) — fails safe as the most
//   restrictive plan rather than crashing or granting access.
// usage_service_unavailable: the database could not be reached while checking or
//   reserving usage — fails closed (denies the request) rather than failing open.
export type EntitlementDenialReason =
  | "account_required"
  | "usage_limit_reached"
  | "tool_unavailable_for_plan"
  | "invalid_entitlement_state"
  | "usage_service_unavailable";

type EntitlementContext = {
  plan: PlanType | "anonymous";
  toolId: ToolId;
  limit: number;
  period: UsagePeriod;
};

// Read-only answer to "how much usage remains" — never mutates anything. Used by the
// dashboard (shows remaining usage without consuming a slot) and anywhere else that only
// needs to ask the question, not act on it.
export type EntitlementCheck =
  | ({ allowed: true; remaining: number } & EntitlementContext)
  | ({ allowed: false; reason: EntitlementDenialReason } & EntitlementContext);

// The result of actually attempting to reserve a usage slot — allowed:true always
// carries the usageEventId the caller must later pass to confirmUsage()/releaseUsage().
export type EntitlementReservation =
  | ({ allowed: true; remaining: number; usageEventId: string } & EntitlementContext)
  | ({ allowed: false; reason: EntitlementDenialReason } & EntitlementContext);

// One HTTP status per denial reason, defined once so every route that surfaces an
// entitlement decision maps it the same way instead of each picking its own status code.
const DENIAL_STATUS: Record<EntitlementDenialReason, number> = {
  account_required: 401,
  usage_limit_reached: 429,
  tool_unavailable_for_plan: 403,
  invalid_entitlement_state: 500,
  usage_service_unavailable: 503,
};

export function statusForDenialReason(reason: EntitlementDenialReason): number {
  return DENIAL_STATUS[reason];
}

// Shared client-facing message per denial reason, so every route surfaces the same
// wording instead of each one writing its own copy. Frontend i18n mapping (task: add
// entitlement error handling and i18n to tool UIs) keys off `code`, not this string —
// this is the fallback the raw API payload carries.
const DENIAL_MESSAGE: Record<EntitlementDenialReason, string> = {
  account_required: "Create a free account to keep using this tool.",
  usage_limit_reached: "You have reached today's usage limit for this tool.",
  tool_unavailable_for_plan: "This tool is not available on your current plan.",
  invalid_entitlement_state: "Your account state could not be verified. Try again shortly.",
  usage_service_unavailable: "The usage service is temporarily unavailable. Try again shortly.",
};

export function entitlementErrorPayload(
  reason: EntitlementDenialReason,
): { code: EntitlementDenialReason; message: string } {
  return { code: reason, message: DENIAL_MESSAGE[reason] };
}
