import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isLocale } from "../../src/i18n/locales.ts";

// auth-client.ts and plan-comparison-modal.tsx import the real "@/i18n/locale-context"
// value alias (a "use client" .tsx file), which Node's native TS loader can't resolve
// outside the Next.js build (no path-alias resolution, and JSX isn't erasable syntax) —
// same reason every other "-source" test in this suite reads files as text.
const authClientSource = await readFile("src/lib/auth-client.ts", "utf8");
const planComparisonModalSource = await readFile("src/components/plan-comparison-modal.tsx", "utf8");
const upgradeModalSource = await readFile("src/components/upgrade-modal.tsx", "utf8");
const localeContextSource = await readFile("src/i18n/locale-context.tsx", "utf8");

// Executes the REAL, current replaceLocaleInPath() body (extracted from the actual file
// read above, not a hand-typed reimplementation that could silently drift from it — see
// CLAUDE.md's stated reason for "-source" tests) against the real isLocale() import, so
// these are genuine behavioral assertions, not just pattern-matching on source text.
function loadRealReplaceLocaleInPath() {
  // Normalize line endings before matching — this repo's checked-out files use CRLF.
  const normalizedSource = localeContextSource.replace(/\r\n/g, "\n");
  const match = normalizedSource.match(
    /export function replaceLocaleInPath\(pathname: string, nextLocale: Locale\) \{([\s\S]*?)\n\}\n\nexport function isLocalizedHomePath/,
  );

  assert.ok(match, "replaceLocaleInPath's body should be extractable from the real source");

  // Executing the real, just-extracted source body — not arbitrary input.
  const fn = new Function("pathname", "nextLocale", "isLocale", match[1]);

  return (pathname, nextLocale) => fn(pathname, nextLocale, isLocale);
}

const replaceLocaleInPath = loadRealReplaceLocaleInPath();

test("root cause regression guard — checkout entry points no longer concatenate locale onto an already-localized path", () => {
  // The exact bug: cancelPath/returnPath is usePathname(), which already includes the
  // locale segment under /[locale]/... routing. Naive `/${locale}${cancelPath}` produced
  // "/pt-BR/pt-BR". Both fixed call sites must route through replaceLocaleInPath()
  // instead, and the old concatenation pattern must not reappear.
  assert.match(authClientSource, /import \{ replaceLocaleInPath \} from "@\/i18n\/locale-context";/);
  assert.match(authClientSource, /cancelUrl: replaceLocaleInPath\(cancelPath, locale\)/);
  assert.doesNotMatch(authClientSource, /cancelUrl: `\/\$\{locale\}\$\{cancelPath\}`/);

  assert.match(
    planComparisonModalSource,
    /import \{ replaceLocaleInPath, useLocaleState \} from "@\/i18n\/locale-context";/,
  );
  assert.match(planComparisonModalSource, /replaceLocaleInPath\(returnPath, locale\)/);
  // Matches only the old buggy assignment expression itself, not this file's own
  // explanatory comment mentioning that pattern as the thing being replaced.
  assert.doesNotMatch(
    planComparisonModalSource,
    /const callbackURL = encodeURIComponent\(`\/\$\{locale\}\$\{returnPath\}`\)/,
  );
});

test("successUrl stays a single hardcoded, never-duplicated literal (not built from a possibly-localized path)", () => {
  // Only cancelUrl/callbackURL are derived from a live pathname; success always returns
  // to the Plan page via a literal string, so it was never at risk of this bug — this
  // guards against someone "fixing" it into the same pattern in the future.
  assert.match(authClientSource, /successUrl: `\/\$\{locale\}\/dashboard\/plan\?checkout=success`/);
});

test("cancelPath/returnPath prop docs accurately describe usePathname()'s already-localized shape", () => {
  // These comments previously said "locale-less path", which was the wrong assumption
  // that caused the bug — regression guard against the stale claim reappearing.
  assert.doesNotMatch(upgradeModalSource, /Locale-less path to return to if the visitor cancels checkout/);
  assert.doesNotMatch(
    planComparisonModalSource,
    /Locale-less path to return to after sign-up\/sign-in/,
  );
});

for (const locale of ["pt-BR", "en", "es"]) {
  test(`${locale}: homepage cancel path (already locale-prefixed) never duplicates the locale`, () => {
    // This is the exact reported production bug: the homepage compressor's pathname IS
    // "/pt-BR" (etc.) — the bare locale segment, with nothing after it.
    const result = replaceLocaleInPath(`/${locale}`, locale);

    assert.equal(result, `/${locale}`);
    assert.notEqual(result, `/${locale}/${locale}`);
    assert.doesNotMatch(result, new RegExp(`/${locale}/${locale}`));
  });

  test(`${locale}: tool-page cancel path (already locale-prefixed) never duplicates the locale`, () => {
    const result = replaceLocaleInPath(`/${locale}/tools/extract-audio`, locale);

    assert.equal(result, `/${locale}/tools/extract-audio`);
    assert.doesNotMatch(result, new RegExp(`/${locale}/${locale}`));
  });

  test(`${locale}: locale-less literal path (e.g. the Plan page's own upgrade button) is prefixed exactly once`, () => {
    const result = replaceLocaleInPath("/dashboard/plan?checkout=cancelled", locale);

    assert.equal(result, `/${locale}/dashboard/plan?checkout=cancelled`);
  });
}

test("bare application root with no locale and no path produces a single clean locale segment", () => {
  for (const locale of ["pt-BR", "en", "es"]) {
    assert.equal(replaceLocaleInPath("/", locale), `/${locale}`);
  }
});

test("an input already prefixed with a DIFFERENT locale is swapped, not stacked", () => {
  assert.equal(replaceLocaleInPath("/en/dashboard/plan", "pt-BR"), "/pt-BR/dashboard/plan");
  assert.equal(replaceLocaleInPath("/pt-BR/tools/extract-audio", "es"), "/es/tools/extract-audio");
});

test("never produces a duplicated locale segment for any supported locale pair", () => {
  const locales = ["pt-BR", "en", "es"];

  for (const inputLocale of locales) {
    for (const targetLocale of locales) {
      for (const suffix of ["", "/tools/extract-audio", "/dashboard/plan?checkout=cancelled"]) {
        const result = replaceLocaleInPath(`/${inputLocale}${suffix}`, targetLocale);

        assert.doesNotMatch(
          result,
          /^\/([a-z]{2}(?:-[A-Z]{2})?)\/\1(?:\/|$)/,
          `duplicated locale segment produced from /${inputLocale}${suffix} -> ${targetLocale}: ${result}`,
        );
      }
    }
  }
});

test("cannot be used to construct an open redirect, even given a malformed/external-looking input", () => {
  // cancelPath/returnPath always come from usePathname() (always same-origin) or a
  // hardcoded internal literal in this codebase — never client-supplied arbitrary input.
  // This test proves the property holds regardless: replaceLocaleInPath() always forces
  // its result to start with "/${locale}", so resolving it against the real app origin
  // can never escape that origin.
  const maliciousInputs = [
    "https://evil.example/phish",
    "//evil.example/phish",
    "http://evil.example",
  ];

  for (const input of maliciousInputs) {
    for (const locale of ["pt-BR", "en", "es"]) {
      const result = replaceLocaleInPath(input, locale);
      const resolved = new URL(result, "https://qavelix.com");

      assert.equal(resolved.origin, "https://qavelix.com", `input "${input}" escaped the app origin: ${result}`);
      assert.match(result, /^\//, "result must always be a same-origin relative path");
    }
  }
});
