import assert from "node:assert/strict";
import test from "node:test";

import { assertStatus, fetchText, withNextServer } from "../helpers/next-server.mjs";

test("integration: localized routes, SEO endpoints, headers, and protected APIs", async (t) => {
  await withNextServer(async ({ baseUrl }) => {
    await t.test("redirects the root path to the default locale", async () => {
      const response = await fetch(`${baseUrl}/`, { redirect: "manual" });

      assertStatus(response, 307, "root redirect");
      assert.equal(response.headers.get("location"), "/en");
    });

    await t.test("renders localized legal placeholder pages", async () => {
      const pages = [
        { path: "/en/about", expected: "Secure media workflows" },
        { path: "/pt-BR/privacy-policy", expected: "Política de Privacidade" },
        { path: "/es/faq", expected: "Preguntas frecuentes" },
      ];

      for (const page of pages) {
        const { response, text } = await fetchText(`${baseUrl}${page.path}`);

        assertStatus(response, 200, page.path);
        assert.match(text, new RegExp(page.expected));
      }
    });

    await t.test("serves sitemap and robots for public SEO surfaces", async () => {
      const robots = await fetchText(`${baseUrl}/robots.txt`);
      const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);

      assertStatus(robots.response, 200, "robots.txt");
      assert.match(robots.text, /Disallow: \/api\//);
      assert.match(robots.text, /^Sitemap: https?:\/\/.+\/sitemap\.xml$/m);

      assertStatus(sitemap.response, 200, "sitemap.xml");
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/en\/about<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/pt-BR\/privacy-policy<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/es\/cookie-policy<\/loc>/);
    });

    await t.test("sends environment-appropriate CSP headers", async () => {
      const { response } = await fetchText(`${baseUrl}/en`);
      const csp = response.headers.get("content-security-policy") ?? "";

      assertStatus(response, 200, "home page");
      assert.match(csp, /default-src 'self'/);

      if (csp.includes("'unsafe-eval'")) {
        assert.doesNotMatch(csp, /upgrade-insecure-requests/);
      } else {
        assert.match(csp, /upgrade-insecure-requests/);
      }
    });

    await t.test(
      "rejects upload analysis without a same-origin file upload",
      async () => {
        const formData = new FormData();
        const response = await fetch(`${baseUrl}/api/upload/analyze`, {
          method: "POST",
          headers: {
            Origin: baseUrl,
          },
          body: formData,
        });
        const payload = await response.json();

        assertStatus(response, 400, "upload analyze missing file");
        assert.equal(payload.ok, false);
        assert.equal(payload.error.code, "missing_file");
      },
    );

    await t.test(
      "rejects compression creation without a same-origin file upload",
      async () => {
        const formData = new FormData();
        const response = await fetch(`${baseUrl}/api/compression/jobs`, {
          method: "POST",
          headers: {
            Origin: baseUrl,
          },
          body: formData,
        });
        const payload = await response.json();

        assertStatus(response, 400, "compression missing file");
        assert.equal(payload.ok, false);
        assert.match(payload.error.message, /Upload a single video file/);
      },
    );
  });
});
