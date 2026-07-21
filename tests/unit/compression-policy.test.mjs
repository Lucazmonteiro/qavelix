import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildFfmpegCompressionArguments,
  calculateCompressionStats,
  compressionPresets,
  createCompressionEncodingPlan,
  getBoundedOutputDimensions,
  getCompressionDisplayProgress,
  getCompressionOutcomeStatus,
  isActiveCompressionStatus,
  isTerminalCompressionStatus,
  mergePolledCompressionJob,
} from "../../src/lib/compression-policy.ts";

const h2641080pSource = {
  durationSeconds: 60,
  bitrate: 8_000_000,
  formatName: "mov,mp4,m4a,3gp,3g2,mj2",
  width: 1920,
  height: 1080,
  videoCodec: "h264",
  audioCodec: "aac",
  frameRate: 30,
};

const compressionQueueSource = await readFile(
  "src/lib/server/compression-queue.ts",
  "utf8",
);
const downloadRouteSource = await readFile(
  "src/app/api/compression/jobs/[id]/download/route.ts",
  "utf8",
);

function jobSnapshot(overrides = {}) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    status: "queued",
    preset: "balanced",
    originalName: "source.mp4",
    inputSize: 190_284,
    outputSize: null,
    compression: null,
    progress: 0,
    createdAt: "2026-07-16T00:00:00.000Z",
    startedAt: null,
    completedAt: null,
    expiresAt: null,
    downloadUrl: null,
    error: null,
    ...overrides,
  };
}

test("compression presets have distinct size and quality goals", () => {
  assert.ok(
    compressionPresets.small.sourceBitrateRatio <
      compressionPresets.balanced.sourceBitrateRatio,
  );
  assert.ok(
    compressionPresets.balanced.sourceBitrateRatio <
      compressionPresets.high.sourceBitrateRatio,
  );
  assert.ok(compressionPresets.small.crf > compressionPresets.balanced.crf);
  assert.ok(compressionPresets.balanced.crf > compressionPresets.high.crf);
  assert.equal(compressionPresets.small.preservesResolution, false);
  assert.equal(compressionPresets.balanced.preservesResolution, true);
  assert.equal(compressionPresets.high.preservesResolution, true);
  assert.equal(compressionPresets.small.maxHeight, null);
  assert.equal(compressionPresets.balanced.maxHeight, null);
  assert.equal(compressionPresets.high.maxHeight, null);
  assert.ok(
    compressionPresets.small.maxVideoBitrateKbps <
      compressionPresets.balanced.maxVideoBitrateKbps,
  );
  assert.ok(
    compressionPresets.balanced.maxVideoBitrateKbps <
      compressionPresets.high.maxVideoBitrateKbps,
  );
  assert.ok(
    compressionPresets.small.audioBitrateKbps <
      compressionPresets.balanced.audioBitrateKbps,
  );
  assert.ok(
    compressionPresets.balanced.audioBitrateKbps <
      compressionPresets.high.audioBitrateKbps,
  );
  assert.equal(compressionPresets.small.encoderPreset, "veryfast");
  assert.equal(compressionPresets.balanced.encoderPreset, "veryfast");
  assert.equal(compressionPresets.high.encoderPreset, "fast");
});

test("localized compression lifecycle and success labels are present", async () => {
  const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");

  for (const expectedText of [
    'waitingLabel: "Waiting for file"',
    'readyLabel: "Ready to compress"',
    'runningLabel: "Compressing"',
    'failedLabel: "Compression failed"',
    'excellent: "✔ Excellent space savings."',
    'waitingLabel: "Aguardando arquivo"',
    'readyLabel: "Pronto para comprimir"',
    'runningLabel: "Comprimindo"',
    'failedLabel: "Falha na compressão"',
    'excellent: "✔ Excelente economia de espaço."',
    'waitingLabel: "Esperando archivo"',
    'readyLabel: "Listo para comprimir"',
    'runningLabel: "Comprimiendo"',
    'failedLabel: "Error de compresión"',
    'excellent: "✔ Excelente ahorro de espacio."',
  ]) {
    assert.ok(dictionarySource.includes(expectedText), expectedText);
  }
});

test("compression plans cap output bitrate below the source when reduction is likely", () => {
  const small = createCompressionEncodingPlan(h2641080pSource, "small");
  const balanced = createCompressionEncodingPlan(h2641080pSource, "balanced");
  const high = createCompressionEncodingPlan(h2641080pSource, "high");
  const highBitrateSource = {
    ...h2641080pSource,
    bitrate: 26_400_000,
  };
  const cappedSmall = createCompressionEncodingPlan(highBitrateSource, "small");
  const cappedBalanced = createCompressionEncodingPlan(highBitrateSource, "balanced");
  const cappedHigh = createCompressionEncodingPlan(highBitrateSource, "high");

  assert.equal(small.estimatedReductionLikely, true);
  assert.equal(balanced.estimatedReductionLikely, true);
  assert.equal(high.estimatedReductionLikely, true);
  assert.equal(small.videoMaxrate, "2200k");
  assert.equal(balanced.videoMaxrate, "5440k");
  assert.equal(high.videoMaxrate, "7104k");
  assert.equal(cappedSmall.videoMaxrate, "2200k");
  assert.equal(cappedBalanced.videoMaxrate, "6500k");
  assert.equal(cappedHigh.videoMaxrate, "14000k");
  assert.ok(
    Number.parseInt(high.videoMaxrate, 10) > Number.parseInt(balanced.videoMaxrate, 10),
  );
});

test("compression plans cap large output dimensions and never upscale", () => {
  const small = createCompressionEncodingPlan(h2641080pSource, "small");
  const balanced = createCompressionEncodingPlan(h2641080pSource, "balanced");
  const high = createCompressionEncodingPlan(h2641080pSource, "high");
  const verticalSource = {
    ...h2641080pSource,
    width: 2160,
    height: 3840,
  };
  const verticalSmall = createCompressionEncodingPlan(verticalSource, "small");
  const verticalBalanced = createCompressionEncodingPlan(verticalSource, "balanced");
  const verticalHigh = createCompressionEncodingPlan(verticalSource, "high");
  const landscape4k = getBoundedOutputDimensions(3840, 2160);
  const portrait4k = getBoundedOutputDimensions(2160, 3840);
  const hd = getBoundedOutputDimensions(1280, 720);
  const odd = getBoundedOutputDimensions(1279, 721);

  assert.equal(small.scaleFilter, null);
  assert.equal(balanced.scaleFilter, null);
  assert.equal(high.scaleFilter, null);
  assert.match(verticalSmall.scaleFilter ?? "", /1080/);
  assert.match(verticalSmall.scaleFilter ?? "", /1920/);
  assert.equal(verticalBalanced.outputWidth, 1080);
  assert.equal(verticalBalanced.outputHeight, 1920);
  assert.equal(verticalHigh.outputWidth, 1080);
  assert.equal(verticalHigh.outputHeight, 1920);
  assert.equal(landscape4k.width, 1920);
  assert.equal(landscape4k.height, 1080);
  assert.equal(portrait4k.width, 1080);
  assert.equal(portrait4k.height, 1920);
  assert.equal(hd.width, 1280);
  assert.equal(hd.height, 720);
  assert.equal(hd.wasDownscaledToFullHd, false);
  assert.equal(odd.width % 2, 0);
  assert.equal(odd.height % 2, 0);
  assert.equal(verticalSmall.preservesResolution, false);
  assert.equal(verticalBalanced.preservesResolution, true);
  assert.equal(verticalHigh.preservesResolution, true);
});

test("FFmpeg arguments use bounded H.264 MP4 settings", () => {
  const { args, plan } = buildFfmpegCompressionArguments(
    "input.mp4",
    "output.mp4",
    h2641080pSource,
    "balanced",
  );

  assert.deepEqual(args.slice(0, 6), [
    "-hide_banner",
    "-nostdin",
    "-y",
    "-i",
    "input.mp4",
    "-map",
  ]);
  assert.ok(args.includes("libx264"));
  assert.equal(args[args.indexOf("-preset") + 1], "veryfast");
  assert.equal(args[args.indexOf("-threads") + 1], "2");
  assert.equal(
    args[args.indexOf("-x264-params") + 1],
    "threads=2:lookahead-threads=1",
  );
  assert.ok(args.includes("-maxrate"));
  assert.ok(args.includes(plan.videoMaxrate));
  assert.ok(args.includes("-bufsize"));
  assert.ok(args.includes("yuv420p"));
  assert.ok(args.includes("+faststart"));
  assert.ok(args.includes("-progress"));
  assert.ok(args.includes("pipe:1"));
  assert.ok(!args.includes("pipe:2"));
  assert.equal(args.at(-1), "output.mp4");
});

test("Balanced and High Quality FFmpeg arguments cap 4K sources to Full HD", () => {
  const source4kVertical = {
    ...h2641080pSource,
    width: 2160,
    height: 3840,
    bitrate: 24_000_000,
  };

  for (const preset of ["balanced", "high"]) {
    const { args, plan } = buildFfmpegCompressionArguments(
      "input.mp4",
      "output.mp4",
      source4kVertical,
      preset,
    );

    assert.equal(plan.preservesResolution, true);
    assert.equal(plan.outputWidth, 1080);
    assert.equal(plan.outputHeight, 1920);
    assert.equal(plan.wasDownscaledToFullHd, true);
    assert.match(plan.scaleFilter ?? "", /force_divisible_by=2/);
    assert.equal(args[args.indexOf("-vf") + 1], plan.scaleFilter);
  }
});

test("compression worker bounds FFmpeg diagnostics and fails safely", () => {
  assert.match(compressionQueueSource, /let ffmpegStderr = ""/);
  assert.match(compressionQueueSource, /const ffmpegStderrBufferLimitBytes = 64 \* 1024/);
  assert.match(compressionQueueSource, /function appendRollingStderr/);
  assert.match(compressionQueueSource, /ffmpeg\.stdout\.on\("data"/);
  assert.match(compressionQueueSource, /const progress = parseProgress/);
  assert.match(compressionQueueSource, /ffmpeg\.stderr\.on\("data"/);
  assert.match(compressionQueueSource, /appendRollingStderr\(ffmpegStderr, text\)/);
  assert.doesNotMatch(compressionQueueSource, /message: text\.trim\(\)/);
  assert.match(compressionQueueSource, /command: ffmpegCommand/);
  assert.match(compressionQueueSource, /exitCode: ffmpegExitCode/);
  assert.match(compressionQueueSource, /stderr: ffmpegStderr/);
  assert.match(compressionQueueSource, /stack: error instanceof Error/);
  assert.match(compressionQueueSource, /const ffmpegTimeoutMs = 12 \* 60 \* 1000/);
  assert.match(compressionQueueSource, /compression_ffmpeg_timeout/);
  assert.match(compressionQueueSource, /ffmpeg\.kill\("SIGTERM"\)/);
  assert.match(compressionQueueSource, /ffmpeg\.kill\("SIGKILL"\)/);
  assert.match(compressionQueueSource, /await rm\(job\.outputPath, \{ force: true \}\)/);
  assert.match(compressionQueueSource, /await persistStatus\(job, "failed", "Compression failed\."\)/);
});

test("compression downloads are streamed instead of fully buffered", () => {
  assert.match(compressionQueueSource, /createReadStream\(job\.outputPath\)/);
  assert.match(compressionQueueSource, /contentLength: \(await stat\(job\.outputPath\)\)\.size/);
  assert.doesNotMatch(compressionQueueSource, /bytes: await readFile\(job\.outputPath\)/);
  assert.match(downloadRouteSource, /Readable\.toWeb\(download\.stream\)/);
  assert.match(downloadRouteSource, /"Content-Length": String\(download\.contentLength\)/);
  assert.doesNotMatch(downloadRouteSource, /new Response\(download\.bytes/);
});

test("compression worker prevents duplicate execution of stale queued jobs", () => {
  assert.match(compressionQueueSource, /const persistedJob = await readPersistedCompressionJob\(id\)/);
  assert.match(
    compressionQueueSource,
    /!isPendingCompressionStatus\(persistedJob\.status\)/,
  );
  assert.match(compressionQueueSource, /isInterruptedProcessingStatus\(persistedJob\.status\)/);
  assert.match(compressionQueueSource, /inMemoryJob\?\.process \|\| activeJobId === id/);
  assert.match(compressionQueueSource, /compression_orphaned_processing_job_failed/);
  assert.match(
    compressionQueueSource,
    /persistedJob\.progress >= inMemoryJob\.progress/,
  );
  assert.match(compressionQueueSource, /const latestPersistedJob = await readPersistedCompressionJob\(job\.id\)/);
  assert.match(
    compressionQueueSource,
    /if \(latestPersistedJob && !isPendingCompressionStatus\(latestPersistedJob\.status\)\)/,
  );
  assert.match(compressionQueueSource, /compression_worker_stale_job_skipped/);
  assert.match(compressionQueueSource, /if \(job && job\.status === "queued"\)/);
  const getCompressionJobSource = compressionQueueSource.slice(
    compressionQueueSource.indexOf("export async function getCompressionJob"),
    compressionQueueSource.indexOf("export async function cancelCompressionJob"),
  );

  assert.doesNotMatch(getCompressionJobSource, /isPendingCompressionStatus/);
});

test("compression statistics distinguish reductions from increases", () => {
  const reduced = calculateCompressionStats(136 * 1024 * 1024, 74 * 1024 * 1024);
  const increased = calculateCompressionStats(136 * 1024 * 1024, 186 * 1024 * 1024);

  assert.equal(reduced.isIneffective, false);
  assert.equal(reduced.savedBytes, 62 * 1024 * 1024);
  assert.equal(reduced.reductionPercent, 45.6);
  assert.equal(getCompressionOutcomeStatus(reduced), "optimized");

  assert.equal(increased.isIneffective, true);
  assert.equal(increased.increasedBytes, 50 * 1024 * 1024);
  assert.equal(increased.increasePercent, 36.8);
  assert.equal(getCompressionOutcomeStatus(increased), "compression_ineffective");
});

test("compression status helpers classify active and terminal polling states", () => {
  for (const status of ["queued", "starting", "running"]) {
    assert.equal(isActiveCompressionStatus(status), true);
    assert.equal(isTerminalCompressionStatus(status), false);
  }

  for (const status of [
    "completed",
    "optimized",
    "compression_ineffective",
    "failed",
    "cancelled",
    "expired",
    "deleted",
  ]) {
    assert.equal(isActiveCompressionStatus(status), false);
    assert.equal(isTerminalCompressionStatus(status), true);
  }
});

test("downloadable final states display completed progress", () => {
  assert.equal(getCompressionDisplayProgress("optimized", 78), 100);
  assert.equal(getCompressionDisplayProgress("compression_ineffective", 99), 100);
  assert.equal(getCompressionDisplayProgress("completed", 25), 100);
  assert.equal(getCompressionDisplayProgress("failed", 41), 41);
  assert.equal(getCompressionDisplayProgress("running", 67.4), 67);
  assert.equal(getCompressionDisplayProgress("running", Number.NaN), 0);
});

test("polled compression jobs render every newer progress value", () => {
  const sequence = [
    jobSnapshot(),
    jobSnapshot({ status: "running", progress: 2 }),
    jobSnapshot({ status: "running", progress: 29 }),
    jobSnapshot({ status: "running", progress: 61 }),
    jobSnapshot({ status: "running", progress: 99 }),
    jobSnapshot({
      status: "optimized",
      progress: 100,
      outputSize: 183_635,
      compression: calculateCompressionStats(190_284, 183_635),
      expiresAt: "2026-07-16T00:30:00.000Z",
      downloadUrl: "/api/compression/jobs/111/download?token=a&signature=b",
    }),
  ];

  let current = sequence[0];
  const renderedProgress = [current.progress];

  for (const next of sequence.slice(1)) {
    current = mergePolledCompressionJob(current, next);
    renderedProgress.push(
      getCompressionDisplayProgress(current.status, current.progress),
    );
  }

  assert.deepEqual(renderedProgress, [0, 2, 29, 61, 99, 100]);
  assert.equal(current.status, "optimized");
  assert.equal(current.outputSize, 183_635);
  assert.equal(current.compression?.reductionPercent, 3.5);
  assert.equal(current.downloadUrl?.includes("/api/compression/jobs/"), true);
});

test("polled compression jobs ignore out-of-order backward progress", () => {
  const current = jobSnapshot({ status: "running", progress: 61 });
  const stale = jobSnapshot({ status: "running", progress: 2 });
  const merged = mergePolledCompressionJob(current, stale);

  assert.equal(merged?.status, "running");
  assert.equal(merged?.progress, 61);
});

test("polled compression jobs do not overwrite terminal state", () => {
  const optimized = jobSnapshot({
    status: "optimized",
    progress: 100,
    outputSize: 183_635,
    compression: calculateCompressionStats(190_284, 183_635),
    downloadUrl: "/api/compression/jobs/111/download?token=a&signature=b",
  });
  const staleRunning = jobSnapshot({ status: "running", progress: 99 });

  assert.equal(mergePolledCompressionJob(optimized, staleRunning), optimized);
});

test("localized ineffective compression warnings are present", async () => {
  const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");

  for (const expectedText of [
    "This video is already highly compressed. Using the selected preset, QAVELIX could not generate a file smaller than the original.",
    "Este vídeo já está altamente comprimido. Com o preset selecionado, o QAVELIX não conseguiu gerar um arquivo menor que o original.",
    "Este vídeo ya está muy comprimido. Con el ajuste seleccionado, QAVELIX no ha podido generar un archivo más pequeño que el original.",
    "Recommended presets",
    "Presets recomendados",
    "Ajustes recomendados",
  ]) {
    assert.ok(dictionarySource.includes(expectedText), expectedText);
  }
});
