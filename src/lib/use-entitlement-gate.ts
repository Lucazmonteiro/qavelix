"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { UpgradeModalLimits } from "@/components/upgrade-modal";
import { useSession } from "@/lib/auth-client";
import type { ToolId } from "@/lib/server/entitlements/policy";

type ActorPlan = "anonymous" | "free" | "pro";
type BlockingReason = "usage_limit_reached" | "account_required";

type EntitlementGateState = {
  plan: ActorPlan | null;
  blocked: boolean;
  reason: BlockingReason | null;
  anonymousLimits: UpgradeModalLimits | null;
  freeLimits: UpgradeModalLimits | null;
  proLimits: UpgradeModalLimits | null;
  showUpgradeModal: boolean;
  // Current-period usage for this actor/tool, as of the last resolved status fetch — only
  // present when the backend returned allowed:true (see EntitlementCheck's shape:
  // `remaining` only exists on the allowed branch). Consumed by useAdGate() to derive
  // "is this the actor's first use in the period" without a second request or any
  // client-only counter; both null while unresolved or while the actor is fully blocked.
  remaining: number | null;
  limit: number | null;
};

type ResolvedGateState = EntitlementGateState & { userId: string | null };

type StatusResponse = {
  ok: boolean;
  plan?: ActorPlan;
  allowed?: boolean;
  reason?: BlockingReason | string;
  anonymousLimits?: UpgradeModalLimits;
  freeLimits?: UpgradeModalLimits;
  proLimits?: UpgradeModalLimits;
  remaining?: number;
  limit?: number;
};

function isBlockingReason(reason: string | undefined): reason is BlockingReason {
  return reason === "usage_limit_reached" || reason === "account_required";
}

// The one-time, automatic modal is worth interrupting a visitor for exactly twice: a
// signed-in Free actor hitting their daily limit (offer Pro), or an anonymous actor
// hitting the combined lifetime pool (offer creating an account, signing in, or Pro) —
// never for Pro (already the top tier) and never for any reason other than a genuine
// usage-limit block (a validation/network/server/FFmpeg error must never trigger this).
function shouldAutoOpenModal(plan: ActorPlan, reason: BlockingReason | null): boolean {
  if (reason === "usage_limit_reached" && plan === "free") {
    return true;
  }

  return reason === "account_required" && plan === "anonymous";
}

const initialState: EntitlementGateState = {
  plan: null,
  blocked: false,
  reason: null,
  anonymousLimits: null,
  freeLimits: null,
  proLimits: null,
  showUpgradeModal: false,
  remaining: null,
  limit: null,
};

// Shared entitlement-lock behavior for every tool UI (CompressionPanel, ExtractAudioTool,
// and any future tool): fetches the authoritative, read-only entitlement status on mount
// AND on every auth-state transition (login, logout, or a plan change picked up by a
// fresh session) — see /api/entitlements/status — so a former Pro/Free actor's stale
// plan/blocked state can never linger after logout without a manual page refresh.
//
// Resolved state is tagged with the userId it was fetched for (null for anonymous) and
// only trusted while that still matches the current session — see `state` below. This
// both avoids a synchronous setState in the effect body for the "auth just changed" case
// (React's set-state-in-effect rule) and guards against a stale response from a previous
// user landing after a fast logout/login sequence — the same technique pro-badge.tsx uses
// for the header badge.
//
// reportDenial() remains the reactive path — call it when an actual processing/start
// attempt is rejected so the UI locks even if the mount-time check raced ahead of a
// just-consumed slot. This is informational only: reserveUsage() at the real
// job-creation/processing route remains the sole place that grants or denies a request,
// so nothing here can be used to bypass enforcement — it only decides what the UI shows.
export function useEntitlementGate(toolId: ToolId) {
  const session = useSession();
  const userId = session.data?.user.id ?? null;
  const [resolved, setResolved] = useState<ResolvedGateState | null>(null);
  const hasShownModalRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/entitlements/status?tool=${toolId}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as StatusResponse;

      if (!payload.ok || !payload.plan) {
        return;
      }

      const blocked = payload.allowed === false && isBlockingReason(payload.reason);
      const reason = blocked && isBlockingReason(payload.reason) ? payload.reason : null;
      const shouldOpenModal =
        shouldAutoOpenModal(payload.plan, reason) && !hasShownModalRef.current;

      if (shouldOpenModal) {
        hasShownModalRef.current = true;
      }

      setResolved((current) => ({
        plan: payload.plan ?? null,
        blocked,
        reason,
        anonymousLimits: payload.anonymousLimits ?? current?.anonymousLimits ?? null,
        freeLimits: payload.freeLimits ?? current?.freeLimits ?? null,
        proLimits: payload.proLimits ?? current?.proLimits ?? null,
        showUpgradeModal: (current?.showUpgradeModal ?? false) || shouldOpenModal,
        remaining: payload.remaining ?? null,
        limit: payload.limit ?? null,
        userId,
      }));
    } catch {
      // Purely informational — a failed status check must never block the UI.
    }
  }, [toolId, userId]);

  useEffect(() => {
    // A fresh auth state deserves a fresh chance to show the one-time upgrade offer —
    // the previous user's "already shown" flag must not suppress it for whoever's
    // signed in (or out) now, relevant on shared devices.
    hasShownModalRef.current = false;
    void refresh();
  }, [refresh]);

  const state = resolved && resolved.userId === userId ? resolved : initialState;

  // Called from a tool's own failed-processing-attempt handler with the exact denial
  // reason the backend just returned. Locks the UI immediately using state already known
  // from the mount-time refresh, without waiting on another round trip.
  function reportDenial(reason: BlockingReason) {
    setResolved((current) => {
      const base = current && current.userId === userId ? current : { ...initialState, userId };
      const shouldOpenModal =
        base.plan !== null && shouldAutoOpenModal(base.plan, reason) && !hasShownModalRef.current;

      if (shouldOpenModal) {
        hasShownModalRef.current = true;
      }

      return {
        ...base,
        blocked: true,
        reason,
        showUpgradeModal: base.showUpgradeModal || shouldOpenModal,
      };
    });
  }

  function closeUpgradeModal() {
    setResolved((current) =>
      current && current.userId === userId ? { ...current, showUpgradeModal: false } : current,
    );
  }

  // Lets a blocked tool surface an explicit, always-visible "Upgrade to Pro" affordance
  // that reopens the offer after the user dismissed the automatic one-time modal.
  function openUpgradeModal() {
    setResolved((current) =>
      current && current.userId === userId ? { ...current, showUpgradeModal: true } : current,
    );
  }

  return {
    ...state,
    reportDenial,
    closeUpgradeModal,
    openUpgradeModal,
  };
}
