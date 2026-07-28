"use client";

import { useId } from "react";

import { Modal } from "@/components/modal";
import { useLocaleState } from "@/i18n/locale-context";
import { formatBytes } from "@/lib/upload-policy";

export type PlanComparisonModalLimits = {
  maxUsesPerPeriod: number;
  maxUploadBytes: number;
};

type PlanComparisonModalProps = {
  open: boolean;
  onClose: () => void;
  anonymousLimits: PlanComparisonModalLimits;
  freeLimits: PlanComparisonModalLimits;
  proLimits: PlanComparisonModalLimits;
  // Locale-less path to return to after sign-up/sign-in (the tool page that triggered
  // this modal) — threaded through as ?callbackURL so the visitor resumes where they
  // were instead of landing on a generic page. Only dashboard, homepage, and
  // /tools/extract-audio are ever accepted by sanitizeCallbackPath() server-side, so an
  // unexpected value here simply falls back to the locale home, never an open redirect.
  returnPath: string;
};

// Shown when an anonymous visitor's combined lifetime usage pool is exhausted (backend
// reason "account_required" — see useEntitlementGate's shouldAutoOpenModal) — a
// three-way comparison (Anonymous/Free/Pro) with real, server-sourced numbers, distinct
// from UpgradeModal (which only ever compares Free vs Pro, for an authenticated Free
// actor hitting their daily cap). Every number here comes from the same
// /api/entitlements/status response the calling tool already fetched — never a second
// request, never a hand-typed duplicate of the real limits.
export function PlanComparisonModal({
  open,
  onClose,
  anonymousLimits,
  freeLimits,
  proLimits,
  returnPath,
}: PlanComparisonModalProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.planComparisonModal;
  const upgradeCopy = dictionary.upgradeModal;
  const titleId = useId();
  const callbackURL = encodeURIComponent(`/${locale}${returnPath}`);

  return (
    <Modal
      className="upgrade-modal plan-comparison-modal"
      closeLabel={upgradeCopy.closeLabel}
      onClose={onClose}
      open={open}
      titleId={titleId}
    >
      <h2 className="upgrade-modal__title" id={titleId}>
        {copy.title}
      </h2>
      <p className="upgrade-modal__description">{copy.description}</p>
      <div className="upgrade-modal__comparison plan-comparison-modal__comparison">
        <div className="upgrade-modal__tier">
          <p className="upgrade-modal__tier-name">{copy.anonymousTierName}</p>
          <ul>
            <li>{copy.usesLifetime.replace("{limit}", String(anonymousLimits.maxUsesPerPeriod))}</li>
            <li>{upgradeCopy.uploadSize.replace("{maxSize}", formatBytes(anonymousLimits.maxUploadBytes))}</li>
          </ul>
        </div>
        <div className="upgrade-modal__tier">
          <p className="upgrade-modal__tier-name">{upgradeCopy.freeTierName}</p>
          <ul>
            <li>{upgradeCopy.usesPerDay.replace("{limit}", String(freeLimits.maxUsesPerPeriod))}</li>
            <li>{upgradeCopy.uploadSize.replace("{maxSize}", formatBytes(freeLimits.maxUploadBytes))}</li>
          </ul>
        </div>
        <div className="upgrade-modal__tier upgrade-modal__tier--pro">
          <p className="upgrade-modal__tier-name">{upgradeCopy.proTierName}</p>
          <ul>
            <li>{upgradeCopy.usesPerDay.replace("{limit}", String(proLimits.maxUsesPerPeriod))}</li>
            <li>{upgradeCopy.uploadSize.replace("{maxSize}", formatBytes(proLimits.maxUploadBytes))}</li>
          </ul>
        </div>
      </div>
      <div className="upgrade-modal__actions">
        <a
          className="button button--primary"
          href={`/${locale}/sign-up?callbackURL=${callbackURL}`}
        >
          {copy.createAccountLabel}
        </a>
        <a
          className="button button--secondary"
          href={`/${locale}/sign-in?callbackURL=${callbackURL}`}
        >
          {copy.signInLabel}
        </a>
      </div>
    </Modal>
  );
}
