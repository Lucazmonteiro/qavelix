import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import test from "node:test";

// Regression coverage for a real incident: the Tools menu pointed at
// /${locale}/tools/extract-audio while investigating a reported 404, and the fastest way
// to catch that class of bug again is to assert every href the menu constructs actually
// resolves to a real page.tsx on disk — a broken link here fails this test immediately,
// without needing a running server.
const headerSource = await readFile("src/components/app-header.tsx", "utf8");

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test("every Tools menu href in app-header.tsx resolves to a real page.tsx on disk", async () => {
  // Scoped to just the toolItems array (identified by its trailing `icon:` field) — the
  // sibling navigationItems array (about/faq/contact) intentionally resolves through the
  // dynamic [slug] catch-all route, not a literal folder per href, so it must not be
  // checked by this same "does a literal page.tsx exist" assertion.
  const toolItemsMatch = headerSource.match(/const toolItems = \[([\s\S]*?)\n  \];/);
  assert.ok(toolItemsMatch, "toolItems array should be found in app-header.tsx");
  const toolItemsBlock = toolItemsMatch[1];

  const hrefMatches = [...toolItemsBlock.matchAll(/href: `\/\$\{locale\}([^`]*)`,\s*\n\s*icon:/g)].map(
    (match) => match[1],
  );

  assert.ok(hrefMatches.length >= 2, "the Tools menu should define at least two items");

  for (const relativePath of hrefMatches) {
    // The homepage entry (Video Compressor) has no extra path segment — it's
    // src/app/[locale]/page.tsx directly, not src/app/[locale]/page.tsx/page.tsx.
    const pagePath = relativePath
      ? `src/app/[locale]${relativePath}/page.tsx`
      : `src/app/[locale]/page.tsx`;
    const exists = await fileExists(pagePath);
    assert.ok(exists, `${relativePath || "/"} should have a page at ${pagePath}`);
  }
});

test("the Extract Audio tools-menu href matches the real route directory exactly", () => {
  assert.match(headerSource, /href: `\/\$\{locale\}\/tools\/extract-audio`/);
});

test("the Video Trimmer tools-menu href matches the real route directory exactly", () => {
  assert.match(headerSource, /href: `\/\$\{locale\}\/tools\/video-trimmer`/);
});
