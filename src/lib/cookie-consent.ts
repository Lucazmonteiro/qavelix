// Shared storage contract for the cookie consent banner (cookie-consent-banner.tsx) and
// every ad-rendering surface (AdUnit) that must not set a non-essential (AdSense)
// cookie before the visitor has actually agreed to it. Deliberately localStorage, not a
// cookie itself — recording "did they consent" in a cookie would itself be exactly the
// kind of non-essential tracking storage this mechanism exists to gate, the same
// reasoning src/i18n's cookie-policy page gives for the existing theme preference.
export const COOKIE_CONSENT_STORAGE_KEY = "qavelix-cookie-consent";

// No native browser event fires when a *different component in the same tab* writes
// localStorage (the "storage" event only fires in *other* tabs/windows) — this custom
// event is the from-scratch fix, matching this codebase's general preference for a small
// dependency-free utility over pulling in a state-management library for one shared flag.
// Every useCookieConsent() instance (the banner, and every mounted AdUnit) listens for it,
// so accepting/declining updates every ad slot on the page immediately, without a reload.
export const COOKIE_CONSENT_CHANGE_EVENT = "qavelix-cookie-consent-change";

export type CookieConsentStatus = "accepted" | "declined";

export function readCookieConsent(): CookieConsentStatus | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);

  return value === "accepted" || value === "declined" ? value : null;
}

export function writeCookieConsent(status: CookieConsentStatus): void {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, status);
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGE_EVENT));
}
