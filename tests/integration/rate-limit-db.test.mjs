import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { Pool } from "@neondatabase/serverless";

// security.ts's durable path can't be imported directly here (real "@/" value aliases —
// see entitlements-db.test.mjs's own header comment for the exact same constraint). This
// exercises the identical SQL statement checkRateLimitDurable() runs directly against the
// real configured Neon database, proving Postgres's own semantics — atomic window
// creation/increment/deny, and genuine concurrent-request safety — behave the way the
// implementation assumes. The last test proves the actual point of Phase 5: reading the
// same key back through a brand-new Pool connection (simulating a fresh process after a
// restart) returns the exact state the first connection left behind — nothing about this
// state lives in any one process, unlike the in-memory Map fallback it replaces.
//
// Skips (does not fail) when DATABASE_URL isn't configured, matching every other
// test:integration file's convention.

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

const databaseUrl = await loadDatabaseUrl();

if (!databaseUrl) {
  test("rate limit bucket durability against the real database", { skip: "DATABASE_URL is not configured" }, () => {});
} else {
  function testKey() {
    return `test-rate-limit-${randomUUID()}`;
  }

  // The exact statement checkRateLimitDurable() runs — see security.ts.
  async function checkRateLimit(pool, key, limit, windowMs) {
    const windowResetAt = new Date(Date.now() + windowMs);

    const inserted = await pool.query(
      `INSERT INTO rate_limit_bucket (key, count, reset_at)
       VALUES ($1, 1, $2)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN rate_limit_bucket.reset_at <= now() THEN 1 ELSE rate_limit_bucket.count + 1 END,
         reset_at = CASE WHEN rate_limit_bucket.reset_at <= now() THEN $2 ELSE rate_limit_bucket.reset_at END,
         updated_at = now()
       WHERE rate_limit_bucket.reset_at <= now() OR rate_limit_bucket.count < $3
       RETURNING count, reset_at`,
      [key, windowResetAt, limit],
    );

    if (inserted.rowCount === 0) {
      const existing = await pool.query(`SELECT reset_at FROM rate_limit_bucket WHERE key = $1`, [
        key,
      ]);

      return { allowed: false, resetAt: existing.rows[0]?.reset_at ?? windowResetAt };
    }

    const row = inserted.rows[0];

    return { allowed: true, count: row.count, resetAt: row.reset_at };
  }

  async function cleanup(pool, key) {
    await pool.query(`DELETE FROM rate_limit_bucket WHERE key = $1`, [key]);
  }

  test("reserving up to the limit succeeds, the next request in the same window is denied, and the count never over-increments", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const key = testKey();

    try {
      const limit = 3;

      for (let attempt = 1; attempt <= limit; attempt += 1) {
        const result = await checkRateLimit(pool, key, limit, 60_000);
        assert.equal(result.allowed, true, `attempt ${attempt} should be allowed`);
        assert.equal(result.count, attempt);
      }

      const denied = await checkRateLimit(pool, key, limit, 60_000);
      assert.equal(denied.allowed, false);

      const finalCount = await pool.query(`SELECT count FROM rate_limit_bucket WHERE key = $1`, [
        key,
      ]);
      assert.equal(finalCount.rows[0].count, limit, "a denied attempt must not increment the counter");
    } finally {
      await cleanup(pool, key);
      await pool.end();
    }
  });

  test("concurrent requests against a near-exhausted window never overshoot the limit", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const key = testKey();

    try {
      const limit = 5;

      await pool.query(`INSERT INTO rate_limit_bucket (key, count, reset_at) VALUES ($1, $2, $3)`, [
        key,
        limit - 1,
        new Date(Date.now() + 60_000),
      ]);

      const attempts = 8;
      const results = await Promise.all(
        Array.from({ length: attempts }, () => checkRateLimit(pool, key, limit, 60_000)),
      );

      const allowedCount = results.filter((result) => result.allowed).length;
      assert.equal(allowedCount, 1, "exactly one concurrent request should win the last slot");

      const finalCount = await pool.query(`SELECT count FROM rate_limit_bucket WHERE key = $1`, [
        key,
      ]);
      assert.equal(finalCount.rows[0].count, limit);
    } finally {
      await cleanup(pool, key);
      await pool.end();
    }
  });

  test("a new window starts once the previous one has expired, resetting the count rather than staying denied forever", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const key = testKey();

    try {
      const limit = 1;

      // Seed an already-expired window at the limit — a naive implementation without the
      // "reset_at <= now()" branch would deny forever instead of starting a new window.
      await pool.query(`INSERT INTO rate_limit_bucket (key, count, reset_at) VALUES ($1, $2, $3)`, [
        key,
        limit,
        new Date(Date.now() - 1_000),
      ]);

      const result = await checkRateLimit(pool, key, limit, 60_000);
      assert.equal(result.allowed, true, "an expired window must allow a fresh request");
      assert.equal(result.count, 1);
    } finally {
      await cleanup(pool, key);
      await pool.end();
    }
  });

  test("state survives a process restart: a brand-new connection reads back exactly what the first one wrote", async () => {
    const key = testKey();
    const limit = 2;

    const firstConnectionPool = new Pool({ connectionString: databaseUrl });

    await checkRateLimit(firstConnectionPool, key, limit, 60_000);
    await checkRateLimit(firstConnectionPool, key, limit, 60_000);
    // Simulates the process that made these writes exiting entirely — nothing about this
    // state can live in that process's memory, unlike the in-memory Map fallback.
    await firstConnectionPool.end();

    const freshProcessPool = new Pool({ connectionString: databaseUrl });

    try {
      const deniedAfterRestart = await checkRateLimit(freshProcessPool, key, limit, 60_000);
      assert.equal(
        deniedAfterRestart.allowed,
        false,
        "a fresh connection must see the same exhausted window the first connection left behind",
      );
    } finally {
      await cleanup(freshProcessPool, key);
      await freshProcessPool.end();
    }
  });
}
