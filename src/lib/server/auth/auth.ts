import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { stripe } from "@better-auth/stripe";

import { env } from "@/env/server";
import { getDb } from "@/lib/server/db/client";
import * as schema from "@/lib/server/db/schema";
import { setUserPlan } from "@/lib/server/entitlements/service";
import { logSecurityEvent } from "@/lib/server/security";
import { getStripeClient } from "@/lib/server/stripe-client";
import type { Subscription } from "@better-auth/stripe";

// DEV-ONLY STUB. There is no email provider configured in this project yet — these
// callbacks log the action link via the existing structured logger instead of sending a
// real email, purely so the Forgot Password / Reset Password / Email Verification UI
// (Milestone 2) can be exercised end-to-end locally. A real provider (Resend, Postmark,
// SES, etc.) must replace this before any of these flows are exposed to real users —
// nothing here is production email delivery.
function logAuthEmailLink(event: string, email: string, url: string) {
  logSecurityEvent("info", event, { email, url });
}

// Milestone 5 — Stripe billing, additive on top of Milestone 4's entitlement system.
// Fully optional, the same "unset means simply absent" convention already used for
// DATABASE_URL/BETTER_AUTH_SECRET in env/server.ts: with any of the three Stripe env
// vars missing, this returns null and every existing tool/dashboard/entitlement route
// keeps working exactly as in Milestone 4, with no Upgrade/Billing Portal available.
//
// This plugin owns every Stripe mechanic (Checkout, Billing Portal, webhook signature
// verification, its own `subscription` table) — see db/schema.ts's comment on that
// table. It is explicitly NOT the source of truth the rest of the app reads plan from;
// that stays user_entitlement.plan, kept in sync here via the lifecycle hooks below so
// getPlan()/reserveUsage()/the dashboard need zero changes.
function createStripePlugin() {
  const stripeClient = getStripeClient();

  if (!stripeClient || !env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_PRO_MONTHLY_PRICE_ID) {
    return null;
  }

  // Only "active"/"trialing" grant Pro — every other status (past_due, unpaid, canceled,
  // incomplete_expired, paused) reverts to Free immediately. This is the failure-handling
  // rule for this milestone: a failed renewal (past_due -> eventually canceled/unpaid)
  // must not leave a user with permanent Pro access just because they subscribed once.
  async function syncPlanFromSubscription(subscription: Subscription) {
    const isProActive = subscription.status === "active" || subscription.status === "trialing";

    await setUserPlan(subscription.referenceId, isProActive ? "pro" : "free");
  }

  return stripe({
    stripeClient,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    createCustomerOnSignUp: true,
    subscription: {
      enabled: true,
      plans: [
        {
          name: "pro",
          priceId: env.STRIPE_PRO_MONTHLY_PRICE_ID,
        },
      ],
      // Covers upgrade, renewal, and every payment-failure transition via the same
      // status-driven rule — no separate "renewal succeeded"/"renewal failed" branches
      // needed, since Stripe expresses both as a status change on the same subscription.
      onSubscriptionCreated: async ({ subscription }) => {
        await syncPlanFromSubscription(subscription);
      },
      onSubscriptionUpdate: async ({ subscription }) => {
        await syncPlanFromSubscription(subscription);
      },
      // The subscription is gone entirely (not just pending-cancel) — access ends
      // unconditionally, regardless of whatever status string it last held.
      onSubscriptionDeleted: async ({ subscription }) => {
        await setUserPlan(subscription.referenceId, "free");
      },
      // Fires once when the subscription enters a pending-cancel state
      // (cancelAtPeriodEnd=true), while status is still "active". The user already paid
      // for the current period, so access is deliberately NOT revoked here —
      // onSubscriptionUpdate/onSubscriptionDeleted handle the actual downgrade once the
      // period genuinely ends (Stripe sends customer.subscription.deleted at that point).
      onSubscriptionCancel: async ({ subscription }) => {
        logSecurityEvent("info", "stripe_subscription_pending_cancel", {
          userId: subscription.referenceId,
        });
      },
    },
  });
}

function createAuth() {
  const stripePlugin = createStripePlugin();

  return betterAuth({
    baseURL: env.NEXT_PUBLIC_APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        logAuthEmailLink("auth_dev_reset_password_link", user.email, url);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        logAuthEmailLink("auth_dev_verification_link", user.email, url);
      },
      sendOnSignUp: true,
    },
    plugins: stripePlugin ? [stripePlugin] : [],
  });
}

// Anchored on globalThis for the same reason as src/lib/server/db/client.ts: `next
// dev`'s hot reload re-evaluates this module on file save, and a plain module-level
// variable would rebuild the Better Auth instance (and, transitively, nothing new here
// since getDb() is already globalThis-safe, but the instance itself would still be
// needlessly reconstructed) on every reload instead of once per dev-server process.
type AuthGlobal = typeof globalThis & {
  __qavelixAuth?: ReturnType<typeof createAuth>;
};

const authGlobal = globalThis as AuthGlobal;

// Lazy on purpose, for the same reason getDb() is lazy: Next.js imports route handler
// modules while collecting build metadata, without invoking them. Constructing the
// Better Auth instance (which needs a database connection) only on first real use keeps
// `next build` and every existing route working with no DATABASE_URL/BETTER_AUTH_SECRET
// configured — auth simply isn't reachable yet, which is correct for this milestone.
export function getAuth() {
  if (!authGlobal.__qavelixAuth) {
    authGlobal.__qavelixAuth = createAuth();
  }

  return authGlobal.__qavelixAuth;
}
