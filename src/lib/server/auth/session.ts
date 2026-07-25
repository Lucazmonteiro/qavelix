import type { Route } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/lib/server/auth/auth";
import type { Locale } from "@/i18n/locales";

// Server-side session read for use inside Server Components (page.tsx). Wraps
// getAuth().api.getSession() so callers don't each need to know how to fetch/forward
// request headers. Returns null for a guest, or { session, user } for a signed-in
// visitor — safe to call from any page, not just the guest-only ones Milestone 2 wires
// it into.
export async function getOptionalSession() {
  const requestHeaders = await headers();

  return getAuth().api.getSession({ headers: requestHeaders });
}

// Only accepts an internal, locale-prefixed /dashboard path. This is intentionally an
// allowlist, not a generic "starts with / and doesn't start with //" check — the
// callback value arrives via a query string an attacker fully controls
// (?callbackURL=...), and the only legitimate destination this flow ever needs to
// produce is a page inside the dashboard, so there is no reason to accept anything
// broader. Rejects protocol-relative URLs (//evil.com), absolute URLs, and anything
// outside /dashboard outright by construction, not by trying to blocklist every way to
// smuggle one past a looser check.
const SAFE_CALLBACK_PATTERN = /^\/[a-z]{2}(-[A-Z]{2})?\/dashboard(\/[a-zA-Z0-9/_-]*)?$/;

export function sanitizeCallbackPath(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  return SAFE_CALLBACK_PATTERN.test(value) ? value : null;
}

// Gates a protected page: redirects to the localized sign-in page (carrying a sanitized
// callback so the user lands back where they intended after signing in) when there is no
// session, otherwise returns the session. `callbackPath` is a value this codebase
// constructs itself (e.g. "/dashboard"), not user input — it still round-trips through
// sanitizeCallbackPath for consistency with the value read back on the sign-in page, not
// because it's untrusted here.
export async function requireSession(locale: Locale, callbackPath: string) {
  const session = await getOptionalSession();

  if (!session) {
    const callbackURL = sanitizeCallbackPath(`/${locale}${callbackPath}`);
    const signInUrl = callbackURL
      ? `/${locale}/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`
      : `/${locale}/sign-in`;

    // typedRoutes only recognizes literal route segments, not a dynamically-appended
    // query string — this is Next's own documented escape hatch for that case, not a
    // way around any actual validation (sanitizeCallbackPath already ran above).
    redirect(signInUrl as Route);
  }

  return session;
}
