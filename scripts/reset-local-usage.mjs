#!/usr/bin/env node
// Dev-only helper: clears anonymous entitlement usage (usage_counter + usage_event rows
// for actorType = "anonymous") from the configured database, so a local developer can
// re-trigger the Ad Gate's "2nd use" flow without waiting out the anonymous pool's
// lifetime window or hand-writing SQL. Deliberately does NOT touch TOOL_POLICY or any
// entitlement/limit code — see the "how it decides what's safe" note below — this only
// ever deletes rows, never changes what a limit means.
//
// Usage:
//   node scripts/reset-local-usage.mjs                 (dry run — lists what would be deleted)
//   node scripts/reset-local-usage.mjs --yes            (actually deletes)
//   node scripts/reset-local-usage.mjs --yes --fingerprint=<actor_id>   (scope to one actor)
//   node scripts/reset-local-usage.mjs --yes --tool=video-compressor   (scope to one tool id;
//                                                                       anonymous uses "any")
//
// Or via npm: npm run dev:reset-usage -- --yes

import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";

import { Pool } from "@neondatabase/serverless";

// Same fallback chain tests/integration/entitlements-db.test.mjs already uses: this script
// runs as a bare node process, outside the Next.js runtime that would otherwise load
// .env.local automatically, so it has to find DATABASE_URL itself.
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

const { values } = parseArgs({
  options: {
    yes: { type: "boolean", default: false },
    fingerprint: { type: "string" },
    tool: { type: "string" },
  },
});

// A hard stop, not just a warning: this script's whole purpose is to let a solo developer
// wipe their own local testing data, which is never an action anyone should be able to
// trigger against a real deployment by accident (e.g. NODE_ENV=production mistakenly set
// in a shell that also has a real DATABASE_URL exported).
if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run: NODE_ENV=production. This script is dev-only.");
  process.exit(1);
}

const databaseUrl = await loadDatabaseUrl();

if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not configured (checked process.env and .env.local) — nothing to reset.",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

// actorType = "anonymous" only — this never touches a signed-in user's usage_counter/
// usage_event rows (actorType = "user"), which is the deliberate scope: the reported
// problem is the anonymous lifetime pool, not any authenticated actor's daily quota.
const toolFilter = values.tool ? "AND tool_id = $2" : "";
const fingerprintFilter = values.fingerprint
  ? `AND actor_id = $${values.tool ? 3 : 2}`
  : "";
const params = ["anonymous", values.tool, values.fingerprint].filter((value) => value !== undefined);

const { rows: counterRows } = await pool.query(
  `SELECT actor_id, tool_id, period_key, count FROM usage_counter
   WHERE actor_type = $1 ${toolFilter} ${fingerprintFilter}
   ORDER BY updated_at DESC`,
  params,
);
const { rows: eventRows } = await pool.query(
  `SELECT id, actor_id, tool_id, status FROM usage_event
   WHERE actor_type = $1 ${toolFilter} ${fingerprintFilter}
   ORDER BY created_at DESC`,
  params,
);

if (counterRows.length === 0 && eventRows.length === 0) {
  console.log("No matching anonymous usage rows found — nothing to reset.");
  await pool.end();
  process.exit(0);
}

console.log(`Matched ${counterRows.length} usage_counter row(s):`);
for (const row of counterRows) {
  console.log(`  actor=${row.actor_id} tool=${row.tool_id} period=${row.period_key} count=${row.count}`);
}
console.log(`Matched ${eventRows.length} usage_event row(s) (status breakdown):`);
const statusCounts = eventRows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] ?? 0) + 1;
  return acc;
}, {});
console.log(`  ${JSON.stringify(statusCounts)}`);

if (!values.yes) {
  console.log("\nDry run only — nothing was deleted. Re-run with --yes to actually clear these rows.");
  await pool.end();
  process.exit(0);
}

await pool.query(
  `DELETE FROM usage_counter WHERE actor_type = $1 ${toolFilter} ${fingerprintFilter}`,
  params,
);
await pool.query(
  `DELETE FROM usage_event WHERE actor_type = $1 ${toolFilter} ${fingerprintFilter}`,
  params,
);

console.log(
  `\nDeleted ${counterRows.length} usage_counter row(s) and ${eventRows.length} usage_event row(s). ` +
    "The anonymous pool for the matched actor(s) is now back to 0 uses.",
);

await pool.end();
