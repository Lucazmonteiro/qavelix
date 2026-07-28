import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

// Skips (does not fail) when DATABASE_URL isn't configured, matching the established
// convention in entitlements-db.test.mjs, logout-usage.test.mjs, and
// billing-address.test.mjs.
async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  try {
    const envFile = await readFile(".env.local", "utf8");
    const match = envFile.match(/^DATABASE_URL=(.+)$/m);

    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function loadAuthOrigin() {
  try {
    const envFile = await readFile(".env.local", "utf8");
    const match = envFile.match(/^NEXT_PUBLIC_APP_URL=(.+)$/m);

    return match?.[1]?.trim() || "http://localhost:3000";
  } catch {
    return "http://localhost:3000";
  }
}

const databaseUrl = await loadDatabaseUrl();
const authOrigin = await loadAuthOrigin();

if (!databaseUrl) {
  test("support contribution checkout (requires a database and Stripe test-mode key)", {
    skip: "DATABASE_URL is not configured",
  }, () => {});
} else {
  function extractSessionCookie(response) {
    const cookies = response.headers.getSetCookie?.() ?? [];
    const sessionCookies = cookies.filter((cookie) => /session_token|__Secure-.*session/i.test(cookie));

    assert.ok(sessionCookies.length > 0, "sign-up must set a session cookie");

    return sessionCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  async function signUp(baseUrl) {
    const email = `support-checkout-test-${randomUUID()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: authOrigin },
      body: JSON.stringify({
        name: "Support Checkout Test User",
        email,
        password: "correct horse battery staple 42",
      }),
    });

    assertStatus(response, 200, "sign-up for support-checkout test");
    return extractSessionCookie(response);
  }

  async function createCheckout(baseUrl, { amount, locale = "en", cookie } = {}) {
    const headers = { "Content-Type": "application/json", Origin: baseUrl };

    if (cookie) {
      headers.Cookie = cookie;
    }

    return fetch(`${baseUrl}/api/support/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify({ amount, locale }),
    });
  }

  test("support contribution checkout creates a real Stripe Checkout Session for anonymous and signed-in contributors", async () => {
    await withNextServer(async ({ baseUrl }) => {
      // Anonymous contributors can start checkout without ever signing in.
      const anonymousResponse = await createCheckout(baseUrl, { amount: 1_000 });
      const anonymousPayload = await anonymousResponse.json();
      assertStatus(anonymousResponse, 200, "anonymous contribution checkout");
      assert.equal(anonymousPayload.ok, true);
      assert.match(anonymousPayload.url, /^https:\/\/checkout\.stripe\.com\//);

      // A signed-in contributor also gets a real Checkout Session — the important part
      // is that authentication is never required, only optionally used.
      const cookie = await signUp(baseUrl);
      const authenticatedResponse = await createCheckout(baseUrl, { amount: 2_500, cookie });
      const authenticatedPayload = await authenticatedResponse.json();
      assertStatus(authenticatedResponse, 200, "authenticated contribution checkout");
      assert.equal(authenticatedPayload.ok, true);
      assert.match(authenticatedPayload.url, /^https:\/\/checkout\.stripe\.com\//);

      // Boundary and invalid-amount rejection, enforced server-side regardless of what
      // any client-side picker would have allowed.
      const tooSmall = await createCheckout(baseUrl, { amount: 50 });
      assertStatus(tooSmall, 400, "below-minimum contribution amount");
      const tooSmallPayload = await tooSmall.json();
      assert.equal(tooSmallPayload.error.code, "invalid_amount");

      const tooLarge = await createCheckout(baseUrl, { amount: 100_000 });
      assertStatus(tooLarge, 400, "above-maximum contribution amount");

      const fractional = await createCheckout(baseUrl, { amount: 1_000.5 });
      assertStatus(fractional, 400, "non-integer contribution amount");

      const missingLocale = await createCheckout(baseUrl, { amount: 1_000, locale: "xx" });
      assertStatus(missingLocale, 400, "invalid locale");

      // Exactly at each boundary must succeed.
      const atMin = await createCheckout(baseUrl, { amount: 100 });
      assertStatus(atMin, 200, "exactly-minimum contribution amount");

      const atMax = await createCheckout(baseUrl, { amount: 50_000 });
      assertStatus(atMax, 200, "exactly-maximum contribution amount");
    });
  });
}
