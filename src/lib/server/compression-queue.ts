import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  compressionPresets,
  DOWNLOAD_TTL_MS,
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
const maxRetainedJobs = 50;
const maxQueuedJobs = 10;
const signingSecret = randomBytes(32);
const queue: string[] = [];
const jobs = new Map<string, CompressionJob>();

let activeJobId: string | null = null;

function snapshot(job: CompressionJob): CompressionJobSnapshot {
  return {
    id: job.id,
    status: job.status,
    preset: job.preset,
    originalName: job.originalName,
    inputSize: job.inputSize,
    outputSize: job.outputSize,
    progress: job.progress,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    expiresAt: job.expiresAt,
    downloadUrl:
      job.status === "completed" && job.downloadToken && job.downloadSignature
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

  if (status === "running") {
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
  activeJobId = job.id;
  setJobStatus(job, "running");

  try {
    const metadata = await analyzeWithFfprobe(job.inputPath);
    const preset = compressionPresets[job.preset];
    const scaleFilter = `scale='min(iw,${preset.maxHeight * 2})':'min(ih,${preset.maxHeight})':force_original_aspect_ratio=decrease`;

    const ffmpeg = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-nostdin",
        "-y",
        "-i",
        job.inputPath,
        "-map",
        "0:v:0",
        "-map",
        "0:a?",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        String(preset.crf),
        "-vf",
        scaleFilter,
        "-c:a",
        "aac",
        "-b:a",
        preset.audioBitrate,
        "-movflags",
        "+faststart",
        "-progress",
        "pipe:2",
        job.outputPath,
      ],
      {
        shell: false,
        windowsHide: true,
      },
    );

    job.process = ffmpeg;

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      const progress = parseProgress(chunk, metadata.durationSeconds);

      if (progress !== null) {
        job.progress = progress;
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

    if (job.status !== "cancelled") {
      const outputStats = await stat(job.outputPath);
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + DOWNLOAD_TTL_MS).toISOString();

      job.outputSize = outputStats.size;
      job.progress = 100;
      job.expiresAt = expiresAt;
      job.downloadToken = token;
      job.downloadSignature = createDownloadSignature(job.id, token, expiresAt);
      setJobStatus(job, "completed");
      await cleanupInputFile(job);
      scheduleExpiration(job);
    }
  } catch (error) {
    if (job.status !== "cancelled") {
      setJobStatus(
        job,
        "failed",
        error instanceof Error ? error.message : "Compression failed.",
      );
    }
  } finally {
    job.process = null;
    activeJobId = null;
    if (job.status !== "completed") {
      await cleanupJobFiles(job);
    }
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

  const job = jobs.get(nextJobId);

  if (!job || job.status !== "queued") {
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

  await mkdir(compressionDirectory, { recursive: true });

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
  queue.push(id);
  void processNextJob();

  return {
    ok: true,
    job: snapshot(job),
  };
}

export function getCompressionJob(id: string) {
  const job = jobs.get(id);
  return job ? snapshot(job) : null;
}

export async function cancelCompressionJob(id: string) {
  const job = jobs.get(id);

  if (!job) {
    return null;
  }

  if (job.status === "queued") {
    const queueIndex = queue.indexOf(id);

    if (queueIndex >= 0) {
      queue.splice(queueIndex, 1);
    }

    setJobStatus(job, "cancelled");
    await cleanupJobFiles(job);
    return snapshot(job);
  }

  if (job.status === "running") {
    setJobStatus(job, "cancelled");
    job.process?.kill("SIGTERM");
    return snapshot(job);
  }

  if (job.status === "completed") {
    setJobStatus(job, "deleted");
    job.progress = 100;
    job.downloadToken = null;
    job.downloadSignature = null;
    job.expiresAt = null;
    await cleanupJobFiles(job);
    return snapshot(job);
  }

  return snapshot(job);
}

export async function expireCompressionJob(id: string) {
  const job = jobs.get(id);

  if (!job || job.status !== "completed") {
    return null;
  }

  setJobStatus(job, "expired");
  job.downloadToken = null;
  job.downloadSignature = null;
  await cleanupJobFiles(job);

  return snapshot(job);
}

export async function readCompressionDownload(
  id: string,
  token: string,
  signature: string,
) {
  const job = jobs.get(id);

  if (
    !job ||
    job.status !== "completed" ||
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

  const expectedSignature = createDownloadSignature(id, token, job.expiresAt);

  if (
    !constantTimeEqual(token, job.downloadToken) ||
    !constantTimeEqual(signature, job.downloadSignature) ||
    !constantTimeEqual(signature, expectedSignature)
  ) {
    return null;
  }

  return {
    fileName: `${path.parse(job.originalName).name}.qavelix-compressed.mp4`,
    contentType: "video/mp4",
    bytes: await readFile(job.outputPath),
  };
}
