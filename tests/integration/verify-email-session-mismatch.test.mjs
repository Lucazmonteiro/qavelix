import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

// Reproduces and verifies the fix for the reported session-mismatch bug: opening a real
// verification link in a browser that already has a *different* account signed in must
// never be displayed as though the signed-in account were the one just verified. See
// src/app/api/verify-email/route.ts and src/components/auth/verify-email-status.tsx.
//
// RESEND_API_KEY is intentionally left unset for this run (matching the project's
// existing dev-only fallback) so the real, unretouched verification link — built by
// buildVerificationLink() in auth.ts, containing the real Better Auth token — is
// captured from the structured `auth_dev_verification_link` log line instead of an
// inbox. Only the path+query of that link (and of every redirect Location this test
// reads) is ever used, never the host: NEXT_PUBLIC_APP_URL is inlined at build time for
// a `next start` production build (see logout-usage.test.mjs's own comment on this same
// constraint) and will not match this test's randomly assigned port.

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
  test("verify-email session-mismatch handling (requires a database)", {
    skip: "DATABASE_URL is not configured",
  }, () => {});
} else {
  function extractSessionCookie(response) {
    const cookies = response.headers.getSetCookie?.() ?? [];
    const sessionCookies = cookies.filter((cookie) =>
      /session_token|__Secure-.*session/i.test(cookie),
    );

    assert.ok(sessionCookies.length > 0, "sign-up must set a session cookie");

    return sessionCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  async function signUp(baseUrl, callbackURL) {
    const email = `verify-mismatch-${randomUUID()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: authOrigin,
        "X-Forwarded-For": `203.0.114.${Math.floor(Math.random() * 200) + 1}`,
      },
      body: JSON.stringify({
        name: "Verify Mismatch Test User",
        email,
        password: "correct horse battery staple 42",
        callbackURL,
      }),
    });

    assertStatus(response, 200, "sign-up for verify-email-session-mismatch test");

    return { email, cookie: extractSessionCookie(response) };
  }

  // Parses the structured dev-fallback log line (see deliverAuthEmail in auth.ts) for the
  // given email's verification link, without ever needing a real RESEND_API_KEY.
  function findVerificationLink(output, email) {
    for (const line of output.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed.startsWith("{")) {
        continue;
      }

      let parsed;

      try {
        parsed = JSON.parse(trimmed);
      } catch {
        continue;
      }

      if (parsed.event === "auth_dev_verification_link" && parsed.email === email) {
        return parsed.url;
      }
    }

    return null;
  }

  function pathAndQuery(absoluteUrl) {
    const parsed = new URL(absoluteUrl);
    return `${parsed.pathname}${parsed.search}`;
  }

  test("an unclaimed link verifies with no session, then the same reused link reflects the actual signed-in account each time", async () => {
    await withNextServer(async ({ baseUrl, getOutput }) => {
      const userA = await signUp(baseUrl, "/en/verify-email");
      const userB = await signUp(baseUrl, "/en/verify-email");

      const rawLink = findVerificationLink(getOutput(), userA.email);
      assert.ok(rawLink, "expected a logged dev-fallback verification link for the new user");

      const verifyPath = pathAndQuery(rawLink);
      assert.match(verifyPath, /token=[^&]+/, "the link must carry a real token");

      // Case A: no active session at all when the link is first opened.
      const noSessionResponse = await fetch(`${baseUrl}${verifyPath}`, { redirect: "manual" });
      assert.equal(noSessionResponse.status, 302);
      const noSessionLocation = noSessionResponse.headers.get("location");
      const noSessionPath = pathAndQuery(new URL(noSessionLocation, baseUrl).toString());
      assert.equal(noSessionPath, "/en/verify-email?result=success&match=none");

      // Case B: reusing the identical link while signed in as the verified account itself
      // — idempotent success, correctly identified as the same account.
      const sameAccountResponse = await fetch(`${baseUrl}${verifyPath}`, {
        redirect: "manual",
        headers: { Cookie: userA.cookie },
      });
      assert.equal(sameAccountResponse.status, 302);
      const samePath = pathAndQuery(
        new URL(sameAccountResponse.headers.get("location"), baseUrl).toString(),
      );
      assert.equal(samePath, "/en/verify-email?result=success&match=same");

      // Case C: reusing the identical link while signed in as a *different* account — the
      // exact reported bug. Must never claim account B is the one that was verified.
      const differentAccountResponse = await fetch(`${baseUrl}${verifyPath}`, {
        redirect: "manual",
        headers: { Cookie: userB.cookie },
      });
      assert.equal(differentAccountResponse.status, 302);
      const differentLocation = differentAccountResponse.headers.get("location");
      const differentUrl = new URL(differentLocation, baseUrl);
      assert.equal(differentUrl.searchParams.get("result"), "success");
      assert.equal(differentUrl.searchParams.get("match"), "different");

      // The verified email must never appear in full — only a masked form — and the raw
      // token must never appear anywhere in the redirect target.
      const maskedEmail = differentUrl.searchParams.get("email");
      assert.ok(maskedEmail, "the different-account case should include a masked email");
      assert.ok(maskedEmail.includes("•"), "the email shown must be masked, not the real address");
      assert.notEqual(maskedEmail, userA.email);
      assert.doesNotMatch(differentLocation, /token=/);
      assert.doesNotMatch(noSessionLocation, /token=/);
      assert.doesNotMatch(samePath, /token=/);
    });
  });

  test("an invalid token redirects to the error state without leaking whether any account exists", async () => {
    await withNextServer(async ({ baseUrl }) => {
      const response = await fetch(
        `${baseUrl}/api/verify-email?token=not-a-real-token&callbackURL=%2Fen%2Fverify-email`,
        { redirect: "manual" },
      );

      assert.equal(response.status, 302);
      const location = new URL(response.headers.get("location"), baseUrl);
      assert.equal(location.searchParams.get("result"), "error");
      assert.equal(location.searchParams.get("code"), "INVALID_TOKEN");
      // The failure path must never say anything about a specific email/account.
      assert.equal(location.searchParams.get("email"), null);
    });
  });

  test("locale is preserved end to end: a pt-BR callback stays on pt-BR through the whole redirect chain", async () => {
    await withNextServer(async ({ baseUrl, getOutput }) => {
      const user = await signUp(baseUrl, "/pt-BR/verify-email");
      const rawLink = findVerificationLink(getOutput(), user.email);
      assert.ok(rawLink, "expected a logged dev-fallback verification link for the new user");

      const response = await fetch(`${baseUrl}${pathAndQuery(rawLink)}`, { redirect: "manual" });
      assert.equal(response.status, 302);
      const location = new URL(response.headers.get("location"), baseUrl);
      assert.equal(location.pathname, "/pt-BR/verify-email");
    });
  });
}
