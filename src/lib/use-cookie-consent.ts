"use client";

import { useCallback, useEffect, useState } from "react";

import {
  COOKIE_CONSENT_CHANGE_EVENT,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";

// "unresolved": the very first render (server and the client's own hydration pass agree
// on this exact value, since neither can read localStorage yet — see readCookieConsent's
// SSR guard), so this never causes a hydration mismatch. The effect below resolves it to
// one of the other three states immediately after mount, a normal post-commit state
// update like every other client-only data hook in this codebase (useEntitlementGate,
// pro-badge.tsx), not a value React had to reconcile against server-rendered markup.
// "undecided": checked, and nothing is stored yet — the banner should show, and no
// non-essential (AdSense) cookie may be set yet.
export type CookieConsentState = "unresolved" | "undecided" | "accepted" | "declined";

// Single shared read/write surface for the cookie consent banner and every AdUnit
// instance on the page. Each call site gets its own React state, but all instances stay
// in sync via COOKIE_CONSENT_CHANGE_EVENT (see cookie-consent.ts) — accepting in the
// banner makes every already-mounted ad slot re-evaluate immediately, without a reload.
export function useCookieConsent() {
  const [status, setStatus] = useState<CookieConsentState>("unresolved");

  useEffect(() => {
    function syncFromStorage() {
      setStatus(readCookieConsent() ?? "undecided");
    }

    // Wrapped so the initial read isn't a synchronous top-level setState call in the
    // effect body (react-hooks/set-state-in-effect) — the same pattern already used by
    // useEntitlementGate's refresh() and AdUnit's requestAd().
    async function loadInitialStatus() {
      syncFromStorage();
    }

    void loadInitialStatus();
    window.addEventListener(COOKIE_CONSENT_CHANGE_EVENT, syncFromStorage);

    return () => window.removeEventListener(COOKIE_CONSENT_CHANGE_EVENT, syncFromStorage);
  }, []);

  const accept = useCallback(() => writeCookieConsent("accepted"), []);
  const decline = useCallback(() => writeCookieConsent("declined"), []);

  return { status, accept, decline };
}
