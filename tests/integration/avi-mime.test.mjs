import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import { assertStatus, withNextServer } from "../helpers/next-server.mjs";

const execFileAsync = promisify(execFile);

async function createAviFixture() {
  const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-avi-test.avi`);

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
      "testsrc=size=1280x720:rate=30",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=1000:sample_rate=44100",
      "-t",
      "2",
      "-c:v",
      "mpeg4",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      filePath,
    ],
    {
      timeout: 60_000,
      windowsHide: true,
    },
  );

  return filePath;
}

async function createFakeAviFixture() {
  const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-fake.avi`);
  const bytes = Buffer.alloc(150 * 1024, 0x41);

  await writeFile(filePath, bytes);

  return filePath;
}

async function postRawVideo(baseUrl, route, filePath, fileName, mimeType) {
  const body = await readFile(filePath);

  return fetch(`${baseUrl}${route}`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": mimeType,
      Origin: baseUrl,
      "X-Forwarded-For": `198.51.100.${Math.floor(Math.random() * 90) + 10}`,
      "X-Qavelix-File-Name": encodeURIComponent(fileName),
      "X-Qavelix-File-Size": String(body.byteLength),
      "X-Qavelix-File-Type": mimeType,
    },
  });
}

test("AVI MIME variants are accepted through the shared upload policy", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const createdFiles = [];

    try {
      const aviPath = await createAviFixture();
      createdFiles.push(aviPath);

      const uploadResponse = await postRawVideo(
        baseUrl,
        "/api/upload/analyze",
        aviPath,
        "valid.avi",
        "video/avi",
      );
      const uploadPayload = await uploadResponse.json();

      assertStatus(uploadResponse, 200, "Video Compressor AVI analysis");
      assert.equal(uploadPayload.ok, true);
      assert.equal(uploadPayload.analysis.file.mimeType, "video/avi");
      assert.equal(uploadPayload.analysis.file.extension, ".avi");
      assert.equal(uploadPayload.analysis.media.formatName, "avi");
      assert.equal(uploadPayload.analysis.media.videoCodec, "mpeg4");
      assert.equal(uploadPayload.analysis.media.audioCodec, "mp3");

      const extractAnalysisResponse = await postRawVideo(
        baseUrl,
        "/api/extract-audio/analyze",
        aviPath,
        "valid.avi",
        "video/msvideo",
      );
      const extractAnalysisPayload = await extractAnalysisResponse.json();

      assertStatus(extractAnalysisResponse, 200, "Extract Audio AVI analysis");
      assert.equal(extractAnalysisPayload.ok, true);
      assert.equal(extractAnalysisPayload.result, "valid_audio");

      const extractResponse = await postRawVideo(
        baseUrl,
        "/api/extract-audio",
        aviPath,
        "valid.avi",
        "video/vnd.avi",
      );
      const mp3Bytes = Buffer.from(await extractResponse.arrayBuffer());

      assertStatus(extractResponse, 200, "Extract Audio AVI extraction");
      assert.equal(extractResponse.headers.get("content-type"), "audio/mpeg");
      assert.ok(mp3Bytes.byteLength > 0);

      const fakeAviPath = await createFakeAviFixture();
      createdFiles.push(fakeAviPath);

      const fakeResponse = await postRawVideo(
        baseUrl,
        "/api/upload/analyze",
        fakeAviPath,
        "fake.avi",
        "video/avi",
      );
      const fakePayload = await fakeResponse.json();

      assertStatus(fakeResponse, 400, "fake AVI analysis");
      assert.equal(fakePayload.ok, false);
      assert.equal(fakePayload.error.code, "invalid_signature");

      const genericResponse = await postRawVideo(
        baseUrl,
        "/api/extract-audio/analyze",
        aviPath,
        "valid.avi",
        "application/octet-stream",
      );
      const genericPayload = await genericResponse.json();

      assertStatus(genericResponse, 400, "generic AVI MIME analysis");
      assert.equal(genericPayload.ok, false);
      assert.equal(genericPayload.result, "unsupported_format");
    } finally {
      await Promise.all(createdFiles.map((filePath) => rm(filePath, { force: true })));
    }
  });
});
