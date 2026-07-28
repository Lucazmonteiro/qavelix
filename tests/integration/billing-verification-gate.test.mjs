import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { Pool } from "@neondatabase/serverless";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

// Email-verification launch requirement: an unverified account must be rejected by both
// /subscription/upgrade (checkout) and /subscription/billing-portal, and the identical
// account must succeed at both once verified — proving the real HTTP gate end-to-end
// (auth.ts's subscription.requireEmailVerification + hooks.before), not just the source
// patterns asserted in stripe-billing-source.test.mjs. Skips gracefully (never fails)
// whenever DATABASE_URL or a full, test-mode Stripe configuration isn't available,
// matching the existing stripe-billing-db.test.mjs/logout-usage.test.mjs convention.

async function loadEnvVar(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  try {
    const envFile = await readFile(".env.local", "utf8");
    const match = envFile.match(new RegExp(`^${name}=(.+)$`, "m"));

    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

const databaseUrl = await loadEnvVar("DATABASE_URL");
const stripeSecretKey = await loadEnvVar("STRIPE_SECRET_KEY");
const stripeWebhookSecret = await loadEnvVar("STRIPE_WEBHOOK_SECRET");
const proPriceId = await loadEnvVar("STRIPE_PRO_MONTHLY_PRICE_ID");
const authOrigin = (await loadEnvVar("NEXT_PUBLIC_APP_URL")) || "http://localhost:3000";

const skipReason = !databaseUrl
  ? "DATABASE_URL is not configured"
  : !stripeSecretKey || !stripeWebhookSecret || !proPriceId
    ? "Stripe is not fully configured (STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET/STRIPE_PRO_MONTHLY_PRICE_ID)"
    : !stripeSecretKey.startsWith("sk_test_")
      ? "STRIPE_SECRET_KEY is not a test-mode key — refusing to run against a live account"
      : null;

if (skipReason) {
  test("billing actions require a verified email (requires database + test-mode Stripe)", {
    skip: skipReason,
  }, () => {});
} else {
  const pool = new Pool({ connectionString: databaseUrl });

  function extractSessionCookie(response) {
    const cookies = response.headers.getSetCookie?.() ?? [];
    const sessionCookies = cookies.filter((cookie) =>
      /session_token|__Secure-.*session/i.test(cookie),
    );

    assert.ok(sessionCookies.length > 0, "sign-up must set a session cookie");

    return sessionCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  async function signUp(baseUrl) {
    const email = `verify-gate-test-${randomUUID()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: authOrigin,
        "X-Forwarded-For": "203.0.113.50",
      },
      body: JSON.stringify({
        name: "Verification Gate Test User",
        email,
        password: "correct horse battery staple 42",
      }),
    });

    assertStatus(response, 200, "sign-up for billing-verification-gate test");
    const body = await response.json();

    return { userId: body.user.id, cookie: extractSessionCookie(response) };
  }

  async function requestUpgrade(baseUrl, cookie) {
    return fetch(`${baseUrl}/api/auth/subscription/upgrade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: authOrigin,
        Cookie: cookie,
      },
      body: JSON.stringify({
        plan: "pro",
        successUrl: `${authOrigin}/en/dashboard/plan?checkout=success`,
        cancelUrl: `${authOrigin}/en/dashboard/plan?checkout=cancelled`,
      }),
    });
  }

  async function requestBillingPortal(baseUrl, cookie) {
    return fetch(`${baseUrl}/api/auth/subscription/billing-portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: authOrigin,
        Cookie: cookie,
      },
      body: JSON.stringify({
        returnUrl: `${authOrigin}/en/dashboard/billing`,
      }),
    });
  }

  async function markVerified(userId) {
    await pool.query('UPDATE "user" SET email_verified = true WHERE id = $1', [userId]);
  }

  test("an unverified account is rejected by both checkout and the billing portal; a verified one succeeds at both", async () => {
    await withNextServer(async ({ baseUrl }) => {
      const { userId, cookie } = await signUp(baseUrl);

      try {
        const rejectedUpgrade = await requestUpgrade(baseUrl, cookie);
        assert.equal(rejectedUpgrade.status, 400, "unverified checkout must be rejected");
        const rejectedUpgradeBody = await rejectedUpgrade.json();
        assert.equal(rejectedUpgradeBody.code, "EMAIL_VERIFICATION_REQUIRED");

        const rejectedPortal = await requestBillingPortal(baseUrl, cookie);
        assert.equal(rejectedPortal.status, 400, "unverified billing portal access must be rejected");
        const rejectedPortalBody = await rejectedPortal.json();
        assert.equal(rejectedPortalBody.code, "EMAIL_VERIFICATION_REQUIRED");

        await markVerified(userId);

        const allowedUpgrade = await requestUpgrade(baseUrl, cookie);
        assertStatus(allowedUpgrade, 200, "verified checkout must succeed");
        const allowedUpgradeBody = await allowedUpgrade.json();
        assert.equal(typeof allowedUpgradeBody.url, "string");

        const allowedPortal = await requestBillingPortal(baseUrl, cookie);
        assertStatus(allowedPortal, 200, "verified billing portal access must succeed");
        const allowedPortalBody = await allowedPortal.json();
        assert.equal(typeof allowedPortalBody.url, "string");
      } finally {
        await pool.query("DELETE FROM subscription WHERE reference_id = $1", [userId]);
        await pool.query("DELETE FROM user_entitlement WHERE user_id = $1", [userId]);
        await pool.query('DELETE FROM "user" WHERE id = $1', [userId]);
      }
    });
  });
}
