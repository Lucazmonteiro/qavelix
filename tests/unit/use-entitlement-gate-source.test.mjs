import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// use-entitlement-gate.ts imports the real "@/lib/auth-client" value alias, which Node's
// native TS loader can't resolve outside the Next.js build — same constraint as every
// other "@/"-importing module in this suite.
const source = await readFile("src/lib/use-entitlement-gate.ts", "utf8");

// Regression coverage for the logout-state-correctness fix: this hook used to fetch
// entitlement status once on mount and never again, so a tool panel that stayed mounted
// across a login or logout (a soft client-side navigation, not a full page reload) could
// keep showing a previous user's plan/blocked state indefinitely.
test("entitlement gate refetches on every auth-state transition, not just on mount", () => {
  assert.match(source, /useSession\(\)/);
  assert.match(source, /const userId = session\.data\?\.user\.id \?\? null;/);
  // refresh() itself must be recreated whenever userId changes, and the mount effect
  // must depend on refresh (transitively on userId) — not an empty dependency array.
  assert.match(source, /}, \[toolId, userId\]\);/);
  assert.doesNotMatch(source, /}, \[toolId\]\);/);
  assert.doesNotMatch(source, /}, \[\]\);/);
});

// Resolved state is tagged with the userId it was fetched for and only trusted while that
// still matches the current session — this is what makes a stale response from a
// previous user impossible to show after a fast auth-state change, without a synchronous
// setState call in the effect body (the same technique pro-badge.tsx uses).
test("entitlement gate state is tagged by userId and never trusted across an auth-state mismatch", () => {
  assert.match(source, /const state = resolved && resolved\.userId === userId \? resolved : initialState;/);
  assert.match(source, /setResolved\(\(current\) => \(\{/);
  assert.doesNotMatch(source, /const \[state, setState\] = useState/);
});

// A fresh auth state gets a fresh chance to show the one-time upgrade offer — the
// previous user's "already shown" flag must not suppress it for whoever is signed in (or
// out) now, which matters on shared devices.
test("the one-time upgrade-modal flag resets on every auth-state transition", () => {
  assert.match(source, /hasShownModalRef\.current = false;\s*\n\s*void refresh\(\);/);
});

// Improvement 2: an anonymous actor hitting the combined lifetime pool (reason
// "account_required") must trigger the same automatic one-time modal a Free actor
// hitting their daily cap does — this is the exact condition the calling tool uses to
// decide between rendering PlanComparisonModal (anonymous) or UpgradeModal (free).
test("the auto-open condition covers both Free daily-limit and anonymous pool-exhaustion, and nothing else", () => {
  const fnBody = source.slice(
    source.indexOf("function shouldAutoOpenModal"),
    source.indexOf("const initialState"),
  );

  assert.match(fnBody, /reason === "usage_limit_reached" && plan === "free"/);
  assert.match(fnBody, /reason === "account_required" && plan === "anonymous"/);

  // Regression guard: Pro must never auto-open this modal (already the top tier), and
  // the status response now also carries anonymousLimits alongside free/pro.
  assert.doesNotMatch(fnBody, /plan === "pro"/);
  assert.match(source, /anonymousLimits: UpgradeModalLimits \| null;/);
  assert.match(source, /anonymousLimits\?: UpgradeModalLimits;/);
});
