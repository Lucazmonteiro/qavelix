import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { Pool } from "@neondatabase/serverless";

// service.ts can't be imported directly here (it transitively pulls in next/headers via
// getOptionalSession, which only resolves inside the Next.js runtime — see
// entitlements-source.test.mjs's header comment). Instead this exercises the exact same
// SQL statements service.ts runs (atomic upsert, idempotency, transactional release)
// directly against the real configured Neon database, proving the schema's constraints
// and Postgres's own semantics actually behave the way the service assumes — including
// genuine concurrent-request safety, which no amount of source-reading can verify.
//
// Skips (does not fail) when DATABASE_URL isn't configured, so this suite stays runnable
// in environments without database access, matching how the rest of this test:integration
// script has no hard external-service requirement today.

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
  test("entitlement usage accounting against the real database", { skip: "DATABASE_URL is not configured" }, () => {});
} else {
  const pool = new Pool({ connectionString: databaseUrl });

  // A fingerprint-shaped, obviously-synthetic actor id and a period key that can never
  // collide with a real UTC date, so this suite can run against the actual dev database
  // without any risk of touching real usage data.
  const actorType = "user";
  const testToolId = "video-compressor";
  const periodKey = "test-period-9999-99-99";

  function actorId() {
    return `test-entitlements-${randomUUID()}`;
  }

  async function reserve(actor, idempotencyKey, limit) {
    const eventId = randomUUID();
    const inserted = await pool.query(
      `INSERT INTO usage_event (id, actor_type, actor_id, tool_id, period_key, status, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, 'reserved', $6)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [eventId, actorType, actor, testToolId, periodKey, idempotencyKey],
    );

    if (inserted.rowCount === 0) {
      const existing = await pool.query(
        `SELECT id, status FROM usage_event WHERE idempotency_key = $1`,
        [idempotencyKey],
      );

      const row = existing.rows[0];

      return row && (row.status === "reserved" || row.status === "confirmed")
        ? { allowed: true, usageEventId: row.id }
        : { allowed: false };
    }

    const counterId = randomUUID();
    const upserted = await pool.query(
      `INSERT INTO usage_counter (id, actor_type, actor_id, tool_id, period_key, count)
       VALUES ($1, $2, $3, $4, $5, 1)
       ON CONFLICT (actor_type, actor_id, tool_id, period_key)
       DO UPDATE SET count = usage_counter.count + 1, updated_at = now()
       WHERE usage_counter.count < $6
       RETURNING count`,
      [counterId, actorType, actor, testToolId, periodKey, limit],
    );

    if (upserted.rowCount === 0) {
      await pool.query(`UPDATE usage_event SET status = 'rejected' WHERE id = $1`, [eventId]);
      return { allowed: false };
    }

    return { allowed: true, usageEventId: eventId, count: upserted.rows[0].count };
  }

  async function release(usageEventId) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE usage_event SET status = 'released'
         WHERE id = $1 AND status = 'reserved'
         RETURNING actor_type, actor_id, tool_id, period_key`,
        [usageEventId],
      );

      if (updated.rowCount > 0) {
        const event = updated.rows[0];

        await client.query(
          `UPDATE usage_counter SET count = GREATEST(count - 1, 0), updated_at = now()
           WHERE actor_type = $1 AND actor_id = $2 AND tool_id = $3 AND period_key = $4`,
          [event.actor_type, event.actor_id, event.tool_id, event.period_key],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function currentCount(actor) {
    const result = await pool.query(
      `SELECT count FROM usage_counter WHERE actor_type = $1 AND actor_id = $2 AND tool_id = $3 AND period_key = $4`,
      [actorType, actor, testToolId, periodKey],
    );

    return result.rows[0]?.count ?? 0;
  }

  async function cleanup(actor) {
    await pool.query(`DELETE FROM usage_event WHERE actor_type = $1 AND actor_id = $2`, [
      actorType,
      actor,
    ]);
    await pool.query(`DELETE FROM usage_counter WHERE actor_type = $1 AND actor_id = $2`, [
      actorType,
      actor,
    ]);
  }

  test("reserving up to the limit succeeds, the next reservation is denied, and nothing is left over-counted", async () => {
    const actor = actorId();

    try {
      const limit = 3;

      for (let attempt = 1; attempt <= limit; attempt += 1) {
        const result = await reserve(actor, `seq-${actor}-${attempt}`, limit);
        assert.equal(result.allowed, true, `attempt ${attempt} should be allowed`);
        assert.equal(result.count, attempt);
      }

      const denied = await reserve(actor, `seq-${actor}-4`, limit);
      assert.equal(denied.allowed, false);
      assert.equal(await currentCount(actor), limit);
    } finally {
      await cleanup(actor);
    }
  });

  test("replaying the same idempotency key never counts twice", async () => {
    const actor = actorId();

    try {
      const key = `idem-${actor}`;
      const first = await reserve(actor, key, 5);
      const replay = await reserve(actor, key, 5);

      assert.equal(first.allowed, true);
      assert.equal(replay.allowed, true);
      assert.equal(replay.usageEventId, first.usageEventId);
      assert.equal(await currentCount(actor), 1);
    } finally {
      await cleanup(actor);
    }
  });

  test("concurrent reservations against a near-exhausted counter never overshoot the limit", async () => {
    const actor = actorId();

    try {
      const limit = 5;

      // Pre-seed at limit - 1 so exactly one of the concurrent attempts below can succeed.
      await pool.query(
        `INSERT INTO usage_counter (id, actor_type, actor_id, tool_id, period_key, count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), actorType, actor, testToolId, periodKey, limit - 1],
      );

      const attempts = 8;
      const results = await Promise.all(
        Array.from({ length: attempts }, (_, index) =>
          reserve(actor, `race-${actor}-${index}`, limit),
        ),
      );

      const allowedCount = results.filter((result) => result.allowed).length;

      assert.equal(allowedCount, 1, "exactly one concurrent reservation should win the last slot");
      assert.equal(await currentCount(actor), limit);
    } finally {
      await cleanup(actor);
    }
  });

  test("release gives back exactly one slot and is idempotent against a second call", async () => {
    const actor = actorId();

    try {
      const first = await reserve(actor, `rel-${actor}-1`, 5);
      await reserve(actor, `rel-${actor}-2`, 5);
      assert.equal(await currentCount(actor), 2);

      await release(first.usageEventId);
      assert.equal(await currentCount(actor), 1);

      // Second release of the same event must not double-decrement.
      await release(first.usageEventId);
      assert.equal(await currentCount(actor), 1);
    } finally {
      await cleanup(actor);
    }
  });

  test("release never drives the counter negative, even if called against an empty counter", async () => {
    const actor = actorId();

    try {
      const result = await reserve(actor, `floor-${actor}`, 5);
      await release(result.usageEventId);
      await release(result.usageEventId);
      assert.equal(await currentCount(actor), 0);
    } finally {
      await cleanup(actor);
    }
  });
}
