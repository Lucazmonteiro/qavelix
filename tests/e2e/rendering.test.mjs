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
    assert.match(text, /Design system/);
    assert.match(text, /Accessibility/);
    assert.match(text, /Readiness/);
    assert.doesNotMatch(text, /Product<\/a>/);
    assert.doesNotMatch(
      text,
      /<a class="primary-nav__link"[^>]*>Upload validation<\/a>/,
    );
    assert.match(text, /Compression/);
    assert.match(text, /Drop one video for compression/);
    assert.equal(
      [...text.matchAll(/<label class="upload-dropzone/g)].length,
      1,
      "home page renders one unified upload surface",
    );
    assert.ok(
      text.indexOf("Drop one video for compression") <
        text.indexOf("Validation runs automatically"),
      "upload tool renders before supporting preview content",
    );
    assert.match(text, /aria-label="English"/);
    assert.match(text, /aria-label="Português \(Brasil\)"/);
    assert.match(text, /aria-label="Español"/);
    assert.match(text, /class="language-selector__flag"/);
    assert.match(text, /<span class="sr-only">English<\/span>/);
    assert.doesNotMatch(text, /context-back-button/);
    assert.doesNotMatch(text, />Back</);
    assert.match(text, /data-theme-option="light"/);
    assert.match(text, /data-theme-option="dark"/);
    assert.match(text, /qavelix-theme/);
    assert.match(text, /qavelix-theme-script/);
    assert.match(text, /data-navigation-origin="primary-navigation"/);
    assert.match(text, /id="footer-navigation"/);
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

test("e2e: favicon and web manifest are production-ready", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const home = await fetchText(`${baseUrl}/en`);
    const favicon = await fetchText(`${baseUrl}/favicon.svg`);
    const manifest = await fetchText(`${baseUrl}/site.webmanifest`);
    const manifestPayload = JSON.parse(manifest.text);

    assertStatus(home.response, 200, "English home page");
    assert.match(home.text, /rel="icon"/);
    assert.match(home.text, /href="\/favicon\.svg"/);
    assert.match(home.text, /rel="manifest"/);
    assert.match(home.text, /href="\/site\.webmanifest"/);

    assertStatus(favicon.response, 200, "favicon");
    assert.match(favicon.response.headers.get("content-type") ?? "", /image\/svg\+xml/);
    assert.match(
      favicon.response.headers.get("cache-control") ?? "",
      /stale-while-revalidate=604800/,
    );

    assertStatus(manifest.response, 200, "web manifest");
    assert.match(
      manifest.response.headers.get("content-type") ?? "",
      /application\/manifest\+json|application\/json/,
    );
    assert.match(
      manifest.response.headers.get("cache-control") ?? "",
      /stale-while-revalidate=86400/,
    );
    assert.equal(manifestPayload.name, "QAVELIX");
    assert.equal(manifestPayload.start_url, "/en");
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

test("e2e: initial pages do not render static contextual Back buttons", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const pages = [
      "/en",
      "/en#compression",
      "/pt-BR",
      "/pt-BR/contact",
      "/es",
      "/es/privacy-policy",
    ];

    for (const page of pages) {
      const { response, text } = await fetchText(`${baseUrl}${page}`);

      assertStatus(response, 200, page);
      assert.doesNotMatch(text, /context-back-button/);
      assert.doesNotMatch(text, />Back</);
      assert.doesNotMatch(text, />Voltar</);
      assert.doesNotMatch(text, />Volver</);
    }
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
