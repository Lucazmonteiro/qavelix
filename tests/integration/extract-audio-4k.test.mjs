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

const mp4Header = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00,
  0x00, 0x02, 0x00,
]);

async function createMp4Fixture({
  durationSeconds = 1,
  silent = false,
  size = "3840x2160",
} = {}) {
  const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-extract.mp4`);
  const audioSource = silent
    ? "anullsrc=channel_layout=mono:sample_rate=44100"
    : "sine=frequency=1000:sample_rate=44100";

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
      audioSource,
      "-t",
      String(durationSeconds),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "32",
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
      timeout: 60_000,
      windowsHide: true,
    },
  );

  return filePath;
}

async function createCorruptedMp4Fixture() {
  const filePath = path.join(os.tmpdir(), `${randomUUID()}.qavelix-corrupt.mp4`);
  const bytes = Buffer.alloc(150 * 1024, 0x41);

  Buffer.from(mp4Header).copy(bytes, 0);
  await writeFile(filePath, bytes);

  return filePath;
}

async function readMedia(filePath) {
  const { stdout } = await execFileAsync(
    "ffprobe",
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", filePath],
    {
      timeout: 30_000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    },
  );

  return JSON.parse(stdout);
}

async function postVideo(baseUrl, route, filePath, fileName) {
  const body = await readFile(filePath);

  return fetch(`${baseUrl}${route}`, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "video/mp4",
      Origin: baseUrl,
      "X-Forwarded-For": `198.51.100.${Math.floor(Math.random() * 90) + 10}`,
      "X-Qavelix-File-Name": encodeURIComponent(fileName),
      "X-Qavelix-File-Size": String(body.byteLength),
      "X-Qavelix-File-Type": "video/mp4",
    },
  });
}

test("Extract Audio accepts valid audible 4K MP4s and keeps invalid media blocked", async () => {
  await withNextServer(async ({ baseUrl }) => {
    const createdFiles = [];

    try {
      const fourKPath = await createMp4Fixture();
      createdFiles.push(fourKPath);

      const fourKMedia = await readMedia(fourKPath);
      assert.ok(
        fourKMedia.streams.some(
          (stream) =>
            stream.codec_type === "video" &&
            stream.codec_name === "h264" &&
            stream.width === 3840 &&
            stream.height === 2160,
        ),
      );
      assert.ok(
        fourKMedia.streams.some(
          (stream) => stream.codec_type === "audio" && stream.codec_name === "aac",
        ),
      );

      const analysisResponse = await postVideo(
        baseUrl,
        "/api/extract-audio/analyze",
        fourKPath,
        "valid-4k.mp4",
      );
      const analysisPayload = await analysisResponse.json();

      assertStatus(analysisResponse, 200, "4K extract-audio analysis");
      assert.equal(analysisPayload.ok, true);
      assert.equal(analysisPayload.result, "valid_audio");
      assert.notEqual(analysisPayload.result, "invalid_media");

      const extractionResponse = await postVideo(
        baseUrl,
        "/api/extract-audio",
        fourKPath,
        "valid-4k.mp4",
      );
      const extractedBytes = Buffer.from(await extractionResponse.arrayBuffer());

      assertStatus(extractionResponse, 200, "4K extract-audio extraction");
      assert.equal(extractionResponse.headers.get("content-type"), "audio/mpeg");
      assert.ok(extractedBytes.byteLength > 0);

      const mp3Path = path.join(os.tmpdir(), `${randomUUID()}.qavelix-output.mp3`);
      createdFiles.push(mp3Path);
      await writeFile(mp3Path, extractedBytes);

      const mp3Media = await readMedia(mp3Path);
      assert.ok(
        mp3Media.streams.some(
          (stream) => stream.codec_type === "audio" && stream.codec_name === "mp3",
        ),
      );

      const corruptedPath = await createCorruptedMp4Fixture();
      createdFiles.push(corruptedPath);

      const corruptedResponse = await postVideo(
        baseUrl,
        "/api/extract-audio/analyze",
        corruptedPath,
        "corrupted.mp4",
      );
      const corruptedPayload = await corruptedResponse.json();

      assert.notEqual(corruptedResponse.status, 200);
      assert.equal(corruptedPayload.ok, false);
      assert.notEqual(corruptedPayload.result, "valid_audio");

      const silentPath = await createMp4Fixture({
        durationSeconds: 3,
        silent: true,
        size: "3840x2160",
      });
      createdFiles.push(silentPath);

      const silentResponse = await postVideo(
        baseUrl,
        "/api/extract-audio/analyze",
        silentPath,
        "silent.mp4",
      );
      const silentPayload = await silentResponse.json();

      assert.equal(
        silentResponse.status,
        422,
        `silent extract-audio analysis returned ${silentResponse.status}: ${JSON.stringify(silentPayload)}`,
      );
      assert.equal(silentPayload.ok, false);
      assert.equal(silentPayload.result, "silent_audio");
    } finally {
      await Promise.all(createdFiles.map((filePath) => rm(filePath, { force: true })));
    }
  });
});
