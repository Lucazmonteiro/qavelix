import assert from "node:assert/strict";
import test from "node:test";

// client-ip.ts has zero "@/"-aliased imports (only node:net), unlike security.ts (which
// pulls in @/env/server and the DB schema for its durable rate-limit path) — so, unlike
// security.ts, it can be imported and executed directly here as real code, not asserted
// against as text. See client-fingerprint-source.test.mjs for the wiring check that
// confirms security.ts's getClientFingerprint() actually delegates to this module.
import { resolveTrustedClientIdentity } from "../../src/lib/server/client-ip.ts";

// Stand-ins for a genuine Cloudflare edge IP reachable to Render. Real Cloudflare-owned
// addresses (see the CLOUDFLARE_IPV4_RANGES/CLOUDFLARE_IPV6_RANGES comments in
// client-ip.ts for the source of truth) — safe to use as literals in a test, they are
// Cloudflare's own publicly documented infrastructure ranges, not anything sensitive.
const CLOUDFLARE_EDGE_IPV4 = "173.245.48.7";
const CLOUDFLARE_EDGE_IPV4_OTHER = "104.16.10.20";
const CLOUDFLARE_EDGE_IPV6 = "2400:cb00::1";

// RFC 5737/1918 documentation & private ranges — never routable on the real internet,
// safe stand-ins for "a real visitor's IP" and "an internal hop," matching the pattern
// already used by this project's integration tests (see tests/integration/http.test.mjs).
const REAL_CLIENT_A = "203.0.113.42";
const REAL_CLIENT_B = "198.51.100.9";
const INTERNAL_HOP = "10.0.4.12";

function forwardedFor(...hops) {
  return hops.join(", ");
}

test("a forged leftmost X-Forwarded-For value cannot change the resolved identity when the real client hop is present", () => {
  const withFakeLeftmostA = resolveTrustedClientIdentity(
    forwardedFor("1.2.3.4", REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4),
  );
  const withFakeLeftmostB = resolveTrustedClientIdentity(
    forwardedFor("9.9.9.9", REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4),
  );
  const withNoFakeLeftmostAtAll = resolveTrustedClientIdentity(
    forwardedFor(REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4),
  );

  assert.equal(withFakeLeftmostA, REAL_CLIENT_A);
  assert.equal(withFakeLeftmostB, REAL_CLIENT_A);
  assert.equal(withNoFakeLeftmostAtAll, REAL_CLIENT_A);
});

test("regression: varying only the attacker-controlled leftmost entry across many requests no longer produces unlimited distinct identities", () => {
  const resolved = new Set();

  for (let i = 0; i < 50; i += 1) {
    resolved.add(
      resolveTrustedClientIdentity(forwardedFor(`${i}.${i}.${i}.${i}`, REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4)),
    );
  }

  assert.equal(resolved.size, 1, "every forged-leftmost variant must resolve to the same real client");
  assert.ok(resolved.has(REAL_CLIENT_A));
});

test("multiple X-Forwarded-For entries: the real client is the hop immediately left of the trusted Cloudflare/proxy tail", () => {
  assert.equal(
    resolveTrustedClientIdentity(forwardedFor(REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4)),
    REAL_CLIENT_A,
  );

  // An additional internal (private-range) hop between Cloudflare and the app is
  // transparently skipped too, without needing to assume an exact hop count.
  assert.equal(
    resolveTrustedClientIdentity(forwardedFor(REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4, INTERNAL_HOP)),
    REAL_CLIENT_A,
  );
});

test("malformed X-Forwarded-For values fail closed rather than misattributing a client", () => {
  assert.equal(resolveTrustedClientIdentity("not-an-ip"), "unknown");
  assert.equal(resolveTrustedClientIdentity(",,,"), "unknown");
  assert.equal(resolveTrustedClientIdentity(`${REAL_CLIENT_A}, garbage`), "unknown");
  assert.equal(resolveTrustedClientIdentity(""), "unknown");
});

test("IPv4 addresses resolve and normalize correctly", () => {
  assert.equal(
    resolveTrustedClientIdentity(forwardedFor(REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4)),
    REAL_CLIENT_A,
  );
});

test("IPv6 addresses resolve, including IPv4-mapped IPv6 normalization", () => {
  const realClientIpv6 = "2001:db8::1";

  assert.equal(
    resolveTrustedClientIdentity(forwardedFor(realClientIpv6, CLOUDFLARE_EDGE_IPV6)),
    realClientIpv6.toLowerCase(),
  );

  // ::ffff:203.0.113.42 is the same client as 203.0.113.42 — must hash identically.
  assert.equal(
    resolveTrustedClientIdentity(forwardedFor(`::ffff:${REAL_CLIENT_A}`, CLOUDFLARE_EDGE_IPV4)),
    REAL_CLIENT_A,
  );
});

test("cf-connecting-ip is never consulted, so it cannot be used to inject a false identity", () => {
  // resolveTrustedClientIdentity()'s signature only accepts X-Forwarded-For — there is
  // no code path through which a cf-connecting-ip value (however forged) can influence
  // the result. Confirms the design choice documented in client-ip.ts and security.ts:
  // trusting that header directly would need this exact same "did this come through
  // Cloudflare" check anyway, so it isn't used at all.
  assert.equal(resolveTrustedClientIdentity.length, 1);
});

test("x-real-ip is never consulted under any circumstance, even when X-Forwarded-For is absent or untrustworthy", () => {
  // resolveTrustedClientIdentity() only ever accepts one argument (X-Forwarded-For).
  // There is no parameter, and no internal fallback, through which an X-Real-IP value —
  // forged or not — could influence the result. Neither Cloudflare nor Render (this
  // app's actual proxy chain) ever sets this header, so it must never be trusted as a
  // substitute identity source.
  assert.equal(resolveTrustedClientIdentity.length, 1);
  assert.equal(resolveTrustedClientIdentity(null), "unknown");
  assert.equal(resolveTrustedClientIdentity(""), "unknown");
});

test("Cloudflare-bypass scenario: a direct connection to the origin still resolves to the real connecting peer, not an attacker-forged value", () => {
  // No Cloudflare hop in the chain at all (origin reached directly) — Render's own
  // append is the only, and therefore rightmost-trusted-boundary, entry.
  assert.equal(resolveTrustedClientIdentity(REAL_CLIENT_A), REAL_CLIENT_A);

  // Attacker fabricates a fake first entry while bypassing Cloudflare; Render still
  // appends the real peer that connected to it, which is what must be trusted.
  assert.equal(resolveTrustedClientIdentity(forwardedFor("1.2.3.4", REAL_CLIENT_A)), REAL_CLIENT_A);
});

test("missing/absent forwarding headers fall back conservatively to \"unknown\" rather than crashing", () => {
  assert.equal(resolveTrustedClientIdentity(null), "unknown");
  assert.equal(resolveTrustedClientIdentity(undefined), "unknown");
  assert.equal(resolveTrustedClientIdentity(""), "unknown");
});

test("local development behavior: a single direct value with no proxy chain is trusted as-is (matches this project's existing integration-test convention)", () => {
  assert.equal(resolveTrustedClientIdentity(REAL_CLIENT_A), REAL_CLIENT_A);
  assert.equal(resolveTrustedClientIdentity("127.0.0.1"), "127.0.0.1");
});

test("repeated requests from the same trusted client resolve consistently", () => {
  const first = resolveTrustedClientIdentity(forwardedFor(REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4));
  const second = resolveTrustedClientIdentity(forwardedFor(REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4_OTHER));

  // Same real client, routed through two different (both genuinely Cloudflare) edge
  // nodes across two requests — must still resolve to the same identity.
  assert.equal(first, second);
  assert.equal(first, REAL_CLIENT_A);
});

test("different trusted clients resolve differently", () => {
  const clientA = resolveTrustedClientIdentity(forwardedFor(REAL_CLIENT_A, CLOUDFLARE_EDGE_IPV4));
  const clientB = resolveTrustedClientIdentity(forwardedFor(REAL_CLIENT_B, CLOUDFLARE_EDGE_IPV4));

  assert.notEqual(clientA, clientB);
});
