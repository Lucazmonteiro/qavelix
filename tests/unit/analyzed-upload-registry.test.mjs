import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  cleanupExpiredAnalyzedUploads,
  consumeAnalyzedUploadReference,
  createAnalyzedUploadRecord,
  deleteAnalyzedUploadReference,
} from "../../src/lib/server/analyzed-upload-registry.ts";

const uploadDirectory = path.join(os.tmpdir(), "qavelix-upload-analysis");
const recordDirectory = path.join(uploadDirectory, "records");

const media = {
  durationSeconds: 1,
  bitrate: 128000,
  formatName: "mov,mp4,m4a,3gp,3g2,mj2",
  width: 320,
  height: 180,
  videoCodec: "h264",
  audioCodec: "aac",
  frameRate: 24,
};

async function createTempUpload(bytes = new Uint8Array([1, 2, 3, 4])) {
  await mkdir(uploadDirectory, { recursive: true });
  const filePath = path.join(uploadDirectory, `${randomUUID()}.mp4`);

  await writeFile(filePath, bytes, { mode: 0o600 });

  return filePath;
}

async function createRecord({ bytes, originalName = "source.mp4" } = {}) {
  const inputPath = await createTempUpload(bytes);
  const reference = await createAnalyzedUploadRecord({
    inputPath,
    originalName,
    mimeType: "video/mp4",
    extension: ".mp4",
    size: bytes?.byteLength ?? 4,
    media,
  });

  return { inputPath, ...reference };
}

function recordPathFromReference(reference) {
  const [id] = reference.split(".");

  return path.join(recordDirectory, `${id}.json`);
}

test("analyzed upload references are opaque and single-use", async () => {
  const { reference, inputPath } = await createRecord();

  assert.doesNotMatch(reference, /qavelix/i);
  assert.doesNotMatch(reference, /[\\/]/);

  const consumed = await consumeAnalyzedUploadReference(reference);

  assert.equal(consumed.ok, true);
  assert.equal(consumed.upload.inputPath, inputPath);
  assert.equal(consumed.upload.originalName, "source.mp4");
  assert.equal(consumed.upload.size, 4);

  const duplicate = await consumeAnalyzedUploadReference(reference);

  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.code, "consumed_reference");
  await rm(inputPath, { force: true });
});

test("tampered analyzed upload references are rejected without consuming records", async () => {
  const { reference, inputPath } = await createRecord();
  const [id] = reference.split(".");
  const tamperedReference = `${id}.${"a".repeat(43)}`;
  const tampered = await consumeAnalyzedUploadReference(tamperedReference);

  assert.equal(tampered.ok, false);
  assert.equal(tampered.code, "invalid_reference");

  const valid = await consumeAnalyzedUploadReference(reference);

  assert.equal(valid.ok, true);
  await rm(inputPath, { force: true });
});

test("expired analyzed upload records remove metadata and temp files", async () => {
  const { reference, inputPath } = await createRecord();
  const metadataPath = recordPathFromReference(reference);
  const record = JSON.parse(await readFile(metadataPath, "utf8"));

  record.expiresAt = new Date(Date.now() - 1000).toISOString();
  await writeFile(metadataPath, JSON.stringify(record), { mode: 0o600 });

  const expired = await consumeAnalyzedUploadReference(reference);

  assert.equal(expired.ok, false);
  assert.equal(expired.code, "expired_reference");
  await assert.rejects(stat(inputPath));
  await assert.rejects(stat(metadataPath));
});

test("missing temp files and metadata mismatches are rejected", async () => {
  const missing = await createRecord();
  await rm(missing.inputPath, { force: true });

  const missingResult = await consumeAnalyzedUploadReference(missing.reference);

  assert.equal(missingResult.ok, false);
  assert.equal(missingResult.code, "missing_file");

  const mismatch = await createRecord();
  await writeFile(mismatch.inputPath, new Uint8Array([1, 2, 3, 4, 5]), {
    mode: 0o600,
  });

  const mismatchResult = await consumeAnalyzedUploadReference(mismatch.reference);

  assert.equal(mismatchResult.ok, false);
  assert.equal(mismatchResult.code, "metadata_mismatch");
  await assert.rejects(stat(mismatch.inputPath));
});

test("analyzed upload references can be explicitly discarded and cleaned by expiry scan", async () => {
  const discarded = await createRecord();

  assert.equal(await deleteAnalyzedUploadReference(discarded.reference), true);
  await assert.rejects(stat(discarded.inputPath));

  const expired = await createRecord();
  const metadataPath = recordPathFromReference(expired.reference);
  const record = JSON.parse(await readFile(metadataPath, "utf8"));

  record.expiresAt = new Date(Date.now() - 1000).toISOString();
  await writeFile(metadataPath, JSON.stringify(record), { mode: 0o600 });
  await cleanupExpiredAnalyzedUploads();

  await assert.rejects(stat(expired.inputPath));
  await assert.rejects(stat(metadataPath));
});
