"use client";

import { useId, useState } from "react";

import { Modal } from "@/components/modal";
import { useLocaleState } from "@/i18n/locale-context";
import { startProUpgradeCheckout } from "@/lib/auth-client";
import { formatBytes } from "@/lib/upload-policy";

export type UpgradeModalLimits = {
  maxUsesPerPeriod: number;
  maxUploadBytes: number;
};

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  freeLimits: UpgradeModalLimits;
  proLimits: UpgradeModalLimits;
  // Locale-less path to return to if the visitor cancels checkout (e.g. the tool page
  // that triggered this modal) — successUrl is always the Plan page, see
  // startProUpgradeCheckout()'s own comment on why that's a single, non-duplicated path.
  cancelPath: string;
};

// Reusable across every tool: triggered by an authoritative backend "usage_limit_reached"
// response for an authenticated Free user (never for Pro — callers are responsible for
// not rendering this for a Pro actor, since Pro hitting its own much higher daily limit is
// a different, non-upsell message). freeLimits/proLimits are read server-side from the
// same TOOL_POLICY table every route enforces (see /api/entitlements/status) and passed
// in as props — never a hand-typed duplicate of the real limits, and never imported
// directly from the server-only policy module into this client component.
export function UpgradeModal({ open, onClose, freeLimits, proLimits, cancelPath }: UpgradeModalProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.upgradeModal;
  const titleId = useId();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleUpgrade() {
    setErrorMessage(null);
    setIsPending(true);

    const { error } = await startProUpgradeCheckout(locale, cancelPath);

    if (error) {
      setErrorMessage(
        error.code === "EMAIL_VERIFICATION_REQUIRED"
          ? copy.emailVerificationRequiredMessage
          : copy.checkoutErrorMessage,
      );
      setIsPending(false);
    }
  }

  return (
    <Modal className="upgrade-modal" closeLabel={copy.closeLabel} onClose={onClose} open={open} titleId={titleId}>
      <h2 className="upgrade-modal__title" id={titleId}>
        {copy.title}
      </h2>
      <p className="upgrade-modal__description">{copy.description}</p>
      <div className="upgrade-modal__comparison">
        <div className="upgrade-modal__tier">
          <p className="upgrade-modal__tier-name">{copy.freeTierName}</p>
          <ul>
            <li>{copy.usesPerDay.replace("{limit}", String(freeLimits.maxUsesPerPeriod))}</li>
            <li>{copy.uploadSize.replace("{maxSize}", formatBytes(freeLimits.maxUploadBytes))}</li>
          </ul>
        </div>
        <div className="upgrade-modal__tier upgrade-modal__tier--pro">
          <p className="upgrade-modal__tier-name">{copy.proTierName}</p>
          <ul>
            <li>{copy.usesPerDay.replace("{limit}", String(proLimits.maxUsesPerPeriod))}</li>
            <li>{copy.uploadSize.replace("{maxSize}", formatBytes(proLimits.maxUploadBytes))}</li>
          </ul>
        </div>
      </div>
      {errorMessage ? (
        <p className="form-status__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
      <div className="upgrade-modal__actions">
        <button
          className="button button--primary"
          disabled={isPending}
          onClick={() => void handleUpgrade()}
          type="button"
        >
          {isPending ? copy.checkoutPendingLabel : copy.upgradeButtonLabel}
        </button>
        <button className="button button--secondary" onClick={onClose} type="button">
          {copy.dismissLabel}
        </button>
      </div>
    </Modal>
  );
}
