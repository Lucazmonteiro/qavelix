import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Same constraint as entitlements-source.test.mjs: these modules use real "@/" value
// aliases and/or next/headers, which Node's native TS loader can't resolve outside the
// Next.js build. We test the real committed source directly instead of a hand-copied
// duplicate that could drift — the actual runtime behavior (webhook signature
// verification, checkout creation, subscription lifecycle sync, billing portal) was
// separately verified end-to-end against live Stripe test-mode data and the real Neon
// dev database this session (customer creation, checkout session creation, subscription
// created -> pro, pending-cancel -> stays pro, full delete -> free, billing portal URL).
const schema = await readFile("src/lib/server/db/schema.ts", "utf8");
const envServer = await readFile("src/env/server.ts", "utf8");
const stripeClientModule = await readFile("src/lib/server/stripe-client.ts", "utf8");
const authModule = await readFile("src/lib/server/auth/auth.ts", "utf8");
const authClientModule = await readFile("src/lib/auth-client.ts", "utf8");
const billingModule = await readFile("src/lib/server/billing.ts", "utf8");
const entitlementsService = await readFile("src/lib/server/entitlements/service.ts", "utf8");
const planActions = await readFile("src/components/dashboard/plan-actions.tsx", "utf8");
const billingPortalButton = await readFile("src/components/dashboard/billing-portal-button.tsx", "utf8");
const upgradeModal = await readFile("src/components/upgrade-modal.tsx", "utf8");
const emailVerificationBanner = await readFile(
  "src/components/dashboard/email-verification-banner.tsx",
  "utf8",
);
const planPage = await readFile("src/app/[locale]/dashboard/plan/page.tsx", "utf8");
const billingPage = await readFile("src/app/[locale]/dashboard/billing/page.tsx", "utf8");
const nextConfig = await readFile("next.config.ts", "utf8");

test("Stripe env vars are optional, validated by real-shaped regex (not just prefix), and never required for the app to boot", () => {
  const secretKeyMatch = envServer.match(/STRIPE_SECRET_KEY: z\.string\(\)\.regex\((\/.*?\/)\)\.optional\(\)/);
  const webhookSecretMatch = envServer.match(
    /STRIPE_WEBHOOK_SECRET: z\.string\(\)\.regex\((\/.*?\/)\)\.optional\(\)/,
  );
  const priceIdMatch = envServer.match(
    /STRIPE_PRO_MONTHLY_PRICE_ID: z\.string\(\)\.regex\((\/.*?\/)\)\.optional\(\)/,
  );

  assert.ok(secretKeyMatch, "STRIPE_SECRET_KEY should be regex-validated");
  assert.ok(webhookSecretMatch, "STRIPE_WEBHOOK_SECRET should be regex-validated");
  assert.ok(priceIdMatch, "STRIPE_PRO_MONTHLY_PRICE_ID should be regex-validated");

  const secretKeyPattern = new RegExp(secretKeyMatch[1].slice(1, -1));
  const webhookSecretPattern = new RegExp(webhookSecretMatch[1].slice(1, -1));
  const priceIdPattern = new RegExp(priceIdMatch[1].slice(1, -1));

  // Accepts real-shaped test AND live values — neither mode is preferred structurally.
  assert.match("sk_test_" + "a".repeat(24), secretKeyPattern);
  assert.match("sk_live_" + "a".repeat(24), secretKeyPattern);
  assert.match("whsec_" + "a".repeat(24), webhookSecretPattern);
  assert.match("price_" + "a".repeat(24), priceIdPattern);

  // Rejects obvious placeholders/typos that a bare startsWith() would have let through.
  assert.doesNotMatch("sk_test_", secretKeyPattern);
  assert.doesNotMatch("sk_", secretKeyPattern);
  assert.doesNotMatch("sk_test_short", secretKeyPattern);
  assert.doesNotMatch("whsec_xxx", webhookSecretPattern);
  assert.doesNotMatch("price_xxx", priceIdPattern);
});

test("Stripe config fails fast on a partially-set combination instead of silently disabling billing", () => {
  assert.match(envServer, /configuredStripeVars\.length > 0 && configuredStripeVars\.length < 3/);
  assert.match(envServer, /only partially configured/);
});

test("a genuine public production deployment cannot silently run on a Stripe test-mode key", () => {
  const productionStripeCheck = envServer.slice(envServer.indexOf("// A genuine public production"));
  assert.match(productionStripeCheck, /value\.NODE_ENV === "production"/);
  assert.match(productionStripeCheck, /!isLocalAppUrl/);
  assert.match(productionStripeCheck, /value\.STRIPE_SECRET_KEY\?\.startsWith\("sk_test_"\)/);
  // The documented local NODE_ENV=production + localhost verification workflow must stay
  // unaffected — the same isLocalAppUrl escape hatch NEXT_PUBLIC_SUPPORT_EMAIL's own check
  // above already relies on, not a second, differently-scoped condition.
  assert.match(envServer, /const isLocalAppUrl = localProductionHosts\.has\(appUrl\.hostname\);/);
});

test("Stripe client is a lazy globalThis-anchored singleton, matching getDb()/getAuth()'s existing pattern", () => {
  assert.match(stripeClientModule, /export function getStripeClient\(\): Stripe \| null/);
  assert.match(stripeClientModule, /if \(!env\.STRIPE_SECRET_KEY\) \{\s*return null;/);
  assert.match(stripeClientModule, /globalThis as StripeGlobal/);
  assert.match(stripeClientModule, /if \(!stripeGlobal\.__qavelixStripe\) \{/);
});

test("the Stripe plugin is fully optional: absent unless all three env vars are configured", () => {
  assert.match(
    authModule,
    /if \(!stripeClient \|\| !env\.STRIPE_WEBHOOK_SECRET \|\| !env\.STRIPE_PRO_MONTHLY_PRICE_ID\) \{\s*return null;/,
  );
  assert.match(authModule, /plugins: stripePlugin \? \[stripePlugin\] : \[\]/);
  assert.match(authModule, /createCustomerOnSignUp: true/);
});

test("the Pro plan definition reuses the configured price id, not a hardcoded literal", () => {
  const planBlock = authModule.slice(authModule.indexOf("plans: ["), authModule.indexOf("onSubscriptionCreated"));
  assert.match(planBlock, /name: "pro"/);
  assert.match(planBlock, /priceId: env\.STRIPE_PRO_MONTHLY_PRICE_ID/);
  assert.doesNotMatch(authModule, /priceId: "price_/);
});

test("only active/trialing subscriptions grant Pro — every other status reverts to Free, covering renewal failure", () => {
  assert.match(
    authModule,
    /const isProActive = subscription\.status === "active" \|\| subscription\.status === "trialing";/,
  );
  assert.match(authModule, /await setUserPlan\(subscription\.referenceId, isProActive \? "pro" : "free"\);/);

  // Both creation and every update (renewal success, renewal failure, any status
  // transition) go through the same status-driven rule.
  assert.match(authModule, /onSubscriptionCreated: async \(\{ subscription \}\) => \{\s*await syncPlanFromSubscription\(subscription\);/);
  assert.match(authModule, /onSubscriptionUpdate: async \(\{ subscription \}\) => \{\s*await syncPlanFromSubscription\(subscription\);/);
});

test("deleting a subscription always downgrades to Free, regardless of its last status", () => {
  assert.match(
    authModule,
    /onSubscriptionDeleted: async \(\{ subscription \}\) => \{\s*await setUserPlan\(subscription\.referenceId, "free"\);/,
  );
});

test("a pending cancellation (cancel_at_period_end) does NOT downgrade the user immediately", () => {
  const cancelHandler = authModule.slice(authModule.indexOf("onSubscriptionCancel:"));
  assert.doesNotMatch(cancelHandler, /setUserPlan/);
  assert.match(cancelHandler, /logSecurityEvent\("info", "stripe_subscription_pending_cancel"/);
});

test("setUserPlan() rethrows on failure so Stripe retries webhook delivery, unlike confirmUsage/releaseUsage's swallow-on-error", () => {
  const setUserPlanBody = entitlementsService.slice(
    entitlementsService.indexOf("export async function setUserPlan"),
  );
  assert.match(setUserPlanBody, /\.onConflictDoUpdate\(\{\s*target: userEntitlement\.userId,/);
  assert.match(setUserPlanBody, /catch \(error\) \{[\s\S]*?throw error;\s*\}/);
});

test("database schema's subscription table matches @better-auth/stripe's own expected shape exactly", () => {
  assert.match(schema, /export const subscription = pgTable\("subscription", \{/);
  const subscriptionBlock = schema.slice(
    schema.indexOf('export const subscription = pgTable("subscription"'),
  );
  for (const column of [
    "plan",
    "referenceId",
    "stripeCustomerId",
    "stripeSubscriptionId",
    "status",
    "periodStart",
    "periodEnd",
    "trialStart",
    "trialEnd",
    "cancelAtPeriodEnd",
    "cancelAt",
    "canceledAt",
    "endedAt",
    "seats",
    "billingInterval",
    "stripeScheduleId",
  ]) {
    assert.match(subscriptionBlock, new RegExp(`${column}:`), `subscription table missing column ${column}`);
  }
  assert.match(subscriptionBlock, /status: text\("status"\)\.notNull\(\)\.default\("incomplete"\)/);

  assert.match(schema, /stripeCustomerId: text\("stripe_customer_id"\),/);

  // Still no Stripe billing tables beyond what the plugin itself requires — no invoice/
  // payment/checkout-session tables, matching the explicit exclusion list for this
  // milestone.
  assert.doesNotMatch(schema, /pgTable\(\s*"(invoice|payment|checkout_session)/i);
});

test("Next's proxy body-size limit still resolves via a relative import inside policy.ts (build-time constraint, not a general convention change)", () => {
  assert.match(nextConfig, /proxyClientMaxBodySize:\s*PRO_MAX_UPLOAD_REQUEST_BYTES/);
});

test("billing helpers fail safe (null), never fabricate a price or subscription detail", () => {
  assert.match(billingModule, /export function isBillingConfigured\(\): boolean/);
  assert.match(
    billingModule,
    /Boolean\(env\.STRIPE_SECRET_KEY && env\.STRIPE_WEBHOOK_SECRET && env\.STRIPE_PRO_MONTHLY_PRICE_ID\)/,
  );

  const priceFn = billingModule.slice(
    billingModule.indexOf("export async function getProMonthlyPriceDisplay"),
    billingModule.indexOf("export async function getProMonthlyPriceDisplay") + 900,
  );
  assert.match(priceFn, /stripeClient\.prices\.retrieve\(env\.STRIPE_PRO_MONTHLY_PRICE_ID\)/);
  assert.match(priceFn, /Intl\.NumberFormat\(locale, \{/);
  assert.doesNotMatch(priceFn, /9\.99|999/); // never a hardcoded duplicate of the real price

  const subscriptionFn = billingModule.slice(
    billingModule.indexOf("export async function getActiveSubscriptionDetail"),
  );
  assert.match(subscriptionFn, /catch \(error\) \{[\s\S]*?return null;\s*\}/);
});

test("the auth client registers the Stripe subscription client plugin", () => {
  assert.match(authClientModule, /from "@better-auth\/stripe\/client"/);
  assert.match(authClientModule, /stripeClient\(\{ subscription: true \}\)/);
});

test("checkout/portal actions call the real Better Auth client methods, never fetch a hand-rolled endpoint", () => {
  // Milestone: Stripe/entitlement audit — the actual authClient.subscription.upgrade()
  // call moved into one shared helper (startProUpgradeCheckout, auth-client.ts) reused by
  // both the Plan page's upgrade button and the reusable daily-limit upgrade modal, so
  // the plan name and the success destination that drives the activation/welcome flow
  // can never drift between call sites.
  assert.match(authClientModule, /export function startProUpgradeCheckout\(locale: Locale, cancelPath: string\)/);
  assert.match(authClientModule, /authClient\.subscription\.upgrade\(\{/);
  assert.match(authClientModule, /plan: "pro"/);
  assert.match(
    authClientModule,
    /successUrl: `\/\$\{locale\}\/dashboard\/plan\?checkout=success`/,
  );

  assert.match(planActions, /from "@\/lib\/auth-client"/);
  assert.match(planActions, /startProUpgradeCheckout\(locale, "\/dashboard\/plan\?checkout=cancelled"\)/);
  assert.doesNotMatch(planActions, /authClient\.subscription\.upgrade/);
  assert.doesNotMatch(planActions, /STRIPE_SECRET_KEY|sk_test|sk_live/);

  assert.match(billingPortalButton, /authClient\.subscription\.billingPortal\(\{/);
  assert.doesNotMatch(billingPortalButton, /STRIPE_SECRET_KEY|sk_test|sk_live/);
});

test("plan/billing pages fall back to Milestone 4's honest placeholder when Stripe isn't configured", () => {
  assert.match(planPage, /from "@\/lib\/server\/billing"/);
  assert.match(planPage, /billingConfigured \? \(/);
  assert.match(planPage, /from "@\/components\/dashboard\/dashboard-placeholder"/);

  assert.match(billingPage, /if \(!billingConfigured\) \{/);
  assert.match(billingPage, /from "@\/components\/dashboard\/dashboard-placeholder"/);
});

test("the plan page reads real price/subscription data, never a fabricated number", () => {
  assert.match(planPage, /getProMonthlyPriceDisplay\(locale\)/);
  assert.match(planPage, /getActiveSubscriptionDetail\(\)/);
  assert.doesNotMatch(planPage, /9\.99|\$9/);
});

test("checkout success/cancelled banners are driven by the real query param, not a client-side guess", () => {
  assert.match(planPage, /const \{ checkout \} = await searchParams;/);
  assert.match(planPage, /checkout === "success"/);
  assert.match(planPage, /checkout === "cancelled"/);
});

// Email-verification launch requirement: unverified accounts must not be able to start
// checkout or reach the billing portal, but sign-in and every other route stay ungated.
// Checkout is blocked by the Stripe plugin's own built-in option; the billing portal has
// no equivalent option, so auth.ts reproduces the same gate via Better Auth's core
// hooks.before extension point, throwing the identical EMAIL_VERIFICATION_REQUIRED code
// so both surfaces map to one client-side check.
test("checkout requires a verified email via the Stripe plugin's own built-in option", () => {
  const subscriptionBlock = authModule.slice(
    authModule.indexOf("subscription: {"),
    authModule.indexOf("plans: ["),
  );
  assert.match(subscriptionBlock, /requireEmailVerification: true/);

  // Sign-in itself must stay ungated — Better Auth's own core requireEmailVerification
  // option (distinct from the Stripe plugin's) must not appear in emailAndPassword.
  const emailAndPasswordBlock = authModule.slice(
    authModule.indexOf("emailAndPassword: {"),
    authModule.indexOf("emailVerification: {"),
  );
  assert.doesNotMatch(emailAndPasswordBlock, /requireEmailVerification/);
});

test("the billing portal is gated by a hooks.before check, since the plugin has no built-in option for it", () => {
  assert.match(authModule, /from "better-auth\/api"/);
  assert.match(authModule, /createAuthMiddleware\(async \(ctx\) => \{/);
  assert.match(authModule, /ctx\.path !== "\/subscription\/billing-portal"/);
  assert.match(authModule, /getSessionFromCtx\(ctx\)/);
  assert.match(authModule, /session && !session\.user\.emailVerified/);
  assert.match(authModule, /code: "EMAIL_VERIFICATION_REQUIRED"/);
  assert.match(authModule, /hooks: \{\s*before: beforeHook,/);
});

test("checkout/portal UI shows a distinct message for EMAIL_VERIFICATION_REQUIRED, not the generic error", () => {
  for (const source of [planActions, upgradeModal]) {
    assert.match(source, /error\.code === "EMAIL_VERIFICATION_REQUIRED"/);
    assert.match(source, /copy\.emailVerificationRequiredMessage/);
  }

  assert.match(billingPortalButton, /emailVerificationRequiredMessage: string/);
  assert.match(billingPortalButton, /requestError\.code === "EMAIL_VERIFICATION_REQUIRED"/);

  assert.match(planActions, /emailVerificationRequiredMessage=\{copy\.emailVerificationRequiredMessage\}/);
  assert.match(
    billingPage,
    /emailVerificationRequiredMessage=\{planCopy\.emailVerificationRequiredMessage\}/,
  );
});

test("plan/billing pages show a verification banner for unverified sessions, alongside (not instead of) the existing gate", () => {
  assert.match(planPage, /from "@\/components\/dashboard\/email-verification-banner"/);
  assert.match(planPage, /billingConfigured && !session\.user\.emailVerified/);

  assert.match(billingPage, /from "@\/components\/dashboard\/email-verification-banner"/);
  assert.match(billingPage, /await requireSession\(locale, "\/dashboard\/billing"\)/);
  assert.match(billingPage, /!session\.user\.emailVerified/);

  assert.match(emailVerificationBanner, /href=\{`\/\$\{locale\}\/verify-email`\}/);
});
