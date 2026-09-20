// Video Trimmer job queue/worker — deliberately mirrors compression-queue.ts's structure,
// locking, persistence, ownership, and download-signing patterns as closely as possible
// (VIDEOTRIMMER.md "Processing Architecture": reuse the same async-queued-job shape, not a
// new architecture). Kept as a separate module + separate DB table rather than extending
// compression-queue.ts itself — see VIDEOTRIMMER.md Open Decision #3 and schema.ts's
// videoTrimmerJob comment for why: isolating a brand-new, unreviewed tool from the
// existing, revenue-bearing Compressor code is safer to build and easier to revert.
//
// Phase 1 scope: fast (stream-copy) trimming only — see video-trimmer-policy.ts.

import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { type ReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";

import type { ConsumedAnalyzedUpload } from "@/lib/server/analyzed-upload-registry";
import { isMaintenanceMode } from "@/lib/maintenance";
import { getDb } from "@/lib/server/db/client";
import { videoTrimmerJob as videoTrimmerJobTable } from "@/lib/server/db/schema";
import type { Actor } from "@/lib/server/entitlements/service";
import { confirmUsage, releaseUsage } from "@/lib/server/entitlements/service";
import {
  buildFfmpegTrimArguments,
  DOWNLOAD_TTL_MS,
  isDownloadableVideoTrimmerStatus,
  validateTrimRange,
  type TrimMode,
  type VideoTrimmerJobSnapshot,
  type VideoTrimmerJobStatus,
} from "@/lib/video-trimmer-policy";

type VideoTrimmerJob = VideoTrimmerJobSnapshot & {
  inputPath: string;
  outputPath: string;
  process: ChildProcessWithoutNullStreams | null;
  downloadToken: string | null;
  downloadSignature: string | null;
  cleanupTimer: ReturnType<typeof setTimeout> | null;
  usageEventId: string | null;
  usageConfirmed: boolean;
  // Security Correction #4's pattern, applied identically here — see
  // compression-queue.ts's isJobOwnedByActor for the full reasoning.
  actorType: Actor["type"] | null;
  actorId: string | null;
};

type CreateJobResult =
  | { ok: true; job: VideoTrimmerJobSnapshot }
  | {
      ok: false;
      error: {
        code:
          | "invalid_range"
          | "range_out_of_bounds"
          | "malformed_timestamp"
          | "source_too_short"
          | "queue_full"
          | "service_unavailable"
          | "missing_file"
          | "metadata_mismatch";
        message: string;
      };
    };

const videoTrimmerDirectory = path.join(os.tmpdir(), "qavelix-video-trimmer");
const jobLockDirectory = path.join(videoTrimmerDirectory, "locks");
const maxRetainedJobs = 50;
const maxQueuedJobs = 10;
const staleWorkerLockMs = 5 * 60 * 1000;
// Fast (stream-copy) trims are near-instant, but keep the same 12-minute ceiling as
// Compressor rather than a shorter one — a slow disk/large source can still take real
// time even without re-encoding, and this leaves headroom for the Phase 2 "accurate"
// (re-encode) mode without needing a second timeout constant later.
const ffmpegTimeoutMs = 12 * 60 * 1000;
const ffmpegStderrBufferLimitBytes = 64 * 1024;
const signingSecret = randomBytes(32);
const queue: string[] = [];
const jobs = new Map<string, VideoTrimmerJob>();

let activeJobId: string | null = null;

function jobLockPath(id: string) {
  return path.join(jobLockDirectory, `${id}.lock`);
}

function logTrimStage(
  event: string,
  details: Record<string, string | number | boolean | null> = {},
) {
  console.info(
    JSON.stringify({ level: "info", event, at: new Date().toISOString(), ...details }),
  );
}

function logTrimError(
  event: string,
  details: Record<string, string | number | boolean | null> = {},
) {
  console.error(
    JSON.stringify({ level: "error", event, at: new Date().toISOString(), ...details }),
  );
}

function isPendingVideoTrimmerStatus(status: VideoTrimmerJobStatus) {
  return status === "queued" || status === "starting";
}

function isInterruptedProcessingStatus(status: VideoTrimmerJobStatus) {
  return status === "starting" || status === "running";
}

function appendRollingStderr(current: string, next: string) {
  const combined = current + next;

  if (Buffer.byteLength(combined, "utf8") <= ffmpegStderrBufferLimitBytes) {
    return combined;
  }

  return combined.slice(-ffmpegStderrBufferLimitBytes);
}

function serializableJob(job: VideoTrimmerJob) {
  return {
    id: job.id,
    status: job.status,
    trimMode: job.trimMode,
    startSeconds: job.startSeconds,
    endSeconds: job.endSeconds,
    originalName: job.originalName,
    inputSize: job.inputSize,
    outputSize: job.outputSize,
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
    actorType: job.actorType,
    actorId: job.actorId,
  };
}

// Identical authorization pattern to compression-queue.ts's isJobOwnedByActor — see that
// function's comment for the full "Security Correction #4" reasoning, including the
// fail-closed behavior when a job has no stored actor.
function isJobOwnedByActor(job: VideoTrimmerJob, actor: Actor): boolean {
  if (!job.actorType || !job.actorId) {
    return false;
  }

  return job.actorType === actor.type && job.actorId === actor.id;
}

async function confirmJobUsage(job: VideoTrimmerJob) {
  if (job.usageEventId && !job.usageConfirmed) {
    await confirmUsage(job.usageEventId);
    job.usageConfirmed = true;
    await persistVideoTrimmerJob(job);
  }
}

async function releaseJobUsage(job: VideoTrimmerJob) {
  if (job.usageEventId && !job.usageConfirmed) {
    await releaseUsage(job.usageEventId);
  }
}

async function persistVideoTrimmerJob(job: VideoTrimmerJob) {
  const db = getDb();
  const data = serializableJob(job);

  await db
    .insert(videoTrimmerJobTable)
    .values({ id: job.id, status: job.status, data })
    .onConflictDoUpdate({
      target: videoTrimmerJobTable.id,
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

async function readPersistedVideoTrimmerJob(id: string) {
  try {
    const db = getDb();
    const [row] = await db
      .select({ data: videoTrimmerJobTable.data })
      .from(videoTrimmerJobTable)
      .where(eq(videoTrimmerJobTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const persisted = row.data as Omit<VideoTrimmerJob, "process" | "cleanupTimer">;

    return {
      ...persisted,
      process: null,
      cleanupTimer: null,
    } satisfies VideoTrimmerJob;
  } catch {
    return null;
  }
}

async function findVideoTrimmerJob(id: string) {
  const inMemoryJob = jobs.get(id);
  const persistedJob = await readPersistedVideoTrimmerJob(id);

  if (!persistedJob) {
    return inMemoryJob ?? null;
  }

  if (isInterruptedProcessingStatus(persistedJob.status)) {
    if (inMemoryJob?.process || activeJobId === id) {
      return inMemoryJob;
    }

    await persistStatus(persistedJob, "failed", "Trim interrupted.");
    await cleanupJobFiles(persistedJob);
    await releaseJobUsage(persistedJob);
    jobs.set(id, persistedJob);
    logTrimError("video_trimmer_orphaned_processing_job_failed", { jobId: persistedJob.id });
    return persistedJob;
  }

  if (
    !inMemoryJob ||
    !isPendingVideoTrimmerStatus(persistedJob.status) ||
    persistedJob.progress >= inMemoryJob.progress
  ) {
    jobs.set(id, persistedJob);
    return persistedJob;
  }

  return inMemoryJob;
}

async function loadPendingVideoTrimmerJobs() {
  try {
    const db = getDb();
    const rows = await db.select({ id: videoTrimmerJobTable.id }).from(videoTrimmerJobTable);
    const pendingJobs: VideoTrimmerJob[] = [];

    for (const row of rows) {
      const job = await findVideoTrimmerJob(row.id);

      if (job && isInterruptedProcessingStatus(job.status)) {
        await persistStatus(job, "failed", "Trim interrupted.");
        await cleanupJobFiles(job);
        await releaseJobUsage(job);
        logTrimError("video_trimmer_stale_processing_job_failed", {
          jobId: job.id,
          status: job.status,
        });
        continue;
      }

      if (job && isPendingVideoTrimmerStatus(job.status)) {
        pendingJobs.push(job);
      }
    }

    return pendingJobs.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  } catch {
    return [];
  }
}

function enqueueJob(id: string) {
  if (!queue.includes(id)) {
    queue.push(id);
    logTrimStage("video_trimmer_job_queued", { jobId: id, queueDepth: queue.length });
  }
}

async function ensureVideoTrimmerWorker() {
  // Shutdown: never start the worker or read the job table (see compression-queue.ts).
  if (isMaintenanceMode()) {
    queue.length = 0;
    return;
  }

  if (activeJobId) {
    return;
  }

  if (queue.length === 0) {
    const pendingJobs = await loadPendingVideoTrimmerJobs();

    for (const job of pendingJobs) {
      enqueueJob(job.id);
    }
  }

  if (queue.length > 0) {
    void processNextJob();
  }
}

function snapshot(job: VideoTrimmerJob): VideoTrimmerJobSnapshot {
  return {
    id: job.id,
    status: job.status,
    trimMode: job.trimMode,
    startSeconds: job.startSeconds,
    endSeconds: job.endSeconds,
    originalName: job.originalName,
    inputSize: job.inputSize,
    outputSize: job.outputSize,
    progress: job.progress,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    expiresAt: job.expiresAt,
    downloadUrl:
      isDownloadableVideoTrimmerStatus(job.status) && job.downloadToken && job.downloadSignature
        ? `/api/video-trimmer/jobs/${job.id}/download?token=${encodeURIComponent(job.downloadToken)}&signature=${encodeURIComponent(job.downloadSignature)}`
        : null,
    error: job.error,
  };
}

function setJobStatus(
  job: VideoTrimmerJob,
  status: VideoTrimmerJobStatus,
  error: string | null = null,
) {
  job.status = status;
  job.error = error;

  if ((status === "starting" || status === "running") && !job.startedAt) {
    job.startedAt = new Date().toISOString();
  }

  if (
    status === "completed" ||
    status === "failed" ||
    status === "cancelled" ||
    status === "expired" ||
    status === "deleted"
  ) {
    job.completedAt = new Date().toISOString();
  }
}

async function persistStatus(
  job: VideoTrimmerJob,
  status: VideoTrimmerJobStatus,
  error: string | null = null,
) {
  setJobStatus(job, status, error);
  await persistVideoTrimmerJob(job);
}

function createDownloadSignature(jobId: string, token: string, expiresAt: string) {
  return createHmac("sha256", signingSecret)
    .update(`${jobId}.${token}.${expiresAt}`)
    .digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function sanitizeExtension(fileName: string) {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
}

async function cleanupJobFiles(job: VideoTrimmerJob) {
  if (job.cleanupTimer) {
    clearTimeout(job.cleanupTimer);
    job.cleanupTimer = null;
  }

  await Promise.all([rm(job.inputPath, { force: true }), rm(job.outputPath, { force: true })]);
}

async function cleanupInputFile(job: VideoTrimmerJob) {
  await rm(job.inputPath, { force: true });
}

function scheduleExpiration(job: VideoTrimmerJob) {
  if (!job.expiresAt) {
    return;
  }

  const delay = Math.max(0, new Date(job.expiresAt).getTime() - Date.now());

  job.cleanupTimer = setTimeout(() => {
    void expireVideoTrimmerJob(job.id);
  }, delay);
}

function parseProgress(chunk: Buffer, clipDurationSeconds: number) {
  if (clipDurationSeconds <= 0) {
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

  return Math.min(99, Math.max(1, Math.round((currentSeconds / clipDurationSeconds) * 100)));
}

function formatCommand(command: string, args: string[]) {
  return [command, ...args]
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

async function runJob(job: VideoTrimmerJob) {
  const lockAcquired = await acquireJobLock(job.id);

  if (!lockAcquired) {
    logTrimStage("video_trimmer_worker_lock_skipped", { jobId: job.id, status: job.status });
    return;
  }

  const latestPersistedJob = await readPersistedVideoTrimmerJob(job.id);

  if (latestPersistedJob && !isPendingVideoTrimmerStatus(latestPersistedJob.status)) {
    jobs.set(job.id, latestPersistedJob);
    logTrimStage("video_trimmer_worker_stale_job_skipped", {
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

  logTrimStage("video_trimmer_worker_picked_job", {
    jobId: job.id,
    startSeconds: job.startSeconds,
    endSeconds: job.endSeconds,
  });

  try {
    const inputStats = await stat(job.inputPath);

    if (!inputStats.isFile()) {
      throw new Error("Video trimmer input path is not a file.");
    }

    if (inputStats.size !== job.inputSize) {
      throw new Error(
        `Video trimmer input size mismatch: expected ${job.inputSize}, got ${inputStats.size}.`,
      );
    }

    await stat(videoTrimmerDirectory);
    await mkdir(path.dirname(job.outputPath), { recursive: true });
    await rm(job.outputPath, { force: true });

    const { args } = buildFfmpegTrimArguments(
      job.inputPath,
      job.outputPath,
      job.startSeconds,
      job.endSeconds,
    );
    ffmpegCommand = formatCommand("ffmpeg", args);
    logTrimStage("video_trimmer_ffmpeg_command_generated", {
      jobId: job.id,
      command: ffmpegCommand,
    });

    const ffmpeg = spawn("ffmpeg", args, { shell: false, windowsHide: true });
    const ffmpegTimeout = setTimeout(() => {
      ffmpegTimedOut = true;
      logTrimError("video_trimmer_ffmpeg_timeout", { jobId: job.id, timeoutMs: ffmpegTimeoutMs });
      ffmpeg.kill("SIGTERM");
      setTimeout(() => {
        if (ffmpeg.exitCode === null && ffmpeg.signalCode === null) {
          ffmpeg.kill("SIGKILL");
        }
      }, 5_000).unref();
    }, ffmpegTimeoutMs);
    ffmpegTimeout.unref();

    job.process = ffmpeg;

    const clipDurationSeconds = job.endSeconds - job.startSeconds;

    if (job.status === "cancelled") {
      ffmpeg.kill("SIGTERM");
    } else {
      await persistStatus(job, "running");
      logTrimStage("video_trimmer_ffmpeg_spawned", { jobId: job.id, pid: ffmpeg.pid ?? null });
    }

    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      const progress = parseProgress(chunk, clipDurationSeconds);

      if (progress !== null) {
        job.progress = progress;
        void persistVideoTrimmerJob(job);
      }
    });

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      ffmpegStderr = appendRollingStderr(ffmpegStderr, chunk.toString("utf8"));
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
          reject(new Error("Trim timed out."));
          return;
        }

        reject(new Error(`FFmpeg exited with code ${code ?? "unknown"}.`));
      });
    });

    if (job.status !== "cancelled") {
      const outputStats = await stat(job.outputPath);
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + DOWNLOAD_TTL_MS).toISOString();

      job.outputSize = outputStats.size;
      job.progress = 100;
      job.expiresAt = expiresAt;
      job.downloadToken = token;
      job.downloadSignature = createDownloadSignature(job.id, token, expiresAt);
      await persistStatus(job, "completed");
      await confirmJobUsage(job);
      logTrimStage("video_trimmer_job_completed", { jobId: job.id, outputSize: outputStats.size });
      await cleanupInputFile(job);
      scheduleExpiration(job);
    }
  } catch (error) {
    if (job.status !== "cancelled") {
      logTrimError("video_trimmer_job_failed", {
        jobId: job.id,
        command: ffmpegCommand,
        exitCode: ffmpegExitCode,
        message: error instanceof Error ? error.message : "Trim failed.",
        stderr: ffmpegStderr,
      });
      await rm(job.outputPath, { force: true });
      await persistStatus(job, "failed", "Trim failed.");
    }
  } finally {
    job.process = null;
    activeJobId = null;
    if (!isDownloadableVideoTrimmerStatus(job.status)) {
      await cleanupJobFiles(job);
    }
    await releaseJobUsage(job);
    await releaseJobLock(job.id);
    void processNextJob();
  }
}

async function processNextJob() {
  // Shutdown: drop the in-memory queue and never spawn FFmpeg.
  if (isMaintenanceMode()) {
    queue.length = 0;
    return;
  }

  if (activeJobId || queue.length === 0) {
    return;
  }

  const nextJobId = queue.shift();

  if (!nextJobId) {
    return;
  }

  const job = await findVideoTrimmerJob(nextJobId);

  if (!job || !isPendingVideoTrimmerStatus(job.status)) {
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

export async function createVideoTrimmerJobFromAnalyzedUpload(
  upload: ConsumedAnalyzedUpload,
  startSeconds: number,
  endSeconds: number,
  trimMode: TrimMode,
  usageEventId: string | null,
  actor: Actor,
): Promise<CreateJobResult> {
  let jobCreated = false;

  try {
    // Shutdown: reject cleanly before any file, DB, or FFmpeg work; the finally block
    // releases the caller's usage reservation since jobCreated stays false.
    if (isMaintenanceMode()) {
      return {
        ok: false,
        error: {
          code: "service_unavailable",
          message: "QAVELIX is under maintenance and is not accepting new jobs.",
        },
      };
    }

    const rangeError = validateTrimRange(startSeconds, endSeconds, upload.media.durationSeconds);

    if (rangeError) {
      return {
        ok: false,
        error: { code: rangeError, message: "The selected start and end time are not valid for this video." },
      };
    }

    pruneTerminalJobs();

    if (queue.length >= maxQueuedJobs) {
      return {
        ok: false,
        error: { code: "queue_full", message: "The trim queue is full. Try again later." },
      };
    }

    let sourceStats;

    try {
      sourceStats = await stat(upload.inputPath);
    } catch {
      return {
        ok: false,
        error: { code: "missing_file", message: "The analyzed upload is no longer available." },
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

    await mkdir(videoTrimmerDirectory, { recursive: true });

    const id = randomUUID();
    const inputPath = path.join(
      videoTrimmerDirectory,
      `${id}${sanitizeExtension(upload.originalName)}`,
    );
    const outputPath = path.join(videoTrimmerDirectory, `${id}.trimmed.mp4`);
    let ownsInputPath = false;

    try {
      await rename(upload.inputPath, inputPath);
      ownsInputPath = true;

      const job: VideoTrimmerJob = {
        id,
        status: "queued",
        trimMode,
        startSeconds,
        endSeconds,
        originalName: upload.originalName,
        inputSize: upload.size,
        outputSize: null,
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
        actorType: actor.type,
        actorId: actor.id,
      };

      jobs.set(id, job);
      await persistVideoTrimmerJob(job);
      logTrimStage("video_trimmer_job_created", { jobId: id, startSeconds, endSeconds });
      enqueueJob(id);
      void ensureVideoTrimmerWorker();

      jobCreated = true;

      return { ok: true, job: snapshot(job) };
    } catch {
      await rm(ownsInputPath ? inputPath : upload.inputPath, { force: true });
      await rm(outputPath, { force: true });
      return {
        ok: false,
        error: {
          code: "missing_file",
          message: "The analyzed upload could not be prepared for trimming.",
        },
      };
    }
  } finally {
    if (!jobCreated && usageEventId) {
      await releaseUsage(usageEventId);
    }
  }
}

export async function getVideoTrimmerJob(id: string, actor: Actor) {
  const job = await findVideoTrimmerJob(id);

  if (!job || !isJobOwnedByActor(job, actor)) {
    return null;
  }

  if (job.status === "queued") {
    enqueueJob(job.id);
    void ensureVideoTrimmerWorker();
  }

  return snapshot(job);
}

export async function cancelVideoTrimmerJob(id: string, actor: Actor) {
  const job = await findVideoTrimmerJob(id);

  if (!job || !isJobOwnedByActor(job, actor)) {
    return null;
  }

  if (job.status === "queued") {
    const queueIndex = queue.indexOf(id);

    if (queueIndex >= 0) {
      queue.splice(queueIndex, 1);
    }

    await persistStatus(job, "cancelled");
    await cleanupJobFiles(job);
    await releaseJobUsage(job);
    return snapshot(job);
  }

  if (job.status === "starting" || job.status === "running") {
    await persistStatus(job, "cancelled");
    job.process?.kill("SIGTERM");
    return snapshot(job);
  }

  if (isDownloadableVideoTrimmerStatus(job.status)) {
    setJobStatus(job, "deleted");
    job.progress = 100;
    job.downloadToken = null;
    job.downloadSignature = null;
    job.expiresAt = null;
    await persistVideoTrimmerJob(job);
    await cleanupJobFiles(job);
    return snapshot(job);
  }

  return snapshot(job);
}

export async function expireVideoTrimmerJob(id: string) {
  const job = await findVideoTrimmerJob(id);

  if (!job || !isDownloadableVideoTrimmerStatus(job.status)) {
    return null;
  }

  setJobStatus(job, "expired");
  job.downloadToken = null;
  job.downloadSignature = null;
  await persistVideoTrimmerJob(job);
  await cleanupJobFiles(job);

  return snapshot(job);
}

export async function readVideoTrimmerDownload(
  id: string,
  token: string,
  signature: string,
  actor: Actor,
) {
  const job = await findVideoTrimmerJob(id);

  if (
    !job ||
    !isJobOwnedByActor(job, actor) ||
    !isDownloadableVideoTrimmerStatus(job.status) ||
    !job.expiresAt ||
    !job.downloadToken ||
    !job.downloadSignature
  ) {
    return null;
  }

  if (new Date(job.expiresAt).getTime() <= Date.now()) {
    await expireVideoTrimmerJob(id);
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
    fileName: `${path.parse(job.originalName).name}.qavelix-trimmed.mp4`,
    contentType: "video/mp4",
    contentLength: outputStats.size,
    stream: outputFile.createReadStream({ autoClose: true }),
  };
}

export type VideoTrimmerDownload = {
  fileName: string;
  contentType: string;
  contentLength: number;
  stream: ReadStream;
};
