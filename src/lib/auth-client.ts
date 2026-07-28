"use client";

import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/react";

import { replaceLocaleInPath } from "@/i18n/locale-context";
import type { Locale } from "@/i18n/locales";

// No baseURL configured on purpose: it defaults to the relative "/api/auth", which is
// exactly our same-origin route (src/app/api/auth/[...all]/route.ts) — no cross-origin
// config needed, matching every other client-side call in this app (all same-origin
// fetches to /api/*).
//
// stripeClient({ subscription: true }) is safe to include unconditionally even when the
// server-side plugin is absent (Stripe env vars unset) — it just adds inert client
// methods (authClient.subscription.*) that would 404/error if actually called, the same
// as calling any other not-configured endpoint. The dashboard only calls these once a
// real plan/price is confirmed present (see dashboard/plan/page.tsx).
export const authClient = createAuthClient({
  plugins: [stripeClient({ subscription: true })],
});

export const useSession = authClient.useSession;

// Shared by every entry point that can start a Pro checkout (the Plan page's upgrade
// button, the reusable upgrade-offer modal shown on a daily-limit block) so the plan
// name, and the success destination that drives the activation/welcome flow, are never
// duplicated or allowed to drift between call sites. Always returns to the Plan page on
// success — that's the one place the app resolves and displays the activation/welcome
// state (see dashboard/plan/page.tsx) — but cancellation returns the visitor to wherever
// they started the checkout from.
//
// cancelPath comes from two shapes of caller: a hardcoded locale-less literal (the Plan
// page's own upgrade button, e.g. "/dashboard/plan?checkout=cancelled") and a live
// usePathname() value from a tool page (the upgrade modal shown on a daily-limit block),
// which — under this app's /[locale]/... routing — already includes the locale segment
// (e.g. "/pt-BR" on the homepage compressor). Naively prepending `/${locale}` on top of
// that produced "/pt-BR/pt-BR" and a Stripe Checkout cancel_url that 404'd. Reusing
// replaceLocaleInPath() (the same locale-swap helper the header's language selector and
// the dashboard settings language links already use) handles both shapes correctly: it
// swaps an existing locale segment in place instead of stacking a second one, and always
// forces the result to start with "/${locale}", so it can never resolve to an external
// URL even if cancelPath were ever malformed.
export function startProUpgradeCheckout(locale: Locale, cancelPath: string) {
  return authClient.subscription.upgrade({
    plan: "pro",
    successUrl: `/${locale}/dashboard/plan?checkout=success`,
    cancelUrl: replaceLocaleInPath(cancelPath, locale),
  });
}
