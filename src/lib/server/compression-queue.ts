import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { type ReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";

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
import type { ConsumedAnalyzedUpload } from "@/lib/server/analyzed-upload-registry";
import { getDb } from "@/lib/server/db/client";
import { compressionJob as compressionJobTable } from "@/lib/server/db/schema";
import { confirmUsage, releaseUsage } from "@/lib/server/entitlements/service";
import { analyzeWithFfprobe } from "@/lib/server/ffprobe";
import type { UploadValidationError } from "@/lib/upload-policy";

type CompressionJob = CompressionJobSnapshot & {
  inputPath: string;
  outputPath: string;
  process: ChildProcessWithoutNullStreams | null;
  downloadToken: string | null;
  downloadSignature: string | null;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
  // The entitlement reservation this job was created against (null for a job created
  // before this milestone's data was migrated — treated as "nothing to confirm/release").
  // usageConfirmed flips true exactly once, when the job reaches a real success state;
  // every other terminal path (failure, timeout, cancellation, orphaned-on-restart)
  // releases the reservation instead — see confirmJobUsage()/releaseJobUsage() below.
  usageEventId: string | null;
  usageConfirmed: boolean;
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
        | {
            code:
              | "invalid_preset"
              | "queue_full"
              | "missing_file"
              | "metadata_mismatch";
            message: string;
          };
    };

const compressionDirectory = path.join(os.tmpdir(), "qavelix-compression");
const jobLockDirectory = path.join(compressionDirectory, "locks");
const maxRetainedJobs = 50;
const maxQueuedJobs = 10;
const staleWorkerLockMs = 5 * 60 * 1000;
const ffmpegTimeoutMs = 12 * 60 * 1000;
const ffmpegStderrBufferLimitBytes = 64 * 1024;
const signingSecret = randomBytes(32);
const queue: string[] = [];
const jobs = new Map<string, CompressionJob>();

let activeJobId: string | null = null;

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

function isInterruptedProcessingStatus(status: CompressionJobStatus) {
  return status === "starting" || status === "running";
}

function appendRollingStderr(current: string, next: string) {
  const combined = current + next;

  if (Buffer.byteLength(combined, "utf8") <= ffmpegStderrBufferLimitBytes) {
    return combined;
  }

  return combined.slice(-ffmpegStderrBufferLimitBytes);
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
    usageEventId: job.usageEventId,
    usageConfirmed: job.usageConfirmed,
  };
}

// Marks the reservation as successfully spent — called exactly once, on the one path
// where the job actually produced usable output. Idempotent via the usageConfirmed
// guard, so a re-entrant call (there shouldn't be one) can't double-confirm.
async function confirmJobUsage(job: CompressionJob) {
  if (job.usageEventId && !job.usageConfirmed) {
    await confirmUsage(job.usageEventId);
    job.usageConfirmed = true;
    await persistCompressionJob(job);
  }
}

// Gives back the reservation for any job that will never produce output — failure,
// timeout, cancellation, or an orphaned job discovered after a process restart. Safe to
// call from multiple sites for the same job: releaseUsage() itself is idempotent
// (guarded by the ledger row's status), and this additionally no-ops once confirmed.
async function releaseJobUsage(job: CompressionJob) {
  if (job.usageEventId && !job.usageConfirmed) {
    await releaseUsage(job.usageEventId);
  }
}

async function persistCompressionJob(job: CompressionJob) {
  const db = getDb();
  const data = serializableJob(job);

  await db
    .insert(compressionJobTable)
    .values({ id: job.id, status: job.status, data })
    .onConflictDoUpdate({
      target: compressionJobTable.id,
      set: { status: job.status, data, updatedAt: new Date() },
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
    const db = getDb();
    const [row] = await db
      .select({ data: compressionJobTable.data })
      .from(compressionJobTable)
      .where(eq(compressionJobTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const persisted = row.data as Omit<CompressionJob, "process" | "cleanupTimer">;

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
  const persistedJob = await readPersistedCompressionJob(id);

  if (!persistedJob) {
    return inMemoryJob ?? null;
  }

  if (isInterruptedProcessingStatus(persistedJob.status)) {
    if (inMemoryJob?.process || activeJobId === id) {
      return inMemoryJob;
    }

    await persistStatus(persistedJob, "failed", "Compression interrupted.");
    await cleanupJobFiles(persistedJob);
    await releaseJobUsage(persistedJob);
    jobs.set(id, persistedJob);
    logCompressionError("compression_orphaned_processing_job_failed", {
      jobId: persistedJob.id,
    });
    return persistedJob;
  }

  if (
    !inMemoryJob ||
    !isPendingCompressionStatus(persistedJob.status) ||
    persistedJob.progress >= inMemoryJob.progress
  ) {
    jobs.set(id, persistedJob);
    return persistedJob;
  }

  return inMemoryJob;
}

async function loadPendingCompressionJobs() {
  try {
    const db = getDb();
    const rows = await db.select({ id: compressionJobTable.id }).from(compressionJobTable);
    const pendingJobs: CompressionJob[] = [];

    for (const row of rows) {
      const id = row.id;
      const job = await findCompressionJob(id);

      if (job && isInterruptedProcessingStatus(job.status)) {
        await persistStatus(job, "failed", "Compression interrupted.");
        await cleanupJobFiles(job);
        await releaseJobUsage(job);
        logCompressionError("compression_stale_processing_job_failed", {
          jobId: job.id,
          status: job.status,
        });
        continue;
      }

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

function formatCommand(command: string, args: string[]) {
  return [command, ...args]
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

// Windows dev-environment observation: a file FFmpeg just finished writing can briefly be
// invisible to a separately-spawned child process (ffprobe) immediately afterward — most
// likely real-time antivirus scanning intercepting a freshly-written media file. Every
// other analyzeWithFfprobe() call site in this app reads a file that already sat on disk
// through a full upload request/response round trip; this is the one place a file is read
// moments after a sibling process just finished writing it, so it's the one place that
// needs a short bounded retry — not a change to analyzeWithFfprobe() itself, which every
// other caller already uses safely as-is.
async function analyzeOutputWithRetry(filePath: string) {
  const maxAttempts = 4;
  const retryDelayMs = 150;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await analyzeWithFfprobe(filePath);
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error("analyzeOutputWithRetry exhausted attempts unexpectedly.");
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

  const latestPersistedJob = await readPersistedCompressionJob(job.id);

  if (latestPersistedJob && !isPendingCompressionStatus(latestPersistedJob.status)) {
    jobs.set(job.id, latestPersistedJob);
    logCompressionStage("compression_worker_stale_job_skipped", {
      jobId: job.id,
      status: latestPersistedJob.status,
    });
    await releaseJobLock(job.id);
    void processNextJob();
    return;
  }

  if (latestPersistedJob) {
    job = latestPersistedJob;
    jobs.set(job.id, job);
  }

  activeJobId = job.id;
  await persistStatus(job, "starting");
  let ffmpegCommand: string | null = null;
  let ffmpegExitCode: number | null = null;
  let ffmpegStderr = "";
  let ffmpegTimedOut = false;
  let lastLoggedProgress = 0;

  logCompressionStage("compression_worker_picked_job", {
    jobId: job.id,
    preset: job.preset,
  });

  try {
    logCompressionStage("compression_ffprobe_started", {
      jobId: job.id,
      inputPath: job.inputPath,
    });
    const inputStats = await stat(job.inputPath);

    if (!inputStats.isFile()) {
      throw new Error("Compression input path is not a file.");
    }

    if (inputStats.size !== job.inputSize) {
      throw new Error(
        `Compression input size mismatch: expected ${job.inputSize}, got ${inputStats.size}.`,
      );
    }

    await stat(compressionDirectory);
    await mkdir(path.dirname(job.outputPath), { recursive: true });
    await rm(job.outputPath, { force: true });

    logCompressionStage("compression_paths_verified", {
      jobId: job.id,
      inputPath: job.inputPath,
      inputSize: inputStats.size,
      outputPath: job.outputPath,
      outputDirectory: path.dirname(job.outputPath),
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
    const { args, plan } = buildFfmpegCompressionArguments(
      job.inputPath,
      job.outputPath,
      metadata,
      job.preset,
    );
    ffmpegCommand = formatCommand("ffmpeg", args);
    logCompressionStage("compression_ffmpeg_command_generated", {
      jobId: job.id,
      argumentCount: args.length,
      command: ffmpegCommand,
      outputPath: job.outputPath,
    });

    const ffmpeg = spawn("ffmpeg", args, {
      shell: false,
      windowsHide: true,
    });
    const ffmpegTimeout = setTimeout(() => {
      ffmpegTimedOut = true;
      logCompressionError("compression_ffmpeg_timeout", {
        jobId: job.id,
        timeoutMs: ffmpegTimeoutMs,
      });
      ffmpeg.kill("SIGTERM");
      setTimeout(() => {
        if (ffmpeg.exitCode === null && ffmpeg.signalCode === null) {
          ffmpeg.kill("SIGKILL");
        }
      }, 5_000).unref();
    }, ffmpegTimeoutMs);
    ffmpegTimeout.unref();

    job.process = ffmpeg;

    if (job.status === "cancelled") {
      ffmpeg.kill("SIGTERM");
    } else {
      await persistStatus(job, "running");
      logCompressionStage("compression_ffmpeg_spawned", {
        jobId: job.id,
        pid: ffmpeg.pid ?? null,
      });
    }

    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      const progress = parseProgress(chunk, metadata.durationSeconds);

      if (progress !== null) {
        job.progress = progress;
        void persistCompressionJob(job);

        if (progress >= 99 || progress - lastLoggedProgress >= 10) {
          lastLoggedProgress = progress;
          logCompressionStage("compression_progress_updated", {
            jobId: job.id,
            progress,
          });
        }
      }
    });

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");

      ffmpegStderr = appendRollingStderr(ffmpegStderr, text);
    });

    await new Promise<void>((resolve, reject) => {
      ffmpeg.on("error", reject);
      ffmpeg.on("close", (code) => {
        clearTimeout(ffmpegTimeout);
        ffmpegExitCode = code;

        if (job.status === "cancelled") {
          resolve();
          return;
        }

        if (code === 0) {
          resolve();
          return;
        }

        if (ffmpegTimedOut) {
          reject(new Error("Compression timed out."));
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
      const outputMetadata = await analyzeOutputWithRetry(job.outputPath);
      const compression = calculateCompressionStats(job.inputSize, outputStats.size, {
        outputWidth: outputMetadata.width,
        outputHeight: outputMetadata.height,
        wasDownscaledToFullHd: plan.wasDownscaledToFullHd,
      });

      job.outputSize = outputStats.size;
      job.compression = compression;
      job.progress = 100;
      job.expiresAt = expiresAt;
      job.downloadToken = token;
      job.downloadSignature = createDownloadSignature(job.id, token, expiresAt);
      await persistStatus(job, getCompressionOutcomeStatus(compression));
      await confirmJobUsage(job);
      logCompressionStage("compression_output_verified", {
        jobId: job.id,
        inputSize: job.inputSize,
        outputSize: outputStats.size,
        reductionPercent: compression.reductionPercent,
        increasePercent: compression.increasePercent,
        ineffective: compression.isIneffective,
        outputWidth: compression.outputWidth,
        outputHeight: compression.outputHeight,
        wasDownscaledToFullHd: compression.wasDownscaledToFullHd,
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
        command: ffmpegCommand,
        exitCode: ffmpegExitCode,
        message: error instanceof Error ? error.message : "Compression failed.",
        stderr: ffmpegStderr,
        stack: error instanceof Error ? (error.stack ?? null) : null,
      });
      await rm(job.outputPath, { force: true });
      await persistStatus(job, "failed", "Compression failed.");
    }
  } finally {
    job.process = null;
    activeJobId = null;
    if (!isDownloadableCompressionStatus(job.status)) {
      await cleanupJobFiles(job);
    }
    // Covers every terminal path that isn't the success branch above: failure, timeout,
    // and cancellation-while-running (cancelCompressionJob() sets status to "cancelled"
    // and kills the process, but this is the finally block that actually runs after that
    // — see the shared job-reference note on cancelCompressionJob()). No-ops if
    // confirmJobUsage() already ran.
    await releaseJobUsage(job);
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

export async function createCompressionJobFromAnalyzedUpload(
  upload: ConsumedAnalyzedUpload,
  preset: CompressionPresetId,
  usageEventId: string | null,
): Promise<CreateJobResult> {
  let jobCreated = false;

  try {
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

    let sourceStats;

    try {
      sourceStats = await stat(upload.inputPath);
    } catch {
      return {
        ok: false,
        error: {
          code: "missing_file",
          message: "The analyzed upload is no longer available.",
        },
      };
    }

    if (!sourceStats.isFile() || sourceStats.size !== upload.size) {
      await rm(upload.inputPath, { force: true });
      return {
        ok: false,
        error: {
          code: "metadata_mismatch",
          message: "The analyzed upload metadata no longer matches the stored file.",
        },
      };
    }

    await mkdir(compressionDirectory, { recursive: true });

    const id = randomUUID();
    const inputPath = path.join(
      compressionDirectory,
      `${id}${sanitizeExtension(upload.originalName)}`,
    );
    const outputPath = path.join(compressionDirectory, `${id}.compressed.mp4`);
    let ownsInputPath = false;

    try {
      await rename(upload.inputPath, inputPath);
      ownsInputPath = true;

      const job: CompressionJob = {
        id,
        status: "queued",
        preset,
        originalName: upload.originalName,
        inputSize: upload.size,
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
        usageEventId,
        usageConfirmed: false,
      };

      jobs.set(id, job);
      await persistCompressionJob(job);
      logCompressionStage("compression_job_created", {
        jobId: id,
        preset,
        inputSize: upload.size,
      });
      enqueueJob(id);
      void ensureCompressionWorker();

      jobCreated = true;

      return {
        ok: true,
        job: snapshot(job),
      };
    } catch {
      await rm(ownsInputPath ? inputPath : upload.inputPath, { force: true });
      await rm(outputPath, { force: true });
      return {
        ok: false,
        error: {
          code: "missing_file",
          message: "The analyzed upload could not be prepared for compression.",
        },
      };
    }
  } finally {
    // Every early return above means no job was created — the reservation this call
    // was given must be handed back rather than left permanently counted.
    if (!jobCreated && usageEventId) {
      await releaseUsage(usageEventId);
    }
  }
}

export async function getCompressionJob(id: string) {
  const job = await findCompressionJob(id);

  if (job && job.status === "queued") {
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
    // Unlike the "starting"/"running" branch below, a queued job never reaches
    // runJob()'s finally block, so nothing else will release this reservation.
    await releaseJobUsage(job);
    return snapshot(job);
  }

  if (job.status === "starting" || job.status === "running") {
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

  let outputFile;
  let outputStats;

  try {
    outputFile = await open(job.outputPath, "r");
    outputStats = await outputFile.stat();
  } catch {
    return null;
  }

  if (!outputStats.isFile()) {
    await outputFile.close();
    return null;
  }

  return {
    fileName: `${path.parse(job.originalName).name}.qavelix-compressed.mp4`,
    contentType: "video/mp4",
    contentLength: outputStats.size,
    stream: outputFile.createReadStream({
      autoClose: true,
    }),
  };
}

export type CompressionDownload = {
  fileName: string;
  contentType: string;
  contentLength: number;
  stream: ReadStream;
};
