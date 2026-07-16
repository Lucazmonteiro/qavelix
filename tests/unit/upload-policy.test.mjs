import assert from "node:assert/strict";
import test from "node:test";

import {
  acceptedExtensions,
  acceptedMimeTypes,
  formatBytes,
  isAcceptedMimeType,
  MAX_UPLOAD_BYTES,
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
