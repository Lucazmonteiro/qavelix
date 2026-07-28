import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { env } from "@/env/server";
import { getAuth } from "@/lib/server/auth/auth";
import { getDb } from "@/lib/server/db/client";
import { user as userTable } from "@/lib/server/db/schema";
import { logSecurityEvent } from "@/lib/server/security";
import { getStripeClient } from "@/lib/server/stripe-client";

export type ActiveSubscriptionDetail = {
  status: string;
  periodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

export type BillingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export type BillingAddressUpdateResult =
  | { ok: true; address: BillingAddress }
  | { ok: false; reason: "not_configured" | "no_customer" | "stripe_error" };

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

// Every account gets a Stripe Customer at sign-up (createCustomerOnSignUp: true in
// auth.ts), but that id isn't exposed through the normal session/user API (it's not a
// registered Better Auth additionalField) — read it directly from the user table, the
// one place it's actually stored.
async function getStripeCustomerId(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ stripeCustomerId: userTable.stripeCustomerId })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  return row?.stripeCustomerId ?? null;
}

// Stripe is the single source of truth for billing address — QAVELIX never stores a
// separate copy, avoiding a second address record that could drift from what Stripe
// actually has on file. Returns null (never a fabricated placeholder) whenever billing
// isn't configured, the customer doesn't exist yet, or no address has been set.
export async function getStripeBillingAddress(userId: string): Promise<BillingAddress | null> {
  const stripeClient = getStripeClient();

  if (!stripeClient) {
    return null;
  }

  const stripeCustomerId = await getStripeCustomerId(userId);

  if (!stripeCustomerId) {
    return null;
  }

  try {
    const customer = await stripeClient.customers.retrieve(stripeCustomerId);

    if (customer.deleted || !customer.address || !customer.address.line1) {
      return null;
    }

    return {
      line1: customer.address.line1,
      line2: customer.address.line2 ?? undefined,
      city: customer.address.city ?? "",
      state: customer.address.state ?? undefined,
      postalCode: customer.address.postal_code ?? "",
      country: customer.address.country ?? "",
    };
  } catch (error) {
    logSecurityEvent("error", "billing_address_lookup_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

// The only function that writes a billing address anywhere — always through Stripe's own
// Customer object (stripeClient.customers.update), never a parallel QAVELIX-owned copy.
// Re-fetches from Stripe after the write rather than trusting the client-submitted
// values or Stripe's own echoed response, so a caller can never report "saved"
// unless Stripe's stored state was actually confirmed.
export async function updateStripeBillingAddress(
  userId: string,
  address: BillingAddress,
): Promise<BillingAddressUpdateResult> {
  const stripeClient = getStripeClient();

  if (!stripeClient) {
    return { ok: false, reason: "not_configured" };
  }

  const stripeCustomerId = await getStripeCustomerId(userId);

  if (!stripeCustomerId) {
    return { ok: false, reason: "no_customer" };
  }

  try {
    await stripeClient.customers.update(stripeCustomerId, {
      address: {
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
      },
    });

    const confirmed = await getStripeBillingAddress(userId);

    if (!confirmed) {
      return { ok: false, reason: "stripe_error" };
    }

    return { ok: true, address: confirmed };
  } catch (error) {
    logSecurityEvent("error", "billing_address_update_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, reason: "stripe_error" };
  }
}
