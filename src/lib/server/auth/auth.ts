import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";

import { env } from "@/env/server";
import { getDb } from "@/lib/server/db/client";
import * as schema from "@/lib/server/db/schema";
import { logSecurityEvent } from "@/lib/server/security";

// DEV-ONLY STUB. There is no email provider configured in this project yet — these
// callbacks log the action link via the existing structured logger instead of sending a
// real email, purely so the Forgot Password / Reset Password / Email Verification UI
// (Milestone 2) can be exercised end-to-end locally. A real provider (Resend, Postmark,
// SES, etc.) must replace this before any of these flows are exposed to real users —
// nothing here is production email delivery.
function logAuthEmailLink(event: string, email: string, url: string) {
  logSecurityEvent("info", event, { email, url });
}

function createAuth() {
  return betterAuth({
    baseURL: env.NEXT_PUBLIC_APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        logAuthEmailLink("auth_dev_reset_password_link", user.email, url);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        logAuthEmailLink("auth_dev_verification_link", user.email, url);
      },
      sendOnSignUp: true,
    },
  });
}

// Anchored on globalThis for the same reason as src/lib/server/db/client.ts: `next
// dev`'s hot reload re-evaluates this module on file save, and a plain module-level
// variable would rebuild the Better Auth instance (and, transitively, nothing new here
// since getDb() is already globalThis-safe, but the instance itself would still be
// needlessly reconstructed) on every reload instead of once per dev-server process.
type AuthGlobal = typeof globalThis & {
  __qavelixAuth?: ReturnType<typeof createAuth>;
};

const authGlobal = globalThis as AuthGlobal;

// Lazy on purpose, for the same reason getDb() is lazy: Next.js imports route handler
// modules while collecting build metadata, without invoking them. Constructing the
// Better Auth instance (which needs a database connection) only on first real use keeps
// `next build` and every existing route working with no DATABASE_URL/BETTER_AUTH_SECRET
// configured — auth simply isn't reachable yet, which is correct for this milestone.
export function getAuth() {
  if (!authGlobal.__qavelixAuth) {
    authGlobal.__qavelixAuth = createAuth();
  }

  return authGlobal.__qavelixAuth;
}
