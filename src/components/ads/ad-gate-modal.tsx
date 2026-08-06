"use client";

import { useEffect, useId, useState } from "react";

import { AdUnit } from "@/components/ads/ad-unit";
import { Modal } from "@/components/modal";
import { replaceLocaleInPath, useLocaleState } from "@/i18n/locale-context";
import { startProUpgradeCheckout } from "@/lib/auth-client";

const COUNTDOWN_SECONDS = 5;

// Last-resort guard, not a translation strategy: the Dictionary type guarantees every
// locale defines adGateModal/upgradeModal, so this should be unreachable in a correctly
// synced codebase. It exists because branch drift can desync the two independently of
// the type system (e.g. a partial cherry-pick that brings this component over without the
// dictionary entries it reads — exactly what happened once already) — better to render
// sane English copy than crash with "Cannot read properties of undefined". If you ever see
// this fallback rendered in practice, the real fix is re-syncing dictionaries.ts, not
// editing these strings.
const FALLBACK_AD_GATE_COPY = {
  title: "Continue for free with a quick ad",
  description: "Watch this short ad to continue processing, or skip ads entirely with QAVELIX PRO.",
  countdownLabel: "Continue in {seconds}s...",
  readyLabel: "You're all set — continue whenever you're ready.",
  continueLabel: "Continue",
  upsellMessage: "Upgrade to QAVELIX PRO: 100 daily uses ad-free and support for files up to 500MB.",
  upgradeButtonLabel: "Upgrade to Pro",
  anonymousPlanExplainer:
    "Anonymous plan: 5 uses max (2 ad-free, 3 ad-supported). Create a free account to double your limit to 10 uses!",
  freePlanExplainer: "Free account: 10 daily uses (ad-supported). Upgrade to Pro for 100 ad-free uses.",
};

const FALLBACK_UPGRADE_COPY = {
  closeLabel: "Close",
  checkoutPendingLabel: "Redirecting to checkout...",
  checkoutErrorMessage: "Could not start checkout. Try again.",
  emailVerificationRequiredMessage:
    "Verify your email address before upgrading to Pro. Check your inbox for the verification link, or request a new one.",
};

type AdGateModalProps = {
  open: boolean;
  onClose: () => void;
  // Called once the visitor has watched out the countdown (or clicked "Continue" once it
  // reaches zero) — the caller is responsible for re-invoking its own start/process
  // function afterward; this component only clears the gate, it never re-triggers work.
  onCleared: () => void;
  // Anonymous actors can't check out without an account (no Stripe customer to attach the
  // subscription to), so they're offered sign-up/sign-in instead of the Stripe flow — same
  // split PlanComparisonModal/UpgradeModal already use for the identical reason.
  plan: "anonymous" | "free";
  cancelPath: string;
};

// Shown from the moment a Free or anonymous actor starts a 2nd (or later) job in the
// current period. Never shown to Pro (100% ad-free, and callers never construct this for a
// Pro actor) and never shown for a 1st use (see useAdGate's `requiresAd`). Offers two ways
// forward, both ending the interruption: watch/wait out the interstitial ad slot for
// COUNTDOWN_SECONDS, or leave to upgrade/sign up for Pro. Deliberately does not gate the
// result of a job already running — it only ever appears before a new job starts (see
// useAdGate.consumeAttempt(), called at the top of each tool's start function, before any
// network request), matching this product's standing rule that an upgrade/ad prompt may
// gate the next task but never the one already in flight.
export function AdGateModal({ open, onClose, onCleared, plan, cancelPath }: AdGateModalProps) {
  const { dictionary, locale } = useLocaleState();
  // See FALLBACK_AD_GATE_COPY's comment above — dictionary.adGateModal/.upgradeModal are
  // typed as always-present, so these fallbacks are a defensive no-op in a correctly
  // synced build; they only ever matter if that invariant is broken at runtime.
  const copy = dictionary.adGateModal ?? FALLBACK_AD_GATE_COPY;
  const upgradeCopy = dictionary.upgradeModal ?? FALLBACK_UPGRADE_COPY;
  const titleId = useId();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // This component stays mounted across opens/closes (its parent toggles `open`, the same
  // pattern UpgradeModal/PlanComparisonModal's callers use), so the countdown must reset
  // for the *next* open rather than only on first mount. Tracked here (render-time state
  // adjustment on an `open` transition, not an effect) instead of in the timer effect
  // below, so that effect only ever does the one thing it's actually for: ticking.
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setSecondsLeft(COUNTDOWN_SECONDS);
      setErrorMessage(null);
    }
  }

  useEffect(() => {
    if (!open || secondsLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);

    return () => window.clearTimeout(timer);
  }, [open, secondsLeft]);

  async function handleUpgrade() {
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await startProUpgradeCheckout(locale, cancelPath);

    if (error) {
      setErrorMessage(
        error.code === "EMAIL_VERIFICATION_REQUIRED"
          ? upgradeCopy.emailVerificationRequiredMessage
          : upgradeCopy.checkoutErrorMessage,
      );
      setIsPending(false);
    }
  }

  const callbackURL = encodeURIComponent(replaceLocaleInPath(cancelPath, locale));
  const canContinue = secondsLeft <= 0;
  const progressPercent = Math.round(
    ((COUNTDOWN_SECONDS - secondsLeft) / COUNTDOWN_SECONDS) * 100,
  );
  const planExplainer = plan === "anonymous" ? copy.anonymousPlanExplainer : copy.freePlanExplainer;

  return (
    <Modal className="upgrade-modal ad-gate-modal" closeLabel={upgradeCopy.closeLabel} onClose={onClose} open={open} titleId={titleId}>
      <h2 className="upgrade-modal__title" id={titleId}>
        {copy.title}
      </h2>
      <p className="upgrade-modal__description">{copy.description}</p>
      <AdUnit className="ad-gate-modal__ad" format="interstitial" plan={plan} />
      <div
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={progressPercent}
        className="ad-gate-modal__progress"
        role="progressbar"
      >
        <div className="ad-gate-modal__progress-bar" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="ad-gate-modal__countdown" role="status">
        {canContinue
          ? copy.readyLabel
          : copy.countdownLabel.replace("{seconds}", String(secondsLeft))}
      </p>
      <div className="ad-gate-modal__upsell">
        <p>{planExplainer}</p>
        <p>{copy.upsellMessage}</p>
      </div>
      {errorMessage ? (
        <p className="form-status__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="upgrade-modal__actions">
        <button
          className="button button--primary"
          disabled={!canContinue}
          onClick={onCleared}
          type="button"
        >
          {copy.continueLabel}
        </button>
        {plan === "free" ? (
          <button
            className="button button--secondary"
            disabled={isPending}
            onClick={() => void handleUpgrade()}
            type="button"
          >
            {isPending ? upgradeCopy.checkoutPendingLabel : copy.upgradeButtonLabel}
          </button>
        ) : (
          <a className="button button--secondary" href={`/${locale}/sign-up?callbackURL=${callbackURL}`}>
            {copy.upgradeButtonLabel}
          </a>
        )}
      </div>
    </Modal>
  );
}
