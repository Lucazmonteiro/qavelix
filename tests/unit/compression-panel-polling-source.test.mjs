import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile("src/components/compression-panel.tsx", "utf8");
const cssSource = await readFile("src/styles/globals.css", "utf8");

test("compression panel polling uses a single abortable timeout loop", () => {
  assert.match(source, /window\.setTimeout/);
  assert.match(source, /window\.clearTimeout/);
  assert.match(source, /AbortController/);
  assert.match(source, /controller\.abort\(\)/);
  assert.doesNotMatch(source, /setInterval/);
  assert.doesNotMatch(source, /clearInterval/);
});

test("compression panel polls only active states and stops on terminal states", () => {
  assert.match(source, /isActiveCompressionStatus/);
  assert.match(source, /isTerminalCompressionStatus\(payload\.job\.status\)/);
  assert.match(source, /mergePolledCompressionJob/);
  assert.match(source, /stopPolling\(\)/);
});

test("compression panel prevents stale polling responses and duplicate loops", () => {
  assert.match(source, /pollingSequenceRef/);
  assert.match(source, /pollingSequenceRef\.current !== pollingSequence/);
  assert.match(source, /mergePolledCompressionJob\(currentJob, payload\.job\)/);
  assert.match(source, /maxPollingFailures/);
  assert.match(source, /cache: "no-store"/);
});

test("compression panel renders final job data and download action", () => {
  assert.match(source, /getCompressionDisplayProgress/);
  assert.match(source, /formatBytes\(compression\.originalSize\)/);
  assert.match(source, /formatBytes\(compression\.compressedSize\)/);
  assert.match(source, /formatBytes\(compression\.savedBytes\)/);
  assert.match(source, /compression\.reductionPercent\.toFixed\(1\)/);
  assert.match(source, /formatBytes\(compression\.increasedBytes\)/);
  assert.match(source, /compression\.increasePercent\.toFixed\(1\)/);
  assert.doesNotMatch(source, /\+\\$\{formatBytes\(compression\.increasedBytes\)\}/);
  assert.doesNotMatch(source, /\+\\$\{compression\.increasePercent\.toFixed\(1\)\}%/);
  assert.match(source, /copy\.downloadAnywayLabel/);
  assert.match(source, /copy\.downloadLabel/);
});

test("compression panel separates waiting and ready states before job submission", () => {
  assert.match(source, /waitingLabel: string/);
  assert.match(source, /readyLabel: string/);
  assert.match(source, /validation\.status === "valid"/);
  assert.match(source, /return copy\.readyLabel/);
  assert.match(source, /setFile\(selectedFile\)/);
  assert.match(source, /resetCompressionResult\(\)/);
  assert.match(source, /const hasSelectedFileOrJob = Boolean\(file \|\| job\)/);
  assert.match(source, /\{hasSelectedFileOrJob \? \(/);
  assert.doesNotMatch(source, /if \(!job\) \{\s*return copy\.queuedLabel;\s*\}/);
});

test("compression panel derives button states from lifecycle rules", () => {
  assert.match(
    source,
    /Boolean\(file\) && hasValidatedFile && !isPolling && !isDownloadable/,
  );
  assert.match(source, /const canCancelCompression = isPolling/);
  assert.match(source, /const canDeleteCompression = canRequestJobCleanup\(job\)/);
  assert.match(source, /disabled=\{!canStartCompression\}/);
  assert.match(source, /disabled=\{!canCancelCompression\}/);
  assert.match(source, /disabled=\{!canDeleteCompression\}/);
  assert.match(
    source,
    /<button className="button button--primary" disabled type="button">/,
  );
});

test("compression panel automatically validates uploads before enabling compression", () => {
  assert.match(source, /type UploadResponse/);
  assert.match(source, /type ValidationState/);
  assert.match(source, /validationSequenceRef/);
  assert.match(source, /void analyzeSelectedFile\(selectedFile\)/);
  assert.match(source, /fetch\("\/api\/upload\/analyze"/);
  assert.match(source, /method: "POST"/);
  assert.match(
    source,
    /setValidation\(\{ status: "valid", analysis: payload\.analysis \}\)/,
  );
  assert.match(source, /validation\.status !== "valid"/);
  assert.match(source, /copy\.validationSuccessLabel/);
  assert.match(source, /copy\.validationFailedLabel/);
});

test("compression panel removes the upload dropzone after successful validation", () => {
  assert.match(source, /const shouldShowUploadDropzone = !hasValidatedFile/);
  assert.match(source, /\{shouldShowUploadDropzone \? \(/);
  assert.match(source, /className=\{`upload-dropzone/);
  assert.match(source, /validation\.status === "valid" \? \(/);
  assert.match(source, /className="upload-result upload-result--workflow"/);
  assert.match(cssSource, /workflow-content-in/);
  assert.match(cssSource, /prefers-reduced-motion: reduce/);
});

test("compression panel presents prominent preset decision cards after validation", () => {
  assert.match(source, /const shouldShowPresets = hasValidatedFile \|\| Boolean\(job\)/);
  assert.match(source, /copy\.presetQuestionLabel/);
  assert.match(source, /preset-card--workflow/);
  assert.match(source, /copy\.recommendedLabel/);
  assert.match(source, /copy\.expectedReductionLabel/);
  assert.match(source, /copy\.presetReductionRanges\[presetId\]/);
  assert.match(source, /copy\.presetUseCases\[presetId\]\.map/);
  assert.match(source, /copy\.presetNotes\[presetId\]/);
  assert.doesNotMatch(source, /estimated/i);
  assert.match(cssSource, /\.preset-workflow/);
  assert.match(cssSource, /\.preset-card__badge/);
  assert.match(cssSource, /\.preset-card__chip/);
  assert.match(cssSource, /\.preset-card__note/);
});

test("compression panel shows stable success UI only for successful terminal jobs", () => {
  assert.match(source, /isSuccessfulCompressionStatus/);
  assert.match(source, /status === "completed" \|\| status === "optimized"/);
  assert.match(source, /className="compression-status__success"/);
  assert.match(source, /role="status"/);
  assert.match(source, /copy\.successMessage/);
  assert.match(source, /alertedJobIdsRef/);
  assert.match(source, /alertedJobIdsRef\.current\.has\(job\.id\)/);
  assert.match(source, /alertedJobIdsRef\.current\.add\(job\.id\)/);
  assert.match(cssSource, /--success: #[0-9a-f]{6}/);
  assert.match(cssSource, /--success-soft: #[0-9a-f]{6}/);
  assert.match(cssSource, /\.compression-status__success/);
  assert.match(cssSource, /var\(--success\)/);
  assert.match(cssSource, /var\(--success-soft\)/);
});

test("compression panel fully resets after delete and allows same file reselection", () => {
  assert.match(source, /function resetFileInput\(\)/);
  assert.match(source, /inputRef\.current\.value = ""/);
  assert.match(source, /function resetCompressionWorkflow\(\)/);
  assert.match(source, /setJob\(null\)/);
  assert.match(source, /setFile\(null\)/);
  assert.match(source, /pollingSequenceRef\.current \+= 1/);
  assert.match(source, /resetCompressionWorkflow\(\)/);
});
