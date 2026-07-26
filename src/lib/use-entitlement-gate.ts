"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { UpgradeModalLimits } from "@/components/upgrade-modal";
import type { ToolId } from "@/lib/server/entitlements/policy";

type ActorPlan = "anonymous" | "free" | "pro";
type BlockingReason = "usage_limit_reached" | "account_required";

type EntitlementGateState = {
  plan: ActorPlan | null;
  blocked: boolean;
  reason: BlockingReason | null;
  freeLimits: UpgradeModalLimits | null;
  proLimits: UpgradeModalLimits | null;
  showUpgradeModal: boolean;
};

type StatusResponse = {
  ok: boolean;
  plan?: ActorPlan;
  allowed?: boolean;
  reason?: BlockingReason | string;
  freeLimits?: UpgradeModalLimits;
  proLimits?: UpgradeModalLimits;
};

function isBlockingReason(reason: string | undefined): reason is BlockingReason {
  return reason === "usage_limit_reached" || reason === "account_required";
}

const initialState: EntitlementGateState = {
  plan: null,
  blocked: false,
  reason: null,
  freeLimits: null,
  proLimits: null,
  showUpgradeModal: false,
};

// Shared entitlement-lock behavior for every tool UI (CompressionPanel, ExtractAudioTool,
// and any future tool): fetches the authoritative, read-only entitlement status on mount
// (see /api/entitlements/status) so a tool that's already at its daily limit renders
// blocked immediately, and exposes reportDenial() for the reactive path — call it when an
// actual processing/start attempt is rejected with "usage_limit_reached" or
// "account_required" so the UI locks even if the mount-time check raced ahead of a
// just-consumed slot. This is informational only: reserveUsage() at the real
// job-creation/processing route remains the sole place that grants or denies a request,
// so nothing here can be used to bypass enforcement — it only decides what the UI shows.
export function useEntitlementGate(toolId: ToolId) {
  const [state, setState] = useState<EntitlementGateState>(initialState);
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
        reason === "usage_limit_reached" && payload.plan === "free" && !hasShownModalRef.current;

      if (shouldOpenModal) {
        hasShownModalRef.current = true;
      }

      setState((current) => ({
        plan: payload.plan ?? current.plan,
        blocked,
        reason,
        freeLimits: payload.freeLimits ?? current.freeLimits,
        proLimits: payload.proLimits ?? current.proLimits,
        showUpgradeModal: current.showUpgradeModal || shouldOpenModal,
      }));
    } catch {
      // Purely informational — a failed status check must never block the UI.
    }
  }, [toolId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Called from a tool's own failed-processing-attempt handler with the exact denial
  // reason the backend just returned. Locks the UI immediately using state already known
  // from the mount-time refresh, without waiting on another round trip.
  function reportDenial(reason: BlockingReason) {
    setState((current) => {
      const shouldOpenModal =
        reason === "usage_limit_reached" && current.plan === "free" && !hasShownModalRef.current;

      if (shouldOpenModal) {
        hasShownModalRef.current = true;
      }

      return {
        ...current,
        blocked: true,
        reason,
        showUpgradeModal: current.showUpgradeModal || shouldOpenModal,
      };
    });
  }

  function closeUpgradeModal() {
    setState((current) => ({ ...current, showUpgradeModal: false }));
  }

  // Lets a blocked tool surface an explicit, always-visible "Upgrade to Pro" affordance
  // that reopens the offer after the user dismissed the automatic one-time modal.
  function openUpgradeModal() {
    setState((current) => ({ ...current, showUpgradeModal: true }));
  }

  return {
    ...state,
    reportDenial,
    closeUpgradeModal,
    openUpgradeModal,
  };
}
