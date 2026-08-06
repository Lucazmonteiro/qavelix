"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/lib/auth-client";

export type ResolvedPlan = "anonymous" | "free" | "pro";

type PlanResponse = {
  ok: boolean;
  plan?: ResolvedPlan;
};

type FetchedPlan = {
  userId: string | null;
  plan: ResolvedPlan;
};

// Shared by every UI that needs the actor's real, server-resolved plan without any
// per-tool usage context (ProBadge's header pill, the homepage pricing cards' CTA logic)
// — a lighter sibling to useEntitlementGate(), which requires a toolId and returns usage
// data that doesn't apply here. Reads the same /api/entitlements/plan endpoint ProBadge
// always has. Refetches on every auth-state transition (login, logout, a plan change
// picked up by a fresh session) and is tagged by the userId it was fetched for, so a
// stale response from a previous user can never be trusted after a fast logout/login.
//
// Anonymous visitors (no session userId) never fetch at all: every caller's safe default
// for "unresolved" is indistinguishable from a confirmed "anonymous" result (an
// anonymous-shaped UI can't over-claim access, unlike defaulting to free/pro), so the
// network round trip would only confirm what's already assumed. This also means the
// badge/CTA state for a genuinely anonymous visitor never flickers between an unresolved
// and a resolved render — there's only ever the one state.
export function useResolvedPlan(): ResolvedPlan | null {
  const session = useSession();
  const userId = session.data?.user.id ?? null;
  const [fetched, setFetched] = useState<FetchedPlan | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/entitlements/plan", { cache: "no-store" });
        const payload = (await response.json()) as PlanResponse;

        if (!cancelled && payload.ok && payload.plan) {
          setFetched({ userId, plan: payload.plan });
        }
      } catch {
        // Purely informational — a failed check must never block the page; callers just
        // keep treating the plan as unresolved until the next successful check.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return fetched?.userId === userId ? fetched.plan : null;
}
