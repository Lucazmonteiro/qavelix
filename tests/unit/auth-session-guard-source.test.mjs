import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const proxySource = await readFile("src/proxy.ts", "utf8");
const sessionHelper = await readFile("src/lib/server/auth/session.ts", "utf8");
const signInPage = await readFile("src/app/[locale]/sign-in/page.tsx", "utf8");
const signUpPage = await readFile("src/app/[locale]/sign-up/page.tsx", "utf8");
const forgotPasswordPage = await readFile(
  "src/app/[locale]/forgot-password/page.tsx",
  "utf8",
);
const resetPasswordPage = await readFile(
  "src/app/[locale]/reset-password/page.tsx",
  "utf8",
);
const verifyEmailPage = await readFile("src/app/[locale]/verify-email/page.tsx", "utf8");

test("proxy.ts's existing locale-redirect and Render-host-redirect logic is untouched", () => {
  assert.match(proxySource, /RENDER_HOST = "qavelix\.onrender\.com"/);
  assert.match(proxySource, /PRODUCTION_HOST = "qavelix\.com"/);
  assert.match(proxySource, /redirectUrl\.pathname =\s*\n\s*pathname === "\/"/);
});

test("proxy.ts does NOT re-add a cookie-presence guest-only redirect (regression guard)", () => {
  // A cookie-presence-only check was tried and removed during review: presence isn't
  // validity, and because it ran before the accurate page-level check, a stale-but-
  // present session cookie (e.g. revoked from another device) would permanently redirect
  // a visitor away from sign-in/sign-up/forgot-password with no in-app recovery. The only
  // guest-only check that should exist is getOptionalSession() on the pages themselves.
  assert.doesNotMatch(proxySource, /GUEST_ONLY_SEGMENTS/);
  assert.doesNotMatch(proxySource, /hasSessionCookie/);
  assert.doesNotMatch(proxySource, /session_token/);
});

test("getOptionalSession() wraps the real Better Auth server API, not a reimplementation", () => {
  assert.match(sessionHelper, /getAuth\(\)\.api\.getSession\(\{ headers: requestHeaders \}\)/);
  assert.match(sessionHelper, /from "next\/headers"/);
  assert.match(sessionHelper, /from "@\/lib\/server\/auth\/auth"/);
});

test("the 3 guest-only pages redirect an authenticated visitor server-side", () => {
  for (const page of [signInPage, signUpPage, forgotPasswordPage]) {
    assert.match(page, /from "@\/lib\/server\/auth\/session"/);
    assert.match(page, /const session = await getOptionalSession\(\)/);
    assert.match(page, /if \(session\) \{/);
    assert.match(page, /redirect\(`\/\$\{locale\}`\)/);
  }
});

test("reset-password and verify-email are deliberately NOT guest-gated", () => {
  assert.doesNotMatch(resetPasswordPage, /getOptionalSession/);
  assert.doesNotMatch(verifyEmailPage, /getOptionalSession/);
});

test("reset-password normalizes a duplicate ?token= query param instead of passing an array through", () => {
  assert.match(resetPasswordPage, /token\?: string \| string\[\]/);
  assert.match(resetPasswordPage, /function normalizeToken/);
  assert.match(resetPasswordPage, /Array\.isArray\(token\)/);
  assert.match(resetPasswordPage, /<ResetPasswordForm token=\{normalizeToken\(token\)\} \/>/);
});
