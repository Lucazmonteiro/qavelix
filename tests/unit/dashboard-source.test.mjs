import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sessionHelper = await readFile("src/lib/server/auth/session.ts", "utf8");
const dashboardLayout = await readFile("src/app/[locale]/dashboard/layout.tsx", "utf8");
const dashboardPage = await readFile("src/app/[locale]/dashboard/page.tsx", "utf8");
const usagePage = await readFile("src/app/[locale]/dashboard/usage/page.tsx", "utf8");
const planPage = await readFile("src/app/[locale]/dashboard/plan/page.tsx", "utf8");
const billingPage = await readFile("src/app/[locale]/dashboard/billing/page.tsx", "utf8");
const settingsPage = await readFile("src/app/[locale]/dashboard/settings/page.tsx", "utf8");
const dashboardShell = await readFile("src/components/dashboard/dashboard-shell.tsx", "utf8");
const dashboardNav = await readFile("src/components/dashboard/dashboard-nav.tsx", "utf8");
const accountSummaryCard = await readFile(
  "src/components/dashboard/account-summary-card.tsx",
  "utf8",
);
const toolQuickLinks = await readFile("src/components/dashboard/tool-quick-links.tsx", "utf8");
const dashboardPlaceholder = await readFile(
  "src/components/dashboard/dashboard-placeholder.tsx",
  "utf8",
);
const signInPage = await readFile("src/app/[locale]/sign-in/page.tsx", "utf8");
const signUpPage = await readFile("src/app/[locale]/sign-up/page.tsx", "utf8");
const signInForm = await readFile("src/components/auth/sign-in-form.tsx", "utf8");
const accountMenu = await readFile("src/components/account-menu.tsx", "utf8");
const localeContext = await readFile("src/i18n/locale-context.tsx", "utf8");

test("dashboard layout gates every route under /dashboard server-side, not client-side", () => {
  assert.match(dashboardLayout, /from "@\/lib\/server\/auth\/session"/);
  assert.match(dashboardLayout, /await requireSession\(locale, "\/dashboard"\)/);
  assert.doesNotMatch(dashboardLayout, /"use client"/);
});

test("requireSession() redirects unauthenticated visitors to a localized sign-in with a callback", () => {
  assert.match(sessionHelper, /export async function requireSession/);
  assert.match(sessionHelper, /if \(!session\) \{/);
  assert.match(sessionHelper, /`\/\$\{locale\}\/sign-in\?callbackURL=/);
  assert.match(sessionHelper, /redirect\(signInUrl as Route\)/);
});

test("sanitizeCallbackPath is a real allowlist, not a blocklist, and only accepts an internal /dashboard path", () => {
  // Extract the real pattern from the source (not a hand-copied duplicate that could
  // drift out of sync with the actual implementation) and test real behavior against it.
  const patternMatch = sessionHelper.match(
    /const SAFE_CALLBACK_PATTERN = (\/.*\/);/,
  );

  assert.ok(patternMatch, "SAFE_CALLBACK_PATTERN should be defined as a regex literal");

  const pattern = new RegExp(patternMatch[1].slice(1, -1));

  // Safe: internal, locale-prefixed dashboard paths.
  assert.match("/en/dashboard", pattern);
  assert.match("/pt-BR/dashboard", pattern);
  assert.match("/en/dashboard/billing", pattern);

  // Unsafe: open-redirect vectors and anything outside /dashboard.
  assert.doesNotMatch("//evil.com", pattern);
  assert.doesNotMatch("https://evil.com", pattern);
  assert.doesNotMatch("/en", pattern);
  assert.doesNotMatch("/en/sign-in", pattern);
  assert.doesNotMatch("javascript:alert(1)", pattern);
  assert.doesNotMatch("/en/dashboard/../../etc/passwd", pattern);
});

test("sign-in reads and sanitizes the callbackURL query param before ever trusting it", () => {
  assert.match(signInPage, /from "@\/lib\/server\/auth\/session"/);
  assert.match(signInPage, /sanitizeCallbackPath\(/);
  assert.match(signInPage, /callbackURL\?: string \| string\[\]/);
  assert.match(signInPage, /<SignInForm callbackURL=\{callbackURL\} \/>/);
});

test("sign-up also threads a sanitized callbackURL through, for the sign-in <-> sign-up cross-link case", () => {
  assert.match(signUpPage, /sanitizeCallbackPath\(/);
  assert.match(signUpPage, /<SignUpForm callbackURL=\{callbackURL\} \/>/);
});

test("sign-in redirects to the callback on success, not always the locale home", () => {
  assert.match(signInForm, /router\.push\(\(callbackURL \?\? `\/\$\{locale\}`\) as Route\)/);
});

test("dashboard overview renders real authenticated session data, not placeholders", () => {
  assert.match(dashboardPage, /const session = await requireSession/);
  assert.match(dashboardPage, /session\.user\.email/);
  assert.match(dashboardPage, /session\.user\.emailVerified/);
  assert.match(dashboardPage, /session\.user\.name/);

  assert.match(accountSummaryCard, /email: string/);
  assert.match(accountSummaryCard, /emailVerified: boolean/);
});

test("account summary shows the real entitlement plan (Milestone 4), not a hardcoded label", () => {
  // Milestone 3 rendered a static "Free account" placeholder. Milestone 4 replaces it with
  // the real plan looked up server-side via getPlan() — the component takes plan as a prop
  // rather than deriving it itself, keeping entitlement lookups out of presentational code.
  assert.match(dashboardPage, /from "@\/lib\/server\/entitlements\/service"/);
  assert.match(dashboardPage, /const plan = await getPlan\(session\.user\.id\)/);
  assert.match(dashboardPage, /<AccountSummaryCard[\s\S]*?plan=\{plan\}/);

  assert.match(accountSummaryCard, /plan: PlanType/);
  assert.match(accountSummaryCard, /plan === "pro" \? copy\.proAccountLabel : copy\.freeAccountLabel/);
  assert.doesNotMatch(accountSummaryCard, /\$\d/); // no hardcoded price
});

test("no fake billing numbers exist anywhere in the dashboard", () => {
  // Usage/plan pages legitimately render byte sizes and counts, but only ever through
  // formatBytes()/dictionary interpolation at runtime — never a literal hardcoded number
  // in the source itself. Billing/settings stay untouched honest placeholders.
  for (const source of [dashboardPage, accountSummaryCard, dashboardPlaceholder, billingPage]) {
    assert.doesNotMatch(source, /\b\d+(\.\d+)?\s*(GB|MB|KB)\b/i);
    assert.doesNotMatch(source, /\$\d/);
  }
  assert.doesNotMatch(usagePage, /\$\d/);
  assert.doesNotMatch(planPage, /\$\d/);
});

test("tool quick links point at the real existing tool routes", () => {
  assert.match(toolQuickLinks, /href: `\/\$\{locale\}`/);
  assert.match(toolQuickLinks, /href: `\/\$\{locale\}\/tools\/extract-audio`/);
});

test("usage and plan pages render real server-computed entitlement data (Milestone 4), not placeholders", () => {
  assert.match(usagePage, /const session = await requireSession/);
  assert.match(usagePage, /from "@\/lib\/server\/entitlements\/service"/);
  assert.match(usagePage, /checkEntitlement\(actor, toolId\)/);
  assert.match(usagePage, /copy\.unavailableMessage/); // honest state when the check fails
  assert.doesNotMatch(usagePage, /from "@\/components\/dashboard\/dashboard-placeholder"/);

  assert.match(planPage, /const session = await requireSession/);
  assert.match(planPage, /from "@\/lib\/server\/entitlements\/service"/);
  assert.match(planPage, /getToolLimits\(plan, toolId\)/);
  // The Upgrade block is still a placeholder — no checkout button, no Stripe SDK/import.
  assert.match(planPage, /from "@\/components\/dashboard\/dashboard-placeholder"/);
  assert.doesNotMatch(planPage, /from "stripe"/i);
  assert.doesNotMatch(planPage, /<button/i);
});

test("billing and settings remain honest 'coming soon' placeholders (out of Milestone 4's scope)", () => {
  for (const page of [billingPage, settingsPage]) {
    assert.match(page, /from "@\/components\/dashboard\/dashboard-placeholder"/);
    assert.match(page, /comingSoonBadge/);
    assert.doesNotMatch(page, /requireSession/); // layout already gates this segment
  }
});

test("dashboard nav uses aria-current, not a bespoke active-class toggle, for the current page", () => {
  assert.match(dashboardNav, /"use client"/);
  assert.match(dashboardNav, /usePathname/);
  assert.match(dashboardNav, /aria-current=\{isActive \? "page" : undefined\}/);
  assert.match(dashboardNav, /aria-label=\{copy\.navLabel\}/);
});

test("dashboard shell is a server component composing the client nav, not a client component itself", () => {
  assert.doesNotMatch(dashboardShell, /"use client"/);
  assert.match(dashboardShell, /from "@\/components\/dashboard\/dashboard-nav"/);
  assert.match(dashboardShell, /page-shell dashboard-shell/);
});

test("account menu links to the dashboard for a signed-in visitor", () => {
  assert.match(accountMenu, /href=\{`\/\$\{locale\}\/dashboard`\}/);
  assert.match(accountMenu, /copy\.accountMenu\.dashboardLabel/);
});

test("locale switching preserves the current path (dashboard included), never forces a redirect to home", () => {
  // This is the existing Milestone-1-era mechanism the dashboard relies on rather than
  // reimplementing — it rewrites only the locale segment of whatever the current path
  // is, so it already covers /dashboard/* with zero dashboard-specific code.
  assert.match(localeContext, /function replaceLocaleInPath/);
  assert.match(localeContext, /segments\[1\] = nextLocale/);
  assert.doesNotMatch(localeContext, /window\.location\.href = `\/\$\{nextLocale\}`/);
});
