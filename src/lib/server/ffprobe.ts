import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { UploadAnalysis } from "@/lib/upload-policy";

const execFileAsync = promisify(execFile);

type FfprobeStream = {
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  avg_frame_rate?: string;
  r_frame_rate?: string;
};

type FfprobeOutput = {
  format?: {
    duration?: string;
    bit_rate?: string;
    format_name?: string;
  };
  streams?: FfprobeStream[];
};

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFrameRate(value: string | undefined) {
  if (!value || value === "0/0") {
    return null;
  }

  const parts = value.split("/").map(Number);
  const numerator = parts[0];
  const denominator = parts[1];

  if (
    numerator === undefined ||
    denominator === undefined ||
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return Number((numerator / denominator).toFixed(3));
}

export async function analyzeWithFfprobe(
  filePath: string,
): Promise<Omit<UploadAnalysis, "file">["media"]> {
  const { stdout } = await execFileAsync(
    "ffprobe",
    ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", filePath],
    {
      timeout: 20_000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    },
  );

  const output = JSON.parse(stdout) as FfprobeOutput;
  const videoStream = output.streams?.find((stream) => stream.codec_type === "video");
  const audioStream = output.streams?.find((stream) => stream.codec_type === "audio");

  return {
    durationSeconds: parseNumber(output.format?.duration),
    bitrate: parseNumber(output.format?.bit_rate),
    formatName: output.format?.format_name ?? null,
    width: videoStream?.width ?? null,
    height: videoStream?.height ?? null,
    videoCodec: videoStream?.codec_name ?? null,
    audioCodec: audioStream?.codec_name ?? null,
    frameRate: parseFrameRate(videoStream?.avg_frame_rate ?? videoStream?.r_frame_rate),
  };
}
