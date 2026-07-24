import { spawn } from "node:child_process";
import path from "node:path";
import { stat } from "node:fs/promises";

import { analyzeWithFfprobe } from "@/lib/server/ffprobe";
import {
  silenceMinimumDurationSeconds,
  silenceNoiseThreshold,
  summarizeSilenceCoverageFromStderr,
} from "@/lib/silence-detection";

export type ExtractAudioErrorCode =
  | "ffmpeg_failed"
  | "no_audio"
  | "output_unavailable"
  | "silent_audio"
  | "timeout";

export class ExtractAudioError extends Error {
  constructor(
    readonly code: ExtractAudioErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const ffmpegTimeoutMs = 8 * 60 * 1000;
const ffmpegStderrBufferLimitBytes = 32 * 1024;

function appendRollingStderr(current: string, chunk: string) {
  const combined = `${current}${chunk}`;

  if (Buffer.byteLength(combined, "utf8") <= ffmpegStderrBufferLimitBytes) {
    return combined;
  }

  return combined.slice(-ffmpegStderrBufferLimitBytes);
}

export function createExtractedAudioFileName(originalName: string) {
  const parsed = path.parse(originalName);
  const baseName = parsed.name
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .trim();

  return `${baseName || "qavelix-audio"}.mp3`;
}

export function getExtractAudioFfmpegArgs(inputPath: string, outputPath: string) {
  return [
    "-hide_banner",
    "-nostdin",
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:a:0",
    "-vn",
    "-c:a",
    "libmp3lame",
    "-b:a",
    "192k",
    outputPath,
  ];
}

export function getSilenceDetectFfmpegArgs(inputPath: string) {
  return [
    "-hide_banner",
    "-nostdin",
    "-i",
    inputPath,
    "-map",
    "0:a:0",
    "-af",
    `silencedetect=noise=${silenceNoiseThreshold}:d=${silenceMinimumDurationSeconds}`,
    "-f",
    "null",
    "-",
  ];
}

async function runSilenceDetect(inputPath: string) {
  const args = getSilenceDetectFfmpegArgs(inputPath);
  let stderr = "";
  let timedOut = false;

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      ffmpeg.kill("SIGTERM");

      setTimeout(() => {
        if (ffmpeg.exitCode === null && ffmpeg.signalCode === null) {
          ffmpeg.kill("SIGKILL");
        }
      }, 5_000).unref();
    }, ffmpegTimeoutMs);

    timeout.unref();

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr = appendRollingStderr(stderr, chunk.toString("utf8"));
    });

    ffmpeg.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ffmpeg.on("close", (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        reject(new ExtractAudioError("timeout", "Audio analysis timed out."));
        return;
      }

      if (code !== 0) {
        reject(
          new ExtractAudioError(
            "ffmpeg_failed",
            "FFmpeg could not analyze the selected audio stream.",
          ),
        );
        return;
      }

      resolve();
    });
  });

  return stderr;
}

export async function analyzeAudibleAudio(
  inputPath: string,
  totalDurationSeconds: number | null,
) {
  if (!totalDurationSeconds || totalDurationSeconds <= 0) {
    throw new ExtractAudioError("ffmpeg_failed", "Audio duration is unavailable.");
  }

  const stderr = await runSilenceDetect(inputPath);
  return summarizeSilenceCoverageFromStderr(stderr, totalDurationSeconds);
}

export async function assertAudibleAudio(
  inputPath: string,
  totalDurationSeconds: number | null,
) {
  const analysis = await analyzeAudibleAudio(inputPath, totalDurationSeconds);

  if (analysis.isSilent) {
    throw new ExtractAudioError(
      "silent_audio",
      "The selected video does not contain audible audio.",
    );
  }

  return analysis;
}

export async function extractMp3Audio(inputPath: string, outputPath: string) {
  const args = getExtractAudioFfmpegArgs(inputPath, outputPath);
  let stderr = "";
  let timedOut = false;

  await new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args, {
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    });

    const timeout = setTimeout(() => {
      timedOut = true;
      ffmpeg.kill("SIGTERM");

      setTimeout(() => {
        if (ffmpeg.exitCode === null && ffmpeg.signalCode === null) {
          ffmpeg.kill("SIGKILL");
        }
      }, 5_000).unref();
    }, ffmpegTimeoutMs);

    timeout.unref();

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      stderr = appendRollingStderr(stderr, chunk.toString("utf8"));
    });

    ffmpeg.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ffmpeg.on("close", (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        reject(new ExtractAudioError("timeout", "Audio extraction timed out."));
        return;
      }

      if (code !== 0) {
        reject(
          new ExtractAudioError(
            "ffmpeg_failed",
            stderr || "FFmpeg could not extract audio from the selected video.",
          ),
        );
        return;
      }

      resolve();
    });
  });
}

export async function verifyExtractedMp3(outputPath: string) {
  const outputStats = await stat(outputPath);

  if (outputStats.size <= 0) {
    throw new ExtractAudioError("output_unavailable", "The MP3 output is empty.");
  }

  const media = await analyzeWithFfprobe(outputPath);

  if (!media.audioCodec) {
    throw new ExtractAudioError(
      "output_unavailable",
      "The generated MP3 could not be verified.",
    );
  }

  return {
    size: outputStats.size,
    media,
  };
}
