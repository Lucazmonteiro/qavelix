import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Same constraint as stripe-billing-source.test.mjs/entitlements-source.test.mjs: these
// modules use real "@/" value aliases that Node's native TS loader can't resolve outside
// the Next.js build. We test the real committed source directly instead of a hand-copied
// duplicate that could drift.
const envServer = await readFile("src/env/server.ts", "utf8");
const emailModule = await readFile("src/lib/server/email.ts", "utf8");
const authModule = await readFile("src/lib/server/auth/auth.ts", "utf8");

test("email env vars are optional, validated by prefix where applicable, and never required for the app to boot", () => {
  assert.match(envServer, /RESEND_API_KEY: z\.string\(\)\.startsWith\("re_"\)\.optional\(\)/);
  assert.match(envServer, /EMAIL_FROM_ADDRESS: z\.string\(\)\.optional\(\)/);
});

test("the Resend client is a lazy globalThis-anchored singleton, matching getDb()/getStripeClient()'s existing pattern", () => {
  assert.match(emailModule, /function getResendClient\(\): Resend \| null/);
  assert.match(emailModule, /if \(!env\.RESEND_API_KEY\) \{\s*return null;/);
  assert.match(emailModule, /globalThis as ResendGlobal/);
  assert.match(emailModule, /if \(!resendGlobal\.__qavelixResend\) \{/);
});

test("email is treated as fully absent unless both the API key and the from address are configured", () => {
  assert.match(emailModule, /export function isEmailConfigured\(\): boolean \{/);
  assert.match(
    emailModule,
    /return Boolean\(env\.RESEND_API_KEY && env\.EMAIL_FROM_ADDRESS\);/,
  );
  assert.match(emailModule, /if \(!resend \|\| !env\.EMAIL_FROM_ADDRESS\) \{\s*return false;/);
});

test("sendAuthEmail never throws and never logs the sensitive link once real delivery succeeds", () => {
  const sendFn = emailModule.slice(emailModule.indexOf("export async function sendAuthEmail"));

  assert.match(sendFn, /catch \(error\) \{[\s\S]*?return false;\s*\}/);
  assert.match(sendFn, /logSecurityEvent\("info", "auth_email_sent", \{ kind, email: to \}\);/);
  // The success-path log call must not carry the url — only the failure/fallback path
  // (in auth.ts's dev-stub log) is allowed to, since that's the pre-existing behavior.
  const successLogCall = sendFn.slice(
    sendFn.indexOf('logSecurityEvent("info", "auth_email_sent"'),
    sendFn.indexOf('logSecurityEvent("info", "auth_email_sent"') + 80,
  );
  assert.doesNotMatch(successLogCall, /\burl\b/);
});

test("auth.ts falls back to the original dev-only log stub whenever sendAuthEmail reports it did not send", () => {
  assert.match(authModule, /import \{ sendAuthEmail \} from "@\/lib\/server\/email";/);
  assert.match(
    authModule,
    /async function deliverAuthEmail\(kind: "reset-password" \| "verify-email", email: string, url: string\) \{/,
  );
  assert.match(authModule, /const sent = await sendAuthEmail\(kind, email, url\);/);
  assert.match(authModule, /if \(!sent\) \{/);
  assert.match(
    authModule,
    /kind === "reset-password" \? "auth_dev_reset_password_link" : "auth_dev_verification_link"/,
  );
});

test("outgoing auth emails set replyTo to the project's existing support address, not a second contact channel", () => {
  assert.match(emailModule, /replyTo: env\.NEXT_PUBLIC_SUPPORT_EMAIL/);
});

test("Better Auth's reset-password and verification callbacks both route through deliverAuthEmail", () => {
  assert.match(
    authModule,
    /sendResetPassword: async \(\{ user, url \}\) => \{\s*await deliverAuthEmail\("reset-password", user\.email, url\);/,
  );
  assert.match(
    authModule,
    /sendVerificationEmail: async \(\{ user, url, token \}\) => \{\s*await deliverAuthEmail\("verify-email", user\.email, buildVerificationLink\(url, token\)\);/,
  );
});
