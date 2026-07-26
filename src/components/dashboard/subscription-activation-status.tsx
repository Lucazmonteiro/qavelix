"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type SubscriptionActivationStatusProps = {
  // Re-derived from the server on every render (see dashboard/plan/page.tsx) — this
  // component never decides plan state itself, it only decides how long to keep asking
  // the server to check again.
  isPro: boolean;
  pendingTitle: string;
  pendingMessage: string;
  stillPendingMessage: string;
  refreshLabel: string;
};

const pollDelaysMs = [2_000, 3_000, 5_000, 5_000, 5_000];

// Shown on /dashboard/plan?checkout=success while the persisted plan hasn't caught up to
// "pro" yet — see entitlements/service.ts's getPlan() comment on why this gap can exist
// (the checkout-success redirect and the Stripe webhook both write the verified
// subscription state, but on different timelines). Never claims success itself; it only
// asks the server (via router.refresh(), which re-runs the Server Component page and its
// getPlan() call) to check again a bounded number of times, then hands off to a manual
// retry so this never turns into a silent infinite-polling loop.
export function SubscriptionActivationStatus({
  isPro,
  pendingTitle,
  pendingMessage,
  stillPendingMessage,
  refreshLabel,
}: SubscriptionActivationStatusProps) {
  const router = useRouter();
  const attemptRef = useRef(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    if (isPro) {
      return;
    }

    if (attemptRef.current >= pollDelaysMs.length) {
      setExhausted(true);
      return;
    }

    const delay = pollDelaysMs[attemptRef.current];
    attemptRef.current += 1;

    const timeoutId = window.setTimeout(() => {
      router.refresh();
    }, delay);

    return () => window.clearTimeout(timeoutId);
    // isPro changing (a fresh server value after refresh()) is what re-triggers this
    // effect and decides whether to keep polling — router is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  if (isPro) {
    return null;
  }

  return (
    <div className="subscription-activation-status" role="status" aria-live="polite">
      <span className="validation-loader" aria-hidden="true" />
      <div>
        <p className="subscription-activation-status__title">{pendingTitle}</p>
        <p>{exhausted ? stillPendingMessage : pendingMessage}</p>
        {exhausted ? (
          <button
            className="button button--secondary"
            onClick={() => {
              attemptRef.current = 0;
              setExhausted(false);
              router.refresh();
            }}
            type="button"
          >
            {refreshLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
