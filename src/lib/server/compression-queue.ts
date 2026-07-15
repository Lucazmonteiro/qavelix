import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  compressionPresets,
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
};

type CreateJobResult =
  | {
      ok: true;
      job: CompressionJobSnapshot;
    }
  | {
      ok: false;
      error: UploadValidationError | { code: "invalid_preset"; message: string };
    };

const compressionDirectory = path.join(os.tmpdir(), "qavelix-compression");
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

  if (status === "completed" || status === "failed" || status === "cancelled") {
    job.completedAt = new Date().toISOString();
  }
}

function sanitizeExtension(fileName: string) {
  return path
    .extname(fileName)
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
}

async function cleanupJobFiles(job: CompressionJob) {
  await Promise.all([
    rm(job.inputPath, { force: true }),
    rm(job.outputPath, { force: true }),
  ]);
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
      job.outputSize = outputStats.size;
      job.progress = 100;
      setJobStatus(job, "completed");
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
    await cleanupJobFiles(job);
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

export async function createCompressionJob(
  file: File,
  preset: CompressionPresetId,
): Promise<CreateJobResult> {
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
    error: null,
    inputPath,
    outputPath,
    process: null,
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

  return snapshot(job);
}
