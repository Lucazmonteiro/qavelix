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
let compressionTestFingerprintCounter = 10;

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

async function createCompressionJobAndWait(baseUrl, file, preset) {
  compressionTestFingerprintCounter += 1;
  const fingerprintIp = `203.0.113.${compressionTestFingerprintCounter}`;
  const formData = new FormData();
  formData.set("file", file);
  formData.set("preset", preset);

  const createResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
    method: "POST",
    headers: {
      Origin: baseUrl,
      "X-Forwarded-For": fingerprintIp,
    },
    body: formData,
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
      assert.match(
        robots.response.headers.get("cache-control") ?? "",
        /stale-while-revalidate=86400/,
      );

      assertStatus(sitemap.response, 200, "sitemap.xml");
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/en\/about<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/pt-BR\/privacy-policy<\/loc>/);
      assert.match(sitemap.text, /<loc>https?:\/\/.+\/es\/cookie-policy<\/loc>/);
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
      "accepts same-origin multipart upload before media analysis",
      async () => {
        const beforeFiles = await listUploadTempFiles();
        const formData = new FormData();
        formData.set(
          "file",
          new File([mp4Header], "sample.mp4", {
            type: "video/mp4",
          }),
        );

        const response = await fetch(`${baseUrl}/api/upload/analyze`, {
          method: "POST",
          headers: {
            Origin: baseUrl,
          },
          body: formData,
        });
        const payload = await response.json();
        const afterFiles = await listUploadTempFiles();

        assert.notEqual(response.status, 403);
        assert.equal(payload.ok, false);
        assert.ok(["ffprobe_failed", "ffprobe_unavailable"].includes(payload.error.code));
        assert.deepEqual(afterFiles, beforeFiles);
      },
    );

    await t.test("rejects cross-origin multipart upload analysis", async () => {
      const formData = new FormData();
      formData.set(
        "file",
        new File([mp4Header], "sample.mp4", {
          type: "video/mp4",
        }),
      );

      const response = await fetch(`${baseUrl}/api/upload/analyze`, {
        method: "POST",
        headers: {
          Origin: "https://attacker.example",
        },
        body: formData,
      });
      const payload = await response.json();

      assertStatus(response, 403, "upload analyze cross-origin");
      assert.equal(payload.ok, false);
      assert.match(payload.error.message, /origin is not allowed/i);
    });

    await t.test(
      "rejects same-origin upload analysis with invalid extension",
      async () => {
        const formData = new FormData();
        formData.set(
          "file",
          new File([mp4Header], "sample.txt", {
            type: "video/mp4",
          }),
        );

        const response = await fetch(`${baseUrl}/api/upload/analyze`, {
          method: "POST",
          headers: {
            Origin: baseUrl,
          },
          body: formData,
        });
        const payload = await response.json();

        assertStatus(response, 400, "upload analyze invalid extension");
        assert.equal(payload.ok, false);
        assert.equal(payload.error.code, "invalid_extension");
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

    await t.test("creates a compression job that is immediately pollable", async () => {
      const formData = new FormData();
      formData.set(
        "file",
        new File([mp4Header], "queued.mp4", {
          type: "video/mp4",
        }),
      );
      formData.set("preset", "balanced");

      const createResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
        method: "POST",
        headers: {
          Origin: baseUrl,
        },
        body: formData,
      });
      const createPayload = await createResponse.json();

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
      const formData = new FormData();
      formData.set(
        "file",
        new File([mp4Header], "tracked.mp4", {
          type: "video/mp4",
        }),
      );
      formData.set("preset", "small");

      const createResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
        method: "POST",
        headers: {
          Origin: baseUrl,
        },
        body: formData,
      });
      const createPayload = await createResponse.json();

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
        const formData = new FormData();
        formData.set("file", await createGeneratedMp4File("generated.mp4"));
        formData.set("preset", "balanced");

        const createResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
          method: "POST",
          headers: {
            Origin: baseUrl,
          },
          body: formData,
        });
        const createPayload = await createResponse.json();

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
        const formData = new FormData();
        formData.set(
          "file",
          new File([mp4Header], "cancelled.mp4", {
            type: "video/mp4",
          }),
        );
        formData.set("preset", "high");

        const createResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
          method: "POST",
          headers: {
            Origin: baseUrl,
          },
          body: formData,
        });
        const createPayload = await createResponse.json();

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
