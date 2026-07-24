import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createCompressionEncodingPlan } from "../../src/lib/compression-policy.ts";

// compression-precheck.ts imports "@/lib/compression-policy", which the plain
// Node test runner cannot resolve without a bundler. Following this suite's
// existing pattern for other "@/"-importing server/lib modules (see
// compression-policy.test.mjs's regex assertions against compression-queue.ts
// and the download route), the new decision logic is verified against its raw
// source, while the shared bitrate/dimension math it depends on is verified
// behaviorally through the directly-importable compression-policy.ts.
const precheckSource = await readFile(
  "src/lib/compression-precheck.ts",
  "utf8",
);

const lowBitrateSource = {
  durationSeconds: 60,
  bitrate: 250_000,
  formatName: "mov,mp4,m4a,3gp,3g2,mj2",
  width: 640,
  height: 480,
  videoCodec: "h264",
  audioCodec: "aac",
  frameRate: 24,
};

test("safety margin constant is 1.2, applied after the downscale override", () => {
  assert.match(
    precheckSource,
    /export const COMPRESSION_RISK_SAFETY_MARGIN = 1\.2;/,
  );

  const downscaleIndex = precheckSource.indexOf("wasDownscaledToFullHd");
  const marginIndex = precheckSource.indexOf("COMPRESSION_RISK_SAFETY_MARGIN", precheckSource.indexOf("estimateCompressionRisk"));

  assert.ok(downscaleIndex > 0 && marginIndex > 0);
  assert.ok(
    downscaleIndex < marginIndex,
    "the will-downscale branch must be checked before the margin comparison",
  );
});

test("estimateCompressionRisk guards on bitrate, duration, and originalSize before estimating", () => {
  assert.match(precheckSource, /!metadata\.bitrate \|\|/);
  assert.match(precheckSource, /!metadata\.durationSeconds \|\|/);
  assert.match(precheckSource, /!originalSize \|\|/);
  assert.match(precheckSource, /reason: "insufficient-data"/);
  assert.match(precheckSource, /estimatedOutputBytes: null/);
});

test("estimateCompressionRisk formula matches the hand-verified cap-based estimate", () => {
  assert.match(
    precheckSource,
    /capTotalBitrateBps \* metadata\.durationSeconds\) \/ 8/,
  );
  assert.match(
    precheckSource,
    /\(videoKbps \+ audioKbps\) \* 1000/,
  );
  assert.match(
    precheckSource,
    /estimatedOutputBytes > originalSize \* COMPRESSION_RISK_SAFETY_MARGIN/,
  );
  assert.match(precheckSource, /reason: "capped-bitrate-exceeds-original"/);
  assert.match(precheckSource, /reason: "will-downscale"/);
  assert.match(precheckSource, /reason: "estimated-safe"/);
});

test("getPresetsLikelyToReduceSize filters presets by risk and excludes the given preset", () => {
  assert.match(
    precheckSource,
    /presetIds\.filter\(\s*\(presetId\) =>\s*presetId !== excludePresetId &&\s*!estimateCompressionRisk\(metadata, originalSize, presetId\)\.willLikelyIncrease,?\s*\)/,
  );
});

test("compression-precheck.ts never imports from compression-queue, ffmpeg, or any server module", () => {
  assert.doesNotMatch(precheckSource, /node:child_process/);
  assert.doesNotMatch(precheckSource, /compression-queue/);
  assert.doesNotMatch(precheckSource, /server\//);
  assert.match(precheckSource, /from "@\/lib\/compression-policy"/);
});

test("shared plan math: fixed caps once bitrate-floored, matching the pre-check's assumptions", () => {
  // Verifies the underlying compression-policy.ts math this file's derivation
  // comment relies on: once source bitrate is low enough that the 240kbps
  // floor binds, each preset's cap becomes a fixed value independent of the
  // exact source bitrate.
  const smallPlan = createCompressionEncodingPlan(lowBitrateSource, "small");
  const balancedPlan = createCompressionEncodingPlan(lowBitrateSource, "balanced");
  const highPlan = createCompressionEncodingPlan(lowBitrateSource, "high");

  assert.equal(smallPlan.videoMaxrate, "240k");
  assert.equal(smallPlan.audioBitrate, "96k");
  assert.equal(balancedPlan.videoMaxrate, "240k");
  assert.equal(balancedPlan.audioBitrate, "160k");
  assert.equal(highPlan.videoMaxrate, "240k");
  assert.equal(highPlan.audioBitrate, "256k");

  // Cap total bitrates: 336k, 400k, 496k respectively (video floor + audio).
  assert.equal(
    (Number.parseInt(smallPlan.videoMaxrate, 10) +
      Number.parseInt(smallPlan.audioBitrate, 10)) *
      1000,
    336_000,
  );
  assert.equal(
    (Number.parseInt(balancedPlan.videoMaxrate, 10) +
      Number.parseInt(balancedPlan.audioBitrate, 10)) *
      1000,
    400_000,
  );
  assert.equal(
    (Number.parseInt(highPlan.videoMaxrate, 10) +
      Number.parseInt(highPlan.audioBitrate, 10)) *
      1000,
    496_000,
  );
});

test("shared plan math: downscaling to Full HD is signaled for 4K sources regardless of bitrate", () => {
  const metadata = { ...lowBitrateSource, width: 3840, height: 2160 };
  const plan = createCompressionEncodingPlan(metadata, "small");

  assert.equal(plan.wasDownscaledToFullHd, true);
});

test("shared plan math: a high-bitrate 1080p source never hits the video bitrate floor", () => {
  const h2641080pSource = {
    durationSeconds: 5,
    bitrate: 8_000_000,
    formatName: "mov,mp4,m4a,3gp,3g2,mj2",
    width: 1920,
    height: 1080,
    videoCodec: "h264",
    audioCodec: "aac",
    frameRate: 30,
  };

  for (const presetId of ["small", "balanced", "high"]) {
    const plan = createCompressionEncodingPlan(h2641080pSource, presetId);

    assert.notEqual(plan.videoMaxrate, "240k", `preset ${presetId}`);
    assert.equal(plan.wasDownscaledToFullHd, false, `preset ${presetId}`);
  }
});
