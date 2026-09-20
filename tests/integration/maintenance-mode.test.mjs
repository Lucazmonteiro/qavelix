import assert from "node:assert/strict";
import test from "node:test";

import { fetchText, withNextServer } from "../helpers/next-server.mjs";

// The shutdown gate lives in src/proxy.ts, in front of every route handler. Every path
// below must answer 503 immediately — including ones that would otherwise hit the
// database, FFmpeg, or Stripe — with no styled app shell and no redirect.
const paths = [
  ["GET", "/"],
  ["GET", "/en"],
  ["GET", "/en/tools/extract-audio"],
  ["GET", "/tools/compress"],
  ["GET", "/robots.txt"],
  ["POST", "/api/upload/analyze"],
  ["POST", "/api/compression/jobs"],
  ["POST", "/api/extract-audio"],
  ["POST", "/api/video-trimmer/jobs"],
  ["POST", "/api/worker/dispatch"],
  ["POST", "/api/auth/stripe/webhook"],
  ["POST", "/api/support/checkout"],
  ["GET", "/api/entitlements/status?tool=video-compressor"],
];

test("maintenance mode answers 503 for every page and endpoint", async () => {
  await withNextServer(
    async ({ baseUrl }) => {
      for (const [method, path] of paths) {
        const { response, text } = await fetchText(`${baseUrl}${path}`, {
          method,
          redirect: "manual",
          ...(method === "POST" ? { body: "{}" } : {}),
        });

        assert.equal(response.status, 503, `${method} ${path} expected 503`);
        assert.ok(response.headers.get("retry-after"), `${method} ${path} needs Retry-After`);
        assert.equal(response.headers.get("cache-control"), "no-store");

        if (path.startsWith("/api/")) {
          assert.equal(JSON.parse(text).error.code, "service_unavailable");
        } else {
          assert.match(text, /Service Temporarily Unavailable/);
          assert.doesNotMatch(text, /<link|<script/i, `${path} must be unstyled`);
        }
      }
    },
    { maintenance: true },
  );
});
