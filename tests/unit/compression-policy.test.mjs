import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  buildFfmpegCompressionArguments,
  calculateCompressionStats,
  compressionPresets,
  createCompressionEncodingPlan,
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
  assert.ok(compressionPresets.small.maxHeight < compressionPresets.balanced.maxHeight);
});

test("localized compression lifecycle and success labels are present", async () => {
  const dictionarySource = await readFile("src/i18n/dictionaries.ts", "utf8");

  for (const expectedText of [
    'waitingLabel: "Waiting for file"',
    'readyLabel: "Ready to compress"',
    'runningLabel: "Compressing"',
    'failedLabel: "Compression failed"',
    'successMessage: "✔ Compression completed successfully"',
    'waitingLabel: "Aguardando arquivo"',
    'readyLabel: "Pronto para comprimir"',
    'runningLabel: "Comprimindo"',
    'failedLabel: "Falha na compressão"',
    'successMessage: "✔ Compressão concluída com sucesso"',
    'waitingLabel: "Esperando archivo"',
    'readyLabel: "Listo para comprimir"',
    'runningLabel: "Comprimiendo"',
    'failedLabel: "Error de compresión"',
    'successMessage: "✔ Compresión completada correctamente"',
  ]) {
    assert.ok(dictionarySource.includes(expectedText), expectedText);
  }
});

test("compression plans cap output bitrate below the source when reduction is likely", () => {
  const small = createCompressionEncodingPlan(h2641080pSource, "small");
  const balanced = createCompressionEncodingPlan(h2641080pSource, "balanced");
  const high = createCompressionEncodingPlan(h2641080pSource, "high");

  assert.equal(small.estimatedReductionLikely, true);
  assert.equal(balanced.estimatedReductionLikely, true);
  assert.equal(high.estimatedReductionLikely, true);
  assert.equal(small.videoMaxrate, "1200k");
  assert.equal(balanced.videoMaxrate, "2800k");
  assert.ok(
    Number.parseInt(high.videoMaxrate, 10) > Number.parseInt(balanced.videoMaxrate, 10),
  );
});

test("compression plans downscale only when the source exceeds the preset height", () => {
  const small = createCompressionEncodingPlan(h2641080pSource, "small");
  const balanced = createCompressionEncodingPlan(h2641080pSource, "balanced");

  assert.match(small.scaleFilter ?? "", /720/);
  assert.equal(balanced.scaleFilter, null);
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
  assert.ok(args.includes("-maxrate"));
  assert.ok(args.includes(plan.videoMaxrate));
  assert.ok(args.includes("-bufsize"));
  assert.ok(args.includes("yuv420p"));
  assert.ok(args.includes("+faststart"));
  assert.equal(args.at(-1), "output.mp4");
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
    "The selected preset could not reduce the file size. The resulting file is larger than the original. Try the Balanced or Smaller File preset to attempt a smaller output.",
    "O preset selecionado não conseguiu reduzir o tamanho do arquivo. O arquivo resultante ficou maior que o original. Experimente o preset 'Equilibrada' ou 'Arquivo menor' para tentar reduzir o tamanho.",
    "El ajuste seleccionado no pudo reducir el tamaño del archivo. El archivo resultante quedó más grande que el original. Prueba el ajuste Equilibrado o Archivo más pequeño para intentar reducir el tamaño.",
  ]) {
    assert.ok(dictionarySource.includes(expectedText), expectedText);
  }
});
