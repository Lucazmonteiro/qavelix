import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// These components import real "@/" value aliases (auth-client, locale-context) that
// Node's native TS loader can't resolve outside the Next.js build.
const profileForm = await readFile("src/components/dashboard/profile-settings-form.tsx", "utf8");
const passwordForm = await readFile("src/components/dashboard/password-settings-form.tsx", "utf8");
const languageLinks = await readFile("src/components/dashboard/language-settings-links.tsx", "utf8");
const signOutButton = await readFile("src/components/dashboard/settings-sign-out-button.tsx", "utf8");
const themeToggle = await readFile("src/components/theme-toggle.tsx", "utf8");
const sessionHelper = await readFile("src/lib/server/auth/session.ts", "utf8");
const schemaSource = await readFile("src/lib/server/db/schema.ts", "utf8");

test("profile form updates only the real, safely-editable name field through Better Auth's own updateUser", () => {
  assert.match(profileForm, /authClient\.updateUser\(\{ name: trimmedName \}\)/);
  // Email is rendered read-only, never submitted as an editable field — the note
  // explains why rather than silently doing nothing.
  assert.match(profileForm, /<input disabled id="settings-email" type="email" value=\{email\} \/>/);
  assert.match(profileForm, /copy\.emailReadOnlyNote/);
  // No stale data after save: the server-rendered parts of the page (e.g. account menu's
  // "signed in as") get a fresh render once the client-side session cache updates.
  assert.match(profileForm, /router\.refresh\(\)/);
  // Duplicate-submission guard.
  assert.match(profileForm, /if \(isSaving\) \{\s*\n\s*return;/);
});

test("password form uses Better Auth's official change-password flow and validates before submitting", () => {
  assert.match(
    passwordForm,
    /authClient\.changePassword\(\{\s*\n\s*currentPassword,\s*\n\s*newPassword,\s*\n\s*revokeOtherSessions: false,\s*\n\s*\}\)/,
  );
  assert.match(passwordForm, /newPassword\.length < MIN_PASSWORD_LENGTH/);
  assert.match(passwordForm, /newPassword\.length > MAX_PASSWORD_LENGTH/);
  assert.match(passwordForm, /newPassword !== confirmPassword/);
  assert.match(passwordForm, /maxLength=\{MAX_PASSWORD_LENGTH\}/);
  assert.match(passwordForm, /if \(isSaving\) \{\s*\n\s*return;/);
});

test("settings page only renders the password form when the account actually has a password to change", () => {
  assert.match(sessionHelper, /export async function hasPasswordCredential/);
  assert.match(sessionHelper, /eq\(account\.providerId, "credential"\)/);
  assert.match(sessionHelper, /isNotNull\(account\.password\)/);
  // The underlying schema comment this check relies on.
  assert.match(schemaSource, /Hashed credential password when providerId = "credential"\. Null for OAuth accounts\./);
});

test("language settings links are real navigation, reusing the same segment-swap the header's language selector uses", () => {
  assert.match(languageLinks, /import \{ replaceLocaleInPath \} from "@\/i18n\/locale-context"/);
  assert.match(languageLinks, /href=\{replaceLocaleInPath\(pathname, locale\)\}/);
  // No client-side navigation interception (unlike LanguageSelector's homepage/tool-page
  // fast path) — plain links, real page loads, so the settings page just renders again
  // server-side in the new locale.
  assert.doesNotMatch(languageLinks, /preventDefault/);
  assert.doesNotMatch(languageLinks, /switchLocale/);
});

test("settings sign-out uses the exact same authClient.signOut() flow as the header account menu", () => {
  assert.match(signOutButton, /authClient\.signOut\(\)/);
  assert.match(signOutButton, /router\.push\(`\/\$\{locale\}`\)/);
  assert.match(signOutButton, /router\.refresh\(\)/);
});

test("ThemeToggle supports only light/dark and is reused as-is by the settings page (no duplicate theme control)", () => {
  assert.match(themeToggle, /type ThemeMode = "light" \| "dark"/);
  assert.doesNotMatch(themeToggle, /"system"/);
  assert.match(themeToggle, /const modes: ThemeMode\[\] = \["light", "dark"\]/);
  assert.match(themeToggle, /variant\?: "compact" \| "expanded"/);
});
