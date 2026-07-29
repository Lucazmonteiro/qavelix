import net from "node:net";

// Resolves the one client identity signal every anonymous-facing security decision in
// this app is keyed on (see getClientFingerprint() in security.ts): the entitlement
// system's anonymous usage pool, and every fingerprint-keyed rate limit in
// enforceApiSecurity(). Deliberately has zero "@/"-aliased imports (only node:net) so it
// can be imported and executed directly in a plain `node --test` file, unlike security.ts
// itself (which pulls in @/env/server and the DB schema for its durable rate-limit path,
// neither resolvable outside a Next build) — see client-ip.test.mjs.
//
// Production topology (docs/architecture/hosting-decision.md, docs/DEPLOYMENT.md):
// Internet client -> Cloudflare (DNS + edge) -> Render (single container) -> this app.
// Well-behaved reverse proxies APPEND their own observed peer to X-Forwarded-For rather
// than replacing it, so the *leftmost* entry is always attacker-controlled input (an
// attacker can freely send "X-Forwarded-For: 1.2.3.4" on a direct request) while the
// *rightmost* entry is always the address of whoever physically connected to the
// component that added it. Reading the first entry (the pre-fix behavior) reads
// attacker-controlled data, not a network-verified fact.
//
// This resolves the header from the right, skipping any hop whose address falls inside a
// *known, non-attacker-obtainable* range — Cloudflare's own published edge ranges, plus
// standard private/reserved ranges to absorb any additional internal hop Render's own
// infrastructure may add in front of the app — and returns the first hop that isn't one
// of those. That is either the real visitor's IP as Cloudflare observed it (normal path),
// or, if Cloudflare is bypassed entirely (e.g. hitting the raw Render hostname directly),
// the actual peer that connected to Render — which still correctly identifies the real
// connecting party rather than trusting anything the client claims about itself.
//
// Residual risk (see the audit's Finding 1 remediation report): this cannot fully close
// the bypass case for an attacker whose *own* real egress IP happens to fall inside a
// trusted range (e.g. an attacker operating from within Cloudflare's own network) —
// closing that last mile requires an infrastructure control (Render-side origin
// allowlisting, or Cloudflare Authenticated Origin Pulls), which is out of scope for a
// code-only fix and is reported separately, not applied here.

// Source: https://www.cloudflare.com/ips-v4 — stable for years, but not immutable;
// re-verify against that page periodically (Cloudflare rarely changes it).
const CLOUDFLARE_IPV4_RANGES = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
] as const;

// Source: https://www.cloudflare.com/ips-v6
const CLOUDFLARE_IPV6_RANGES = [
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
] as const;

// Absorbs any additional internal hop that may sit between Cloudflare and this app
// (e.g. a PaaS-internal load balancer) without needing to assume an exact hop count.
// These are non-routable on the public internet, so trusting them as "a proxy hop to
// skip past" never lets an external attacker claim to be the real client — it only ever
// matters when a genuine intermediate hop is present.
// Deliberately excludes loopback (127.0.0.0/8, ::1/128): a genuine intermediate
// infrastructure hop's own advertised address is never loopback, so treating loopback as
// "skip past, look further left" would only ever discard the one real signal available
// in a direct/no-proxy scenario (e.g. local development) instead of correctly resolving
// to it.
const PRIVATE_RESERVED_IPV4_RANGES = [
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
  "169.254.0.0/16",
  "100.64.0.0/10",
] as const;

const PRIVATE_RESERVED_IPV6_RANGES = ["fc00::/7", "fe80::/10"] as const;

function addSubnets(blockList: net.BlockList, cidrRanges: readonly string[], family: "ipv4" | "ipv6") {
  for (const cidr of cidrRanges) {
    const separatorIndex = cidr.lastIndexOf("/");
    const address = cidr.slice(0, separatorIndex);
    const prefix = Number(cidr.slice(separatorIndex + 1));

    blockList.addSubnet(address, prefix, family);
  }
}

function buildTrustedHopBlockList(): net.BlockList {
  const blockList = new net.BlockList();

  addSubnets(blockList, CLOUDFLARE_IPV4_RANGES, "ipv4");
  addSubnets(blockList, CLOUDFLARE_IPV6_RANGES, "ipv6");
  addSubnets(blockList, PRIVATE_RESERVED_IPV4_RANGES, "ipv4");
  addSubnets(blockList, PRIVATE_RESERVED_IPV6_RANGES, "ipv6");

  return blockList;
}

// Built once at module load — a BlockList is a static set of ranges, cheap to reuse
// across every request rather than rebuilt per call.
const trustedHopBlockList = buildTrustedHopBlockList();

function isValidIpAddress(value: string): boolean {
  return net.isIP(value) !== 0;
}

// Collapses an IPv4-mapped IPv6 representation ("::ffff:203.0.113.5") to its plain IPv4
// form, and lowercases IPv6 for consistent hashing — otherwise the same real client could
// resolve to two different fingerprints depending on which equivalent representation a
// given hop happens to use.
function normalizeIpAddress(ip: string): string {
  const ipv4MappedMatch = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(ip);

  if (ipv4MappedMatch?.[1]) {
    return ipv4MappedMatch[1];
  }

  return net.isIPv6(ip) ? ip.toLowerCase() : ip;
}

function isTrustedHop(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return trustedHopBlockList.check(ip, "ipv4");
  }

  if (net.isIPv6(ip)) {
    return trustedHopBlockList.check(ip, "ipv6");
  }

  return false;
}

// Walks X-Forwarded-For from the right (the trustworthy end), skipping any hop that
// falls inside a known proxy/reserved range, and returns the first hop that doesn't —
// the real client as observed by the nearest trusted proxy. Fails closed (returns null)
// on an empty header or any unparseable hop, rather than guessing.
function resolveTrustedForwardedFor(headerValue: string): string | null {
  const hops = headerValue
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);

  for (let index = hops.length - 1; index >= 0; index -= 1) {
    const candidate = hops[index];

    if (!candidate || !isValidIpAddress(candidate)) {
      return null;
    }

    if (isTrustedHop(candidate)) {
      continue;
    }

    return normalizeIpAddress(candidate);
  }

  return null;
}

// The single entry point callers should use. Never returns null/empty — "unknown" is the
// same conservative shared fallback this app already used before this fix for the
// no-trustworthy-signal case (no proxy in front at all and no valid header), so behavior
// for that edge case is unchanged.
//
// X-Real-IP is deliberately not accepted as a parameter or consulted as a fallback under
// any circumstance: neither Cloudflare nor Render (this app's actual, documented proxy
// chain — see the module comment above) ever sets or overwrites that header, so any value
// present is indistinguishable from attacker-injected input — the exact trust failure
// this module exists to close for X-Forwarded-For, reopened in miniature if this header
// were trusted instead. A missing/untrustworthy X-Forwarded-For falls straight through to
// "unknown" rather than accepting an unverifiable substitute.
export function resolveTrustedClientIdentity(
  forwardedForHeader: string | null | undefined,
): string {
  const trustedForwardedIp = forwardedForHeader
    ? resolveTrustedForwardedFor(forwardedForHeader)
    : null;

  return trustedForwardedIp ?? "unknown";
}

// Security Correction #3 — Better Auth's own built-in rate limiter (sign-in/sign-up:
// 3 attempts/10s, password-reset/verification-email: 3/60s, per IP — see
// node_modules/@better-auth/core/dist/context/create-context.mjs's default special
// rules) resolves the client IP via this exact same "trustedProxies-aware, walk
// X-Forwarded-For from the right" algorithm (@better-auth/core/utils/ip.mjs's
// getIPFromHeader), but only trusts a *single-value* header unless `trustedProxies` is
// configured — otherwise a real, multi-hop production header (Cloudflare + Render) makes
// it give up and fall back to one shared bucket for every visitor, silently disabling
// per-account brute-force throttling. Exported so auth.ts can pass the exact same
// trusted-hop list this module already uses for the app's own rate limiter/entitlement
// fingerprint, rather than maintaining a second, potentially-drifting copy of the same
// Cloudflare/private-range list.
export const TRUSTED_PROXY_CIDR_RANGES = [
  ...CLOUDFLARE_IPV4_RANGES,
  ...CLOUDFLARE_IPV6_RANGES,
  ...PRIVATE_RESERVED_IPV4_RANGES,
  ...PRIVATE_RESERVED_IPV6_RANGES,
];
