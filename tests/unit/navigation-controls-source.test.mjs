import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const navigationControls = await readFile(
  "src/components/navigation-controls.tsx",
  "utf8",
);
const homePage = await readFile("src/app/[locale]/page.tsx", "utf8");
const contentPage = await readFile("src/app/[locale]/[slug]/page.tsx", "utf8");
const uploadValidator = await readFile("src/components/upload-validator.tsx", "utf8");
const compressionPanel = await readFile("src/components/compression-panel.tsx", "utf8");
const appShell = await readFile("src/components/app-shell.tsx", "utf8");
const dictionary = await readFile("src/i18n/dictionaries.ts", "utf8");
const globalStyles = await readFile("src/styles/globals.css", "utf8");

function cssBlock(selector) {
  const match = globalStyles.match(new RegExp(`${selector} \\{([^}]*)\\}`));

  assert.ok(match, `${selector} block should exist`);

  return match[1];
}

test("navigation controls are shell-owned and not statically repeated in sections", () => {
  for (const source of [homePage, contentPage, uploadValidator, compressionPanel]) {
    assert.doesNotMatch(source, /ContextBackButton/);
    assert.doesNotMatch(source, /context-back-button/);
  }

  assert.match(appShell, /<NavigationControls/);
  assert.match(appShell, /id="page-end-sentinel"/);
});

test("contextual Back stores origin, validates destination, and clears itself after return", () => {
  assert.match(navigationControls, /qavelix-navigation-context/);
  assert.match(navigationControls, /data-navigation-origin/);
  assert.match(navigationControls, /normalizeDestination/);
  assert.match(navigationControls, /getCurrentDestination/);
  assert.match(navigationControls, /setNavigationContext\(null\)/);
  assert.match(navigationControls, /clearNavigationContext\(\)/);
});

test("Back to top uses an end sentinel and reduced-motion-aware scrolling", () => {
  assert.match(navigationControls, /IntersectionObserver/);
  assert.match(navigationControls, /page-end-sentinel/);
  assert.match(navigationControls, /prefers-reduced-motion: reduce/);
  assert.match(navigationControls, /window\.scrollTo/);
  assert.match(navigationControls, /backToTopLabel/);
});

test("contextual Back and Back to top are coordinated as mutually exclusive controls", () => {
  assert.match(navigationControls, /const showBackToTop = isEndVisible/);
  assert.match(
    navigationControls,
    /const showContextBack = Boolean\(navigationContext\) && !showBackToTop/,
  );
  assert.match(navigationControls, /\{showContextBack \? \(/);
  assert.match(navigationControls, /\{showBackToTop \? \(/);
});

test("contextual Back and Back to top share the same visual treatment", () => {
  const baseButtonBlock = cssBlock("\\.context-back-button");
  const topButtonBlock = cssBlock("\\.context-back-button--top");

  assert.match(
    baseButtonBlock,
    /background: color-mix\(in srgb, var\(--accent-soft\) 70%, var\(--surface\)\)/,
  );
  assert.match(
    baseButtonBlock,
    /border: 1px solid color-mix\(in srgb, var\(--accent\) 36%, var\(--border\)\)/,
  );
  assert.match(baseButtonBlock, /color: var\(--foreground\)/);
  assert.doesNotMatch(topButtonBlock, /background:/);
  assert.match(globalStyles, /\.context-back-button:active/);
});

test("localized navigation control labels are present", () => {
  assert.match(dictionary, /back: "Back"/);
  assert.match(dictionary, /back: "Voltar"/);
  assert.match(dictionary, /back: "Volver"/);
  assert.match(dictionary, /backToTop: "Back to top"/);
  assert.match(dictionary, /backToTop: "Voltar ao início"/);
  assert.match(dictionary, /backToTop: "Volver al inicio"/);
});
