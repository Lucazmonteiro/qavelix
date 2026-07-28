"use client";

import { useState } from "react";

import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import {
  formatContributionAmount,
  isValidContributionCents,
  MAX_CONTRIBUTION_CENTS,
  MIN_CONTRIBUTION_CENTS,
  SUGGESTED_CONTRIBUTION_AMOUNTS_CENTS,
} from "@/lib/contribution-amounts";

type Dictionary = ReturnType<typeof getDictionary>;

type SupportCheckoutFormProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type CheckoutResponse = {
  ok: boolean;
  url?: string;
  error?: { code?: string; message?: string };
};

// Suggested-amount buttons and a custom-amount field both resolve to the same integer
// cents value sent to the server — the server independently re-validates it (never
// trusts this client-side check alone) and creates the actual Checkout Session; this
// component never talks to Stripe directly.
export function SupportCheckoutForm({ dictionary, locale }: SupportCheckoutFormProps) {
  const copy = dictionary.support;
  const [selectedCents, setSelectedCents] = useState<number>(SUGGESTED_CONTRIBUTION_AMOUNTS_CENTS[1]);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectSuggested(cents: number) {
    setIsCustom(false);
    setSelectedCents(cents);
    setError(null);
  }

  function selectCustom(value: string) {
    setIsCustom(true);
    setCustomAmount(value);
    setError(null);
  }

  function resolveAmountCents(): number | null {
    if (!isCustom) {
      return selectedCents;
    }

    const dollars = Number.parseFloat(customAmount.replace(",", "."));

    if (!Number.isFinite(dollars)) {
      return null;
    }

    return Math.round(dollars * 100);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const amountCents = resolveAmountCents();

    if (amountCents === null || !isValidContributionCents(amountCents)) {
      setError(copy.invalidAmountMessage);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/support/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountCents, locale }),
      });
      const payload = (await response.json()) as CheckoutResponse;

      if (!response.ok || !payload.ok || !payload.url) {
        setError(copy.errorMessage);
        setIsSubmitting(false);
        return;
      }

      window.location.href = payload.url;
    } catch {
      setError(copy.errorMessage);
      setIsSubmitting(false);
    }
  }

  return (
    <form className="support-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2 className="dashboard-card__title">{copy.amountsTitle}</h2>
      <div className="support-form__amounts" role="radiogroup" aria-label={copy.amountsTitle}>
        {SUGGESTED_CONTRIBUTION_AMOUNTS_CENTS.map((cents) => (
          <button
            aria-pressed={!isCustom && selectedCents === cents}
            className="support-form__amount-button"
            key={cents}
            onClick={() => selectSuggested(cents)}
            type="button"
          >
            {formatContributionAmount(cents, locale)}
          </button>
        ))}
      </div>
      <div className="auth-field">
        <label htmlFor="support-custom-amount">{copy.customAmountLabel}</label>
        <input
          id="support-custom-amount"
          inputMode="decimal"
          min={MIN_CONTRIBUTION_CENTS / 100}
          max={MAX_CONTRIBUTION_CENTS / 100}
          onChange={(event) => selectCustom(event.target.value)}
          onFocus={() => setIsCustom(true)}
          placeholder={copy.customAmountPlaceholder}
          step="1"
          type="number"
          value={customAmount}
        />
      </div>
      {error ? (
        <p className="form-status__error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button button--primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? copy.contributingLabel : copy.contributeButtonLabel}
      </button>
      <p className="settings-form__note">
        {"🔒 "}
        {copy.secureNote}
      </p>
      <p className="settings-form__note">{copy.legalNote}</p>
    </form>
  );
}
