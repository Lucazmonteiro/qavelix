import { headers } from "next/headers";

import { env } from "@/env/server";
import { getAuth } from "@/lib/server/auth/auth";
import { logSecurityEvent } from "@/lib/server/security";
import { getStripeClient } from "@/lib/server/stripe-client";

export type ActiveSubscriptionDetail = {
  status: string;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

// Whether checkout/billing-portal/webhook is actually reachable — mirrors the same
// three-env-var check auth.ts's createStripePlugin() uses to decide whether to register
// the plugin at all, so the dashboard's "is Pro purchasable" question always agrees with
// whether the underlying routes actually exist.
export function isBillingConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRO_MONTHLY_PRICE_ID);
}

// Fetched live from Stripe rather than duplicated as a local constant, so the displayed
// price can never silently drift from the actual Stripe Price object (e.g. after a
// dashboard price change) — matches this project's "no fake/stale numbers" dashboard
// rule. Returns null (never a guessed fallback) if billing isn't configured or the price
// lookup fails; callers render an honest empty state instead.
export async function getProMonthlyPriceDisplay(locale: string): Promise<string | null> {
  const stripeClient = getStripeClient();

  if (!stripeClient || !env.STRIPE_PRO_MONTHLY_PRICE_ID) {
    return null;
  }

  try {
    const price = await stripeClient.prices.retrieve(env.STRIPE_PRO_MONTHLY_PRICE_ID);

    if (price.unit_amount === null) {
      return null;
    }

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: price.currency,
    }).format(price.unit_amount / 100);
  } catch (error) {
    logSecurityEvent("error", "billing_price_lookup_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

// Read-only detail for the dashboard Plan page ("renews on"/"cancels on"). This is
// display-only — user_entitlement.plan (Milestone 4, kept in sync by the webhook hooks
// in auth.ts) remains the actual authority for what a user can do. A lookup failure here
// degrades to an honest "no detail available" rather than blocking the page or fabricating
// a date, matching this project's existing "fail safe, never fake data" dashboard rule.
export async function getActiveSubscriptionDetail(): Promise<ActiveSubscriptionDetail | null> {
  try {
    const requestHeaders = await headers();
    const subscriptions = await getAuth().api.listActiveSubscriptions({
      headers: requestHeaders,
    });
    const active = subscriptions.find(
      (subscription) => subscription.status === "active" || subscription.status === "trialing",
    );

    if (!active) {
      return null;
    }

    return {
      status: active.status,
      periodEnd: active.periodEnd ?? null,
      cancelAtPeriodEnd: active.cancelAtPeriodEnd ?? false,
    };
  } catch (error) {
    logSecurityEvent("error", "billing_subscription_lookup_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}
