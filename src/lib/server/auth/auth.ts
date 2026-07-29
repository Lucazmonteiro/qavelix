import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { stripe } from "@better-auth/stripe";

import { env } from "@/env/server";
import { TRUSTED_PROXY_CIDR_RANGES } from "@/lib/server/client-ip";
import { getDb } from "@/lib/server/db/client";
import * as schema from "@/lib/server/db/schema";
import { sendAuthEmail } from "@/lib/server/email";
import { setUserPlan } from "@/lib/server/entitlements/service";
import { logSecurityEvent } from "@/lib/server/security";
import { getStripeClient } from "@/lib/server/stripe-client";
import type { Subscription } from "@better-auth/stripe";

// Sends the reset-password/verification link through the configured provider
// (RESEND_API_KEY + EMAIL_FROM_ADDRESS, see src/lib/server/email.ts). Falls back to
// logging the link via the structured logger whenever email isn't configured or the
// provider call fails — this project's original dev-only behavior, kept as a safety net
// so the Forgot Password / Reset Password / Email Verification flows never silently
// dead-end, rather than removed outright.
async function deliverAuthEmail(kind: "reset-password" | "verify-email", email: string, url: string) {
  const sent = await sendAuthEmail(kind, email, url);

  if (!sent) {
    logSecurityEvent(
      "info",
      kind === "reset-password" ? "auth_dev_reset_password_link" : "auth_dev_verification_link",
      { email, url },
    );
  }
}

// Better Auth's own default verification link (`url`, built by
// sendVerificationEmailFn) points straight at its GET /verify-email endpoint, which
// redirects to callbackURL with no signal about which account was verified — the root
// cause of the session-mismatch bug (see src/app/api/verify-email/route.ts's comment).
// Rewritten here to point at that proxy route instead, carrying the same token and the
// same embedded callbackURL forward untouched — the actual signature/expiry check still
// happens exactly once, inside Better Auth's own verifyEmail, just invoked from our
// route instead of reached directly by the browser.
function buildVerificationLink(defaultUrl: string, token: string): string {
  const parsed = new URL(defaultUrl);
  const callbackPath = parsed.searchParams.get("callbackURL") ?? "/";
  const proxyUrl = new URL("/api/verify-email", env.NEXT_PUBLIC_APP_URL);

  proxyUrl.searchParams.set("token", token);
  proxyUrl.searchParams.set("callbackURL", callbackPath);

  return proxyUrl.toString();
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
      // Verified-email launch requirement: unverified accounts must not be able to start
      // a paid subscription (a typo'd/unowned email address is a real billing-support
      // risk). This is the plugin's own built-in gate for /subscription/upgrade — it
      // throws its EMAIL_VERIFICATION_REQUIRED error code, mapped to a localized message
      // client-side (see src/lib/auth-errors usage in PlanActions/UpgradeModal). Sign-in
      // itself stays ungated (no emailAndPassword.requireEmailVerification above) and so
      // does every other tool/dashboard route — only checkout and (via the hooks.before
      // below, since this plugin has no equivalent option for it) the billing portal.
      requireEmailVerification: true,
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

// @better-auth/stripe has no equivalent of subscription.requireEmailVerification for
// /subscription/billing-portal, so this reproduces the same gate at the Better Auth core
// level via the documented hooks.before extension point (runs before every endpoint
// dispatch; every other path is a no-op here). Registered unconditionally — it only ever
// matches a path the stripe plugin itself registers, so it's inert whenever Stripe isn't
// configured, the same "safe to always include" convention already used elsewhere in this
// file. Throws the identical EMAIL_VERIFICATION_REQUIRED code the plugin's own checkout
// gate uses, so the client maps both with one check.
const beforeHook = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/subscription/billing-portal") {
    return;
  }

  const session = await getSessionFromCtx(ctx);

  if (session && !session.user.emailVerified) {
    throw APIError.from("BAD_REQUEST", {
      code: "EMAIL_VERIFICATION_REQUIRED",
      message: "Email verification is required before you can manage billing.",
    });
  }
});

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
    // Security Correction #3 — without this, Better Auth's own built-in rate limiter
    // (3 sign-in/sign-up attempts per 10s, 3 password-reset/verification-email requests
    // per 60s, per IP — its own default special rules) only trusts a *single-value*
    // X-Forwarded-For header. Behind this app's real Cloudflare + Render chain, the
    // header genuinely has multiple hops, so without trustedProxies configured, IP
    // resolution silently gives up and every visitor shares one rate-limit bucket —
    // either a trivial denial-of-service against sign-in for everyone (one attacker
    // exhausts the shared bucket) or no meaningful per-account brute-force throttling at
    // all. Reuses the exact same Cloudflare/private-range trust list already used and
    // tested for the app's own fingerprint/rate-limit resolution (client-ip.ts) rather
    // than maintaining a second copy. Purely a rate-limiter IP-resolution detail — does
    // not touch sessions, cookies, or any user-visible auth behavior.
    advanced: {
      ipAddress: {
        trustedProxies: TRUSTED_PROXY_CIDR_RANGES,
      },
    },
    hooks: {
      before: beforeHook,
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await deliverAuthEmail("reset-password", user.email, url);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url, token }) => {
        await deliverAuthEmail("verify-email", user.email, buildVerificationLink(url, token));
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
