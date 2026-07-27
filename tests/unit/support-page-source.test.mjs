import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// support/page.tsx imports the real "@/components/app-shell" value alias, which Node's
// native TS loader can't resolve outside the Next.js build — asserted against the real
// committed source directly, same convention as every other page-source test in this
// suite.
const page = await readFile("src/app/[locale]/support/page.tsx", "utf8");
const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");
const foundationCard = await readFile("src/components/foundation-card.tsx", "utf8");
const cssSource = await readFile("src/styles/globals.css", "utf8");

test("support page uses the standard AppShell (real header/footer nav), not an isolated layout", () => {
  assert.match(page, /from "@\/components\/app-shell"/);
  assert.match(page, /<AppShell dictionary=\{dictionary\} locale=\{locale\}>/);
  assert.doesNotMatch(page, /Back to compressor|floating.*[Bb]ack/);
});

test("support page hero reuses the toned-down content-page hero, not the oversized homepage hero-section", () => {
  assert.match(page, /<section className="content-page__hero">/);
  assert.doesNotMatch(page, /className="hero-section"/);
  assert.doesNotMatch(page, /hero-section__content/);
});

test("support page renders the story, where-support-helps cards, transparency notice, and closing message sections", () => {
  assert.match(page, /support-story-title/);
  assert.match(page, /copy\.story\.paragraphs\.map/);
  assert.match(page, /support-helps-title/);
  assert.match(page, /copy\.helps\.cards\.map/);
  assert.match(page, /from "@\/components\/foundation-card"/);
  assert.match(page, /className="support-notice"/);
  assert.match(page, /copy\.transparency\.items\.map/);
  assert.match(page, /className="support-closing"/);
  assert.match(page, /\{copy\.closingMessage\}/);
});

test("support page still renders the existing Stripe one-time contribution form, unmodified in placement", () => {
  assert.match(page, /from "@\/components\/support-checkout-form"/);
  assert.match(page, /<SupportCheckoutForm dictionary=\{dictionary\} locale=\{locale\}\s*\/>/);
});

test("FoundationCard supports an optional decorative icon without breaking existing callers", () => {
  assert.match(foundationCard, /icon\?: string/);
  assert.match(foundationCard, /aria-hidden="true"/);
});

test("support-helps-grid is a responsive auto-fit grid, not a fixed 3-column grid awkward for 4 cards", () => {
  assert.match(cssSource, /\.support-helps-grid \{\s*\n\s*grid-template-columns: repeat\(auto-fit, minmax\(/);
});

test("support dictionary section (type + en + pt-BR + es) defines story, helps, transparency, and closingMessage for every locale", () => {
  const matches = dictionarySource.match(/support: \{/g) ?? [];
  assert.equal(matches.length, 4, "type declaration + en + pt-BR + es");

  const storyMatches = dictionarySource.match(/story: \{\s*\n\s*eyebrow: "/g) ?? [];
  assert.equal(storyMatches.length, 3, "story section present in every locale (en/pt-BR/es)");

  const helpsMatches = dictionarySource.match(/helps: \{\s*\n\s*eyebrow: "/g) ?? [];
  assert.equal(helpsMatches.length, 3, "helps section present in every locale (en/pt-BR/es)");

  const transparencyMatches = dictionarySource.match(/transparency: \{\s*\n\s*title: "/g) ?? [];
  assert.equal(transparencyMatches.length, 3, "transparency section present in every locale (en/pt-BR/es)");

  const closingMatches = dictionarySource.match(/closingMessage:\s*\r?\n\s*"/g) ?? [];
  assert.equal(closingMatches.length, 3, "closingMessage present in every locale (en/pt-BR/es)");
});

test("support page copy never claims charity/nonprofit status or promises Pro access", () => {
  const enBlockMatch = dictionarySource.match(
    /support: \{\r?\n {6}metadataTitle: "Support QAVELIX"[\s\S]*?\r?\n {4}\},/,
  );
  assert.ok(enBlockMatch, "en support block should be found");
  const enBlock = enBlockMatch[0];

  assert.match(enBlock, /not a tax-deductible/i);
  assert.doesNotMatch(enBlock, /is a registered (charity|nonprofit)/i);
  // The transparency notice explicitly reassures contributors a contribution does NOT
  // unlock Pro — confirm that reassurance is present, and that Pro is never mentioned
  // as something a contribution grants.
  assert.match(enBlock, /doesn't unlock QAVELIX PRO/i);
  assert.doesNotMatch(enBlock, /grants QAVELIX PRO access|unlocks QAVELIX PRO access/i);
});
