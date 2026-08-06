import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

// Free actors have nothing to manage on /dashboard/billing (no invoice history, no
// portal access) — dashboard/billing/page.tsx redirects them to /dashboard/plan before
// any billing content renders. This proves that redirect over real HTTP, distinct from
// dashboard-source.test.mjs's source-pattern check of the same logic. Skips (never
// fails) without a database, matching the established convention.
//
// Not a raw 3xx: dashboard/loading.tsx gives every /dashboard/* route a Suspense
// boundary, so by the time billing/page.tsx's own async redirect() resolves, the
// response's 200 status line has already started streaming from the parent layout —
// Next.js's documented fallback for that case is a client-side redirect embedded in the
// 200 response (a `<meta http-equiv="refresh">` tag plus a NEXT_REDIRECT digest in the
// RSC payload), which is exactly what a real browser transparently follows. Verified by
// hand against a running server before writing this — see the request-manual fetch
// approach below, which checks for that embedded marker instead of assuming a raw 3xx.
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
  test("a Free actor is redirected off /dashboard/billing to /dashboard/plan (requires a database)", {
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
    const email = `dashboard-billing-guard-test-${randomUUID()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: authOrigin },
      body: JSON.stringify({
        name: "Dashboard Billing Guard Test User",
        email,
        password: "correct horse battery staple 42",
      }),
    });

    assertStatus(response, 200, "sign-up for dashboard-billing-guard test");
    return extractSessionCookie(response);
  }

  test("a Free actor is redirected off /dashboard/billing to /dashboard/plan, with locale preserved", async () => {
    await withNextServer(async ({ baseUrl }) => {
      const cookie = await signUp(baseUrl);

      const response = await fetch(`${baseUrl}/pt-BR/dashboard/billing`, {
        headers: { Cookie: cookie },
        redirect: "manual",
      });

      // A raw HTTP 3xx would also be a pass (e.g. if a future refactor moves this check
      // somewhere that resolves before any streaming starts) — either is a correctly
      // redirecting response, so this only fails if neither mechanism is present.
      if (response.status >= 300 && response.status < 400) {
        const location = new URL(response.headers.get("location"), baseUrl);
        assert.equal(location.pathname, "/pt-BR/dashboard/plan");
        return;
      }

      assertStatus(response, 200, "billing page for a Free actor (embedded client redirect)");
      const body = await response.text();
      assert.match(body, /NEXT_REDIRECT;replace;\/pt-BR\/dashboard\/plan;307/);
      assert.match(
        body,
        /<meta id="__next-page-redirect" http-equiv="refresh" content="1;url=\/pt-BR\/dashboard\/plan"\/>/,
      );
    });
  });
}
