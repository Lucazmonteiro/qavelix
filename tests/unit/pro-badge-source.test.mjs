import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// pro-badge.tsx imports the real "@/lib/auth-client" value alias, which Node's native TS
// loader can't resolve outside the Next.js build — same constraint as every other
// "@/"-importing module in this suite (see compression-panel-polling-source.test.mjs).
// The server-resolved-plan fetch/cache logic itself lives in use-resolved-plan.ts, a
// shared hook also used by pricing-cards.tsx — pro-badge.tsx only consumes it now.
const source = await readFile("src/components/pro-badge.tsx", "utf8");
const hookSource = await readFile("src/lib/use-resolved-plan.ts", "utf8");
const appHeader = await readFile("src/components/app-header.tsx", "utf8");
const planRoute = await readFile("src/app/api/entitlements/plan/route.ts", "utf8");
const globalStyles = await readFile("src/styles/globals.css", "utf8");

test("PRO badge is driven by the authoritative server-resolved plan, never client-only session state", () => {
  assert.match(source, /useResolvedPlan\(\)/);
  assert.match(source, /if \(plan !== "pro"\) \{\s*\n\s*return null;/);
  assert.match(hookSource, /fetch\("\/api\/entitlements\/plan"/);
  // Anonymous/loading/free must never fetch anything — the effect returns immediately
  // when there's no session user id.
  assert.match(hookSource, /if \(!userId\) \{\s*\n\s*return;/);
  // A fetched result is only trusted when it was fetched for the *current* userId — this
  // is what makes the badge disappear immediately on logout without a synchronous
  // setState in the effect body (React's set-state-in-effect lint rule), and also guards
  // against a stale response from a previous user landing after a fast user switch.
  assert.match(hookSource, /fetched\?\.userId === userId \? fetched\.plan : null/);
});

test("useResolvedPlan refetches on every auth-state transition, not just on mount", () => {
  const effectBlock = hookSource.slice(
    hookSource.indexOf("useEffect(() => {"),
    hookSource.indexOf("return fetched?.userId"),
  );

  assert.match(effectBlock, /\}, \[userId\]\);/);
  // Regression guard: a mount-only effect (empty deps or a stale "run once" pattern) is
  // exactly the staleness bug this hook must not reintroduce.
  assert.doesNotMatch(effectBlock, /\}, \[\]\);/);
  // No setState call directly in the synchronous "no user" branch — that's the pattern
  // React's set-state-in-effect rule flags, and the userId-tagged fetched check above
  // achieves the same "hide immediately on logout" behavior without it.
  const noUserBranch = effectBlock.slice(0, effectBlock.indexOf("let cancelled"));
  assert.doesNotMatch(noUserBranch, /setFetched/);
});

test("PRO badge shimmer is confined to prefers-reduced-motion: no-preference and the base pill is otherwise static", () => {
  assert.match(globalStyles, /@media \(prefers-reduced-motion: no-preference\) \{\s*\n\s*\.pro-badge::after/);
  assert.match(globalStyles, /animation: pro-badge-shimmer/);
  // The base .pro-badge rule (outside the media query) must not itself declare an
  // animation — reduced-motion users must see a plain static pill, not a paused/frozen
  // animated one.
  const baseRuleStart = globalStyles.indexOf(".pro-badge {");
  const baseRuleEnd = globalStyles.indexOf("}", baseRuleStart);
  const baseRule = globalStyles.slice(baseRuleStart, baseRuleEnd);
  assert.doesNotMatch(baseRule, /animation/);
});

test("PRO badge is wired into the header without breaking the header's grid layout", () => {
  assert.match(appHeader, /import \{ ProBadge \} from "@\/components\/pro-badge"/);
  assert.match(appHeader, /<ProBadge dictionary=\{dictionary\} \/>/);
  assert.match(appHeader, /className="brand-group"/);
  assert.match(globalStyles, /\.brand-group \{\s*\n\s*grid-area: brand;/);
});

test("/api/entitlements/plan is read-only, tool-agnostic, and trusts only the resolved server actor", () => {
  assert.match(planRoute, /resolveActor\(request\)/);
  assert.match(planRoute, /actor\.type === "user" \? actor\.plan : "anonymous"/);
  assert.match(planRoute, /enforceApiSecurity\(/);
  // No mutation of any kind belongs in a plan-lookup endpoint.
  assert.doesNotMatch(planRoute, /reserveUsage|setUserPlan|confirmUsage/);
});
