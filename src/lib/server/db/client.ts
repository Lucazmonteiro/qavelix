import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "@/env/server";
import * as schema from "@/lib/server/db/schema";
import { logSecurityEvent } from "@/lib/server/security";

// Anchored on globalThis, not a plain module-level variable: `next dev`'s hot reload
// re-evaluates this module on every relevant file save. A module-level `let` would
// silently start a brand-new Pool each time without closing the previous one — a slow
// connection leak across a dev session, not just a wasted object. globalThis survives
// module re-evaluation, so the pool (and the Drizzle client wrapping it) are created
// once per dev-server process, the same way the underlying Neon connection actually
// behaves in production.
type DbGlobal = typeof globalThis & {
  __qavelixDbPool?: Pool;
  __qavelixDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const dbGlobal = globalThis as DbGlobal;

function getPool() {
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured. Set it in .env.local to use the database.",
    );
  }

  if (!dbGlobal.__qavelixDbPool) {
    // A conservative cap, not a tuned value: Neon's own connection limit (especially on
    // lower tiers) is shared across every serverless function instance that ends up
    // holding a warm pool, not just this one. Pool's default (10) is a reasonable
    // per-process ceiling for a single persistent server; it is not automatically safe
    // once this runs across many concurrent serverless instances, each with its own
    // pool — that's a deployment-topology concern (Neon's pooled/pgbouncer connection
    // string) this cap alone doesn't solve, only bounds.
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 });

    // Pool extends EventEmitter; an 'error' event with no listener crashes the whole
    // Node process (the standard node-postgres/pg gotcha). This can fire on an idle
    // pooled connection long after the query that opened it has finished, so it must be
    // handled here, not at each call site.
    pool.on("error", (error: Error) => {
      logSecurityEvent("error", "db_pool_idle_client_error", {
        message: error.message,
      });
    });

    dbGlobal.__qavelixDbPool = pool;
  }

  return dbGlobal.__qavelixDbPool;
}

// Lazy on purpose: importing this module (directly, or transitively through the auth
// module) must never throw or attempt a connection until a caller actually needs the
// database. This keeps every existing route, page, and the production build working
// with no DATABASE_URL configured at all. The constructed client is cached too, not
// just the pool, so repeated calls reuse one Drizzle instance instead of rebuilding it
// per call.
export function getDb() {
  if (!dbGlobal.__qavelixDb) {
    dbGlobal.__qavelixDb = drizzle(getPool(), { schema });
  }

  return dbGlobal.__qavelixDb;
}

export type Database = ReturnType<typeof getDb>;
