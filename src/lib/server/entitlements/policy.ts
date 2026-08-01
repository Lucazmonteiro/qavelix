// A relative import, not the usual "@/" alias: next.config.ts imports this module
// directly (for PRO_MAX_UPLOAD_REQUEST_BYTES below), and Next's own config transpiler
// does not apply the app's path-alias resolution, so an aliased import here would break
// `next build` while still working everywhere else. Every other import in this codebase
// keeps using "@/" — this file is the one exception, for this one mechanical reason.
import { MAX_UPLOAD_BYTES, UPLOAD_REQUEST_OVERHEAD_BYTES } from "../../upload-policy";

export const PLAN_TYPES = ["free", "pro"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export function isPlanType(value: string): value is PlanType {
  return (PLAN_TYPES as readonly string[]).includes(value);
}

export const TOOL_IDS = ["video-compressor", "extract-audio", "video-trimmer"] as const;
export type ToolId = (typeof TOOL_IDS)[number];

export function isToolId(value: string): value is ToolId {
  return (TOOL_IDS as readonly string[]).includes(value);
}

// The single sentinel tool_id for the anonymous tier's combined (not per-tool) usage
// pool. Both tools reserve against this same key for an anonymous actor, so "5 free
// uses" means 5 total, not 5 per tool — see usage_counter's comment in db/schema.ts.
export const ANONYMOUS_POOL_TOOL_ID = "any" as const;

export type UsagePeriod = "day" | "lifetime";

export type ToolLimits = {
  maxUsesPerPeriod: number;
  period: UsagePeriod;
  maxUploadBytes: number;
};

// Only the Pro upload ceiling is new here — the existing 250MB constant (MAX_UPLOAD_BYTES)
// is reused as-is for anonymous and Free, per this milestone's explicit instruction not
// to change it without approval. This is the one new number the product decision raised.
export const PRO_MAX_UPLOAD_BYTES = 500 * 1024 * 1024;

// Next's proxy body-size limit is infrastructure, not per-request policy — it has to be
// sized for the largest upload any plan can legitimately send (Pro), not just the
// Free/anonymous ceiling. Without this, a Pro upload between 250MB and 500MB would be
// rejected by Next itself before ever reaching a route handler's plan-aware check,
// silently making the Pro upload limit unreachable.
export const PRO_MAX_UPLOAD_REQUEST_BYTES = PRO_MAX_UPLOAD_BYTES + UPLOAD_REQUEST_OVERHEAD_BYTES;

// The single source of truth for every plan x tool limit in the product — a confirmed
// product decision, not an invented default:
//   Anonymous: 5 lifetime uses, combined across all tools, then an account is required.
//   Free (authenticated): 10 uses/day per tool, existing 250MB upload cap (unchanged).
//   Pro: 100 uses/day per tool, 500MB upload cap.
// Changing a number here changes it everywhere this system reads from — no limit is
// duplicated in any route, component, or test fixture. Adding a future tool means adding
// one entry per plan here, nothing else.
export const TOOL_POLICY: {
  anonymous: Record<typeof ANONYMOUS_POOL_TOOL_ID, ToolLimits>;
  free: Record<ToolId, ToolLimits>;
  pro: Record<ToolId, ToolLimits>;
} = {
  anonymous: {
    any: { maxUsesPerPeriod: 5, period: "lifetime", maxUploadBytes: MAX_UPLOAD_BYTES },
  },
  free: {
    "video-compressor": {
      maxUsesPerPeriod: 10,
      period: "day",
      maxUploadBytes: MAX_UPLOAD_BYTES,
    },
    "extract-audio": {
      maxUsesPerPeriod: 10,
      period: "day",
      maxUploadBytes: MAX_UPLOAD_BYTES,
    },
    // VIDEOTRIMMER.md "Free / Pro Entitlements" Option A (the document's own recommended
    // default): mirror the existing symmetric policy exactly rather than inventing
    // trim-specific numbers — see that doc for the Option A/B trade-off discussion.
    "video-trimmer": {
      maxUsesPerPeriod: 10,
      period: "day",
      maxUploadBytes: MAX_UPLOAD_BYTES,
    },
  },
  pro: {
    "video-compressor": {
      maxUsesPerPeriod: 100,
      period: "day",
      maxUploadBytes: PRO_MAX_UPLOAD_BYTES,
    },
    "extract-audio": {
      maxUsesPerPeriod: 100,
      period: "day",
      maxUploadBytes: PRO_MAX_UPLOAD_BYTES,
    },
    "video-trimmer": {
      maxUsesPerPeriod: 100,
      period: "day",
      maxUploadBytes: PRO_MAX_UPLOAD_BYTES,
    },
  },
};

export function getToolLimits(plan: PlanType, toolId: ToolId): ToolLimits {
  return TOOL_POLICY[plan][toolId];
}

export function getAnonymousLimits(): ToolLimits {
  return TOOL_POLICY.anonymous[ANONYMOUS_POOL_TOOL_ID];
}
