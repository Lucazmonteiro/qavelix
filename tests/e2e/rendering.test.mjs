import assert from "node:assert/strict";
import test from "node:test";

import { assertStatus, fetchText, withNextServer } from "../helpers/next-server.mjs";

function stylesheetHrefs(html) {
  return [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map(
    (match) => match[1],
  );
}

function scriptSrcs(html) {
  return [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
}

test("e2e: localized home page renders the complete interactive shell", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const { response, text } = await fetchText(`${baseUrl}/en`);

    assertStatus(response, 200, "English home page");
    assert.match(text, /QAVELIX/);
    assert.match(text, /Upload validation/);
    assert.match(text, /Compression/);
    assert.match(text, /data-theme-option="light"/);
    assert.match(text, /data-theme-option="dark"/);
    assert.match(text, /qavelix-theme/);
    assert.match(text, /document\.addEventListener\("click"/);
  });
});

test("e2e: rendered CSS and JavaScript assets are reachable", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const { text } = await fetchText(`${baseUrl}/en`);
    const stylesheets = stylesheetHrefs(text);
    const scripts = scriptSrcs(text);

    assert.ok(stylesheets.length > 0, "at least one stylesheet is linked");
    assert.ok(scripts.length > 0, "at least one script is linked");

    const stylesheet = await fetchText(`${baseUrl}${stylesheets[0]}`);

    assertStatus(stylesheet.response, 200, "global stylesheet");
    assert.match(stylesheet.response.headers.get("content-type") ?? "", /^text\/css/);
    assert.match(stylesheet.text, /\.site-header__inner/);

    const appScript = await fetchText(
      `${baseUrl}${scripts.find((src) => src.includes("_next/static/chunks/"))}`,
    );

    assertStatus(appScript.response, 200, "client script chunk");
    assert.match(
      appScript.response.headers.get("content-type") ?? "",
      /javascript|text\/plain/,
    );
  });
});

test("e2e: SEO and legal pages expose metadata and localized content", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const { response, text } = await fetchText(`${baseUrl}/es/terms`);

    assertStatus(response, 200, "Spanish terms page");
    assert.match(text, /Términos/);
    assert.match(text, /rel="canonical"/);
    assert.match(text, /hrefLang="en"/);
    assert.match(text, /hrefLang="pt-BR"/);
    assert.match(text, /property="og:title"/);
    assert.match(text, /name="twitter:card"/);
  });
});

test("e2e: FAQ page includes structured data for search engines", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const { response, text } = await fetchText(`${baseUrl}/en/faq`);

    assertStatus(response, 200, "English FAQ page");
    assert.match(text, /application\/ld\+json/);
    assert.match(text, /FAQPage/);
    assert.match(text, /Does QAVELIX store uploaded files/);
  });
});
