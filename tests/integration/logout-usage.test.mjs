import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

const execFileAsync = promisify(execFile);

// Skips (does not fail) when DATABASE_URL isn't configured, matching the established
// convention in entitlements-db.test.mjs — auth/entitlements both require a real
// database, and this suite otherwise has no hard external-service requirement.
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

// Better Auth's own origin/CSRF check (independent of this app's enforceApiSecurity(),
// which reconstructs the expected origin from the request's own Host header and so works
// against any dynamic test port) validates the Origin header against trustedOrigins
// computed once from NEXT_PUBLIC_APP_URL when the Better Auth singleton is first
// constructed. Next.js inlines NEXT_PUBLIC_* references at build time everywhere
// (server code included, not just client bundles) — so a `next start` production build
// (the one withNextServer() uses whenever a build already exists) has this value
// permanently baked to whatever .env.local held during `npm run build`, not the random
// port this test's own server actually listens on. Only Better Auth's endpoints need
// this — every other call in this file goes through enforceApiSecurity() and can use the
// real dynamic baseUrl as its Origin.
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
  test("logout preserves anonymous usage state (requires a database)", {
    skip: "DATABASE_URL is not configured",
  }, () => {});
} else {
  // Randomized per process run so repeated local runs against the same persistent dev
  // database never collide on either the anonymous fingerprint pool or a reused email —
  // same reasoning as tests/integration/http.test.mjs's fingerprintRunSeedA/B.
  const runSeed = Math.floor(Math.random() * 200) + 10;
  let fingerprintCounter = 0;

  function nextFingerprint() {
    fingerprintCounter += 1;
    return `203.0.${runSeed}.${fingerprintCounter}`;
  }

  // 3 seconds at an explicit video bitrate — a shorter/lower-bitrate clip renders under
  // MIN_UPLOAD_BYTES (100KB) and gets rejected as "too small" before it can consume a
  // real usage slot, which is not what this test is exercising.
  async function createSmallAudibleMp4() {
    const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-logout-test.mp4`);

    await execFileAsync(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "lavfi",
        "-i",
        "testsrc=size=320x180:rate=15",
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=1000:sample_rate=44100",
        "-t",
        "3",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-b:v",
        "400k",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        filePath,
      ],
      { timeout: 30_000, windowsHide: true },
    );

    return filePath;
  }

  async function consumeOneAnonymousUse(baseUrl, filePath, fingerprint) {
    const body = await readFile(filePath);
    const response = await fetch(`${baseUrl}/api/extract-audio`, {
      method: "POST",
      body,
      headers: {
        Origin: baseUrl,
        "X-Forwarded-For": fingerprint,
        "X-Qavelix-File-Name": "logout-test.mp4",
        "X-Qavelix-File-Size": String(body.byteLength),
        "X-Qavelix-File-Type": "video/mp4",
      },
    });

    assertStatus(response, 200, "anonymous extract-audio consuming one use");
    return response;
  }

  async function getAnonymousStatus(baseUrl, fingerprint, cookie) {
    const headers = { Origin: baseUrl, "X-Forwarded-For": fingerprint };

    if (cookie) {
      headers.Cookie = cookie;
    }

    const response = await fetch(`${baseUrl}/api/entitlements/status?tool=extract-audio`, {
      headers,
    });

    return response.json();
  }

  function extractSessionCookie(response) {
    const cookies = response.headers.getSetCookie?.() ?? [];
    const sessionCookies = cookies.filter((cookie) =>
      /session_token|__Secure-.*session/i.test(cookie),
    );

    assert.ok(sessionCookies.length > 0, "sign-up must set a session cookie");

    return sessionCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  async function signUp(baseUrl, fingerprint) {
    const email = `logout-test-${randomUUID()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: authOrigin,
        "X-Forwarded-For": fingerprint,
      },
      body: JSON.stringify({
        name: "Logout Test User",
        email,
        password: "correct horse battery staple 42",
      }),
    });

    assertStatus(response, 200, "sign-up for logout-usage test");
    return extractSessionCookie(response);
  }

  async function signOut(baseUrl, cookie) {
    const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: authOrigin,
        Cookie: cookie,
      },
      body: "{}",
    });

    assertStatus(response, 200, "sign-out for logout-usage test");
  }

  test("logout preserves anonymous usage state exactly as it was before login", async (t) => {
    await withNextServer(async ({ baseUrl }) => {
      const fixturePath = await createSmallAudibleMp4();

      try {
        const scenarios = [
          { label: "0 of 5 used", usesBefore: 0 },
          { label: "4 of 5 used", usesBefore: 4 },
          { label: "5 of 5 used (exhausted)", usesBefore: 5 },
        ];

        for (const scenario of scenarios) {
          await t.test(scenario.label, async () => {
            const fingerprint = nextFingerprint();

            for (let i = 0; i < scenario.usesBefore; i += 1) {
              await consumeOneAnonymousUse(baseUrl, fixturePath, fingerprint);
            }

            const before = await getAnonymousStatus(baseUrl, fingerprint);
            assert.equal(before.plan, "anonymous");
            assert.equal(before.allowed, scenario.usesBefore < 5);
            // checkEntitlement() only includes "remaining" on its allowed:true branch —
            // a blocked (5/5) response has no remaining field at all, not remaining: 0.
            if (before.allowed) {
              assert.equal(before.remaining, 5 - scenario.usesBefore);
            } else {
              // This exact reason ("account_required", not "usage_limit_reached") is
              // what makes useEntitlementGate render PlanComparisonModal instead of
              // UpgradeModal for an exhausted anonymous actor.
              assert.equal(before.reason, "account_required");
            }

            // The same visitor (same IP fingerprint) creates an account and signs in —
            // this must never touch, reset, or merge into their prior anonymous usage.
            const cookie = await signUp(baseUrl, fingerprint);

            // While authenticated, the actor's usage is tracked under their own user id,
            // in a completely separate counter from the anonymous pool — a brand-new Free
            // account must show its own full daily allowance, not something reduced by
            // whatever the visitor used anonymously before signing up.
            const authenticatedStatus = await getAnonymousStatus(baseUrl, fingerprint, cookie);
            assert.equal(authenticatedStatus.plan, "free");
            // A brand-new account has consumed none of its own (separate) daily quota,
            // regardless of how much of the anonymous pool this same fingerprint used —
            // proves the two counters are genuinely independent, not shared/merged.
            assert.equal(authenticatedStatus.remaining, authenticatedStatus.limit);
            assert.equal(authenticatedStatus.allowed, true);

            await signOut(baseUrl, cookie);

            // Back to anonymous, same fingerprint, no cookie — usage must read back
            // exactly as it was before the login/logout cycle: not reset, not
            // double-consumed, not leaked from the authenticated session.
            const after = await getAnonymousStatus(baseUrl, fingerprint);
            assert.equal(after.plan, "anonymous");
            assert.equal(
              after.remaining,
              before.remaining,
              `${scenario.label}: anonymous remaining must be unchanged by the login/logout cycle`,
            );
            assert.equal(after.allowed, before.allowed);
          });
        }
      } finally {
        await rm(fixturePath, { force: true });
      }
    });
  });
}
