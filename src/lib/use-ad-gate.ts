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

// Freemium ad-gate: how many uses in the current period an actor gets before an ad is
// required. Anonymous gets a taste (their first 2 of the 5-use lifetime pool) before ads
// start on uses 3-5; a signed-in Free actor sees an ad on every one of their 10 daily
// uses — the account itself is the upgrade being sold at that tier (5 lifetime -> 10
// daily), not an ad-free allowance, which is why this number is 0 rather than 1. Pro
// never sees this gate at all (appliesToPlan below is false for "pro").
const FREE_USES_BEFORE_AD: Record<"anonymous" | "free", number> = {
  anonymous: 2,
  free: 0,
};

// This is a monetization/UX layer, not an entitlement — it never denies a request the
// backend would otherwise allow, and touches no server state; the real quota
// (TOOL_POLICY, reserveUsage) is entirely unaffected and remains the only actual
// enforcement boundary, enforced server-side and keyed off the actor's session or IP
// fingerprint (resolveActor() in entitlements/service.ts) — never off anything read from
// this client, so it already can't be reset by clearing local storage/cookies or opening
// a private-browsing tab. Because of that, the running count below only needs to be
// correct for *this* client's own UX, not resistant to a determined visitor bypassing it
// client-side (e.g. via devtools or calling the API directly) — that visitor still hits
// the same server-side limit everyone else does, ad or no ad. Deliberately not extended
// with fingerprinting or other cross-session tracking to "harden" this: doing so would
// duplicate enforcement that already exists server-side, add a real privacy/consent
// liability for no additional protection, and this gate was never the security boundary
// to begin with.
//
// The starting count comes from the server (limit - remaining, both server-confirmed as
// of the last status fetch — so even a first load in a fresh private-browsing tab starts
// from the actor's real, already-used count, not zero); every attempt the actor actually
// proceeds with after that (immediately, or after clearing the ad gate) increments a
// local counter, so the gate keeps working correctly across several uses in one sitting
// without re-fetching status after every job.
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
  const freeUsesBeforeAd = plan === "anonymous" || plan === "free" ? FREE_USES_BEFORE_AD[plan] : 0;
  const requiresAd = appliesToPlan && (usedCount ?? 0) >= freeUsesBeforeAd && !adCleared;

  // Call at the very top of the tool's own start/process function, before any network
  // request. Returns true when the caller should proceed immediately (still within the
  // plan's ad-free allowance, Pro, or the ad gate was already cleared); returns false and
  // opens the modal otherwise, leaving it to the caller to re-invoke its own start
  // function from the modal's completion callback. Every path that returns true also
  // advances the local counter, so the next call is evaluated against the new count.
  const consumeAttempt = useCallback(() => {
    if (!appliesToPlan || (usedCount ?? 0) < freeUsesBeforeAd || adCleared) {
      setUsedCount((count) => (count ?? 0) + 1);
      setAdCleared(false);
      return true;
    }

    setShowAdGateModal(true);
    return false;
  }, [appliesToPlan, usedCount, adCleared, freeUsesBeforeAd]);

  const closeAdGateModal = useCallback(() => setShowAdGateModal(false), []);

  const clearAdGate = useCallback(() => {
    setAdCleared(true);
    setShowAdGateModal(false);
  }, []);

  return { requiresAd, showAdGateModal, consumeAttempt, closeAdGateModal, clearAdGate };
}
