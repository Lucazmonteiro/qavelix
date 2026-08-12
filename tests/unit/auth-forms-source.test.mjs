import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const signInForm = await readFile("src/components/auth/sign-in-form.tsx", "utf8");
const signUpForm = await readFile("src/components/auth/sign-up-form.tsx", "utf8");
const forgotPasswordForm = await readFile(
  "src/components/auth/forgot-password-form.tsx",
  "utf8",
);
const resetPasswordForm = await readFile(
  "src/components/auth/reset-password-form.tsx",
  "utf8",
);
const verifyEmailStatus = await readFile(
  "src/components/auth/verify-email-status.tsx",
  "utf8",
);
const authErrors = await readFile("src/lib/auth-errors.ts", "utf8");
const authClient = await readFile("src/lib/auth-client.ts", "utf8");
const authValidation = await readFile("src/lib/auth-validation.ts", "utf8");
const authFormShell = await readFile("src/components/auth/auth-form-shell.tsx", "utf8");
const authField = await readFile("src/components/auth/auth-field.tsx", "utf8");
const accountMenu = await readFile("src/components/account-menu.tsx", "utf8");

test("auth client is a single createAuthClient() singleton, not reconstructed per form", () => {
  assert.match(authClient, /createAuthClient/);
  assert.match(authClient, /"better-auth\/react"/);
  // Milestone 5 added the Stripe subscription client plugin, but this is still the one
  // and only createAuthClient() call in the codebase — not reconstructed per form.
  assert.match(authClient, /export const authClient = createAuthClient\(\{/);
  const authClientCalls = authClient.match(/createAuthClient\(/g) ?? [];
  assert.equal(authClientCalls.length, 1);

  for (const source of [
    signInForm,
    signUpForm,
    forgotPasswordForm,
    resetPasswordForm,
    verifyEmailStatus,
  ]) {
    assert.doesNotMatch(source, /createAuthClient\(/);
    assert.match(source, /from "@\/lib\/auth-client"/);
  }
});

test("each flow calls the correct Better Auth client method", () => {
  assert.match(signInForm, /authClient\.signIn\.email\(/);
  assert.match(signUpForm, /authClient\.signUp\.email\(/);
  assert.match(forgotPasswordForm, /authClient\.requestPasswordReset\(/);
  assert.match(resetPasswordForm, /authClient\.resetPassword\(/);
  assert.match(verifyEmailStatus, /authClient\.sendVerificationEmail\(/);
});

test("password-reset flow passes the emailed token through, not a re-derived one", () => {
  assert.match(forgotPasswordForm, /redirectTo: `\/\$\{locale\}\/reset-password`/);
  assert.match(resetPasswordForm, /token: string \| null/);
  assert.match(resetPasswordForm, /if \(!token\) \{/);
  assert.match(resetPasswordForm, /authClient\.resetPassword\(\{ newPassword, token/);
});

test("client-side password validation mirrors, not exceeds, the server's own defaults", () => {
  assert.match(authValidation, /MIN_PASSWORD_LENGTH = 8/);
  assert.match(authValidation, /MAX_PASSWORD_LENGTH = 128/);
  assert.match(authValidation, /export function validatePasswordPair/);
});

test("password/email validation logic lives in one shared module, not duplicated per form", () => {
  for (const source of [signUpForm, resetPasswordForm]) {
    assert.match(source, /from "@\/lib\/auth-validation"/);
    assert.match(source, /validatePasswordPair\(/);
    // The constants themselves must not be redefined locally — only imported.
    assert.doesNotMatch(source, /const MIN_PASSWORD_LENGTH/);
    assert.doesNotMatch(source, /const MAX_PASSWORD_LENGTH/);
  }

  for (const source of [signInForm, signUpForm, forgotPasswordForm]) {
    assert.match(source, /EMAIL_PATTERN/);
    assert.doesNotMatch(source, /const emailPattern/);
  }
});

test("forgot-password validates email client-side (server maps malformed email to a generic VALIDATION_ERROR)", () => {
  assert.match(forgotPasswordForm, /EMAIL_PATTERN\.test\(email\)/);
  assert.match(authErrors, /VALIDATION_ERROR: "invalidEmail"/);
});

test("every form maps Better Auth error codes through the shared i18n mapper, not ad hoc strings", () => {
  assert.match(authErrors, /USER_ALREADY_EXISTS/);
  assert.match(authErrors, /INVALID_EMAIL_OR_PASSWORD/);
  assert.match(authErrors, /PASSWORD_TOO_SHORT/);
  assert.match(authErrors, /INVALID_TOKEN/);
  assert.match(authErrors, /TOKEN_EXPIRED/);
  assert.match(authErrors, /export function mapAuthErrorCode/);

  for (const source of [signInForm, signUpForm, forgotPasswordForm, resetPasswordForm]) {
    assert.match(source, /mapAuthErrorCode\(error\.code, copy\.errors\)/);
  }
});

test("forms show a disabled, relabeled submit button while a request is in flight", () => {
  for (const source of [signInForm, signUpForm, forgotPasswordForm, resetPasswordForm]) {
    assert.match(source, /isSubmitting/);
    assert.match(source, /disabled=\{isSubmitting\}/);
  }
});

test("shared primitives are reused, not duplicated, across all 5 flow components", () => {
  for (const source of [
    signInForm,
    signUpForm,
    forgotPasswordForm,
    resetPasswordForm,
    verifyEmailStatus,
  ]) {
    assert.match(source, /from "@\/components\/auth\/auth-form-shell"/);
  }

  for (const source of [signInForm, signUpForm, forgotPasswordForm, resetPasswordForm]) {
    assert.match(source, /from "@\/components\/auth\/auth-field"/);
  }

  assert.match(authField, /aria-invalid=\{error \? "true" : undefined\}/);
  // aria-describedby must reference both the permanent hint and the transient error
  // when both are present, not just the error — see AuthField's `hint` prop.
  assert.match(authField, /aria-describedby=\{describedBy\}/);
  assert.match(authField, /hint \? hintId : null/);
  assert.match(authField, /error \? errorId : null/);
  assert.match(authFormShell, /page-shell auth-page/);
});

test("verify-email reflects session state rather than re-implementing token verification", () => {
  assert.match(verifyEmailStatus, /useSession/);
  assert.match(verifyEmailStatus, /session\.data\.user\.emailVerified/);
  assert.doesNotMatch(verifyEmailStatus, /authClient\.verifyEmail\(/);
});

test("status messages use the same role=alert/role=status convention as the rest of the app", () => {
  for (const source of [signInForm, signUpForm, forgotPasswordForm, resetPasswordForm]) {
    assert.match(source, /className="form-status__error" role="alert"/);
  }

  assert.match(authField, /className="auth-field__error" id=\{errorId\} role="alert"/);
  assert.match(verifyEmailStatus, /className="form-status__success" role="status"/);
  assert.match(verifyEmailStatus, /className="form-status__error" role="alert"/);
});

test("sign-up shows a permanent, localized password composition hint, distinct from the on-submit error", () => {
  assert.match(authField, /className="auth-field__hint" id=\{hintId\}/);
  assert.match(signUpForm, /hint=\{copy\.fields\.passwordHint\}/);
  // The dynamic strength/length validation on submit (isPasswordStrong, validatePasswordPair)
  // stays wired up unchanged — the hint is additive UI, not a replacement for it.
  assert.match(signUpForm, /isPasswordStrong\(password\)/);
  assert.match(signUpForm, /validatePasswordPair\(password, confirmPassword\)/);
});

test("resend-verification and sign-out check the actual response instead of assuming success", () => {
  assert.match(verifyEmailStatus, /const \{ error \} = await authClient\.sendVerificationEmail/);
  assert.match(verifyEmailStatus, /if \(error\) \{/);
  assert.match(verifyEmailStatus, /mapAuthErrorCode\(error\.code, copy\.errors\)/);

  assert.match(accountMenu, /const \{ error \} = await authClient\.signOut\(\)/);
  assert.match(accountMenu, /if \(error\) \{/);
});
