import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Extract Audio API streams uploads, enforces policy, and preserves CSRF protection", async () => {
  const route = await readFile("src/app/api/extract-audio/route.ts", "utf8");
  const analysisRoute = await readFile(
    "src/app/api/extract-audio/analyze/route.ts",
    "utf8",
  );

  for (const source of [route, analysisRoute]) {
    assert.doesNotMatch(source, /request\.formData/);
    assert.doesNotMatch(source, /\.arrayBuffer/);
    assert.doesNotMatch(source, /Buffer\.concat/);
    assert.match(source, /request\.body\.getReader\(\)/);
    assert.match(source, /createWriteStream/);
    assert.match(source, /MIN_UPLOAD_BYTES/);
    assert.match(source, /MAX_UPLOAD_BYTES/);
    assert.match(source, /requireSameOrigin:\s*true/);
    assert.match(source, /validateFileIdentity/);
    assert.match(source, /analyzeWithFfprobe/);
    assert.match(source, /media\.audioCodec/);
  }
});

test("Extract Audio FFmpeg strategy generates MP3 safely", async () => {
  const extraction = await readFile("src/lib/server/extract-audio.ts", "utf8");
  const silenceDetection = await readFile("src/lib/silence-detection.ts", "utf8");

  assert.match(extraction, /spawn\("ffmpeg", args/);
  assert.match(extraction, /shell:\s*false/);
  assert.match(extraction, /"-nostdin"/);
  assert.match(extraction, /"-map"/);
  assert.match(extraction, /"0:a:0"/);
  assert.match(extraction, /"-vn"/);
  assert.match(extraction, /"libmp3lame"/);
  assert.match(extraction, /"192k"/);
  assert.match(extraction, /verifyExtractedMp3/);
  assert.match(extraction, /silencedetect=noise=\$\{silenceNoiseThreshold\}:d=/);
  assert.match(silenceDetection, /completeSilenceToleranceSeconds = 0\.35/);
  assert.match(silenceDetection, /summarizeSilenceCoverageFromStderr/);
});

test("Extract Audio frontend uses the real API and localized error mapping", async () => {
  const component = await readFile("src/components/extract-audio-tool.tsx", "utf8");

  assert.match(component, /fetch\("\/api\/extract-audio\/analyze"/);
  assert.match(component, /fetch\("\/api\/extract-audio"/);
  assert.match(component, /AbortController/);
  assert.match(component, /URL\.createObjectURL/);
  assert.match(component, /URL\.revokeObjectURL/);
  assert.match(component, /copy\.errors/);
  assert.match(component, /MIN_UPLOAD_BYTES/);
  assert.match(component, /return "fileTooSmall"/);
  assert.match(component, /isAnalysisApproved/);
  assert.match(component, /case "silent_audio"/);
  assert.match(component, /case "no_audio_stream"/);
  assert.match(component, /processingErrorKey === "silentAudio"/);
  assert.match(component, /processingErrorKey === "invalidMedia"/);
  assert.match(component, /return copy\.statusFailed/);
  assert.match(component, /copy\.statusNoAudio/);
  assert.doesNotMatch(component, /nextStepMessage/);
});

test("Extract Audio uses localized invalid video copy for corrupted files", async () => {
  const dictionaries = await readFile("src/i18n/dictionaries.ts", "utf8");

  assert.match(dictionaries, /statusInvalid: "Invalid video"/);
  assert.match(
    dictionaries,
    /This file is corrupted or is not a valid video\. Choose another file to continue\./,
  );
  assert.match(dictionaries, /statusInvalid: "Vídeo inválido"/);
  assert.match(
    dictionaries,
    /Este arquivo está corrompido ou não é um vídeo válido\. Escolha outro arquivo para continuar\./,
  );
  assert.match(
    dictionaries,
    /Este archivo está dañado o no es un video válido\. Elige otro archivo para continuar\./,
  );
  assert.doesNotMatch(dictionaries, /Não foi possível ler este vídeo/);
  assert.doesNotMatch(dictionaries, /This video could not be read/);
  assert.doesNotMatch(dictionaries, /No se ha podido leer este video/);
});

test("Extract Audio renders an accessible indeterminate processing indicator", async () => {
  const [component, styles, dictionaries] = await Promise.all([
    readFile("src/components/extract-audio-tool.tsx", "utf8"),
    readFile("src/styles/globals.css", "utf8"),
    readFile("src/i18n/dictionaries.ts", "utf8"),
  ]);

  assert.match(component, /const showProcessingIndicator = isProcessing/);
  assert.match(component, /className="compression-status__validation"/);
  assert.match(component, /className="validation-loader"/);
  assert.match(component, /role="progressbar"/);
  assert.match(component, /aria-label=\{processingIndicatorLabel\}/);
  assert.doesNotMatch(component, /aria-valuenow/);
  assert.doesNotMatch(component, /progressPendingLabel/);
  assert.match(component, /copy\.analysisProgressMessage/);
  assert.match(component, /copy\.extractionProgressMessage/);
  assert.match(component, /copy\.preparingDownloadMessage/);
  assert.match(styles, /\.validation-loader/);
  assert.match(styles, /\.validation-loader::after/);
  assert.match(styles, /linear-gradient\(\s*90deg,\s*transparent,\s*var\(--accent\),\s*transparent\s*\)/);
  assert.match(styles, /will-change: transform/);
  assert.match(styles, /validation-loader-slide 1\.35s linear infinite/);
  assert.match(styles, /@keyframes validation-loader-slide/);
  assert.match(styles, /transform: translate3d\(-120%, 0, 0\)/);
  assert.match(styles, /transform: translate3d\(240%, 0, 0\)/);
  assert.match(styles, /@keyframes validation-loader-reduced-motion/);
  assert.match(styles, /animation: validation-loader-reduced-motion 2s ease-in-out infinite !important/);
  assert.match(styles, /animation-iteration-count: infinite !important/);
  assert.match(styles, /transform: translate3d\(54%, 0, 0\)/);
  assert.doesNotMatch(styles, /transform: translate3d\(54%, 0, 0\) !important/);
  const responsiveMediaSections = styles
    .split(/\n(?=@media\s*\()/)
    .filter((section) => /@media\s*\((?:min|max)-width:/.test(section));

  for (const section of responsiveMediaSections) {
    assert.doesNotMatch(section, /validation-loader[\s\S]*?animation:\s*none/);
  }
  assert.match(dictionaries, /Este vídeo está sem áudio/);
  assert.match(dictionaries, /This video has no audible sound/);
  assert.match(dictionaries, /Este video está sin audio/);
  assert.doesNotMatch(dictionaries, /Em andamento/);
});

test("Extract Audio download starts the existing blob flow and shows localized confirmation", async () => {
  const [component, dictionaries] = await Promise.all([
    readFile("src/components/extract-audio-tool.tsx", "utf8"),
    readFile("src/i18n/dictionaries.ts", "utf8"),
  ]);

  assert.match(component, /const \[downloadStarted, setDownloadStarted\]/);
  assert.match(component, /downloadNoticeTimerRef/);
  assert.match(component, /function handleDownloadStarted\(\)/);
  assert.match(component, /setTimeout\(\(\) => \{/);
  assert.match(component, /}, 4_000\)/);
  assert.match(component, /onClick=\{handleDownloadStarted\}/);
  assert.match(component, /href=\{result\.url\}/);
  assert.match(component, /download=\{result\.fileName\}/);
  assert.match(component, /role="status"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /clearDownloadNotice\(\)/);
  assert.match(dictionaries, /Download started successfully\./);
  assert.match(dictionaries, /Download iniciado com sucesso\./);
  assert.match(dictionaries, /La descarga se inició correctamente\./);
});
