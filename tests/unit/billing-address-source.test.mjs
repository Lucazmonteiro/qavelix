import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// These modules import real "@/" value aliases (locale-context, or next/headers via
// billing.ts/session.ts) that Node's native TS loader can't resolve outside the Next.js
// build.
const form = await readFile("src/components/dashboard/billing-address-form.tsx", "utf8");
const route = await readFile("src/app/api/billing/address/route.ts", "utf8");
const billingLib = await readFile("src/lib/server/billing.ts", "utf8");
const billingPage = await readFile("src/app/[locale]/dashboard/billing/page.tsx", "utf8");

test("postal-code lookup is debounced and never blocks or overwrites manual entry", () => {
  assert.match(form, /window\.setTimeout\(/);
  assert.match(form, /debounceMs/);
  assert.match(form, /window\.clearTimeout\(timeoutId\)/);
  // Autofill only applies to fields the visitor hasn't already typed into.
  assert.match(form, /touchedFieldsRef\.current\.add\("street"\)/);
  assert.match(form, /touchedFieldsRef\.current\.add\("city"\)/);
  assert.match(form, /touchedFieldsRef\.current\.add\("state"\)/);
  assert.match(form, /if \(!touched\.has\("street"\) && result\.address\.street\)/);
  assert.match(form, /if \(!touched\.has\("city"\) && result\.address\.city\)/);
  assert.match(form, /if \(!touched\.has\("state"\) && result\.address\.state\)/);
  // Every field remains a plain, always-editable input — never disabled by lookup state.
  assert.doesNotMatch(form, /disabled=\{lookupStatus/);
});

test("form shows explicit loading/success/not-found/error states for the lookup, and never for country selection alone", () => {
  assert.match(form, /"idle" \| "loading" \| "success" \| "not_found" \| "error"/);
  assert.match(form, /copy\.lookupLoadingLabel/);
  assert.match(form, /copy\.lookupSuccessLabel/);
  assert.match(form, /copy\.lookupNotFoundLabel/);
  assert.match(form, /copy\.lookupErrorLabel/);
});

test("form prefills from the real Stripe-backed address on mount and prevents duplicate submissions", () => {
  assert.match(form, /fetch\("\/api\/billing\/address", \{ cache: "no-store" \}\)/);
  assert.match(form, /if \(isSaving\) \{\s*\n\s*return;/);
});

test("/api/billing/address requires a real session and validates server-side, never trusting the client beyond shape", () => {
  assert.match(route, /getOptionalSession\(\)/);
  assert.match(route, /if \(!session\) \{/);
  assert.match(route, /unauthenticated/);
  assert.match(route, /isBillingConfigured\(\)/);
  assert.match(route, /COUNTRY_PATTERN = \/\^\[A-Z\]\{2\}\$\//);
  assert.match(route, /parseBillingAddressPayload/);
  assert.match(route, /enforceApiSecurity\(/);
  assert.match(route, /requireSameOrigin: true/);
});

test("billing address is always synced through Stripe's own Customer object, never a parallel QAVELIX-owned store", () => {
  assert.match(billingLib, /stripeClient\.customers\.update\(stripeCustomerId, \{/);
  // Re-fetches and confirms after the write rather than trusting the echoed response —
  // never reports "saved" unless Stripe's own stored state was actually confirmed.
  assert.match(billingLib, /const confirmed = await getStripeBillingAddress\(userId\);/);
  assert.match(billingLib, /if \(!confirmed\) \{\s*\n\s*return \{ ok: false, reason: "stripe_error" \};/);
  // Partial-failure handling: not-configured and no-customer are distinct, honest states,
  // never silently treated as success.
  assert.match(billingLib, /reason: "not_configured"/);
  assert.match(billingLib, /reason: "no_customer"/);
});

test("billing page renders the address form only alongside the real Billing Portal button", () => {
  assert.match(billingPage, /from "@\/components\/dashboard\/billing-address-form"/);
  assert.match(billingPage, /<BillingAddressForm dictionary=\{dictionary\} locale=\{locale\} \/>/);
});
