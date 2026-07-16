import assert from "node:assert/strict";
import test from "node:test";

import { contentPageSlugs, isContentPageSlug } from "../../src/config/content-pages.ts";
import { isLocale, localeLabels, locales } from "../../src/i18n/locales.ts";

test("locale registry accepts only supported locales", () => {
  assert.deepEqual(locales, ["en", "pt-BR", "es"]);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("pt-BR"), true);
  assert.equal(isLocale("es"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(localeLabels["pt-BR"], "Português (Brasil)");
});

test("content page slug registry covers Phase 7 legal and SEO pages", () => {
  assert.deepEqual(contentPageSlugs, [
    "about",
    "contact",
    "faq",
    "privacy-policy",
    "terms",
    "cookie-policy",
  ]);
  assert.equal(isContentPageSlug("privacy-policy"), true);
  assert.equal(isContentPageSlug("unknown"), false);
});
