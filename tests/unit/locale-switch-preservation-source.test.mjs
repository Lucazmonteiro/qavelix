import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const localeContextSource = await readFile("src/i18n/locale-context.tsx", "utf8");
const languageSelectorSource = await readFile(
  "src/components/language-selector.tsx",
  "utf8",
);
const appShellSource = await readFile("src/components/app-shell.tsx", "utf8");
const homepageContentSource = await readFile(
  "src/components/homepage-content.tsx",
  "utf8",
);
const homepageSource = await readFile("src/components/homepage-compressor.tsx", "utf8");
const pageSource = await readFile("src/app/[locale]/page.tsx", "utf8");

test("homepage language switching preserves compressor state by avoiding navigation", () => {
  assert.match(languageSelectorSource, /"use client"/);
  assert.match(languageSelectorSource, /isLocalizedHomePath\(window\.location\.pathname\)/);
  assert.match(languageSelectorSource, /event\.preventDefault\(\)/);
  assert.match(languageSelectorSource, /localeState\.switchLocale\(locale\)/);
  assert.match(localeContextSource, /window\.history\.pushState\(null, "", nextUrl\)/);
});

test("locale switching preserves scroll position and document language", () => {
  assert.match(localeContextSource, /const currentScroll = \{ x: window\.scrollX, y: window\.scrollY \}/);
  assert.match(localeContextSource, /const lastWorkflowScrollRef = useRef/);
  assert.match(localeContextSource, /window\.addEventListener\("scroll", handleScroll, \{ passive: true \}\)/);
  assert.match(localeContextSource, /currentScroll\.y === 0 && lastWorkflowScrollRef\.current\.y > 0/);
  assert.match(localeContextSource, /window\.requestAnimationFrame\(\(\) => \{/);
  assert.match(localeContextSource, /window\.history\.scrollRestoration = "manual"/);
  assert.match(localeContextSource, /function restoreScrollPosition\(\)/);
  assert.match(localeContextSource, /window\.scrollTo\(preservedScroll\.x, preservedScroll\.y\)/);
  assert.match(localeContextSource, /window\.setTimeout\(restoreScrollPosition, 120\)/);
  assert.match(localeContextSource, /document\.documentElement\.lang = locale/);
});

test("homepage text updates from a shared client dictionary without remounting compressor", () => {
  assert.match(appShellSource, /<LocaleProvider initialLocale=\{locale\}>/);
  assert.match(homepageContentSource, /const \{ dictionary \} = useLocaleState\(\)/);
  assert.match(homepageContentSource, /<HomepageCompressor/);
  assert.match(homepageContentSource, /compression: dictionary\.compression/);
  assert.match(pageSource, /<HomepageContent \/>/);
  assert.doesNotMatch(pageSource, /dictionary\.home\.sections\.designSystem/);
  assert.match(homepageSource, /useState\(false\)/);
  assert.match(homepageSource, /<CompressionPanel/);
});

test("non-home localized pages keep normal link navigation", () => {
  assert.match(localeContextSource, /export function isLocalizedHomePath/);
  assert.match(languageSelectorSource, /if \(!isLocalizedHomePath\(window\.location\.pathname\)\) \{\s*return;\s*\}/);
  assert.match(languageSelectorSource, /href=\{`\/\$\{locale\}`\}/);
});
