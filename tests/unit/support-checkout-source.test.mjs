import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  isValidContributionCents,
  MAX_CONTRIBUTION_CENTS,
  MIN_CONTRIBUTION_CENTS,
  SUGGESTED_CONTRIBUTION_AMOUNTS_CENTS,
} from "../../src/lib/contribution-amounts.ts";

// The route itself imports real "@/" value aliases (next/headers via session.ts,
// getStripeClient, drizzle) that Node's native TS loader can't resolve outside the
// Next.js build — asserted against the real committed source directly, same convention
// as every other server-route test in this suite.
const route = await readFile("src/app/api/support/checkout/route.ts", "utf8");
const form = await readFile("src/components/support-checkout-form.tsx", "utf8");
const successPage = await readFile("src/app/[locale]/support/success/page.tsx", "utf8");

test("contribution amount bounds: below/at/above the min and max are correctly classified", () => {
  assert.equal(isValidContributionCents(MIN_CONTRIBUTION_CENTS - 1), false);
  assert.equal(isValidContributionCents(MIN_CONTRIBUTION_CENTS), true);
  assert.equal(isValidContributionCents(MAX_CONTRIBUTION_CENTS), true);
  assert.equal(isValidContributionCents(MAX_CONTRIBUTION_CENTS + 1), false);
  // Never a float — a fractional cent amount must be rejected even inside the range.
  assert.equal(isValidContributionCents(500.5), false);
  for (const amount of SUGGESTED_CONTRIBUTION_AMOUNTS_CENTS) {
    assert.equal(isValidContributionCents(amount), true, `suggested amount ${amount} must be valid`);
  }
});

test("checkout route validates the amount server-side using the same shared bounds, never trusting the client beyond shape", () => {
  assert.match(route, /import \{ isValidContributionCents \} from "@\/lib\/contribution-amounts"/);
  assert.match(route, /typeof amount !== "number" \|\| !isValidContributionCents\(amount\)/);
  // isValidContributionCents() itself requires a safe integer — asserted directly
  // against contribution-amounts.ts, the one place that check lives.
  assert.match(route, /const CONTRIBUTION_CURRENCY = "usd";/);
  assert.doesNotMatch(route, /body\.currency/);
});

test("the shared bounds helper itself rejects non-integer and non-finite amounts", () => {
  assert.equal(isValidContributionCents(Number.NaN), false);
  assert.equal(isValidContributionCents(Number.POSITIVE_INFINITY), false);
  assert.equal(isValidContributionCents(1000.1), false);
});

test("checkout route creates a one-time payment-mode session, distinct from the Pro subscription price", () => {
  assert.match(route, /mode: "payment"/);
  assert.match(route, /price_data: \{/);
  // Never the recurring Pro price id — an inline product/price for the contribution
  // amount instead, so it can never accidentally reuse or collide with the Pro plan.
  assert.doesNotMatch(route, /STRIPE_PRO_MONTHLY_PRICE_ID/);
  assert.match(route, /metadata: \{\s*\n\s*type: "qavelix_contribution",/);
});

test("checkout route never grants any entitlement, plan, or usage benefit", () => {
  assert.doesNotMatch(route, /setUserPlan|reserveUsage|confirmUsage|userEntitlement|usageCounter/);
});

test("checkout route associates a signed-in contributor's existing Stripe Customer, but never requires signing in", () => {
  assert.match(route, /const session = await getOptionalSession\(\);/);
  assert.match(route, /customer: stripeCustomerId/);
  // No branch that rejects or redirects an anonymous request — session is optional
  // throughout, only used to look up an existing customer id if present.
  assert.doesNotMatch(route, /if \(!session\) \{\s*\n\s*return jsonError/);
});

test("checkout is idempotent against duplicate submissions", () => {
  assert.match(route, /idempotencyKey: `qavelix-contribution-\$\{security\.requestId\}`/);
});

test("client form sends integer cents to the server, which returns the real Checkout URL to redirect to", () => {
  assert.match(form, /Math\.round\(dollars \* 100\)/);
  assert.match(form, /fetch\("\/api\/support\/checkout"/);
  assert.match(form, /window\.location\.href = payload\.url;/);
  // No Stripe SDK/publishable key import — Checkout Session creation is entirely
  // server-side; this component only ever POSTs an amount and redirects to whatever URL
  // the server hands back.
  assert.doesNotMatch(form, /@stripe|loadStripe|pk_/);
});

test("success page verifies payment server-side against Stripe, never trusting the redirect alone", () => {
  assert.match(successPage, /stripeClient\.checkout\.sessions\.retrieve\(sessionId\)/);
  assert.match(successPage, /session\.payment_status !== "paid"/);
  assert.match(successPage, /session\.metadata\?\.type !== "qavelix_contribution"/);
  // No query-string flag this page trusts on its own (unlike a hypothetical
  // "?success=true") — verification always goes through Stripe.
  assert.doesNotMatch(successPage, /searchParams\.success/);
});
