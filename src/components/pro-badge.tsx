"use client";

import { useEffect, useState } from "react";

import type { getDictionary } from "@/i18n/dictionaries";
import { useSession } from "@/lib/auth-client";

type Dictionary = ReturnType<typeof getDictionary>;

type ProBadgeProps = {
  dictionary: Dictionary;
};

type PlanResponse = {
  ok: boolean;
  plan?: "anonymous" | "free" | "pro";
};

type FetchedPlan = {
  userId: string;
  plan: "anonymous" | "free" | "pro";
};

// Shown beside the brand only for a genuinely confirmed Pro entitlement — reads the
// authoritative server-resolved plan via /api/entitlements/plan, never client-side
// session state or anything cached alone. The effect depends on the session's user id
// (not just running once on mount), so it refetches on every auth-state transition
// instead of only reflecting whatever was true when the header first mounted. Renders
// nothing at all until "pro" is confirmed, so there's no layout shift and no loading
// placeholder to accidentally leave visible.
export function ProBadge({ dictionary }: ProBadgeProps) {
  const session = useSession();
  const userId = session.data?.user.id ?? null;
  const [fetchedPlan, setFetchedPlan] = useState<FetchedPlan | null>(null);

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
          setFetchedPlan({ userId, plan: payload.plan });
        }
      } catch {
        // Purely informational — a failed check must never block the header from
        // rendering; it just means the badge stays hidden until the next successful
        // check.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Only trust a fetched result if it was fetched for the *current* userId. This covers
  // logout (userId becomes null, so the badge hides immediately without waiting on a
  // fetch or needing a synchronous setState in the effect body) and guards against a
  // stale response from a previous user landing after a fast logout/login sequence.
  const plan = userId && fetchedPlan?.userId === userId ? fetchedPlan.plan : null;

  if (plan !== "pro") {
    return null;
  }

  return (
    <span aria-label={dictionary.navigation.proBadgeLabel} className="pro-badge">
      {dictionary.upgradeModal.proTierName}
    </span>
  );
}
