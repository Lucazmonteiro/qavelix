import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// security.ts imports "@/env/server" and the DB schema for its durable rate-limit path
// (see rate-limit-source.test.mjs's own comment on why) — not resolvable by Node's
// native TS loader outside a Next build. This asserts against the real committed source
// text, same convention as every other "-source.test.mjs" file in this suite, rather
// than a hand-duplicated copy that could drift. The actual trust-resolution algorithm
// itself is real-imported and behaviorally tested in client-ip.test.mjs.
const security = await readFile("src/lib/server/security.ts", "utf8");
const entitlementsService = await readFile("src/lib/server/entitlements/service.ts", "utf8");

test("getClientFingerprint delegates to the trust-boundary-aware resolver instead of trusting the leftmost X-Forwarded-For entry", () => {
  assert.match(
    security,
    /import \{ resolveTrustedClientIdentity \} from "@\/lib\/server\/client-ip";/,
  );
  assert.match(
    security,
    /export function getClientFingerprint\(request: Request\) \{\s*const ipAddress = resolveTrustedClientIdentity\(/,
  );

  // The vulnerable pattern (split(",")[0], trusting the first/leftmost hop) must be gone.
  assert.doesNotMatch(security, /x-forwarded-for"\)\.split\(","\)\[0\]/);
});

test("getClientFingerprint never reads cf-connecting-ip directly", () => {
  // Checks the actual header-access call sites, not prose — this file's own comments
  // discuss cf-connecting-ip by name to explain why it's intentionally not used, which
  // would otherwise false-positive a plain substring search.
  assert.doesNotMatch(security, /getHeaderValue\(request, "cf-connecting-ip"\)/i);
  assert.doesNotMatch(security, /\.headers\.get\("cf-connecting-ip"\)/i);
});

test("getClientFingerprint still reads x-forwarded-for, and no longer reads x-real-ip at all", () => {
  const fingerprintFn = security.slice(
    security.indexOf("export function getClientFingerprint"),
  );

  assert.match(fingerprintFn, /getHeaderValue\(request, "x-forwarded-for"\)/);
  assert.match(fingerprintFn, /createHash\("sha256"\)\.update\(ipAddress\)\.digest\("base64url"\)/);

  // x-real-ip is never set/overwritten by this app's actual proxy chain (Cloudflare,
  // Render), so any value present is indistinguishable from attacker-injected input —
  // it must never be consulted, not even as a fallback.
  assert.doesNotMatch(fingerprintFn, /"x-real-ip"/);
});

test("resolveActor() still resolves authenticated users by session/user id, never by fingerprint, and anonymous actors still use getClientFingerprint()", () => {
  assert.match(
    entitlementsService,
    /if \(session\) \{\s*const plan = await getPlan\(session\.user\.id\);\s*return \{ type: "user", id: session\.user\.id, plan \};\s*\}/,
  );
  assert.match(
    entitlementsService,
    /return \{ type: "anonymous", id: getClientFingerprint\(request\) \};/,
  );
});
