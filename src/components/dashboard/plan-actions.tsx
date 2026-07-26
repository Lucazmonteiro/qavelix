"use client";

import { useState } from "react";

import { BillingPortalButton } from "@/components/dashboard/billing-portal-button";
import { useLocaleState } from "@/i18n/locale-context";
import { startProUpgradeCheckout } from "@/lib/auth-client";
import type { PlanType } from "@/lib/server/entitlements/policy";

type PlanActionsProps = {
  plan: PlanType;
};

// Redirects the browser automatically on success (Better Auth's client fetch plugin does
// this whenever a response carries { url, redirect: true } — see
// node_modules/better-auth/dist/client/fetch-plugins.mjs) — this component only needs to
// handle the pending/error states while that redirect is in flight.
export function PlanActions({ plan }: PlanActionsProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.dashboard.plan;
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (plan === "pro") {
    return (
      <BillingPortalButton
        errorMessage={copy.portalErrorMessage}
        label={copy.manageSubscriptionLabel}
        pendingLabel={copy.portalPendingLabel}
        returnPath="/dashboard/plan"
      />
    );
  }

  async function handleUpgrade() {
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await startProUpgradeCheckout(locale, "/dashboard/plan?checkout=cancelled");

    if (error) {
      setErrorMessage(copy.checkoutErrorMessage);
      setIsPending(false);
    }
  }

  return (
    <div className="dashboard-plan-actions">
      <button
        className="button button--primary"
        disabled={isPending}
        onClick={handleUpgrade}
        type="button"
      >
        {isPending ? copy.checkoutPendingLabel : copy.upgradeButtonLabel}
      </button>
      {errorMessage ? (
        <p className="form-status__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
