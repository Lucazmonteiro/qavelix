import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { Pool } from "@neondatabase/serverless";
import Stripe from "stripe";

// Same rationale as tests/integration/entitlements-db.test.mjs: auth.ts/entitlements
// service.ts can't be imported directly outside the Next.js runtime (real "@/" aliases +
// next/headers), so this exercises the exact SQL setUserPlan() runs directly against the
// real configured dev database, plus a live (but minimal, read-only-ish) round trip
// against the real configured Stripe test account to catch key/price misconfiguration
// automatically rather than only via manual testing.
//
// Skips gracefully (never fails) when DATABASE_URL/STRIPE_SECRET_KEY aren't configured,
// matching the existing entitlements-db.test.mjs convention.

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
const proPriceId = await loadEnvVar("STRIPE_PRO_MONTHLY_PRICE_ID");

if (!databaseUrl) {
  test("user_entitlement upsert (setUserPlan's SQL pattern)", { skip: "DATABASE_URL is not configured" }, () => {});
} else {
  const pool = new Pool({ connectionString: databaseUrl });
  const testUserId = `test-billing-${randomUUID()}`;

  async function upsertPlan(plan) {
    await pool.query(
      `INSERT INTO user_entitlement (user_id, plan)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET plan = $2, updated_at = now()`,
      [testUserId, plan],
    );
  }

  async function currentPlan() {
    const result = await pool.query("SELECT plan FROM user_entitlement WHERE user_id = $1", [
      testUserId,
    ]);

    return result.rows[0]?.plan ?? null;
  }

  test("setUserPlan's upsert inserts on first write and updates in place on every subsequent write", async () => {
    // user_entitlement.user_id has a real FK to user.id (unlike usage_counter/usage_event's
    // deliberately-unconstrained polymorphic actorId) — a throwaway user row is required.
    await pool.query(
      `INSERT INTO "user" (id, name, email, email_verified) VALUES ($1, $2, $3, false)`,
      [testUserId, "Billing DB Test", `${testUserId}@example.invalid`],
    );

    try {
      assert.equal(await currentPlan(), null);

      await upsertPlan("pro");
      assert.equal(await currentPlan(), "pro");

      // A real subscription lifecycle writes this row many times (created -> pro,
      // renewed -> pro again, failed renewal -> free, deleted -> free) — must always
      // update the same row, never insert a duplicate.
      await upsertPlan("free");
      assert.equal(await currentPlan(), "free");

      await upsertPlan("pro");
      assert.equal(await currentPlan(), "pro");

      const rowCount = await pool.query(
        "SELECT count(*) FROM user_entitlement WHERE user_id = $1",
        [testUserId],
      );

      assert.equal(rowCount.rows[0].count, "1");
    } finally {
      await pool.query("DELETE FROM user_entitlement WHERE user_id = $1", [testUserId]);
      await pool.query('DELETE FROM "user" WHERE id = $1', [testUserId]);
    }
  });
}

if (!stripeSecretKey) {
  test("Stripe test-mode key and Pro price are reachable", { skip: "STRIPE_SECRET_KEY is not configured" }, () => {});
} else if (!stripeSecretKey.startsWith("sk_test_")) {
  test("Stripe test-mode key and Pro price are reachable", { skip: "STRIPE_SECRET_KEY is not a test-mode key — refusing to run against a live account" }, () => {});
} else {
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-06-24.dahlia" });

  test("the configured Stripe secret key is valid and reachable in test mode", async () => {
    const account = await stripe.accounts.retrieve();

    assert.equal(typeof account.id, "string");
  });

  test("the configured Pro monthly price exists, is active, and matches the confirmed product decision (recurring, monthly)", async () => {
    if (!proPriceId) {
      assert.fail("STRIPE_PRO_MONTHLY_PRICE_ID is not configured");
    }

    const price = await stripe.prices.retrieve(proPriceId);

    assert.equal(price.active, true);
    assert.equal(price.recurring?.interval, "month");
    assert.equal(price.currency, "usd");
    assert.equal(price.unit_amount, 999);
  });
}
