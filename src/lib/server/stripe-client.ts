import Stripe from "stripe";

import { env } from "@/env/server";

// Same globalThis-anchored singleton pattern as getDb()/getAuth() (src/lib/server/db/client.ts,
// src/lib/server/auth/auth.ts) — `next dev`'s hot reload re-evaluates this module on file
// save, so a plain module-level variable would reconstruct the client on every reload.
type StripeGlobal = typeof globalThis & {
  __qavelixStripe?: Stripe;
};

const stripeGlobal = globalThis as StripeGlobal;

// Returns null when STRIPE_SECRET_KEY is unset — the single place every other Stripe-aware
// module (auth.ts's plugin, billing.ts's display helpers) checks, instead of each
// re-deriving "is billing configured" from env vars itself.
export function getStripeClient(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeGlobal.__qavelixStripe) {
    stripeGlobal.__qavelixStripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-06-24.dahlia",
    });
  }

  return stripeGlobal.__qavelixStripe;
}
