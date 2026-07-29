import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

const execFileAsync = promisify(execFile);

// Security Correction #4 — regression coverage for the compression-job IDOR/BOLA
// finding: one actor could poll, cancel, or download another actor's job by knowing (or
// obtaining, or guessing) its UUID alone, since the job record stored no owner at all.
// This file proves the fix — ownership is now checked on every job-scoped route, using
// the same server-derived actor identity (resolveActor()) every other security-sensitive
// decision in this app already uses — never a client-supplied job ID alone.
//
// Requires a real database: authenticated-actor scenarios need Better Auth's session
// store, matching the same skip-gracefully convention already used by
// tests/integration/logout-usage.test.mjs and entitlements-db.test.mjs.
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

// See the identical comment in tests/integration/logout-usage.test.mjs: Better Auth's
// own origin/CSRF check validates against trustedOrigins computed from
// NEXT_PUBLIC_APP_URL at build time, which a production build bakes to whatever
// .env.local held during `npm run build` — not this test's own dynamic port. Only
// Better Auth endpoints need this; every other route uses enforceApiSecurity(), which
// works against the real dynamic baseUrl.
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
  test("compression job ownership is enforced for every actor pair (requires a database)", {
    skip: "DATABASE_URL is not configured",
  }, () => {});
} else {
  // Randomized per process run so repeated local runs against the same persistent dev
  // database never collide on the anonymous fingerprint pool — same reasoning as
  // tests/integration/http.test.mjs's fingerprintRunSeedA/B, using the RFC 3849 IPv6
  // documentation range rather than a private RFC1918 address (see that file's comment
  // for why a private address would collapse every fixture into one shared identity).
  const runSeed = Math.floor(Math.random() * 0xffff);
  let fingerprintCounter = 0;

  function nextFingerprint() {
    fingerprintCounter += 1;
    return `2001:db8:${runSeed.toString(16)}::${fingerprintCounter}`;
  }

  async function createSmallVideoFile(fileName) {
    const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-authz-test.mp4`);

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
        "2",
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-b:v",
        "300k",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "96k",
        "-movflags",
        "+faststart",
        filePath,
      ],
      { timeout: 30_000, windowsHide: true },
    );

    try {
      return new File([await readFile(filePath)], fileName, { type: "video/mp4" });
    } finally {
      await rm(filePath, { force: true });
    }
  }

  function extractSessionCookie(response) {
    const cookies = response.headers.getSetCookie?.() ?? [];
    const sessionCookies = cookies.filter((cookie) => /session_token/i.test(cookie));

    assert.ok(sessionCookies.length > 0, "sign-up must set a session cookie");

    return sessionCookies.map((cookie) => cookie.split(";")[0]).join("; ");
  }

  async function signUp(baseUrl, fingerprint) {
    const email = `authz-test-${randomUUID()}@example.com`;
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: authOrigin,
        "X-Forwarded-For": fingerprint,
      },
      body: JSON.stringify({
        name: "Authorization Test User",
        email,
        password: "correct horse battery staple 42",
      }),
    });

    assertStatus(response, 200, "sign-up for compression-authorization test");
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

    assertStatus(response, 200, "sign-out for compression-authorization test");
  }

  // An "actor" here is just the request-header shape resolveActor() reads: either a
  // distinct X-Forwarded-For (anonymous) or a distinct session Cookie (authenticated).
  function anonymousActor(baseUrl) {
    return { Origin: baseUrl, "X-Forwarded-For": nextFingerprint() };
  }

  function authenticatedActor(baseUrl, cookie) {
    return { Origin: baseUrl, Cookie: cookie };
  }

  async function createAnalyzedUploadReference(baseUrl, file, actorHeaders) {
    const response = await fetch(`${baseUrl}/api/upload/analyze`, {
      method: "POST",
      headers: {
        ...actorHeaders,
        "X-Qavelix-File-Name": encodeURIComponent(file.name),
        "X-Qavelix-File-Size": String(file.size),
        "X-Qavelix-File-Type": file.type,
      },
      body: file.stream(),
      duplex: "half",
    });
    const payload = await response.json();

    assertStatus(response, 200, `${file.name} upload analysis`);
    assert.equal(payload.ok, true);

    return payload.analysis.uploadReference.value;
  }

  async function createJobAs(baseUrl, file, actorHeaders) {
    const uploadReference = await createAnalyzedUploadReference(baseUrl, file, actorHeaders);
    const response = await fetch(`${baseUrl}/api/compression/jobs`, {
      method: "POST",
      headers: { ...actorHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ uploadReference, preset: "balanced" }),
    });
    const payload = await response.json();

    assertStatus(response, 202, `${file.name} compression create`);
    assert.equal(payload.ok, true);

    return payload.job;
  }

  async function pollJobAs(baseUrl, jobId, actorHeaders) {
    return fetch(`${baseUrl}/api/compression/jobs/${jobId}`, { headers: actorHeaders });
  }

  async function cancelJobAs(baseUrl, jobId, actorHeaders) {
    return fetch(`${baseUrl}/api/compression/jobs/${jobId}`, {
      method: "DELETE",
      headers: actorHeaders,
    });
  }

  async function downloadAs(baseUrl, downloadUrl, actorHeaders) {
    return fetch(`${baseUrl}${downloadUrl}`, { headers: actorHeaders });
  }

  async function waitForDownloadUrl(baseUrl, jobId, ownerHeaders) {
    let latestJob = null;

    for (let attempt = 0; attempt < 80; attempt += 1) {
      const response = await pollJobAs(baseUrl, jobId, ownerHeaders);
      const payload = await response.json();

      assertStatus(response, 200, `owner poll attempt ${attempt}`);
      latestJob = payload.job;

      if (["completed", "optimized", "compression_ineffective"].includes(latestJob.status)) {
        break;
      }

      assert.doesNotMatch(latestJob.status, /failed|cancelled|deleted|expired/);
      await delay(400);
    }

    assert.ok(
      ["completed", "optimized", "compression_ineffective"].includes(latestJob.status),
      `job did not reach a downloadable state: ${JSON.stringify(latestJob)}`,
    );
    assert.ok(latestJob.downloadUrl, "a completed job must expose a download URL to its owner");

    return latestJob;
  }

  test("compression job ownership is enforced for every actor pair", async (t) => {
    await withNextServer(async ({ baseUrl }) => {
      const file = await createSmallVideoFile("authz-source.mp4");

      const anonymousA = anonymousActor(baseUrl);
      const anonymousB = anonymousActor(baseUrl);
      const userACookie = await signUp(baseUrl, nextFingerprint());
      const userBCookie = await signUp(baseUrl, nextFingerprint());
      const userA = authenticatedActor(baseUrl, userACookie);
      const userB = authenticatedActor(baseUrl, userBCookie);
      const anonymousVisitor = anonymousActor(baseUrl);

      await t.test("anonymous client A can access its own job", async () => {
        const job = await createJobAs(baseUrl, file, anonymousA);
        const response = await pollJobAs(baseUrl, job.id, anonymousA);
        const payload = await response.json();

        assertStatus(response, 200, "anonymous A polling own job");
        assert.equal(payload.job.id, job.id);
      });

      await t.test("anonymous client B cannot poll, see, or cancel client A's job", async () => {
        const job = await createJobAs(baseUrl, file, anonymousA);

        const pollResponse = await pollJobAs(baseUrl, job.id, anonymousB);
        assertStatus(pollResponse, 404, "anonymous B polling A's job");
        const pollPayload = await pollResponse.json();
        assert.equal(pollPayload.ok, false);
        // No trace of A's data (filename, preset, size) leaks into the denial response.
        assert.doesNotMatch(JSON.stringify(pollPayload), /authz-source/);

        const cancelResponse = await cancelJobAs(baseUrl, job.id, anonymousB);
        assertStatus(cancelResponse, 404, "anonymous B cancelling A's job");

        // A's job must be completely unaffected by B's attempted cancellation.
        const ownerCheck = await pollJobAs(baseUrl, job.id, anonymousA);
        const ownerPayload = await ownerCheck.json();
        assertStatus(ownerCheck, 200, "anonymous A still owns job after B's denied attempts");
        assert.notEqual(ownerPayload.job.status, "cancelled");
      });

      await t.test(
        "a nonexistent job and an unauthorized job return the identical generic 404 (no existence disclosure)",
        async () => {
          const job = await createJobAs(baseUrl, file, anonymousA);
          const unauthorizedResponse = await pollJobAs(baseUrl, job.id, anonymousB);
          const unauthorizedPayload = await unauthorizedResponse.json();

          const nonexistentId = randomUUID();
          const nonexistentResponse = await pollJobAs(baseUrl, nonexistentId, anonymousB);
          const nonexistentPayload = await nonexistentResponse.json();

          assert.equal(unauthorizedResponse.status, nonexistentResponse.status);
          assert.deepEqual(unauthorizedPayload, nonexistentPayload);
        },
      );

      await t.test("User A can access its own authenticated job", async () => {
        const job = await createJobAs(baseUrl, file, userA);
        const response = await pollJobAs(baseUrl, job.id, userA);
        const payload = await response.json();

        assertStatus(response, 200, "User A polling own job");
        assert.equal(payload.job.id, job.id);
      });

      await t.test("User B cannot poll, download, or cancel User A's job", async () => {
        const job = await createJobAs(baseUrl, file, userA);

        const pollResponse = await pollJobAs(baseUrl, job.id, userB);
        assertStatus(pollResponse, 404, "User B polling User A's job");

        const cancelResponse = await cancelJobAs(baseUrl, job.id, userB);
        assertStatus(cancelResponse, 404, "User B cancelling User A's job");

        const finished = await waitForDownloadUrl(baseUrl, job.id, userA);
        const stolenDownloadResponse = await downloadAs(baseUrl, finished.downloadUrl, userB);
        assertStatus(
          stolenDownloadResponse,
          404,
          "User B downloading User A's job with A's own valid, correctly-signed URL",
        );

        // The legitimate owner's download must still work after B's denied attempts.
        const ownerDownloadResponse = await downloadAs(baseUrl, finished.downloadUrl, userA);
        assertStatus(ownerDownloadResponse, 200, "User A downloading own completed job");
      });

      await t.test("anonymous visitor cannot access an authenticated user's job", async () => {
        const job = await createJobAs(baseUrl, file, userA);
        const response = await pollJobAs(baseUrl, job.id, anonymousVisitor);

        assertStatus(response, 404, "anonymous visitor polling User A's authenticated job");
      });

      await t.test(
        "an authenticated user cannot automatically claim an unrelated anonymous job",
        async () => {
          const job = await createJobAs(baseUrl, file, anonymousA);
          const response = await pollJobAs(baseUrl, job.id, userB);

          assertStatus(response, 404, "User B polling an unrelated anonymous job");
        },
      );

      await t.test("logout removes access to a previously authenticated job", async () => {
        const staleCookie = await signUp(baseUrl, nextFingerprint());
        const staleActor = authenticatedActor(baseUrl, staleCookie);
        const job = await createJobAs(baseUrl, file, staleActor);

        const whileSignedIn = await pollJobAs(baseUrl, job.id, staleActor);
        assertStatus(whileSignedIn, 200, "polling own job while still signed in");

        await signOut(baseUrl, staleCookie);

        // Same (now-invalidated) cookie, same job ID — Better Auth's own session lookup
        // returns null post-logout, resolveActor() falls back to an anonymous fingerprint
        // identity, and that no longer matches the job's stored owner.
        const afterSignOut = await pollJobAs(baseUrl, job.id, staleActor);
        assertStatus(afterSignOut, 404, "polling the same job with a signed-out cookie");
      });

      await t.test("an invalid session cookie cannot access a protected job", async () => {
        const job = await createJobAs(baseUrl, file, userA);
        const forgedActor = {
          Origin: baseUrl,
          Cookie: "better-auth.session_token=not-a-real-session-token",
        };

        const response = await pollJobAs(baseUrl, job.id, forgedActor);
        assertStatus(response, 404, "polling with a forged/invalid session cookie");
      });

      await t.test(
        "malformed job IDs fail safely for every actor without touching the database",
        async () => {
          for (const actorHeaders of [anonymousA, userA]) {
            const response = await pollJobAs(baseUrl, "../../etc/passwd", actorHeaders);
            assertStatus(response, 404, "malformed job id poll");
          }
        },
      );
    });
  });
}
