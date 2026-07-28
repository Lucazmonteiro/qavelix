import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// plan-comparison-modal.tsx imports the real "@/i18n/locale-context" value alias, which
// Node's native TS loader can't resolve outside the Next.js build.
const source = await readFile("src/components/plan-comparison-modal.tsx", "utf8");
const compressionPanel = await readFile("src/components/compression-panel.tsx", "utf8");
const extractAudioTool = await readFile("src/components/extract-audio-tool.tsx", "utf8");
const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");
const sessionHelper = await readFile("src/lib/server/auth/session.ts", "utf8");

test("plan comparison modal renders three real, server-sourced tiers — never invented numbers", () => {
  assert.match(source, /anonymousLimits\.maxUsesPerPeriod/);
  assert.match(source, /anonymousLimits\.maxUploadBytes/);
  assert.match(source, /freeLimits\.maxUsesPerPeriod/);
  assert.match(source, /proLimits\.maxUsesPerPeriod/);
  // Reuses the Modal primitive and the existing upgrade-modal CSS classes rather than
  // duplicating the accessible dialog/focus-trap implementation or the visual language.
  assert.match(source, /from "@\/components\/modal"/);
  assert.match(source, /className="upgrade-modal plan-comparison-modal"/);
});

test("plan comparison modal's two CTAs are real navigations, not fake buttons", () => {
  assert.match(source, /href=\{`\/\$\{locale\}\/sign-up\?callbackURL=\$\{callbackURL\}`\}/);
  assert.match(source, /href=\{`\/\$\{locale\}\/sign-in\?callbackURL=\$\{callbackURL\}`\}/);
});

test("plan comparison modal has no direct-to-Pro-checkout CTA — only create-account and sign-in", () => {
  // The modal's only conversion paths are creating a free account or signing in; Pro
  // info stays purely informational (the third comparison column), never a button that
  // routes an anonymous visitor straight into a Pro checkout/sign-up-for-Pro flow.
  assert.doesNotMatch(source, /viewProLabel/);
  assert.doesNotMatch(source, /proCallbackURL/);
  assert.doesNotMatch(source, /dashboard\/plan/);
  // Exactly two <a> actions inside .upgrade-modal__actions.
  const actionsBlock = source.match(/<div className="upgrade-modal__actions">([\s\S]*?)<\/div>/);
  assert.ok(actionsBlock, "upgrade-modal__actions block should exist");
  const anchorCount = (actionsBlock[1].match(/<a\b/g) ?? []).length;
  assert.equal(anchorCount, 2, "exactly two CTAs: create account and sign in");
});

test("the return-path callback is accepted by the server-side sanitizer, not just constructed client-side", () => {
  // Confirms the widened SAFE_CALLBACK_PATTERN actually accepts what this modal
  // constructs: the bare locale homepage, /tools/extract-audio, and /dashboard/plan.
  const patternMatch = sessionHelper.match(/const SAFE_CALLBACK_PATTERN = (\/.*\/);/);
  assert.ok(patternMatch, "SAFE_CALLBACK_PATTERN should be defined as a regex literal");
  const pattern = new RegExp(patternMatch[1].slice(1, -1));

  assert.match("/en", pattern);
  assert.match("/en/tools/extract-audio", pattern);
  assert.match("/en/dashboard/plan", pattern);
});

test("both tool panels render PlanComparisonModal for anonymous visitors and UpgradeModal for Free actors, never both", () => {
  for (const source of [compressionPanel, extractAudioTool]) {
    assert.match(source, /import \{ PlanComparisonModal \} from "@\/components\/plan-comparison-modal"/);
    assert.match(
      source,
      /gate\.plan === "anonymous" && gate\.anonymousLimits && gate\.freeLimits && gate\.proLimits/,
    );
    assert.match(source, /gate\.plan === "free" && gate\.freeLimits && gate\.proLimits/);
    assert.match(source, /<PlanComparisonModal/);
    assert.match(source, /returnPath=\{pathname\}/);
  }
});

test("planComparisonModal dictionary section exists for every supported locale", () => {
  const matches = dictionarySource.match(/planComparisonModal: \{/g) ?? [];
  // Type declaration + en + pt-BR + es = 4.
  assert.equal(matches.length, 4);
});
