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
const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");

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

// The static dropzone description now states both plans' fixed limits directly (never
// a single "your limit" claim), so it needs no interpolation — but "file too large"
// validation and processing errors must still reflect the actor's real resolved limit,
// since a Pro actor must never be told a file was rejected for exceeding 250MB when the
// backend would actually accept it.
test("extract audio tool's displayed upload-limit copy uses the same resolved limit as validation", () => {
  assert.match(source, /const uploadDescription = copy\.uploadDescription;/);
  assert.doesNotMatch(source, /uploadDescription\.replace\(\s*\n\s*"\{maxSize\}"/);
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

// Same regression class as compression-panel: confirms file-picker/drag-and-drop wiring
// stays intact and gated only by isBlocked, so a real future regression here fails a test
// instead of only surfacing as "the tool stopped working" in a live bug report.
test("extract audio's file-picker and drag-and-drop selection remain wired to setSelectedFiles(), gated only by isBlocked", () => {
  assert.match(source, /const isBlocked = gate\.blocked;/);
  assert.match(source, /onChange=\{\(event\) => setSelectedFiles\(event\.target\.files\)\}/);
  assert.match(source, /disabled=\{isBlocked\}/);
  assert.match(
    source,
    /onDrop=\{\(event\) => \{\s*\n\s*event\.preventDefault\(\);\s*\n\s*setIsDragging\(false\);\s*\n\s*\n\s*if \(isBlocked\) \{\s*\n\s*return;\s*\n\s*\}\s*\n\s*\n\s*setSelectedFiles\(event\.dataTransfer\.files\);/,
  );
});

test("extract audio's upload-limit UI and both modals only render once every limit field they read is defined", () => {
  assert.match(
    source,
    /\{gate\.freeLimits && gate\.proLimits \? \(\s*\n\s*<dl className="upload-limit-comparison">/,
  );
  assert.match(
    source,
    /\{gate\.plan === "anonymous" && gate\.anonymousLimits && gate\.freeLimits && gate\.proLimits \? \(\s*\n\s*<PlanComparisonModal/,
  );
  assert.match(
    source,
    /\{gate\.plan === "free" && gate\.freeLimits && gate\.proLimits \? \(\s*\n\s*<UpgradeModal/,
  );
});

test("extract audio upload-limit info states both Free and Pro limits, not just the viewer's resolved plan", () => {
  const uploadDescriptionMatch = dictionarySource.match(
    /uploadDescription:\s*\n\s*"Choose a supported video file for audio extraction\.\\nAccepted formats: MP4, MOV, AVI, WebM, M4V, MPEG and MPG\.\\nFree plan: 100 KB to 250 MB per file\.\\nPro plan: 100 KB to 500 MB per file\."/,
  );
  assert.ok(uploadDescriptionMatch, "extractAudio.uploadDescription should state both plan limits");
  assert.doesNotMatch(dictionarySource, /Size allowed: 100 KB to \{maxSize\} per video\.",\s*\n\s*privacyMessage/);
});

// Improvement 4 ("make Free 250MB / Pro 500MB clear everywhere"): the tool's status panel
// must show both plan ceilings side by side, not just the actor's own resolved number —
// sourced from the same gate.freeLimits/proLimits the upgrade modal already uses, never a
// second fetch or a hardcoded pair of numbers.
test("extract audio tool shows a Free/Pro upload-limit comparison sourced from the entitlement gate", () => {
  assert.match(source, /className="upload-limit-comparison"/);
  assert.match(source, /dictionary\.upgradeModal\.freeTierName/);
  assert.match(source, /dictionary\.upgradeModal\.proTierName/);
  assert.match(source, /formatBytes\(gate\.freeLimits\.maxUploadBytes\)/);
  assert.match(source, /formatBytes\(gate\.proLimits\.maxUploadBytes\)/);
  // The actor's own tier is visually distinguished, not just listed identically to the
  // other tier.
  assert.match(source, /upload-limit-comparison__row--current/);
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
