import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildFfmpegCompressionArguments,
  calculateCompressionStats,
  DOWNLOAD_TTL_MS,
  getCompressionOutcomeStatus,
  isDownloadableCompressionStatus,
  type CompressionJobSnapshot,
  type CompressionJobStatus,
  type CompressionPresetId,
} from "@/lib/compression-policy";
import { analyzeWithFfprobe } from "@/lib/server/ffprobe";
import { validateFileIdentity } from "@/lib/server/upload-validation";
import type { UploadValidationError } from "@/lib/upload-policy";

type CompressionJob = CompressionJobSnapshot & {
  inputPath: string;
  outputPath: string;
  process: ChildProcessWithoutNullStreams | null;
  downloadToken: string | null;
  downloadSignature: string | null;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
};

type CreateJobResult =
  | {
      ok: true;
      job: CompressionJobSnapshot;
    }
  | {
      ok: false;
      error:
        | UploadValidationError
        | { code: "invalid_preset" | "queue_full"; message: string };
    };

const compressionDirectory = path.join(os.tmpdir(), "qavelix-compression");
const jobMetadataDirectory = path.join(compressionDirectory, "jobs");
const jobLockDirectory = path.join(compressionDirectory, "locks");
const maxRetainedJobs = 50;
const maxQueuedJobs = 10;
const staleWorkerLockMs = 5 * 60 * 1000;
const signingSecret = randomBytes(32);
const queue: string[] = [];
const jobs = new Map<string, CompressionJob>();

let activeJobId: string | null = null;

function jobMetadataPath(id: string) {
  return path.join(jobMetadataDirectory, `${id}.json`);
}

function jobLockPath(id: string) {
  return path.join(jobLockDirectory, `${id}.lock`);
}

function logCompressionStage(
  event: string,
  details: Record<string, string | number | boolean | null> = {},
) {
  console.info(
    JSON.stringify({
      level: "info",
      event,
      at: new Date().toISOString(),
      ...details,
    }),
  );
}

function logCompressionError(
  event: string,
  details: Record<string, string | number | boolean | null> = {},
) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      at: new Date().toISOString(),
      ...details,
    }),
  );
}

function isPendingCompressionStatus(status: CompressionJobStatus) {
  return status === "queued" || status === "starting";
}

function serializableJob(job: CompressionJob) {
  return {
    id: job.id,
    status: job.status,
    preset: job.preset,
    originalName: job.originalName,
    inputSize: job.inputSize,
    outputSize: job.outputSize,
    compression: job.compression,
    progress: job.progress,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    expiresAt: job.expiresAt,
    downloadUrl: null,
    error: job.error,
    inputPath: job.inputPath,
    outputPath: job.outputPath,
    downloadToken: job.downloadToken,
    downloadSignature: job.downloadSignature,
  };
}

async function persistCompressionJob(job: CompressionJob) {
  await mkdir(jobMetadataDirectory, { recursive: true });
  await writeFile(jobMetadataPath(job.id), JSON.stringify(serializableJob(job)), {
    mode: 0o600,
  });
}

async function acquireJobLock(id: string) {
  await mkdir(jobLockDirectory, { recursive: true });

  try {
    const existingLock = await stat(jobLockPath(id));

    if (Date.now() - existingLock.mtimeMs > staleWorkerLockMs) {
      await rm(jobLockPath(id), { force: true });
    }
  } catch {
    // No existing lock.
  }

  try {
    await writeFile(jobLockPath(id), `${process.pid}:${Date.now()}`, {
      flag: "wx",
      mode: 0o600,
    });
    return true;
  } catch {
    return false;
  }
}

async function releaseJobLock(id: string) {
  await rm(jobLockPath(id), { force: true });
}

async function readPersistedCompressionJob(id: string) {
  try {
    const text = await readFile(jobMetadataPath(id), "utf8");
    const persisted = JSON.parse(text) as Omit<
      CompressionJob,
      "process" | "cleanupTimer"
    >;

    return {
      ...persisted,
      process: null,
      cleanupTimer: null,
    } satisfies CompressionJob;
  } catch {
    return null;
  }
}

async function findCompressionJob(id: string) {
  const inMemoryJob = jobs.get(id);

  if (inMemoryJob) {
    return inMemoryJob;
  }

  const persistedJob = await readPersistedCompressionJob(id);

  if (persistedJob) {
    jobs.set(id, persistedJob);
  }

  return persistedJob;
}

async function loadPendingCompressionJobs() {
  try {
    const files = await readdir(jobMetadataDirectory);
    const pendingJobs: CompressionJob[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) {
        continue;
      }

      const id = path.basename(file, ".json");
      const job = await findCompressionJob(id);

      if (job && isPendingCompressionStatus(job.status)) {
        pendingJobs.push(job);
      }
    }

    return pendingJobs.sort((left, right) =>
      left.createdAt.localeCompare(right.createdAt),
    );
  } catch {
    return [];
  }
}

function enqueueJob(id: string) {
  if (!queue.includes(id)) {
    queue.push(id);
    logCompressionStage("compression_job_queued", {
      jobId: id,
      queueDepth: queue.length,
    });
  }
}

async function ensureCompressionWorker() {
  if (activeJobId) {
    return;
  }

  if (queue.length === 0) {
    const pendingJobs = await loadPendingCompressionJobs();

    for (const job of pendingJobs) {
      enqueueJob(job.id);
    }
  }

  if (queue.length > 0) {
    void processNextJob();
  }
}

function snapshot(job: CompressionJob): CompressionJobSnapshot {
  return {
    id: job.id,
    status: job.status,
    preset: job.preset,
    originalName: job.originalName,
    inputSize: job.inputSize,
    outputSize: job.outputSize,
    compression: job.compression,
    progress: job.progress,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    expiresAt: job.expiresAt,
    downloadUrl:
      isDownloadableCompressionStatus(job.status) &&
      job.downloadToken &&
      job.downloadSignature
        ? `/api/compression/jobs/${job.id}/download?token=${encodeURIComponent(job.downloadToken)}&signature=${encodeURIComponent(job.downloadSignature)}`
        : null,
    error: job.error,
  };
}

function setJobStatus(
  job: CompressionJob,
  status: CompressionJobStatus,
  error: string | null = null,
) {
  job.status = status;
  job.error = error;

  if ((status === "starting" || status === "running") && !job.startedAt) {
    job.startedAt = new Date().toISOString();
  }

  if (
    status === "completed" ||
    status === "optimized" ||
    status === "compression_ineffective" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "expired" ||
    status === "deleted"
  ) {
    job.completedAt = new Date().toISOString();
  }
}

async function persistStatus(
  job: CompressionJob,
  status: CompressionJobStatus,
  error: string | null = null,
) {
  setJobStatus(job, status, error);
  await persistCompressionJob(job);
}

function createDownloadSignature(jobId: string, token: string, expiresAt: string) {
  return createHmac("sha256", signingSecret)
    .update(`${jobId}.${token}.${expiresAt}`)
    .digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function sanitizeExtension(fileName: string) {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
}

async function cleanupJobFiles(job: CompressionJob) {
  if (job.cleanupTimer) {
    clearTimeout(job.cleanupTimer);
    job.cleanupTimer = null;
  }

  await Promise.all([
    rm(job.inputPath, { force: true }),
    rm(job.outputPath, { force: true }),
  ]);
}

async function cleanupInputFile(job: CompressionJob) {
  await rm(job.inputPath, { force: true });
}

function scheduleExpiration(job: CompressionJob) {
  if (!job.expiresAt) {
    return;
  }

  const delay = Math.max(0, new Date(job.expiresAt).getTime() - Date.now());

  job.cleanupTimer = setTimeout(() => {
    void expireCompressionJob(job.id);
  }, delay);
}

function parseProgress(chunk: Buffer, durationSeconds: number | null) {
  if (!durationSeconds || durationSeconds <= 0) {
    return null;
  }

  const text = chunk.toString("utf8");
  const outTimeMatch = text.match(/out_time_ms=(\d+)/);

  if (!outTimeMatch?.[1]) {
    return null;
  }

  const currentSeconds = Number(outTimeMatch[1]) / 1_000_000;

  if (!Number.isFinite(currentSeconds)) {
    return null;
  }

  return Math.min(99, Math.max(1, Math.round((currentSeconds / durationSeconds) * 100)));
}

async function runJob(job: CompressionJob) {
  const lockAcquired = await acquireJobLock(job.id);

  if (!lockAcquired) {
    logCompressionStage("compression_worker_lock_skipped", {
      jobId: job.id,
      status: job.status,
    });
    return;
  }

  activeJobId = job.id;
  await persistStatus(job, "starting");
  logCompressionStage("compression_worker_picked_job", {
    jobId: job.id,
    preset: job.preset,
  });

  try {
    logCompressionStage("compression_ffprobe_started", {
      jobId: job.id,
      inputPath: job.inputPath,
    });
    const metadata = await analyzeWithFfprobe(job.inputPath);
    logCompressionStage("compression_ffprobe_finished", {
      jobId: job.id,
      durationSeconds: metadata.durationSeconds,
      bitrate: metadata.bitrate,
      width: metadata.width,
      height: metadata.height,
      videoCodec: metadata.videoCodec,
    });
    const { args } = buildFfmpegCompressionArguments(
      job.inputPath,
      job.outputPath,
      metadata,
      job.preset,
    );
    logCompressionStage("compression_ffmpeg_command_generated", {
      jobId: job.id,
      argumentCount: args.length,
      outputPath: job.outputPath,
    });

    const ffmpeg = spawn("ffmpeg", args, {
      shell: false,
      windowsHide: true,
    });

    job.process = ffmpeg;
    await persistStatus(job, "running");
    logCompressionStage("compression_ffmpeg_spawned", {
      jobId: job.id,
      pid: ffmpeg.pid ?? null,
    });

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      const progress = parseProgress(chunk, metadata.durationSeconds);

      if (progress !== null) {
        job.progress = progress;
        void persistCompressionJob(job);
        logCompressionStage("compression_progress_updated", {
          jobId: job.id,
          progress,
        });
      } else if (text.trim()) {
        logCompressionStage("compression_ffmpeg_stderr", {
          jobId: job.id,
          message: text.trim().slice(0, 1000),
        });
      }
    });

    await new Promise<void>((resolve, reject) => {
      ffmpeg.on("error", reject);
      ffmpeg.on("close", (code) => {
        if (job.status === "cancelled") {
          resolve();
          return;
        }

        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`FFmpeg exited with code ${code ?? "unknown"}.`));
      });
    });
    logCompressionStage("compression_encoding_finished", {
      jobId: job.id,
      status: job.status,
    });

    if (job.status !== "cancelled") {
      const outputStats = await stat(job.outputPath);
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + DOWNLOAD_TTL_MS).toISOString();
      const compression = calculateCompressionStats(job.inputSize, outputStats.size);

      job.outputSize = outputStats.size;
      job.compression = compression;
      job.progress = 100;
      job.expiresAt = expiresAt;
      job.downloadToken = token;
      job.downloadSignature = createDownloadSignature(job.id, token, expiresAt);
      await persistStatus(job, getCompressionOutcomeStatus(compression));
      logCompressionStage("compression_output_verified", {
        jobId: job.id,
        inputSize: job.inputSize,
        outputSize: outputStats.size,
        reductionPercent: compression.reductionPercent,
        increasePercent: compression.increasePercent,
        ineffective: compression.isIneffective,
      });
      logCompressionStage("compression_download_prepared", {
        jobId: job.id,
        expiresAt,
      });
      logCompressionStage("compression_job_completed", {
        jobId: job.id,
        status: job.status,
      });
      await cleanupInputFile(job);
      scheduleExpiration(job);
    }
  } catch (error) {
    if (job.status !== "cancelled") {
      logCompressionError("compression_job_failed", {
        jobId: job.id,
        message: error instanceof Error ? error.message : "Compression failed.",
      });
      await persistStatus(
        job,
        "failed",
        error instanceof Error ? error.message : "Compression failed.",
      );
    }
  } finally {
    job.process = null;
    activeJobId = null;
    if (!isDownloadableCompressionStatus(job.status)) {
      await cleanupJobFiles(job);
    }
    await releaseJobLock(job.id);
    void processNextJob();
  }
}

async function processNextJob() {
  if (activeJobId || queue.length === 0) {
    return;
  }

  const nextJobId = queue.shift();

  if (!nextJobId) {
    return;
  }

  logCompressionStage("compression_worker_dispatch", {
    jobId: nextJobId,
    remainingQueueDepth: queue.length,
  });
  const job = await findCompressionJob(nextJobId);

  if (!job || !isPendingCompressionStatus(job.status)) {
    void processNextJob();
    return;
  }

  await runJob(job);
}

function pruneTerminalJobs() {
  if (jobs.size <= maxRetainedJobs) {
    return;
  }

  const terminalJobs = [...jobs.values()]
    .filter((job) => ["failed", "cancelled", "expired", "deleted"].includes(job.status))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  for (const job of terminalJobs) {
    if (jobs.size <= maxRetainedJobs) {
      return;
    }

    jobs.delete(job.id);
  }
}

export async function createCompressionJob(
  file: File,
  preset: CompressionPresetId,
): Promise<CreateJobResult> {
  pruneTerminalJobs();

  if (queue.length >= maxQueuedJobs) {
    return {
      ok: false,
      error: {
        code: "queue_full",
        message: "The compression queue is full. Try again later.",
      },
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validationError = validateFileIdentity(file, bytes.slice(0, 16));

  if (validationError) {
    return {
      ok: false,
      error: validationError,
    };
  }

  await mkdir(jobMetadataDirectory, { recursive: true });

  const id = randomUUID();
  const inputPath = path.join(
    compressionDirectory,
    `${id}${sanitizeExtension(file.name)}`,
  );
  const outputPath = path.join(compressionDirectory, `${id}.compressed.mp4`);

  await writeFile(inputPath, bytes, {
    flag: "wx",
    mode: 0o600,
  });

  const job: CompressionJob = {
    id,
    status: "queued",
    preset,
    originalName: file.name,
    inputSize: file.size,
    outputSize: null,
    compression: null,
    progress: 0,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    expiresAt: null,
    downloadUrl: null,
    error: null,
    inputPath,
    outputPath,
    process: null,
    downloadToken: null,
    downloadSignature: null,
    cleanupTimer: null,
  };

  jobs.set(id, job);
  await persistCompressionJob(job);
  logCompressionStage("compression_job_created", {
    jobId: id,
    preset,
    inputSize: file.size,
  });
  enqueueJob(id);
  void ensureCompressionWorker();

  return {
    ok: true,
    job: snapshot(job),
  };
}

export async function getCompressionJob(id: string) {
  const job = await findCompressionJob(id);

  if (job && isPendingCompressionStatus(job.status)) {
    enqueueJob(job.id);
    void ensureCompressionWorker();
  }

  return job ? snapshot(job) : null;
}

export async function cancelCompressionJob(id: string) {
  const job = await findCompressionJob(id);

  if (!job) {
    return null;
  }

  if (job.status === "queued") {
    const queueIndex = queue.indexOf(id);

    if (queueIndex >= 0) {
      queue.splice(queueIndex, 1);
    }

    await persistStatus(job, "cancelled");
    await cleanupJobFiles(job);
    return snapshot(job);
  }

  if (job.status === "running") {
    await persistStatus(job, "cancelled");
    job.process?.kill("SIGTERM");
    return snapshot(job);
  }

  if (isDownloadableCompressionStatus(job.status)) {
    setJobStatus(job, "deleted");
    job.progress = 100;
    job.downloadToken = null;
    job.downloadSignature = null;
    job.expiresAt = null;
    await persistCompressionJob(job);
    await cleanupJobFiles(job);
    return snapshot(job);
  }

  return snapshot(job);
}

export async function expireCompressionJob(id: string) {
  const job = await findCompressionJob(id);

  if (!job || !isDownloadableCompressionStatus(job.status)) {
    return null;
  }

  setJobStatus(job, "expired");
  job.downloadToken = null;
  job.downloadSignature = null;
  await persistCompressionJob(job);
  await cleanupJobFiles(job);

  return snapshot(job);
}

export async function readCompressionDownload(
  id: string,
  token: string,
  signature: string,
) {
  const job = await findCompressionJob(id);

  if (
    !job ||
    !isDownloadableCompressionStatus(job.status) ||
    !job.expiresAt ||
    !job.downloadToken ||
    !job.downloadSignature
  ) {
    return null;
  }

  if (new Date(job.expiresAt).getTime() <= Date.now()) {
    await expireCompressionJob(id);
    return null;
  }

  if (
    !constantTimeEqual(token, job.downloadToken) ||
    !constantTimeEqual(signature, job.downloadSignature)
  ) {
    return null;
  }

  return {
    fileName: `${path.parse(job.originalName).name}.qavelix-compressed.mp4`,
    contentType: "video/mp4",
    bytes: await readFile(job.outputPath),
  };
}
