"use client";

import { useState } from "react";

import { useLocaleState } from "@/i18n/locale-context";
import { authClient } from "@/lib/auth-client";

type BillingPortalButtonProps = {
  label: string;
  pendingLabel: string;
  errorMessage: string;
  // Shown instead of errorMessage when auth.ts's hooks.before rejects the request with
  // EMAIL_VERIFICATION_REQUIRED (see src/lib/server/auth/auth.ts) — the same launch
  // requirement the Stripe plugin's own subscription.requireEmailVerification enforces
  // for checkout, reproduced here since the plugin has no equivalent option for the
  // billing portal.
  emailVerificationRequiredMessage: string;
  // Locale-less path, e.g. "/dashboard/plan" — the locale prefix is added here so every
  // caller doesn't need to know the current locale itself.
  returnPath: string;
  className?: string;
};

// Shared by the Plan page (Pro users managing an existing subscription) and the Billing
// page (any user — Stripe gets a customer for every account via createCustomerOnSignUp,
// so the portal is reachable even before a first subscription, just with an empty
// history). Redirects the browser automatically on success — see PlanActions's comment
// on Better Auth's client fetch plugin behavior.
export function BillingPortalButton({
  label,
  pendingLabel,
  errorMessage,
  emailVerificationRequiredMessage,
  returnPath,
  className,
}: BillingPortalButtonProps) {
  const { locale } = useLocaleState();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsPending(true);

    const { error: requestError } = await authClient.subscription.billingPortal({
      returnUrl: `/${locale}${returnPath}`,
    });

    if (requestError) {
      setError(
        requestError.code === "EMAIL_VERIFICATION_REQUIRED"
          ? emailVerificationRequiredMessage
          : errorMessage,
      );
      setIsPending(false);
    }
  }

  return (
    <div className="dashboard-plan-actions">
      <button
        className={className ?? "button button--secondary"}
        disabled={isPending}
        onClick={handleClick}
        type="button"
      >
        {isPending ? pendingLabel : label}
      </button>
      {error ? (
        <p className="form-status__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
