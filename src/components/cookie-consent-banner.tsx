"use client";

import { useLocaleState } from "@/i18n/locale-context";
import { useCookieConsent } from "@/lib/use-cookie-consent";

// Shown only in the "undecided" state (see useCookieConsent) — never during the brief
// "unresolved" window before the client-side localStorage read completes, and never once
// the visitor has actually chosen. Accepting/declining here is the only thing that lets
// AdUnit (src/components/ads/ad-unit.tsx) render a real ad and push to adsbygoogle — until
// then, every ad slot on the page stays a reserved-space placeholder, never a live
// AdSense request, so no non-essential cookie is set before this choice is made.
export function CookieConsentBanner() {
  const { dictionary, locale } = useLocaleState();
  const { status, accept, decline } = useCookieConsent();
  const copy = dictionary.cookieConsentBanner;

  if (status !== "undecided") {
    return null;
  }

  return (
    <div aria-label={copy.ariaLabel} className="cookie-consent-banner" role="region">
      <div className="cookie-consent-banner__inner">
        <p className="cookie-consent-banner__message">
          {copy.message} <a href={`/${locale}/cookie-policy`}>{copy.learnMoreLabel}</a>
        </p>
        <div className="cookie-consent-banner__actions">
          <button className="button button--secondary" onClick={decline} type="button">
            {copy.declineLabel}
          </button>
          <button className="button button--primary" onClick={accept} type="button">
            {copy.acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
