import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  acceptedExtensions,
  acceptedMimeTypes,
  formatBytes,
  isAcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_REQUEST_BYTES,
  UPLOAD_REQUEST_OVERHEAD_BYTES,
} from "../../src/lib/upload-policy.ts";

test("upload policy exposes the supported media constraints", () => {
  assert.equal(MAX_UPLOAD_BYTES, 250 * 1024 * 1024);
  assert.deepEqual(acceptedExtensions, [
    ".mp4",
    ".m4v",
    ".mov",
    ".webm",
    ".avi",
    ".mpg",
    ".mpeg",
  ]);
  assert.ok(acceptedMimeTypes.includes("video/mp4"));
  assert.ok(acceptedMimeTypes.includes("video/webm"));
});

test("upload request body limit is derived from the upload policy", () => {
  assert.equal(UPLOAD_REQUEST_OVERHEAD_BYTES, 2 * 1024 * 1024);
  assert.equal(
    MAX_UPLOAD_REQUEST_BYTES,
    MAX_UPLOAD_BYTES + UPLOAD_REQUEST_OVERHEAD_BYTES,
  );
  assert.ok(MAX_UPLOAD_REQUEST_BYTES > 136 * 1024 * 1024);
  assert.ok(MAX_UPLOAD_REQUEST_BYTES > MAX_UPLOAD_BYTES);
});

test("Next and API request limits use the shared upload request policy", async () => {
  const [nextConfig, uploadRoute, compressionRoute] = await Promise.all([
    readFile("next.config.ts", "utf8"),
    readFile("src/app/api/upload/analyze/route.ts", "utf8"),
    readFile("src/app/api/compression/jobs/route.ts", "utf8"),
  ]);

  assert.match(nextConfig, /proxyClientMaxBodySize:\s*MAX_UPLOAD_REQUEST_BYTES/);
  assert.match(uploadRoute, /MAX_UPLOAD_BYTES/);
  assert.doesNotMatch(uploadRoute, /MAX_UPLOAD_REQUEST_BYTES/);
  assert.match(compressionRoute, /MAX_UPLOAD_REQUEST_BYTES/);
  assert.doesNotMatch(compressionRoute, /MAX_UPLOAD_BYTES\s*\+/);
});

test("upload analysis route streams raw request bodies instead of buffering files", async () => {
  const uploadRoute = await readFile("src/app/api/upload/analyze/route.ts", "utf8");

  assert.doesNotMatch(uploadRoute, /request\.formData/);
  assert.doesNotMatch(uploadRoute, /\.arrayBuffer/);
  assert.doesNotMatch(uploadRoute, /Buffer\.concat/);
  assert.doesNotMatch(uploadRoute, /readFile\(/);
  assert.match(uploadRoute, /request\.body\.getReader\(\)/);
  assert.match(uploadRoute, /createWriteStream/);
  assert.match(uploadRoute, /receivedBytes > MAX_UPLOAD_BYTES/);
  assert.match(uploadRoute, /receivedBytes > declaredSize/);
  assert.match(uploadRoute, /receivedBytes !== declaredSize/);
});

test("formatBytes formats file sizes for user-facing validation messages", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(1024), "1.0 KB");
  assert.equal(formatBytes(10 * 1024), "10 KB");
  assert.equal(formatBytes(250 * 1024 * 1024), "250 MB");
});

test("isAcceptedMimeType narrows only supported video MIME types", () => {
  assert.equal(isAcceptedMimeType("video/mp4"), true);
  assert.equal(isAcceptedMimeType("video/quicktime"), true);
  assert.equal(isAcceptedMimeType("image/png"), false);
  assert.equal(isAcceptedMimeType("application/octet-stream"), false);
});
