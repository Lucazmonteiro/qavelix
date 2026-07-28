"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { Modal } from "@/components/modal";
import type { Dictionary } from "@/i18n/dictionaries";

type ProWelcomeModalProps = {
  // True only when the server has already confirmed a persisted Pro entitlement AND the
  // visitor just completed checkout (checkout=success) — never rendered from the query
  // param alone, per the product-integrity rule that a client-controlled query string
  // must never be read as proof of Pro access.
  shouldOffer: boolean;
  copy: Dictionary["dashboard"]["plan"]["welcome"];
  benefits: string[];
  locale: string;
};

const sessionStorageKey = "qavelix:pro-welcome-shown";

// One-time celebratory experience after a genuinely confirmed Pro activation. Gated on
// sessionStorage (not persisted plan state) purely to stop the exact same browser tab
// from re-showing it on a refresh or back/forward navigation to the same
// ?checkout=success URL — the entitlement check that decides shouldOffer already lives
// entirely server-side and is unaffected by this flag.
export function ProWelcomeModal({ shouldOffer, copy, benefits, locale }: ProWelcomeModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldOffer) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(sessionStorageKey) === "1") {
        return;
      }

      window.sessionStorage.setItem(sessionStorageKey, "1");
    } catch {
      // Storage can be unavailable (private browsing, disabled storage) — the welcome
      // still shows once for this render; it just loses the refresh/back-nav guard.
    }

    // sessionStorage is a browser-only API unavailable during SSR/hydration, so the
    // open/closed decision can only be made client-side after mount — there is no
    // derived-state equivalent here, unlike the cases this lint rule is meant to catch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true);
  }, [shouldOffer]);

  function handleClose() {
    setOpen(false);
  }

  function handleGoToTools() {
    setOpen(false);
    router.push(`/${locale}` as Route);
  }

  return (
    <Modal className="pro-welcome-modal" closeLabel={copy.closeLabel} onClose={handleClose} open={open} titleId={titleId}>
      <h2 className="pro-welcome-modal__title" id={titleId}>
        {copy.title}
      </h2>
      <p>{copy.intro}</p>
      <p>{copy.supportMessage}</p>
      <p>{copy.goalMessage}</p>
      <div className="pro-welcome-modal__benefits">
        <p className="pro-welcome-modal__benefits-title">{copy.benefitsTitle}</p>
        <ul>
          {benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      </div>
      <button className="button button--primary" onClick={handleGoToTools} type="button">
        {copy.ctaLabel}
      </button>
    </Modal>
  );
}
