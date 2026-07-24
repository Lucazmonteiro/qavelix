import assert from "node:assert/strict";
import test from "node:test";

import { summarizeSilenceCoverageFromStderr } from "../../src/lib/silence-detection.ts";

test("silence coverage rejects audio silent for the whole relevant duration", () => {
  const summary = summarizeSilenceCoverageFromStderr(
    [
      "[silencedetect @ 000001] silence_start: 0",
      "[silencedetect @ 000001] silence_end: 9.82 | silence_duration: 9.82",
    ].join("\n"),
    10,
  );

  assert.equal(summary.isSilent, true);
  assert.equal(summary.threshold, "-50dB");
  assert.equal(summary.minimumSilenceDurationSeconds, 0.5);
  assert.equal(summary.toleranceSeconds, 0.35);
});

test("silence coverage allows videos with partial silence and audible sections", () => {
  const summary = summarizeSilenceCoverageFromStderr(
    [
      "[silencedetect @ 000001] silence_start: 0",
      "[silencedetect @ 000001] silence_end: 1.2 | silence_duration: 1.2",
      "[silencedetect @ 000001] silence_start: 4.4",
      "[silencedetect @ 000001] silence_end: 5.1 | silence_duration: 0.7",
    ].join("\n"),
    8,
  );

  assert.equal(summary.isSilent, false);
  assert.ok(summary.audibleSeconds > 5);
});

test("silence coverage treats no detected silence as audible audio", () => {
  const summary = summarizeSilenceCoverageFromStderr(
    "ffmpeg processing log without silencedetect intervals",
    3,
  );

  assert.equal(summary.isSilent, false);
  assert.equal(summary.silentSeconds, 0);
  assert.equal(summary.audibleSeconds, 3);
});
