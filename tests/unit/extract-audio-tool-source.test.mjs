import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// extract-audio-tool.tsx imports real "@/" value aliases (useLocaleState,
// useEntitlementGate) that Node's native TS loader can't resolve outside the Next.js
// build — same constraint as every other "@/"-importing module in this suite (see
// compression-panel-polling-source.test.mjs, entitlements-source.test.mjs). We assert
// against the real committed source directly instead of a hand-copied duplicate that
// could drift.
const source = await readFile("src/components/extract-audio-tool.tsx", "utf8");

// Regression coverage for the upload-limit audit's critical finding: this component's
// client-side pre-check used to hardcode the flat 250MB MAX_UPLOAD_BYTES constant,
// silently blocking a confirmed Pro actor from ever selecting a 250-500MB file in the
// browser even though the backend correctly allowed it. resolvedMaxUploadBytes must be
// derived from the entitlement gate's own resolved plan/limits (already fetched by
// useEntitlementGate for the upgrade-modal comparison, but previously unused for the
// size gate itself), and MAX_UPLOAD_BYTES may only remain as the safe pre-resolution
// fallback.
test("extract audio tool's client-side size check resolves the actor's real plan limit instead of a flat constant", () => {
  assert.match(
    source,
    /const resolvedMaxUploadBytes =\s*\n\s*gate\.plan === "pro" && gate\.proLimits\s*\n\s*\? gate\.proLimits\.maxUploadBytes\s*\n\s*: \(gate\.freeLimits\?\.maxUploadBytes \?\? MAX_UPLOAD_BYTES\);/,
  );
  // validateFile() must take the resolved limit as an explicit parameter — it has no
  // notion of plan itself, same convention as the server's validateFileIdentity().
  assert.match(
    source,
    /function validateFile\(file: File, maxUploadBytes: number\): ValidationErrorKey \| null/,
  );
  assert.match(source, /file\.size > maxUploadBytes/);
  assert.match(source, /validateFile\(file, resolvedMaxUploadBytes\)/);
  // MAX_UPLOAD_BYTES must survive only as the loading-state fallback, never as the size
  // actually compared against a selected file once the gate has resolved a real plan.
  assert.doesNotMatch(source, /file\.size > MAX_UPLOAD_BYTES/);
});

// The displayed upload-size copy (dropzone description, "file too large" validation and
// processing errors) must reflect the same resolved limit as the validation logic above
// — a Pro actor must never be shown a message claiming a 250MB ceiling for a file the
// backend would actually accept.
test("extract audio tool's displayed upload-limit copy uses the same resolved limit as validation", () => {
  assert.match(
    source,
    /const uploadDescription = copy\.uploadDescription\.replace\(\s*\n\s*"\{maxSize\}",\s*\n\s*formatBytes\(resolvedMaxUploadBytes\),\s*\n\s*\);/,
  );
  assert.match(source, /\{uploadDescription\}/);
  assert.doesNotMatch(source, /\{copy\.uploadDescription\}/);
  assert.match(
    source,
    /copy\.validation\[validationErrorKey\]\.replace\("\{maxSize\}", formatBytes\(resolvedMaxUploadBytes\)\)/,
  );
  assert.match(
    source,
    /copy\.errors\[processingErrorKey\]\.replace\("\{maxSize\}", formatBytes\(resolvedMaxUploadBytes\)\)/,
  );
});

test("extract audio tool's resolved limit is used only for the client-side gate, never sent to the server", () => {
  // resolvedMaxUploadBytes exists purely to avoid blocking a confirmed Pro actor
  // client-side; the actual requests to /api/extract-audio/analyze and /api/extract-audio
  // send only the file itself and its own name/size/type headers — the server
  // independently resolves the actor's real plan from the session (see
  // extract-audio/route.ts, extract-audio/analyze/route.ts), never from anything the
  // client claims about its own limit.
  const requestHeaderBlocks = source.match(/headers:\s*\{[^}]*\}/gs) ?? [];
  assert.ok(requestHeaderBlocks.length > 0, "expected fetch() header blocks in source");
  for (const block of requestHeaderBlocks) {
    assert.doesNotMatch(block, /resolvedMaxUploadBytes/);
  }
});
