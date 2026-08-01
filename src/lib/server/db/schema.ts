import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Better Auth's core schema (user/session/account/verification). Column names,
// types, and nullability follow Better Auth's Drizzle adapter expectations exactly —
// https://www.better-auth.com/docs/adapters/drizzle — so the adapter can be pointed at
// this schema without additional field mapping.
//
// There is no separate "password reset" table: Better Auth's email/password plugin
// stores reset tokens in `verification`, keyed by identifier (`reset-password:{token}`),
// and deletes them on use. Email-verification tokens do NOT use this table in the
// installed better-auth version (1.6.25) — they're stateless signed JWTs (see
// node_modules/better-auth/dist/api/routes/email-verification.mjs), verified via
// signature + expiry rather than a DB lookup. Re-verifying an already-verified user is a
// harmless no-op, so the lack of single-use revocation there isn't a real risk. The table
// still exists and is migrated for the reset-password flow above.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Milestone 5 — added by the @better-auth/stripe plugin's own schema (see
  // node_modules/@better-auth/stripe's `user` schema extension). Populated automatically
  // by the plugin when a Stripe customer is created for this user; nullable because it
  // stays empty until Stripe billing is actually configured (STRIPE_SECRET_KEY unset) or
  // for any user who never starts a checkout.
  stripeCustomerId: text("stripe_customer_id"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Postgres does not index foreign-key columns automatically. Without this, every
  // "list/revoke this user's sessions" lookup (and the ON DELETE CASCADE from `user`)
  // is a sequential scan once the table has any real volume.
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    // Hashed credential password when providerId = "credential". Null for OAuth accounts.
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // `identifier` (not the primary key) is what every verification/reset-token check
  // actually queries by — without this, each check is a sequential scan.
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// Not part of Better Auth. Durable counterpart to the structured events already
// emitted via logSecurityEvent() (src/lib/server/security.ts), which today only reach
// console/log output. No writer is wired up yet in this milestone — this is schema only,
// ready for a future milestone to persist selected security/audit events into it.
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    event: text("event").notNull(),
    level: text("level").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    fingerprint: text("fingerprint"),
    requestId: text("request_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_log_user_id_idx").on(table.userId)],
);

// Milestone 4 — plan, entitlement, and usage foundation. No Stripe/billing tables: this
// is deliberately just "what plan is this user on" and "how much have they used," built
// so a future billing integration can update `plan` (e.g. from a webhook) without any of
// this schema changing shape.

// One row per authenticated user (userId is the primary key, not a separate surrogate
// id, since "one entitlement record per user" is an invariant the schema itself should
// enforce, not just application code). Anonymous visitors have no row here at all — they
// are tracked entirely through usage_counter/usage_event by fingerprint, never promoted
// into this table until they actually sign up.
export const userEntitlement = pgTable("user_entitlement", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // "free" | "pro" — src/lib/server/entitlements/policy.ts is the source of truth for
  // what each value actually grants. Defaults to "free" for every authenticated user;
  // nothing here requires a Stripe customer or subscription to exist.
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// The fast-path aggregate: one row per (actor, tool, period), atomically incremented via
// an INSERT ... ON CONFLICT ... WHERE count < limit upsert (see entitlements/service.ts)
// so "check the limit" and "count this use" happen as a single atomic statement — the
// standard safe pattern for this under concurrent requests, not a read-then-write race.
// actorId is polymorphic (a user.id when actorType = "user", a fingerprint hash when
// actorType = "anonymous") so it is deliberately not a foreign key — Postgres can't
// enforce a constraint against two different meanings of the same column.
export const usageCounter = pgTable(
  "usage_counter",
  {
    id: text("id").primaryKey(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id").notNull(),
    // "video-compressor" | "extract-audio" | "any" — "any" is used only for the
    // anonymous tier's combined (not per-tool) 5-lifetime-uses pool.
    toolId: text("tool_id").notNull(),
    // A daily counter's period key is the UTC date ("2026-07-25"); the anonymous
    // lifetime pool uses the constant "lifetime" so it never resets.
    periodKey: text("period_key").notNull(),
    count: integer("count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("usage_counter_actor_tool_period_idx").on(
      table.actorType,
      table.actorId,
      table.toolId,
      table.periodKey,
    ),
  ],
);

// The audit ledger: one row per attempted usage, independent of the fast-path counter
// above. idempotencyKey (the compression job id, or a per-request id for the synchronous
// Extract Audio flow) is UNIQUE — a retried or duplicated request can attempt to reserve
// the same key twice and will hit this constraint rather than double-count, which is the
// idempotency guarantee this milestone requires.
export const usageEvent = pgTable(
  "usage_event",
  {
    id: text("id").primaryKey(),
    actorType: text("actor_type").notNull(),
    actorId: text("actor_id").notNull(),
    toolId: text("tool_id").notNull(),
    // Recorded at reservation time and reused verbatim on release — NOT recomputed as
    // "today" at release time. An async compression job can be reserved on one UTC day
    // and only fail/release after midnight; recomputing would target the wrong day's
    // usage_counter row and silently fail to release the original reservation.
    periodKey: text("period_key").notNull(),
    // "reserved" (quota claimed, work in progress) | "confirmed" (work succeeded, slot
    // stays counted) | "released" (work failed/was cancelled after reservation, slot
    // given back) | "rejected" (reservation itself was denied, never counted at all).
    status: text("status").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("usage_event_actor_idx").on(table.actorType, table.actorId, table.toolId)],
);

// Milestone 5 — Stripe billing. This table's shape is dictated by @better-auth/stripe's
// own subscription schema (see node_modules/@better-auth/stripe's `subscriptions`
// export) — column names/types/nullability must match exactly for the plugin's Drizzle
// adapter to read/write it without additional field mapping, the same convention already
// used for Better Auth's own user/session/account/verification tables above.
//
// This is Stripe's own view of billing state (one row per subscription attempt,
// `referenceId` = user.id) — it is NOT the source of truth the rest of the app reads
// from. That stays user_entitlement.plan (Milestone 4), which the subscription
// lifecycle hooks in auth.ts keep in sync whenever this table changes. Nothing outside
// the Stripe integration itself queries this table directly.
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),
  referenceId: text("reference_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("incomplete"),
  periodStart: timestamp("period_start", { withTimezone: true }),
  periodEnd: timestamp("period_end", { withTimezone: true }),
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelAt: timestamp("cancel_at", { withTimezone: true }),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  seats: integer("seats"),
  billingInterval: text("billing_interval"),
  stripeScheduleId: text("stripe_schedule_id"),
});

// Milestone 6 Phase 5 — durable rate limiting. One mutable row per rate-limit key (the
// same "route:fingerprint" string already used as the in-memory Map key in security.ts),
// holding the count and expiry of the current fixed window. Read/written by a single
// atomic upsert (see checkRateLimit()'s durable path in security.ts) so "is this window
// still open" and "increment or start a new window" happen as one statement, not a
// read-then-write race — the same discipline usageCounter's upsert already uses above.
// Only used when DATABASE_URL is configured; security.ts falls back to the original
// in-memory Map otherwise, so a deployment with no database configured at all (the
// anonymous-only core product) keeps working exactly as before.
export const rateLimitBucket = pgTable("rate_limit_bucket", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Milestone 6 Phase 6 — durable job state. Replaces the local-disk JSON snapshot
// (os.tmpdir()/qavelix-compression/jobs/{id}.json) compression-queue.ts previously used
// as its persistence layer — that file survived a crash of the *same* process but not a
// redeploy (temp directory wiped) or any restart, silently losing every in-flight job.
// `data` holds the identical serialized shape the JSON file did (see serializableJob() in
// compression-queue.ts), so persistCompressionJob()/readPersistedCompressionJob() change
// only their I/O backend, not the shape of what they read/write — every other function in
// that file (dispatch, locking, FFmpeg execution) is unchanged. `status` is additionally
// surfaced as its own column purely so a caller can filter without deserializing `data`;
// it's kept in sync with data.status on every write. Unlike rate_limit_bucket, this table
// has no "DATABASE_URL not configured" fallback: entitlements/service.ts's resolveActor()
// (Milestone 5) already hard-requires a database on every compression-job-creation
// request, so this introduces no new dependency the create path didn't already have.
export const compressionJob = pgTable("compression_job", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Video Trimmer (VIDEOTRIMMER.md Phase 1) — a separate table from compression_job rather
// than a shared one with a discriminator column, per that document's Open Decision #3: a
// new tool sharing Compressor's already-shipped, revenue-bearing table/queue is a riskier
// change to review and revert independently than an equivalent, isolated table following
// the exact same shape/columns. Identical durability reasoning to compression_job above —
// see that table's comment.
export const videoTrimmerJob = pgTable("video_trimmer_job", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
