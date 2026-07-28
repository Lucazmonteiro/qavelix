"use client";

import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/react";

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
export function startProUpgradeCheckout(locale: string, cancelPath: string) {
  return authClient.subscription.upgrade({
    plan: "pro",
    successUrl: `/${locale}/dashboard/plan?checkout=success`,
    cancelUrl: `/${locale}${cancelPath}`,
  });
}
