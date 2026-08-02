"use client";

import { useCallback, useState } from "react";

type ActorPlan = "anonymous" | "free" | "pro";

type UseAdGateInput = {
  plan: ActorPlan | null;
  // From useEntitlementGate()'s `remaining`/`limit` — the actor's real, server-confirmed
  // usage count for the current period (today for Free, lifetime for anonymous), never a
  // client-only counter. Both null until the gate's first status fetch resolves.
  remaining: number | null;
  limit: number | null;
};

// Freemium ad-gate: an anonymous or Free actor's first use in the current period is
// always free of any ad; every use after that requires either watching/waiting out an ad
// (AdGateModal) or upgrading to Pro. Pro never sees this gate at all. This is a
// monetization/UX layer, not an entitlement — it never denies a request the backend would
// otherwise allow, and touches no server state; the real quota (TOOL_POLICY, reserveUsage)
// is entirely unaffected and remains the only actual enforcement boundary. Because of
// that, the running count below is only as trustworthy as the client it runs in (a
// determined visitor could bypass it) — an acceptable tradeoff for an ad-impression gate,
// deliberately not extended to guard anything security-sensitive.
//
// The starting count comes from the server (limit - remaining, both server-confirmed as
// of the last status fetch); every attempt the actor actually proceeds with after that
// (immediately, or after clearing the ad gate) increments a local counter, so the gate
// keeps working correctly across several uses in one sitting without re-fetching status
// after every job.
export function useAdGate({ plan, remaining, limit }: UseAdGateInput) {
  const [usedCount, setUsedCount] = useState<number | null>(null);
  const [adCleared, setAdCleared] = useState(false);
  const [showAdGateModal, setShowAdGateModal] = useState(false);

  // Seeds the running count from the server the first moment both values are known —
  // done during render (not an effect) since it only ever needs to happen once: the guard
  // (`usedCount === null`) stops being true as soon as this fires, so it can never loop.
  // This is React's own documented pattern for "adjusting state when a prop becomes
  // available," not a synchronous effect side effect.
  if (usedCount === null && remaining !== null && limit !== null) {
    setUsedCount(Math.max(0, limit - remaining));
  }

  const appliesToPlan = plan === "anonymous" || plan === "free";
  const requiresAd = appliesToPlan && (usedCount ?? 0) >= 1 && !adCleared;

  // Call at the very top of the tool's own start/process function, before any network
  // request. Returns true when the caller should proceed immediately (first use, Pro, or
  // the ad gate was already cleared); returns false and opens the modal otherwise, leaving
  // it to the caller to re-invoke its own start function from the modal's completion
  // callback. Every path that returns true also advances the local counter, so the next
  // call correctly requires an ad again.
  const consumeAttempt = useCallback(() => {
    if (!appliesToPlan || (usedCount ?? 0) < 1 || adCleared) {
      setUsedCount((count) => (count ?? 0) + 1);
      setAdCleared(false);
      return true;
    }

    setShowAdGateModal(true);
    return false;
  }, [appliesToPlan, usedCount, adCleared]);

  const closeAdGateModal = useCallback(() => setShowAdGateModal(false), []);

  const clearAdGate = useCallback(() => {
    setAdCleared(true);
    setShowAdGateModal(false);
  }, []);

  return { requiresAd, showAdGateModal, consumeAttempt, closeAdGateModal, clearAdGate };
}
