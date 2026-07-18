import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile("src/components/compression-panel.tsx", "utf8");
const footerSource = await readFile("src/components/app-footer.tsx", "utf8");
const homepageSource = await readFile("src/components/homepage-compressor.tsx", "utf8");
const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");
const themeScriptSource = await readFile("src/components/theme-script.tsx", "utf8");
const localeLayoutSource = await readFile("src/app/[locale]/layout.tsx", "utf8");
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
    /Boolean\(file\) &&\s*hasValidatedFile &&\s*!isPolling &&\s*!isDownloadable &&\s*!isCancelling &&\s*!isDeleting/,
  );
  assert.match(source, /const canCancelCompression = isPolling && !isCancelling && !isDeleting/);
  assert.match(source, /const canDeleteCompression = Boolean\(file \|\| job\) && !isPolling && !isCancelling && !isDeleting/);
  assert.match(source, /disabled=\{!canStartCompression\}/);
  assert.match(source, /disabled=\{!canCancelCompression\}/);
  assert.match(source, /disabled=\{!canDeleteCompression\}/);
  assert.match(
    source,
    /<button className="button button--primary" disabled type="button">/,
  );
});

test("compression action buttons use one turquoise design system", () => {
  assert.match(
    source,
    /canCancelCompression \? "button--primary" : "button--secondary"/,
  );
  assert.match(cssSource, /\.button:not\(:disabled\):hover/);
  assert.match(cssSource, /cursor: pointer/);
  assert.match(cssSource, /filter: brightness\(1\.06\)/);
  assert.match(cssSource, /box-shadow: var\(--strong-shadow\)/);
  assert.match(cssSource, /\.button--primary\s*\{\s*background: var\(--accent\)/);
  assert.match(cssSource, /\.button--secondary/);
  assert.match(cssSource, /color-mix\(in srgb, var\(--accent\) 70%, var\(--surface\)\)/);
  assert.match(cssSource, /\.button--secondary:not\(:disabled\):hover/);
  assert.match(cssSource, /\.button:disabled/);
  assert.match(cssSource, /color-mix\(in srgb, var\(--accent\) 24%, #042f2e\)/);
  assert.match(cssSource, /cursor: not-allowed/);
  assert.match(cssSource, /filter: none/);
  assert.match(cssSource, /box-shadow: none/);
  assert.match(dictionarySource, /cancelLabel: "Cancel"/);
  assert.match(dictionarySource, /cancelLabel: "Cancelar"/);
  assert.doesNotMatch(dictionarySource, /Cancel job/);
  assert.doesNotMatch(dictionarySource, /Cancelar job/);
  assert.doesNotMatch(dictionarySource, /Cancelar trabajo/);
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

test("compression panel presents oversized upload errors with relevant details only", () => {
  assert.match(source, /uploadLimitExceededLabel: string/);
  assert.match(source, /maximumAllowedLabel: string/);
  assert.match(source, /oversizedFileMessage: string/);
  assert.match(source, /code\?: string/);
  assert.match(source, /fileSize\?: number/);
  assert.match(source, /validation\.code === "file_too_large"/);
  assert.match(
    source,
    /formatOversizedFileMessage\(copy, selectedFile\.size, MAX_UPLOAD_BYTES\)/,
  );
  assert.match(source, /const isOversizedFile =/);
  assert.match(source, /\{isOversizedFile \? \(/);
  assert.match(source, /return copy\.uploadLimitExceededLabel/);
  assert.doesNotMatch(source, /<dt>\{copy\.statusLabel\}<\/dt>\s*<dd>\{copy\.uploadLimitExceededLabel\}<\/dd>/);
  assert.match(source, /<dt>\{copy\.maximumAllowedLabel\}<\/dt>/);
  assert.match(source, /<dd>\{formatBytes\(MAX_UPLOAD_BYTES\)\}<\/dd>/);
  assert.match(dictionarySource, /uploadLimitExceededLabel: "Upload limit exceeded"/);
  assert.match(dictionarySource, /uploadLimitExceededLabel: "Limite de upload excedido"/);
  assert.match(dictionarySource, /uploadLimitExceededLabel: "Límite de carga excedido"/);
  assert.match(dictionarySource, /The selected file is \{fileSize\}/);
  assert.match(dictionarySource, /O arquivo selecionado possui \{fileSize\}/);
  assert.match(
    dictionarySource,
    /El archivo seleccionado tiene un tamaño de \{fileSize\}/,
  );
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

test("compression panel reuses the original source after a completed result", () => {
  assert.match(source, /const \[downloadStarted, setDownloadStarted\] = useState\(false\)/);
  assert.match(source, /function handleDownloadStarted\(\)/);
  assert.match(source, /setDownloadStarted\(true\)/);
  assert.match(source, /copy\.downloadStartedMessage/);
  assert.match(source, /function prepareForNewCompression\(nextPreset: CompressionPresetId\)/);
  assert.match(source, /nextPreset === preset/);
  assert.match(source, /!isDownloadable/);
  assert.match(source, /setPreset\(nextPreset\)/);
  assert.match(source, /resetCompressionResult\(\)/);
  assert.match(source, /if \(!file \|\| validation\.status !== "valid"\)/);
  assert.match(source, /setError\(copy\.errors\.sourceUnavailable\)/);
  assert.match(source, /function handlePresetSelect\(nextPreset: CompressionPresetId\)/);
  assert.match(source, /if \(isDownloadable\) \{\s*prepareForNewCompression\(nextPreset\);/);
  assert.match(source, /disabled=\{arePresetButtonsDisabled\}/);
  assert.match(dictionarySource, /downloadStartedMessage: "✔ Download started successfully"/);
  assert.match(dictionarySource, /downloadStartedMessage: "✔ Download iniciado com sucesso"/);
  assert.match(dictionarySource, /downloadStartedMessage: "✔ Descarga iniciada correctamente"/);
  assert.match(dictionarySource, /sourceUnavailable:/);
});

test("compression panel shows a localized reuse tip after successful compression", () => {
  assert.match(source, /copy\.reuseTipTitle/);
  assert.match(source, /copy\.reuseTipDescription/);
  assert.match(source, /copy\.reuseTipSecondary/);
  assert.match(source, /className="compression-status__tip"/);
  assert.match(source, /\{isSuccessful \? \(/);
  assert.match(source, /aria-label=\{copy\.reuseTipTitle\}/);
  assert.match(dictionarySource, /reuseTipTitle: "Compare results"/);
  assert.match(dictionarySource, /reuseTipTitle: "Compare os resultados"/);
  assert.match(dictionarySource, /reuseTipTitle: "Compara los resultados"/);
  assert.match(cssSource, /\.compression-status__tip/);
  assert.match(cssSource, /font-size: 0\.86rem/);
});

test("homepage helper copy follows validated file hierarchy", () => {
  assert.match(homepageSource, /useState\(false\)/);
  assert.match(homepageSource, /copy\.compression\.validationHelper/);
  assert.match(homepageSource, /copy\.description/);
  assert.match(homepageSource, /onValidatedChange=\{setHasValidatedFile\}/);
  assert.match(source, /onValidatedChange\?: \(hasValidatedFile: boolean\) => void/);
  assert.match(source, /onValidatedChange\?\.\(hasValidatedFile\)/);
  assert.match(dictionarySource, /validationSuccessLabel: "File Information"/);
  assert.match(dictionarySource, /validationSuccessLabel: "Informações do arquivo"/);
  assert.match(dictionarySource, /validationSuccessLabel: "Información del archivo"/);
  assert.match(dictionarySource, /Your file has been successfully validated/);
  assert.match(dictionarySource, /Seu arquivo foi validado com sucesso/);
  assert.match(dictionarySource, /Tu archivo se ha validado correctamente/);
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
  assert.match(cssSource, /background: #ffffff/);
  assert.match(cssSource, /color: #000000/);
  assert.match(cssSource, /text-transform: uppercase/);
  assert.match(cssSource, /\.preset-card__chip/);
  assert.match(cssSource, /\.preset-card__note/);
  assert.match(cssSource, /\.preset-card:not\(:disabled\):hover/);
  assert.match(cssSource, /\.preset-card:disabled/);
});

test("homepage compressor stays high enough for immediate result review", () => {
  assert.match(cssSource, /\.hero-section--tool/);
  assert.match(cssSource, /gap: clamp\(0\.7rem, 1\.4vw, 1\.1rem\)/);
  assert.match(
    cssSource,
    /padding-block: clamp\(0\.25rem, 0\.9vw, 0\.65rem\) clamp\(3rem, 6vw, 5rem\)/,
  );
  assert.match(cssSource, /\.homepage-tool \.upload-dropzone/);
  assert.match(cssSource, /min-height: clamp\(16rem, 31vw, 23rem\)/);
});

test("working states reposition the entire workspace without changing the landing layout", () => {
  assert.match(source, /const hasSelectedFileOrJob = Boolean\(file \|\| job\)/);
  assert.match(source, /compression-section--working/);
  assert.match(
    source,
    /hasSelectedFileOrJob \? " compression-section--working" : ""/,
  );
  assert.match(cssSource, /\.hero-section--tool:has\(\.compression-section--working\)/);
  assert.match(cssSource, /\.homepage-tool \.compression-section--working/);
  assert.match(cssSource, /margin-top: 0/);
  assert.doesNotMatch(cssSource, /margin-top: clamp\(-2rem, -3vw, -1rem\)/);
  assert.match(cssSource, /\.homepage-tool \.compression-panel/);
});

test("theme bootstrap uses Next Script instead of a raw rendered script tag", () => {
  assert.match(localeLayoutSource, /import Script from "next\/script"/);
  assert.match(localeLayoutSource, /id="qavelix-theme-script"/);
  assert.match(localeLayoutSource, /strategy="beforeInteractive"/);
  assert.match(localeLayoutSource, /dangerouslySetInnerHTML=\{\{ __html: themeScript \}\}/);
  assert.match(themeScriptSource, /export const themeScript = `/);
  assert.doesNotMatch(themeScriptSource, /return <script/);
  assert.match(themeScriptSource, /const themes = \["light", "dark"\]/);
  assert.match(themeScriptSource, /getStoredTheme\(\) \?\? "dark"/);
});

test("compression panel scrolls settled validation results into reading position", () => {
  assert.match(source, /function scrollCompressionPanelIntoView/);
  assert.ok(source.includes('document.querySelector<HTMLElement>(".site-header")'));
  assert.match(source, /panelTop - headerHeight - 16/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /const compressionPanelRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(source, /settledValidationKeyRef/);
  assert.match(source, /validation\.status !== "valid" && validation\.status !== "invalid"/);
  assert.match(source, /scrollCompressionPanelIntoView\(compressionPanelRef\.current\)/);
  assert.match(source, /<div className="compression-panel" ref=\{compressionPanelRef\}>/);
});

test("footer keeps only useful content and legal links", () => {
  assert.match(footerSource, /contentPageSlugs\.map/);
  assert.match(footerSource, /data-navigation-origin="footer-navigation"/);
  assert.doesNotMatch(footerSource, /dictionary\.navigation\.product/);
  assert.doesNotMatch(footerSource, /dictionary\.navigation\.upload/);
  assert.doesNotMatch(footerSource, /dictionary\.navigation\.compression/);
  assert.doesNotMatch(footerSource, /dictionary\.navigation\.design/);
  assert.match(cssSource, /\.site-footer__inner/);
  assert.match(cssSource, /align-items: center/);
  assert.match(cssSource, /\.site-footer__links/);
  assert.match(cssSource, /justify-content: flex-end/);
});

test("compression result hierarchy has clearer titles and warning spacing", () => {
  assert.match(cssSource, /\.upload-result--workflow h3/);
  assert.match(cssSource, /\.compression-status h3/);
  assert.doesNotMatch(cssSource, /\.compression-status--ineffective h3/);
  assert.match(cssSource, /font-weight: 950/);
  assert.match(cssSource, /border-bottom: 1px solid color-mix\(in srgb, var\(--accent\) 34%, var\(--border\)\)/);
  assert.match(cssSource, /\.compression-status__warning/);
  assert.match(cssSource, /margin: 1\.45rem 0 0/);
  assert.match(cssSource, /background: color-mix\(in srgb, var\(--accent-soft\) 46%, var\(--surface\)\)/);
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
  assert.match(source, /function resetToInitialState\(\)/);
  assert.match(source, /function scrollToInitialScreen\(\)/);
  assert.match(source, /setJob\(null\)/);
  assert.match(source, /setFile\(null\)/);
  assert.match(source, /setPreset\("balanced"\)/);
  assert.match(source, /setDownloadStarted\(false\)/);
  assert.match(source, /pollingSequenceRef\.current \+= 1/);
  assert.match(source, /window\.scrollTo\(\{/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /behavior: prefersReducedMotion \? "auto" : "smooth"/);
  assert.match(source, /uploadDropzoneRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /resetToInitialState\(\)/);
});
