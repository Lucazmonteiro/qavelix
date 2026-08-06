"use client";

import type { getDictionary } from "@/i18n/dictionaries";
import { useResolvedPlan } from "@/lib/use-resolved-plan";

type Dictionary = ReturnType<typeof getDictionary>;

type ProBadgeProps = {
  dictionary: Dictionary;
};

// Shown beside the brand only for a genuinely confirmed Pro entitlement — reads the
// authoritative server-resolved plan via useResolvedPlan() (/api/entitlements/plan),
// never client-side session state or anything cached alone. Renders nothing at all until
// "pro" is confirmed, so there's no layout shift and no loading placeholder to
// accidentally leave visible.
export function ProBadge({ dictionary }: ProBadgeProps) {
  const plan = useResolvedPlan();

  if (plan !== "pro") {
    return null;
  }

  return (
    <span aria-label={dictionary.navigation.proBadgeLabel} className="pro-badge">
      {dictionary.upgradeModal.proTierName}
    </span>
  );
}
