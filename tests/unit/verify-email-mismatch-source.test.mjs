import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Same constraint as email-source.test.mjs/dashboard-source.test.mjs: these modules use
// real "@/" aliases and next/headers-adjacent server-only APIs Node's native TS loader
// can't resolve outside the Next.js build. The actual runtime behavior (real signature
// verification, real redirect chain, real masked-email display) is separately proven end
// to end in tests/integration/verify-email-session-mismatch.test.mjs.
const routeModule = await readFile("src/app/api/verify-email/route.ts", "utf8");
const authModule = await readFile("src/lib/server/auth/auth.ts", "utf8");
const sessionHelper = await readFile("src/lib/server/auth/session.ts", "utf8");
const verifyEmailStatus = await readFile("src/components/auth/verify-email-status.tsx", "utf8");
const verifyEmailPage = await readFile("src/app/[locale]/verify-email/page.tsx", "utf8");

test("the real, signature-and-expiry-checked verification always runs through Better Auth's own API, never reimplemented", () => {
  assert.match(routeModule, /getAuth\(\)\.api\.verifyEmail\(\{ query: \{ token \}, headers: request\.headers \}\)/);
  assert.doesNotMatch(routeModule, /jwtVerify|jose/);
});

test("the token's email is only ever decoded for display after Better Auth's own check succeeded, and is masked before ever leaving the server", () => {
  const decodeFn = routeModule.slice(
    routeModule.indexOf("function decodeJwtEmail"),
    routeModule.indexOf("function maskEmail"),
  );
  // Decoding is a plain base64url JSON parse — no crypto, no secret, purely for display.
  assert.match(decodeFn, /Buffer\.from\(payloadSegment, "base64url"\)/);
  assert.doesNotMatch(decodeFn, /secret|HS256|verify/i);

  const maskFn = routeModule.slice(
    routeModule.indexOf("function maskEmail"),
    routeModule.indexOf("function redirectTo"),
  );
  assert.match(maskFn, /"•"/);
});

test("the callback destination is round-tripped through the same allowlist every other flow uses, never trusted as-is", () => {
  assert.match(routeModule, /from "@\/lib\/server\/auth\/session"/);
  assert.match(routeModule, /sanitizeCallbackPath\(url\.searchParams\.get\("callbackURL"\)\)/);
});

test("the route is rate-limited like every other state-changing route in this codebase", () => {
  assert.match(routeModule, /enforceApiSecurity\(request, \{/);
  assert.match(routeModule, /route: "verify-email-callback"/);
});

test("neither the raw token nor a full email is ever logged or placed in the redirect target", () => {
  assert.match(routeModule, /logSecurityEvent\("info", "verify_email_callback_failed", \{ code \}\)/);
  assert.doesNotMatch(routeModule, /logSecurityEvent\([^)]*token/s);
  // The success path never logs anything containing the decoded email.
  const successPath = routeModule.slice(routeModule.indexOf("const verifiedEmail = decodeJwtEmail"));
  assert.doesNotMatch(successPath, /logSecurityEvent/);
});

test("the 3 verification outcomes map to a small fixed enum, never the raw email as an identity claim", () => {
  assert.match(routeModule, /redirectTo\(callbackPath, \{ result: "success", match: "none" \}\)/);
  assert.match(routeModule, /redirectTo\(callbackPath, \{ result: "success", match: "same" \}\)/);
  assert.match(routeModule, /match: "different"/);
  // The masked email is the ONLY email-shaped value ever placed on the redirect — the
  // real, unmasked verifiedEmail is compared server-side and then discarded, not forwarded.
  assert.doesNotMatch(routeModule, /email: verifiedEmail/);
});

test("auth.ts threads the real token through to the proxy route instead of Better Auth's default redirect-first link", () => {
  assert.match(authModule, /function buildVerificationLink\(defaultUrl: string, token: string\)/);
  assert.match(authModule, /new URL\("\/api\/verify-email", env\.NEXT_PUBLIC_APP_URL\)/);
  assert.match(
    authModule,
    /sendVerificationEmail: async \(\{ user, url, token \}\) => \{\s*await deliverAuthEmail\("verify-email", user\.email, buildVerificationLink\(url, token\)\);/,
  );
});

test("sanitizeCallbackPath's allowlist accepts /verify-email as a legitimate destination", () => {
  const patternMatch = sessionHelper.match(/const SAFE_CALLBACK_PATTERN = (\/.*\/);/);
  assert.ok(patternMatch, "SAFE_CALLBACK_PATTERN should be defined as a regex literal");
  const pattern = new RegExp(patternMatch[1].slice(1, -1));

  assert.match("/en/verify-email", pattern);
  assert.doesNotMatch("/en/verify-email/../etc/passwd", pattern);
});

test("the verify-email page narrows result/match/code/email from raw query strings against a fixed set before ever rendering them", () => {
  assert.match(verifyEmailPage, /RESULT_VALUES = new Set\(\["success", "error"\]\)/);
  assert.match(verifyEmailPage, /MATCH_VALUES = new Set\(\["same", "different", "none"\]\)/);
  assert.match(verifyEmailPage, /RESULT_VALUES\.has\(result\)/);
  assert.match(verifyEmailPage, /MATCH_VALUES\.has\(match\)/);
});

test("the different-account case never claims the current session is the verified one, and never auto-switches accounts", () => {
  const differentBlock = verifyEmailStatus.slice(
    verifyEmailStatus.indexOf('if (match === "different")'),
    verifyEmailStatus.indexOf('if (match === "same")'),
  );
  assert.match(differentBlock, /copy\.verifyEmail\.differentAccountTitle/);
  assert.match(differentBlock, /differentAccountMessage\.replace\("\{email\}", maskedEmail\)/);
  assert.match(differentBlock, /differentAccountMessageGeneric/);
  assert.match(differentBlock, /handleSignOutAndSignIn/);
  // No automatic account switch: signing out happens, but nothing signs the visitor back
  // in as anyone — the button only navigates to the plain sign-in page afterward.
  assert.doesNotMatch(differentBlock, /signIn\.email\(/);
});

test("the sign-out-and-sign-in action actually signs out before redirecting, and checks the real response", () => {
  const handler = verifyEmailStatus.slice(
    verifyEmailStatus.indexOf("async function handleSignOutAndSignIn"),
    verifyEmailStatus.indexOf("async function handleSignOutAndSignIn") + 500,
  );
  assert.match(handler, /const \{ error \} = await authClient\.signOut\(\);/);
  assert.match(handler, /if \(error\) \{/);
  assert.match(handler, /router\.push\(`\/\$\{locale\}\/sign-in`\)/);
});

test("the no-session success case (case A) never implies anyone is authenticated", () => {
  assert.match(verifyEmailStatus, /copy\.verifyEmail\.verifiedNoSessionMessage/);
  assert.match(verifyEmailStatus, /copy\.verifyEmail\.goToSignInLabel/);
});

test("the failure case (case D) only offers resend to whoever is actually signed in right now, never implying the failed token's target", () => {
  const errorBlock = verifyEmailStatus.slice(
    verifyEmailStatus.indexOf('if (result === "error")'),
    verifyEmailStatus.indexOf('if (result === "success")'),
  );
  assert.match(errorBlock, /errors\.tokenExpired/);
  assert.match(errorBlock, /errors\.invalidToken/);
  assert.match(errorBlock, /errors\.unknown/);
  assert.match(errorBlock, /session\.data \?/);
  assert.match(errorBlock, /handleResend/);
});

test("the original pending/verified/resend flow (no result param) is preserved unchanged", () => {
  const legacyBlock = verifyEmailStatus.slice(verifyEmailStatus.indexOf("// No result param:"));
  assert.match(legacyBlock, /session\.isPending/);
  assert.match(legacyBlock, /session\.data\.user\.emailVerified/);
  assert.match(legacyBlock, /onClick=\{handleResend\}/);
  assert.doesNotMatch(legacyBlock, /authClient\.verifyEmail\(/);
  // handleResend itself (defined once, shared with the case-D resend branch) still calls
  // the real Better Auth client method.
  assert.match(verifyEmailStatus, /authClient\.sendVerificationEmail\(/);
});
