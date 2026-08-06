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

test("sanitizeCallbackPath is a real allowlist, not a blocklist, and only accepts dashboard/homepage/extract-audio", () => {
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
  // Safe: the two tool pages the plan-comparison modal can be shown on, so an anonymous
  // visitor who signs up from a usage-limit block returns to what they were doing.
  assert.match("/en", pattern);
  assert.match("/pt-BR", pattern);
  assert.match("/en/tools/extract-audio", pattern);
  assert.match("/es/tools/extract-audio", pattern);
  // Safe: the email-verification proxy route's own callback destination.
  assert.match("/en/verify-email", pattern);
  assert.match("/pt-BR/verify-email", pattern);
  assert.match("/es/verify-email", pattern);
  // Safe: the one exact, literal checkout-intent suffix, only on /verify-email.
  assert.match("/en/verify-email?intent=checkout_pro", pattern);
  assert.match("/pt-BR/verify-email?intent=checkout_pro", pattern);

  // Unsafe: the intent suffix is a closed allowlist, not a general query-string
  // allowance — no other value, path, or shape is accepted.
  assert.doesNotMatch("/en/verify-email?intent=something_else", pattern);
  assert.doesNotMatch("/en/dashboard?intent=checkout_pro", pattern);
  assert.doesNotMatch("/en/verify-email?intent=checkout_pro&extra=1", pattern);

  // Unsafe: open-redirect vectors and anything outside this fixed set.
  assert.doesNotMatch("//evil.com", pattern);
  assert.doesNotMatch("https://evil.com", pattern);
  assert.doesNotMatch("/en/sign-in", pattern);
  assert.doesNotMatch("/en/about", pattern);
  assert.doesNotMatch("/en/tools/video-compressor", pattern);
  assert.doesNotMatch("javascript:alert(1)", pattern);
  assert.doesNotMatch("/en/dashboard/../../etc/passwd", pattern);
  assert.doesNotMatch("/en/tools/extract-audio/../../etc/passwd", pattern);
  assert.doesNotMatch("/en/verify-email/../../etc/passwd", pattern);
});

test("sign-in reads and sanitizes the callbackURL query param before ever trusting it", () => {
  assert.match(signInPage, /from "@\/lib\/server\/auth\/session"/);
  assert.match(signInPage, /sanitizeCallbackPath\(/);
  assert.match(signInPage, /callbackURL\?: string \| string\[\]/);
  assert.match(signInPage, /<SignInForm callbackURL=\{callbackURL\} \/>/);
});

test("sign-up also threads a sanitized callbackURL through, for the sign-in <-> sign-up cross-link case", () => {
  assert.match(signUpPage, /sanitizeCallbackPath\(/);
  assert.match(signUpPage, /<SignUpForm callbackURL=\{callbackURL\} intent=\{intent\} \/>/);
});

test("sign-up narrows the intent query param to a fixed literal before trusting it", () => {
  assert.match(signUpPage, /intent\?: string \| string\[\]/);
  assert.match(
    signUpPage,
    /=== "checkout_pro"\s*\n\s*\? "checkout_pro"\s*\n\s*: null/,
  );
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

test("the Unverified badge is a real link to the verification flow, not just a status label", () => {
  assert.match(dashboardPage, /locale=\{locale\}/);
  assert.match(accountSummaryCard, /locale: string/);
  assert.match(
    accountSummaryCard,
    /<a className="dashboard-status dashboard-status--warning" href=\{`\/\$\{locale\}\/verify-email`\}>/,
  );
  // The verified state stays a plain status badge, not a link.
  assert.match(
    accountSummaryCard,
    /<span className="dashboard-status dashboard-status--positive">\s*\{copy\.verifiedLabel\}/,
  );
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
  // Milestone: Stripe/entitlement audit — the Plan page compares both tiers side by
  // side (not just the current plan's limits), so both calls appear explicitly rather
  // than a single getToolLimits(plan, toolId).
  assert.match(planPage, /getToolLimits\("free", toolId\)/);
  assert.match(planPage, /getToolLimits\("pro", toolId\)/);
  // The Upgrade block still falls back to the honest placeholder when Stripe isn't
  // configured — no checkout button is ever shown pointing at a route that doesn't exist.
  assert.match(planPage, /from "@\/components\/dashboard\/dashboard-placeholder"/);
  assert.doesNotMatch(planPage, /from "stripe"/i);
});

test("billing remains an honest 'coming soon' placeholder when Stripe isn't configured", () => {
  assert.match(billingPage, /from "@\/components\/dashboard\/dashboard-placeholder"/);
  assert.match(billingPage, /comingSoonBadge/);
});

// Improvement 3: settings is a real, functional page now — profile (name edit,
// read-only email), appearance (reuses ThemeToggle), language (reuses
// replaceLocaleInPath), a conditional password-change section, sign-out, and a link to
// Billing. No DashboardPlaceholder, no fake/decorative controls, no account deletion
// (deliberately deferred — see the page's own comment on why).
test("settings is a real functional page, not a placeholder", () => {
  assert.doesNotMatch(settingsPage, /from "@\/components\/dashboard\/dashboard-placeholder"/);
  assert.match(settingsPage, /await requireSession\(locale, "\/dashboard"\)/);
  assert.match(settingsPage, /hasPasswordCredential\(session\.user\.id\)/);
  assert.match(settingsPage, /from "@\/components\/dashboard\/profile-settings-form"/);
  assert.match(settingsPage, /from "@\/components\/dashboard\/password-settings-form"/);
  assert.match(settingsPage, /from "@\/components\/dashboard\/language-settings-links"/);
  assert.match(settingsPage, /from "@\/components\/dashboard\/settings-sign-out-button"/);
  assert.match(settingsPage, /from "@\/components\/theme-toggle"/);
  assert.match(settingsPage, /canChangePassword \?/);
  assert.match(settingsPage, /href=\{`\/\$\{locale\}\/dashboard\/billing`\}/);
  // No account-deletion UI — explicitly deferred, not silently missing.
  assert.doesNotMatch(settingsPage, /delete.*account/i);
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

test("the Billing nav item only renders for a Pro plan, resolved server-side by the layout, not fetched client-side", () => {
  // Resolved once, server-side, at the layout boundary that already gates every
  // /dashboard/* route via requireSession() — never a second client-side fetch inside
  // DashboardNav itself, which would risk a flash of the link before it resolves.
  assert.match(dashboardLayout, /from "@\/lib\/server\/entitlements\/service"/);
  assert.match(dashboardLayout, /const plan = await getPlan\(session\.user\.id\)/);
  assert.match(dashboardLayout, /<DashboardShell dictionary=\{dictionary\} locale=\{locale\} plan=\{plan\}>/);

  assert.match(dashboardShell, /plan: PlanType/);
  assert.match(dashboardShell, /<DashboardNav dictionary=\{dictionary\} locale=\{locale\} plan=\{plan\} \/>/);

  assert.doesNotMatch(dashboardNav, /"use client";[\s\S]*fetch\("\/api\/entitlements/);
  assert.match(dashboardNav, /plan: PlanType/);
  assert.match(
    dashboardNav,
    /\.\.\.\(plan === "pro" \? \[\{ href: `\/\$\{locale\}\/dashboard\/billing`, label: copy\.billing \}\] : \[\]\)/,
  );
});

test("the billing page redirects a non-Pro actor to the Plan page before any billing content renders", () => {
  assert.match(billingPage, /from "@\/lib\/server\/entitlements\/service"/);
  assert.match(billingPage, /const plan = await getPlan\(session\.user\.id\)/);
  assert.match(
    billingPage,
    /if \(plan !== "pro"\) \{\s*\n\s*redirect\(`\/\$\{locale\}\/dashboard\/plan` as Route\);\s*\n\s*\}/,
  );
  // The plan check happens before isBillingConfigured() is even called — independent of
  // Stripe configuration, always the first gate after requireSession().
  const planCheckIndex = billingPage.indexOf("if (plan !== \"pro\")");
  const billingConfiguredCallIndex = billingPage.indexOf(
    "const billingConfigured = isBillingConfigured();",
  );
  assert.ok(planCheckIndex > 0 && billingConfiguredCallIndex > planCheckIndex);
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
