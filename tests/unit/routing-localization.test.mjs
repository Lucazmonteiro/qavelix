import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { contentPageSlugs, isContentPageSlug } from "../../src/config/content-pages.ts";
import { isLocale, localeLabels, locales } from "../../src/i18n/locales.ts";

const envExample = await readFile(".env.example", "utf8");
const envSource = await readFile("src/env/server.ts", "utf8");
const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");

test("locale registry accepts only supported locales", () => {
  assert.deepEqual(locales, ["en", "pt-BR", "es"]);
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("pt-BR"), true);
  assert.equal(isLocale("es"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(localeLabels["pt-BR"], "Português (Brasil)");
});

test("content page slug registry covers public product and legal pages", () => {
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

test("public support email is centralized and does not invent departmental aliases", () => {
  assert.match(envExample, /NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail\.com/);
  assert.match(envSource, /NEXT_PUBLIC_SUPPORT_EMAIL/);
  assert.match(envSource, /required for public production deployments/);
  assert.match(envSource, /localProductionHosts/);
  assert.match(dictionarySource, /\{supportEmail\}/);
  assert.doesNotMatch(dictionarySource, /support@qavelix/i);
  assert.doesNotMatch(dictionarySource, /privacy@qavelix/i);
  assert.doesNotMatch(dictionarySource, /security@qavelix/i);
  assert.doesNotMatch(dictionarySource, /legal@qavelix/i);
});
