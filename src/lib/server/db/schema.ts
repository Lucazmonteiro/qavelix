import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Better Auth's core schema (user/session/account/verification). Column names,
// types, and nullability follow Better Auth's Drizzle adapter expectations exactly —
// https://www.better-auth.com/docs/adapters/drizzle — so the adapter can be pointed at
// this schema without additional field mapping.
//
// There is no separate "password reset" table: Better Auth's email/password plugin
// stores reset tokens in `verification` (the same table it uses for email-verification
// tokens), keyed by identifier. Adding a second table for the same purpose would
// duplicate what Better Auth already manages.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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
