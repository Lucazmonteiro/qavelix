import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

// Skips (does not fail) when DATABASE_URL isn't configured, matching the established
// convention in entitlements-db.test.mjs and logout-usage.test.mjs.
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

// Better Auth's own origin/CSRF check validates Origin against trustedOrigins computed
// from NEXT_PUBLIC_APP_URL when the singleton is first built — a `next start` production
// build (the one withNextServer() uses whenever a build already exists) has this value
// baked at `npm run build` time, not this test's own random port. See the matching,
// more detailed comment in tests/integration/logout-usage.test.mjs.
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
  test("billing address requires a real session and syncs to Stripe (requires a database)", {
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
    const email = `billing-address-test-${randomUUID()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: authOrigin },
      body: JSON.stringify({
        name: "Billing Address Test User",
        email,
        password: "correct horse battery staple 42",
      }),
    });

    assertStatus(response, 200, "sign-up for billing-address test");
    return extractSessionCookie(response);
  }

  test("billing address requires a real session and syncs to Stripe", async () => {
    await withNextServer(async ({ baseUrl }) => {
      // Unauthenticated requests are rejected outright — never a silent no-op.
      const unauthenticatedGet = await fetch(`${baseUrl}/api/billing/address`, {
        headers: { Origin: baseUrl },
      });
      assertStatus(unauthenticatedGet, 401, "unauthenticated billing address GET");

      const unauthenticatedPost = await fetch(`${baseUrl}/api/billing/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: baseUrl },
        body: JSON.stringify({
          line1: "1 Test St",
          city: "Testville",
          postalCode: "12345",
          country: "US",
        }),
      });
      assertStatus(unauthenticatedPost, 401, "unauthenticated billing address POST");

      const cookie = await signUp(baseUrl);
      const authHeaders = { Origin: baseUrl, Cookie: cookie };

      // A fresh account has no address on file yet.
      const emptyResponse = await fetch(`${baseUrl}/api/billing/address`, { headers: authHeaders });
      const emptyPayload = await emptyResponse.json();
      assertStatus(emptyResponse, 200, "billing address GET for a fresh account");
      assert.equal(emptyPayload.ok, true);
      assert.equal(emptyPayload.address, null);

      // Server-side validation rejects an incomplete/invalid address before ever
      // touching Stripe (missing city, malformed country code).
      const invalidResponse = await fetch(`${baseUrl}/api/billing/address`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ line1: "1 Test St", city: "", postalCode: "12345", country: "USA" }),
      });
      const invalidPayload = await invalidResponse.json();
      assertStatus(invalidResponse, 400, "invalid billing address is rejected server-side");
      assert.equal(invalidPayload.ok, false);
      assert.equal(invalidPayload.error.code, "invalid_address");

      // A valid address is written to the real Stripe Customer object and re-fetched
      // (not just echoed back) — confirms Stripe actually persisted it, not just that
      // the API call itself returned 200.
      const validResponse = await fetch(`${baseUrl}/api/billing/address`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          line1: "742 Evergreen Terrace",
          line2: "Apt 2",
          city: "Springfield",
          state: "IL",
          postalCode: "62704",
          country: "us",
        }),
      });
      const validPayload = await validResponse.json();
      assertStatus(validResponse, 200, "valid billing address is saved");
      assert.equal(validPayload.ok, true);
      assert.equal(validPayload.address.line1, "742 Evergreen Terrace");
      assert.equal(validPayload.address.city, "Springfield");
      // Country is normalized to uppercase ISO-2, regardless of the case submitted.
      assert.equal(validPayload.address.country, "US");

      // Re-fetching independently confirms the write actually persisted server-side in
      // Stripe, not just that the POST response echoed the input back.
      const confirmResponse = await fetch(`${baseUrl}/api/billing/address`, { headers: authHeaders });
      const confirmPayload = await confirmResponse.json();
      assertStatus(confirmResponse, 200, "billing address GET after saving");
      assert.equal(confirmPayload.address.line1, "742 Evergreen Terrace");
      assert.equal(confirmPayload.address.postalCode, "62704");
    });
  });
}
