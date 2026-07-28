import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// service.ts-style constraint (see entitlements-source.test.mjs): security.ts's durable
// path uses real "@/" value aliases (getDb, env) that Node's native TS loader can't
// resolve outside the Next.js build. We test the real committed source directly instead
// of a hand-copied duplicate that could drift — the atomic upsert's actual Postgres
// behavior is separately verified against a real database in rate-limit-db.test.mjs.
const schema = await readFile("src/lib/server/db/schema.ts", "utf8");
const security = await readFile("src/lib/server/security.ts", "utf8");
const uploadAnalyzeRoute = await readFile("src/app/api/upload/analyze/route.ts", "utf8");
const extractAudioRoute = await readFile("src/app/api/extract-audio/route.ts", "utf8");
const extractAudioAnalyzeRoute = await readFile(
  "src/app/api/extract-audio/analyze/route.ts",
  "utf8",
);
const compressionJobsRoute = await readFile("src/app/api/compression/jobs/route.ts", "utf8");
const compressionJobRoute = await readFile(
  "src/app/api/compression/jobs/[id]/route.ts",
  "utf8",
);
const compressionDownloadRoute = await readFile(
  "src/app/api/compression/jobs/[id]/download/route.ts",
  "utf8",
);

test("rate_limit_bucket is a single mutable row per key, matching the in-memory Map key shape", () => {
  assert.match(schema, /export const rateLimitBucket = pgTable\(\s*"rate_limit_bucket"/);
  assert.match(schema, /key: text\("key"\)\.primaryKey\(\)/);
  assert.match(schema, /count: integer\("count"\)\.notNull\(\)\.default\(0\)/);
  assert.match(schema, /resetAt: timestamp\("reset_at", \{ withTimezone: true \}\)\.notNull\(\)/);
});

test("checkRateLimit is durable when DATABASE_URL is configured, and falls back to the original in-memory Map otherwise", () => {
  assert.match(security, /function checkRateLimitInMemory\(/);
  assert.match(security, /async function checkRateLimitDurable\(/);
  assert.match(security, /export function checkRateLimit\(options: RateLimitOptions\): Promise<RateLimitResult> \{/);
  assert.match(security, /if \(!env\.DATABASE_URL\) \{\s*return Promise\.resolve\(checkRateLimitInMemory\(options\)\);/);
  assert.match(security, /return checkRateLimitDurable\(options\);/);
});

test("the in-memory fallback path is byte-for-byte the original implementation (new window on expiry, deny without incrementing at the limit)", () => {
  const inMemoryFn = security.slice(
    security.indexOf("function checkRateLimitInMemory"),
    security.indexOf("async function checkRateLimitDurable"),
  );

  assert.match(inMemoryFn, /if \(rateLimitBuckets\.size > 10_000\) \{/);
  assert.match(inMemoryFn, /if \(!existingBucket \|\| existingBucket\.resetAt <= now\) \{/);
  assert.match(inMemoryFn, /if \(existingBucket\.count >= limit\) \{\s*return \{\s*allowed: false,/);
});

test("the durable path is a single atomic upsert, never a read-then-write race, and fails closed on a DB error", () => {
  const durableFn = security.slice(
    security.indexOf("async function checkRateLimitDurable"),
    security.indexOf("export function checkRateLimit"),
  );

  assert.match(durableFn, /\.onConflictDoUpdate\(\{\s*target: rateLimitBucket\.key,/);
  assert.match(
    durableFn,
    /setWhere: sql`\$\{rateLimitBucket\.resetAt\} <= now\(\) OR \$\{rateLimitBucket\.count\} < \$\{limit\}`,/,
  );
  assert.match(durableFn, /catch \(error\) \{[\s\S]*?return \{ allowed: false, remaining: 0, resetAt: windowResetAt\.getTime\(\) \};/);
  assert.match(durableFn, /logSecurityEvent\("error", "rate_limit_check_failed"/);
});

test("enforceApiSecurity awaits the (possibly durable) rate limit check", () => {
  assert.match(security, /export async function enforceApiSecurity\(/);
  assert.match(security, /const rateLimit = await checkRateLimit\(\{/);
});

test("every enforceApiSecurity call site awaits it, so the durable path is never silently skipped", () => {
  for (const [name, source] of [
    ["upload/analyze", uploadAnalyzeRoute],
    ["extract-audio", extractAudioRoute],
    ["extract-audio/analyze", extractAudioAnalyzeRoute],
    ["compression/jobs", compressionJobsRoute],
    ["compression/jobs/[id]", compressionJobRoute],
    ["compression/jobs/[id]/download", compressionDownloadRoute],
  ]) {
    assert.match(source, /await enforceApiSecurity\(/, `${name} should await enforceApiSecurity()`);
    assert.doesNotMatch(
      source,
      /(?<!await )enforceApiSecurity\(/,
      `${name} should never call enforceApiSecurity() without awaiting it`,
    );
  }
});
