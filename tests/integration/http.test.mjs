import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

import { assertStatus, fetchText, withNextServer } from "../helpers/next-server.mjs";

const execFileAsync = promisify(execFile);

const mp4Header = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00,
  0x02, 0x00,
]);

async function listUploadTempFiles() {
  try {
    return new Set(await readdir(path.join(os.tmpdir(), "qavelix-upload-analysis")));
  } catch {
    return new Set();
  }
}

const knownCompressionStatuses = [
  "queued",
  "starting",
  "running",
  "completed",
  "optimized",
  "compression_ineffective",
  "failed",
  "cancelled",
];

const terminalCompressionStatuses = [
  "completed",
  "optimized",
  "compression_ineffective",
  "failed",
  "cancelled",
];

const successfulCompressionStatuses = [
  "completed",
  "optimized",
  "compression_ineffective",
];
const uploadLimitBytes = 250 * 1024 * 1024;
let uploadTestFingerprintCounter = 150;
let compressionTestFingerprintCounter = 10;

function compressionRequestHeaders(baseUrl) {
  compressionTestFingerprintCounter += 1;

  return {
    Origin: baseUrl,
    "X-Forwarded-For": `203.0.113.${compressionTestFingerprintCounter}`,
    "Content-Type": "application/json",
  };
}

async function pollCompressionJob(baseUrl, jobId) {
  const response = await fetch(`${baseUrl}/api/compression/jobs/${jobId}`);
  const payload = await response.json();

  return { response, payload };
}

async function createGeneratedMp4File(
  fileName,
  { durationSeconds = 2, size = "320x180" } = {},
) {
  const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-test.mp4`);

  await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      `testsrc=size=${size}:rate=24`,
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=1000:sample_rate=44100",
      "-t",
      String(durationSeconds),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      filePath,
    ],
    {
      timeout: 30_000,
      windowsHide: true,
    },
  );

  try {
    return new File([await readFile(filePath)], fileName, {
      type: "video/mp4",
    });
  } finally {
    await rm(filePath, { force: true });
  }
}

function createGeneratedByteStream(totalBytes, { prefix = new Uint8Array() } = {}) {
  let sentBytes = 0;

  return new ReadableStream({
    pull(controller) {
      if (sentBytes >= totalBytes) {
        controller.close();
        return;
      }

      if (sentBytes === 0 && prefix.byteLength > 0) {
        const prefixedBytes = prefix.slice(0, Math.min(prefix.byteLength, totalBytes));
        sentBytes += prefixedBytes.byteLength;
        controller.enqueue(prefixedBytes);
        return;
      }

      const nextSize = Math.min(64 * 1024, totalBytes - sentBytes);
      sentBytes += nextSize;
      controller.enqueue(new Uint8Array(nextSize));
    },
  });
}

function createFailingUploadStream() {
  let pulled = false;

  return new ReadableStream({
    pull(controller) {
      if (!pulled) {
        pulled = true;
        controller.enqueue(mp4Header);
        return;
      }

      controller.error(new Error("simulated upload abort"));
    },
  });
}

async function postRawUpload(
  baseUrl,
  {
    body,
    name = "sample.mp4",
    size,
    type = "video/mp4",
    origin = baseUrl,
    extraHeaders = {},
  } = {},
) {
  uploadTestFingerprintCounter += 1;
  const headers = {
    Origin: origin,
    "X-Forwarded-For": `198.51.100.${uploadTestFingerprintCounter}`,
    ...extraHeaders,
  };

  if (name !== null) {
    headers["x-qavelix-file-name"] = encodeURIComponent(name);
  }

  if (size !== null) {
    headers["x-qavelix-file-size"] = String(
      size ?? (body && "byteLength" in body ? body.byteLength : 0),
    );
  }

  if (type !== null) {
    headers["x-qavelix-file-type"] = type;
  }

  const init = {
    method: "POST",
    headers,
  };

  if (body !== undefined) {
    init.body = body;

    if (body instanceof ReadableStream) {
      init.duplex = "half";
    }
  }

  return fetch(`${baseUrl}/api/upload/analyze`, init);
}

async function createAnalyzedUploadReference(baseUrl, file, name = file.name) {
  const response = await postRawUpload(baseUrl, {
    body: file.stream(),
    name,
    size: file.size,
    type: file.type,
  });
  const payload = await response.json();

  assertStatus(response, 200, "analyzed upload reference create");
  assert.equal(payload.ok, true);
  assert.ok(payload.analysis.uploadReference?.value);
  assert.ok(payload.analysis.uploadReference?.expiresAt);
  assert.doesNotMatch(JSON.stringify(payload), /qavelix-upload-analysis/i);

  return payload.analysis.uploadReference.value;
}

async function deleteAnalyzedUpload(baseUrl, uploadReference) {
  const response = await fetch(`${baseUrl}/api/upload/analyze`, {
    method: "DELETE",
    headers: {
      Origin: baseUrl,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadReference }),
  });

  assertStatus(response, 200, "delete analyzed upload reference");
}

async function createCompressionJobFromReference(baseUrl, file, preset) {
  const uploadReference = await createAnalyzedUploadReference(baseUrl, file);
  const response = await fetch(`${baseUrl}/api/compression/jobs`, {
    method: "POST",
    headers: compressionRequestHeaders(baseUrl),
    body: JSON.stringify({ uploadReference, preset }),
  });
  const payload = await response.json();

  return { response, payload, uploadReference };
}

async function createCompressionJobAndWait(baseUrl, file, preset) {
  const uploadReference = await createAnalyzedUploadReference(baseUrl, file);

  const createResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
    method: "POST",
    headers: compressionRequestHeaders(baseUrl),
    body: JSON.stringify({ uploadReference, preset }),
  });
  const createPayload = await createResponse.json();

  assertStatus(createResponse, 202, `${preset} compression job create`);
  assert.equal(createPayload.ok, true);

  let latestJob = createPayload.job;

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const { response, payload } = await pollCompressionJob(baseUrl, latestJob.id);

    assertStatus(response, 200, `${preset} compression job poll ${attempt}`);
    assert.equal(payload.ok, true);
    assert.equal(payload.job.id, latestJob.id);
    assert.ok(knownCompressionStatuses.includes(payload.job.status));

    latestJob = payload.job;

    if (terminalCompressionStatuses.includes(latestJob.status)) {
      break;
    }

    await delay(500);
  }

  assert.ok(
    successfulCompressionStatuses.includes(latestJob.status),
    `${preset} ended with ${JSON.stringify(latestJob)}`,
  );
  assert.equal(latestJob.progress, 100);
  assert.ok((latestJob.outputSize ?? 0) > 0);

  return latestJob;
}

test("integration: localized routes, SEO endpoints, headers, and protected APIs", async (t) => {
  await withNextServer(async ({ baseUrl, command }) => {
    await t.test("redirects the root path to the default locale", async () => {
      const response = await fetch(`${baseUrl}/`, { redirect: "manual" });

      assertStatus(response, 307, "root redirect");
      assert.equal(response.headers.get("location"), "/en");
    });

    await t.test("renders localized public pages without unfinished release language", async () => {
      const pages = [
        { path: "/en/about", expected: "Simple, secure video compression" },
        { path: "/pt-BR/privacy-policy", expected: "Última atualização" },
        { path: "/es/faq", expected: "Preguntas frecuentes" },
      ];

      for (const page of pages) {
        const { response, text } = await fetchText(`${baseUrl}${page.path}`);

        assertStatus(response, 200, page.path);
        assert.match(text, new RegExp(page.expected));
        assert.doesNotMatch(text, /placeholder|provisional|Phase 7|Fase 7/i);
      }
    });

    await t.test("renders the configured support email on public contact and legal pages", async () => {
      const pages = [
        "/en/contact",
        "/pt-BR/contact",
        "/es/contact",
        "/en/privacy-policy",
        "/pt-BR/terms",
        "/es/terms",
      ];

      for (const page of pages) {
        const { response, text } = await fetchText(`${baseUrl}${page}`);

        assertStatus(response, 200, page);
        assert.match(text, /qavelixhq@gmail\.com/);
        assert.match(text, /mailto:qavelixhq@gmail\.com/);
        assert.doesNotMatch(text, /Support email is not configured/);
        assert.doesNotMatch(text, /support@qavelix|privacy@qavelix|security@qavelix|legal@qavelix/i);
      }
    });

    await t.test("renders Google Search Console verification on public home pages", async () => {
      const verificationToken = "mwcIi8xSvEKz7P_4baNDZxKBlFP2ZwGM1T7fNjtq45U";
      const pages = ["/", "/en", "/pt-BR", "/es"];

      for (const page of pages) {
        const { response, text } = await fetchText(`${baseUrl}${page}`);

        assertStatus(response, 200, page);
        assert.match(
          text,
          new RegExp(
            `<meta name="google-site-verification" content="${verificationToken}"\\/?\\s*>`,
          ),
        );
      }
    });

    await t.test("serves sitemap and robots for public SEO surfaces", async () => {
      const robots = await fetchText(`${baseUrl}/robots.txt`);
      const sitemap = await fetchText(`${baseUrl}/sitemap.xml`);

      assertStatus(robots.response, 200, "robots.txt");
      assert.match(robots.text, /Disallow: \/api\//);
      assert.match(robots.text, /^Sitemap: https?:\/\/.+\/sitemap\.xml$/m);
      assert.match(
        robots.response.headers.get("cache-control") ?? "",
        /stale-while-revalidate=86400/,
      );

      assertStatus(sitemap.response, 200, "sitemap.xml");
      assert.match(sitemap.response.headers.get("content-type") ?? "", /application\/xml/);
      assert.match(sitemap.text, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
      assert.match(sitemap.text, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
      assert.match(sitemap.text, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/en\/about<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/pt-BR\/privacy-policy<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/es\/cookie-policy<\/loc>/);
      assert.match(sitemap.text, /<xhtml:link rel="alternate" hreflang="en" href="https?:\/\/.+\/en" \/>/);
      assert.match(sitemap.text, /<lastmod>[^<]+<\/lastmod>/);
      assert.match(sitemap.text, /<changefreq>weekly<\/changefreq>/);
      assert.match(sitemap.text, /<changefreq>monthly<\/changefreq>/);
      assert.match(sitemap.text, /<priority>1<\/priority>/);
      assert.match(sitemap.text, /<priority>0\.65<\/priority>/);
      assert.doesNotMatch(sitemap.text, /design-system|readiness/);

      // Extract Audio is a real, indexable public route (src/app/[locale]/tools/
      // extract-audio/page.tsx) that the sitemap previously omitted entirely — every
      // supported locale must be present, each with its own hreflang alternate block.
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/en\/tools\/extract-audio<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/pt-BR\/tools\/extract-audio<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/es\/tools\/extract-audio<\/loc>/);
      assert.match(
        sitemap.text,
        /<xhtml:link rel="alternate" hreflang="pt-BR" href="https?:\/\/.+\/pt-BR\/tools\/extract-audio" \/>/,
      );
      assert.match(sitemap.text, /<priority>0\.8<\/priority>/);
      // The Video Compressor intentionally has no separate route — it lives on the
      // localized homepage itself — so no /tools/video-compressor URL should ever appear.
      assert.doesNotMatch(sitemap.text, /video-compressor/);
      assert.match(
        sitemap.response.headers.get("cache-control") ?? "",
        /stale-while-revalidate=86400/,
      );
    });

    await t.test("sends environment-appropriate CSP headers", async () => {
      const { response } = await fetchText(`${baseUrl}/en`);
      const csp = response.headers.get("content-security-policy") ?? "";

      assertStatus(response, 200, "home page");
      assert.match(csp, /default-src 'self'/);

      if (command === "start") {
        assert.doesNotMatch(csp, /'unsafe-eval'/);
        assert.match(csp, /upgrade-insecure-requests/);
        return;
      }

      if (csp.includes("'unsafe-eval'")) {
        assert.doesNotMatch(csp, /upgrade-insecure-requests/);
      } else {
        assert.match(csp, /upgrade-insecure-requests/);
      }
    });

    await t.test(
      "rejects upload analysis without a same-origin file upload",
      async () => {
        const response = await postRawUpload(baseUrl, {
          body: undefined,
          size: 16,
        });
        const payload = await response.json();

        assertStatus(response, 400, "upload analyze missing file");
        assert.equal(payload.ok, false);
        assert.equal(payload.error.code, "missing_file");
      },
    );

    await t.test(
      "accepts same-origin raw streamed upload before media analysis",
      async () => {
        const beforeFiles = await listUploadTempFiles();
        const file = await createGeneratedMp4File("sample.mp4", {
          durationSeconds: 1,
        });
        const response = await postRawUpload(baseUrl, {
          body: file.stream(),
          size: file.size,
        });
        const payload = await response.json();
        const afterFiles = await listUploadTempFiles();

        assert.notEqual(response.status, 403);
        assertStatus(response, 200, "upload analyze streamed valid mp4");
        assert.equal(payload.ok, true);
        assert.equal(payload.analysis.file.name, "sample.mp4");
        assert.equal(payload.analysis.file.size, file.size);
        assert.equal(payload.analysis.file.mimeType, "video/mp4");
        assert.equal(payload.analysis.file.extension, ".mp4");
        assert.ok(payload.analysis.uploadReference?.value);
        assert.ok(payload.analysis.media.durationSeconds > 0);
        await deleteAnalyzedUpload(baseUrl, payload.analysis.uploadReference.value);
        const cleanupFiles = await listUploadTempFiles();
        assert.notDeepEqual(afterFiles, beforeFiles);
        assert.deepEqual(cleanupFiles, beforeFiles);
      },
    );

    await t.test("rejects cross-origin raw upload analysis", async () => {
      const response = await postRawUpload(baseUrl, {
        body: mp4Header,
        size: mp4Header.byteLength,
        origin: "https://attacker.example",
      });
      const payload = await response.json();

      assertStatus(response, 403, "upload analyze cross-origin");
      assert.equal(payload.ok, false);
      assert.match(payload.error.message, /origin is not allowed/i);
    });

    await t.test(
      "rejects same-origin upload analysis with invalid extension",
      async () => {
        const response = await postRawUpload(baseUrl, {
          body: mp4Header,
          name: "sample.txt",
          size: mp4Header.byteLength,
        });
        const payload = await response.json();

        assertStatus(response, 400, "upload analyze invalid extension");
        assert.equal(payload.ok, false);
        assert.equal(payload.error.code, "invalid_extension");
      },
    );

    await t.test("rejects raw upload analysis with missing file name metadata", async () => {
      const response = await postRawUpload(baseUrl, {
        body: mp4Header,
        name: null,
        size: mp4Header.byteLength,
      });
      const payload = await response.json();

      assertStatus(response, 400, "upload analyze missing name header");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "missing_file");
    });

    await t.test("rejects raw upload analysis with missing size metadata", async () => {
      const response = await postRawUpload(baseUrl, {
        body: mp4Header,
        size: null,
      });
      const payload = await response.json();

      assertStatus(response, 400, "upload analyze missing size header");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "invalid_size");
    });

    await t.test("rejects raw upload analysis with invalid size metadata", async () => {
      const response = await postRawUpload(baseUrl, {
        body: mp4Header,
        size: "-1",
      });
      const payload = await response.json();

      assertStatus(response, 400, "upload analyze invalid size header");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "invalid_size");
    });

    await t.test("rejects raw upload analysis with zero-byte size metadata", async () => {
      const response = await postRawUpload(baseUrl, {
        body: new Uint8Array(),
        size: 0,
      });
      const payload = await response.json();

      assertStatus(response, 400, "upload analyze zero size header");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "empty_file");
    });

    await t.test("rejects declared raw upload sizes over the upload limit", async () => {
      const response = await postRawUpload(baseUrl, {
        body: undefined,
        size: uploadLimitBytes + 1,
      });
      const payload = await response.json();

      assertStatus(response, 400, "upload analyze declared too large");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "file_too_large");
    });

    await t.test("rejects raw upload bytes that exceed the declared size", async () => {
      const beforeFiles = await listUploadTempFiles();
      const response = await postRawUpload(baseUrl, {
        body: mp4Header,
        size: mp4Header.byteLength - 1,
      });
      const payload = await response.json();
      const afterFiles = await listUploadTempFiles();

      assertStatus(response, 400, "upload analyze real bytes exceed declared");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "invalid_size");
      assert.deepEqual(afterFiles, beforeFiles);
    });

    await t.test("rejects truncated raw uploads and removes partial files", async () => {
      const beforeFiles = await listUploadTempFiles();
      const response = await postRawUpload(baseUrl, {
        body: mp4Header,
        size: mp4Header.byteLength + 1,
      });
      const payload = await response.json();
      const afterFiles = await listUploadTempFiles();

      assertStatus(response, 400, "upload analyze truncated");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "truncated_upload");
      assert.deepEqual(afterFiles, beforeFiles);
    });

    await t.test("rejects raw upload analysis with invalid MIME type", async () => {
      const response = await postRawUpload(baseUrl, {
        body: mp4Header,
        size: mp4Header.byteLength,
        type: "image/png",
      });
      const payload = await response.json();

      assertStatus(response, 400, "upload analyze invalid mime");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "invalid_mime");
    });

    await t.test("rejects raw upload analysis with spoofed binary signature", async () => {
      const beforeFiles = await listUploadTempFiles();
      const response = await postRawUpload(baseUrl, {
        body: new TextEncoder().encode("not an mp4 video"),
        size: 16,
      });
      const payload = await response.json();
      const afterFiles = await listUploadTempFiles();

      assertStatus(response, 400, "upload analyze spoofed signature");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "invalid_signature");
      assert.deepEqual(afterFiles, beforeFiles);
    });

    await t.test("rejects raw upload analysis when FFprobe cannot parse media", async () => {
      const beforeFiles = await listUploadTempFiles();
      const response = await postRawUpload(baseUrl, {
        body: createGeneratedByteStream(1024, { prefix: mp4Header }),
        size: 1024,
      });
      const payload = await response.json();
      const afterFiles = await listUploadTempFiles();

      assert.notEqual(response.status, 403);
      assert.equal(payload.ok, false);
      assert.ok(["ffprobe_failed", "ffprobe_unavailable"].includes(payload.error.code));
      assert.deepEqual(afterFiles, beforeFiles);
    });

    await t.test("cleans up partial files after an aborted raw upload stream", async () => {
      const beforeFiles = await listUploadTempFiles();

      await assert.rejects(
        postRawUpload(baseUrl, {
          body: createFailingUploadStream(),
          size: 1024,
        }),
      );
      await delay(250);

      const afterFiles = await listUploadTempFiles();
      assert.deepEqual(afterFiles, beforeFiles);
    });

    await t.test(
      "rejects compression creation without a validated upload reference",
      async () => {
        const response = await fetch(`${baseUrl}/api/compression/jobs`, {
          method: "POST",
          headers: compressionRequestHeaders(baseUrl),
          body: JSON.stringify({ preset: "balanced" }),
        });
        const payload = await response.json();

        assertStatus(response, 400, "compression missing reference");
        assert.equal(payload.ok, false);
        assert.equal(payload.error.code, "missing_reference");
      },
    );

    await t.test("rejects multipart compression creation after single-upload flow", async () => {
      const formData = new FormData();
      formData.set(
        "file",
        new File([mp4Header], "legacy.mp4", {
          type: "video/mp4",
        }),
      );
      formData.set("preset", "balanced");

        const response = await fetch(`${baseUrl}/api/compression/jobs`, {
          method: "POST",
          headers: {
            Origin: baseUrl,
            "X-Forwarded-For": `203.0.113.${++compressionTestFingerprintCounter}`,
          },
          body: formData,
        });
      const payload = await response.json();

      assertStatus(response, 400, "compression rejects multipart");
      assert.equal(payload.ok, false);
      assert.equal(payload.error.code, "invalid_request");
    });

    await t.test("rejects malformed and tampered upload references", async () => {
      for (const uploadReference of [
        "not-a-reference",
        `${randomUUID()}.tampered`,
      ]) {
        const response = await fetch(`${baseUrl}/api/compression/jobs`, {
          method: "POST",
          headers: compressionRequestHeaders(baseUrl),
          body: JSON.stringify({ uploadReference, preset: "balanced" }),
        });
        const payload = await response.json();

        assertStatus(response, 400, `compression rejects ${uploadReference}`);
        assert.equal(payload.ok, false);
        assert.ok(["malformed_reference", "invalid_reference"].includes(payload.error.code));
      }
    });

    await t.test("rejects duplicate compression requests for the same upload reference", async () => {
      const file = await createGeneratedMp4File("duplicate.mp4", {
        durationSeconds: 1,
      });
      const uploadReference = await createAnalyzedUploadReference(baseUrl, file);

      const firstResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
        method: "POST",
        headers: compressionRequestHeaders(baseUrl),
        body: JSON.stringify({ uploadReference, preset: "balanced" }),
      });
      const firstPayload = await firstResponse.json();

      assertStatus(firstResponse, 202, "first compression from reference");
      assert.equal(firstPayload.ok, true);

      const secondResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
        method: "POST",
        headers: compressionRequestHeaders(baseUrl),
        body: JSON.stringify({ uploadReference, preset: "balanced" }),
      });
      const secondPayload = await secondResponse.json();

      assertStatus(secondResponse, 400, "duplicate compression from reference");
      assert.equal(secondPayload.ok, false);
      assert.equal(secondPayload.error.code, "consumed_reference");
    });

    await t.test("discards an analyzed upload reference on request", async () => {
      const file = await createGeneratedMp4File("discarded.mp4", {
        durationSeconds: 1,
      });
      const uploadReference = await createAnalyzedUploadReference(baseUrl, file);

      const discardResponse = await fetch(`${baseUrl}/api/upload/analyze`, {
        method: "DELETE",
        headers: {
          Origin: baseUrl,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadReference }),
      });
      const discardPayload = await discardResponse.json();

      assertStatus(discardResponse, 200, "discard analyzed upload");
      assert.equal(discardPayload.ok, true);

      const compressionResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
        method: "POST",
        headers: compressionRequestHeaders(baseUrl),
        body: JSON.stringify({ uploadReference, preset: "balanced" }),
      });
      const compressionPayload = await compressionResponse.json();

      assertStatus(compressionResponse, 400, "discarded reference cannot compress");
      assert.equal(compressionPayload.ok, false);
      assert.equal(compressionPayload.error.code, "invalid_reference");
    });

    await t.test("creates a compression job that is immediately pollable", async () => {
      const file = await createGeneratedMp4File("queued.mp4", { durationSeconds: 1 });
      const { response: createResponse, payload: createPayload } =
        await createCompressionJobFromReference(baseUrl, file, "balanced");

      assertStatus(createResponse, 202, "compression job create");
      assert.equal(createPayload.ok, true);
      assert.match(createPayload.job.id, /^[0-9a-f-]{36}$/i);

      const pollResponse = await fetch(
        `${baseUrl}/api/compression/jobs/${createPayload.job.id}`,
      );
      const pollPayload = await pollResponse.json();

      assertStatus(pollResponse, 200, "compression job immediate poll");
      assert.equal(pollPayload.ok, true);
      assert.equal(pollPayload.job.id, createPayload.job.id);
      assert.ok(knownCompressionStatuses.includes(pollPayload.job.status));
    });

    await t.test("polls an API-created job through terminal status", async () => {
      const file = await createGeneratedMp4File("tracked.mp4", { durationSeconds: 1 });
      const { response: createResponse, payload: createPayload } =
        await createCompressionJobFromReference(baseUrl, file, "small");

      assertStatus(createResponse, 202, "tracked compression job create");

      let latestJob = createPayload.job;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        const { response, payload } = await pollCompressionJob(baseUrl, latestJob.id);

        assertStatus(response, 200, `tracked compression job poll ${attempt}`);
        assert.equal(payload.ok, true);
        assert.equal(payload.job.id, latestJob.id);
        assert.ok(knownCompressionStatuses.includes(payload.job.status));

        latestJob = payload.job;

        if (terminalCompressionStatuses.includes(latestJob.status)) {
          break;
        }

        await delay(250);
      }

      assert.ok(terminalCompressionStatuses.includes(latestJob.status));
      assert.notEqual(latestJob.status, "queued");
    });

    await t.test(
      "executes FFmpeg and completes a real compression job with a download",
      async () => {
        const file = await createGeneratedMp4File("generated.mp4");
        const { response: createResponse, payload: createPayload } =
          await createCompressionJobFromReference(baseUrl, file, "balanced");

        assertStatus(createResponse, 202, "real compression job create");

        let latestJob = createPayload.job;
        const observedStatuses = new Set([latestJob.status]);
        let pollAttempts = 0;

        for (let attempt = 0; attempt < 80; attempt += 1) {
          const { response, payload } = await pollCompressionJob(baseUrl, latestJob.id);
          pollAttempts += 1;

          assertStatus(response, 200, `real compression job poll ${attempt}`);
          assert.equal(payload.ok, true);
          assert.equal(payload.job.id, latestJob.id);
          assert.ok(knownCompressionStatuses.includes(payload.job.status));

          latestJob = payload.job;
          observedStatuses.add(latestJob.status);

          if (terminalCompressionStatuses.includes(latestJob.status)) {
            break;
          }

          await delay(500);
        }

        assert.ok(pollAttempts > 0);
        assert.ok(observedStatuses.has(latestJob.status));
        assert.ok(terminalCompressionStatuses.includes(latestJob.status));
        assert.ok(successfulCompressionStatuses.includes(latestJob.status));
        assert.equal(latestJob.progress, 100);
        assert.ok((latestJob.outputSize ?? 0) > 0);
        assert.ok(latestJob.compression);
        assert.ok(latestJob.downloadUrl);

        const downloadResponse = await fetch(`${baseUrl}${latestJob.downloadUrl}`);

        assertStatus(downloadResponse, 200, "real compression download");
        assert.match(downloadResponse.headers.get("content-type") ?? "", /video\/mp4/);
      },
    );

    await t.test(
      "compresses the same vertical source through every preset sequence",
      async () => {
        const sourceFile = await createGeneratedMp4File("vertical.mp4", {
          durationSeconds: 1,
          size: "540x960",
        });
        const sourceBytes = new Uint8Array(await sourceFile.arrayBuffer());
        const sequences = [
          ["high", "small", "balanced"],
          ["balanced", "high", "small"],
          ["small", "balanced", "high"],
        ];

        for (const sequence of sequences) {
          for (const preset of sequence) {
            const latestJob = await createCompressionJobAndWait(
              baseUrl,
              new File([sourceBytes], `vertical-${preset}.mp4`, {
                type: "video/mp4",
              }),
              preset,
            );

            assert.equal(latestJob.preset, preset);
          }
        }
      },
    );

    await t.test(
      "cancels a retrievable compression job without returning 404",
      async () => {
        const file = await createGeneratedMp4File("cancelled.mp4", {
          durationSeconds: 1,
        });
        const { response: createResponse, payload: createPayload } =
          await createCompressionJobFromReference(baseUrl, file, "high");

        assertStatus(createResponse, 202, "cancel compression job create");

        const cancelResponse = await fetch(
          `${baseUrl}/api/compression/jobs/${createPayload.job.id}`,
          {
            method: "DELETE",
            headers: {
              Origin: baseUrl,
            },
          },
        );
        const cancelPayload = await cancelResponse.json();

        assertStatus(cancelResponse, 200, "cancel compression job");
        assert.equal(cancelPayload.ok, true);
        assert.equal(cancelPayload.job.id, createPayload.job.id);
        assert.ok(knownCompressionStatuses.includes(cancelPayload.job.status));
      },
    );

    await t.test("returns 404 for unknown compression jobs only", async () => {
      const response = await fetch(`${baseUrl}/api/compression/jobs/${randomUUID()}`);
      const payload = await response.json();

      assertStatus(response, 404, "unknown compression job");
      assert.equal(payload.ok, false);
    });
  });
});
