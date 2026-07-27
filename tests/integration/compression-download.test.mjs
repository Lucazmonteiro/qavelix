import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

const execFileAsync = promisify(execFile);
// Randomized per process run so repeated local runs against the same persistent dev
// database don't replay the same synthetic IP sequence — see the matching comment in
// tests/integration/http.test.mjs for why a fixed starting value caused accumulating
// anonymous-quota exhaustion (401 account_required) across reruns.
const fingerprintRunSeed = Math.floor(Math.random() * 254) + 1;
let requestFingerprintCounter = 0;

function compressionRequestHeaders(baseUrl) {
  requestFingerprintCounter += 1;

  return {
    Origin: baseUrl,
    "X-Forwarded-For": `10.${fingerprintRunSeed}.99.${requestFingerprintCounter}`,
    "Content-Type": "application/json",
  };
}

async function createGeneratedVideoFile(
  fileName,
  {
    container = "mp4",
    durationSeconds = 1,
    mimeType = "video/mp4",
    videoCodec = "libx264",
    audioCodec = "aac",
    extraOutputArgs = [],
  } = {},
) {
  const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-test.${container}`);

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
      "testsrc=size=320x180:rate=24",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=1000:sample_rate=44100",
      "-t",
      String(durationSeconds),
      "-c:v",
      videoCodec,
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      audioCodec,
      ...extraOutputArgs,
      filePath,
    ],
    {
      timeout: 30_000,
      windowsHide: true,
    },
  );

  try {
    return new File([await readFile(filePath)], fileName, {
      type: mimeType,
    });
  } finally {
    await rm(filePath, { force: true });
  }
}

async function createAnalyzedUploadReference(baseUrl, file) {
  const response = await fetch(`${baseUrl}/api/upload/analyze`, {
    method: "POST",
    headers: {
      Origin: baseUrl,
      "X-Qavelix-File-Name": encodeURIComponent(file.name),
      "X-Qavelix-File-Size": String(file.size),
      "X-Qavelix-File-Type": file.type,
    },
    body: file.stream(),
    duplex: "half",
  });
  const payload = await readJson(response, `${file.name} upload analysis`);

  assertStatus(response, 200, `${file.name} upload analysis`);
  assert.equal(payload.ok, true);
  assert.ok(payload.analysis.uploadReference?.value);

  return payload.analysis.uploadReference.value;
}

async function createCompressionJobAndWait(baseUrl, file, { requireObservedProgress = false } = {}) {
  const uploadReference = await createAnalyzedUploadReference(baseUrl, file);
  const createResponse = await fetch(`${baseUrl}/api/compression/jobs`, {
    method: "POST",
    headers: compressionRequestHeaders(baseUrl),
    body: JSON.stringify({ uploadReference, preset: "balanced" }),
  });
  const createPayload = await readJson(createResponse, `${file.name} compression create`);

  assertStatus(createResponse, 202, `${file.name} compression create`);
  assert.equal(createPayload.ok, true);

  let latestJob = createPayload.job;
  const observedStatuses = new Set([latestJob.status]);
  const observedProgress = [];

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/compression/jobs/${latestJob.id}`);
    const payload = await readJson(response, `${file.name} compression poll ${attempt}`);

    assertStatus(response, 200, `${file.name} compression poll ${attempt}`);
    assert.equal(payload.ok, true);
    assert.equal(payload.job.id, latestJob.id);
    latestJob = payload.job;
    observedStatuses.add(latestJob.status);
    observedProgress.push(latestJob.progress);

    if (["completed", "optimized", "compression_ineffective"].includes(latestJob.status)) {
      break;
    }

    assert.doesNotMatch(latestJob.status, /failed|cancelled|deleted|expired/);
    await delay(500);
  }

  assert.ok(
    ["completed", "optimized", "compression_ineffective"].includes(latestJob.status),
    `${file.name} ended with ${JSON.stringify(latestJob)}`,
  );
  assert.equal(latestJob.progress, 100);
  assert.ok(latestJob.downloadUrl);
  if (requireObservedProgress) {
    assert.ok(observedStatuses.has("running") || observedStatuses.has("starting"));
    assert.ok(observedProgress.some((progress) => progress > 0));
  }

  return latestJob;
}

async function assertDownloadWorks(baseUrl, job, expectedName) {
  const response = await fetch(`${baseUrl}${job.downloadUrl}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const outputPath = path.join(os.tmpdir(), `${randomUUID()}-${expectedName}`);

  assertStatus(response, 200, `${expectedName} download`);
  assert.match(response.headers.get("content-type") ?? "", /video\/mp4/);
  assert.match(
    response.headers.get("content-disposition") ?? "",
    new RegExp(`attachment; filename="${expectedName}"`),
  );
  assert.ok(bytes.byteLength > 0);

  try {
    await writeFile(outputPath, bytes);
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=format_name:stream=codec_type,codec_name",
        "-of",
        "default=nw=1",
        outputPath,
      ],
      {
        timeout: 30_000,
        windowsHide: true,
      },
    );

    assert.match(stdout, /format_name=mov,mp4,m4a,3gp,3g2,mj2/);
    assert.match(stdout, /codec_type=video/);
  } finally {
    await rm(outputPath, { force: true });
  }

  return bytes.byteLength;
}

async function readJson(response, label) {
  const text = await response.text();

  assert.notEqual(text, "", `${label} returned an empty response`);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/json/,
    `${label} should return JSON, received ${text.slice(0, 160)}`,
  );

  return JSON.parse(text);
}

test("compression download route serves completed outputs and rejects unsafe requests", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const mp4File = await createGeneratedVideoFile("download-source.mp4");
    const mp4Job = await createCompressionJobAndWait(baseUrl, mp4File, {
      requireObservedProgress: true,
    });
    const outputPath = path.join(
      os.tmpdir(),
      "qavelix-compression",
      `${mp4Job.id}.compressed.mp4`,
    );

    assert.ok((await stat(outputPath)).isFile());
    await assertDownloadWorks(
      baseUrl,
      mp4Job,
      "download-source.qavelix-compressed.mp4",
    );

    await delay(1_000);
    await assertDownloadWorks(
      baseUrl,
      mp4Job,
      "download-source.qavelix-compressed.mp4",
    );
    assert.ok((await stat(outputPath)).isFile());

    // Two real, completed jobs from two different simulated actors (each call to
    // createAnalyzedUploadReference()/createCompressionJobAndWait() gets its own
    // fingerprint via compressionRequestHeaders()'s counter) — proves an actor's real,
    // valid token+signature for their own job cannot be reused to fetch a *different*
    // actor's job, not just that a garbage token is rejected.
    const aviFile = await createGeneratedVideoFile("download-source.avi", {
      container: "avi",
      mimeType: "video/avi",
      videoCodec: "mpeg4",
      audioCodec: "mp3",
    });
    const aviJob = await createCompressionJobAndWait(baseUrl, aviFile);

    await assertDownloadWorks(
      baseUrl,
      aviJob,
      "download-source.qavelix-compressed.mp4",
    );

    const crossActorUrl = mp4Job.downloadUrl.replace(mp4Job.id, aviJob.id);
    const crossActorResponse = await fetch(`${baseUrl}${crossActorUrl}`);
    const crossActorPayload = await readJson(
      crossActorResponse,
      "cross-actor download (mp4Job's token against aviJob's id)",
    );

    assertStatus(crossActorResponse, 404, "cross-actor compression download");
    assert.equal(crossActorPayload.ok, false);

    const invalidTokenUrl = mp4Job.downloadUrl.replace(
      /token=[^&]+/,
      "token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    const invalidTokenResponse = await fetch(`${baseUrl}${invalidTokenUrl}`);
    const invalidTokenPayload = await readJson(
      invalidTokenResponse,
      "invalid compression download token",
    );

    assertStatus(invalidTokenResponse, 404, "invalid compression download token");
    assert.equal(invalidTokenPayload.ok, false);

    const unknownResponse = await fetch(
      `${baseUrl}/api/compression/jobs/${randomUUID()}/download?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&signature=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
    );
    const unknownPayload = await readJson(
      unknownResponse,
      "unknown compression download job",
    );

    assertStatus(unknownResponse, 404, "unknown compression download job");
    assert.equal(unknownPayload.ok, false);

    await rm(outputPath, { force: true });
    const missingOutputResponse = await fetch(`${baseUrl}${mp4Job.downloadUrl}`);
    const missingOutputPayload = await readJson(
      missingOutputResponse,
      "missing compression output",
    );

    assertStatus(missingOutputResponse, 404, "missing compression output");
    assert.equal(missingOutputPayload.ok, false);

    const extractAudioFile = await createGeneratedVideoFile("extract-check.mp4", {
      durationSeconds: 8,
    });
    const extractAudioResponse = await fetch(`${baseUrl}/api/extract-audio`, {
      method: "POST",
      headers: {
        ...compressionRequestHeaders(baseUrl),
        "X-Qavelix-File-Name": encodeURIComponent(extractAudioFile.name),
        "X-Qavelix-File-Size": String(extractAudioFile.size),
        "X-Qavelix-File-Type": extractAudioFile.type,
        "Content-Type": extractAudioFile.type,
      },
      body: extractAudioFile.stream(),
      duplex: "half",
    });
    const extractAudioResponseForDebug = extractAudioResponse.clone();
    const extractAudioBytes = new Uint8Array(await extractAudioResponse.arrayBuffer());

    assert.equal(
      extractAudioResponse.status,
      200,
      `extract audio still downloads expected HTTP 200, received ${extractAudioResponse.status}: ${await extractAudioResponseForDebug.text()}`,
    );
    assert.match(extractAudioResponse.headers.get("content-type") ?? "", /audio\/mpeg/);
    assert.ok(extractAudioBytes.byteLength > 0);
  });
});
