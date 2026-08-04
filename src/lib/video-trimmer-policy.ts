// Pure logic/types for Video Trimmer, mirroring compression-policy.ts's structure and
// conventions exactly (see VIDEOTRIMMER.md "Processing Architecture" — this tool is
// modeled as an async queued job like Video Compressor, not a synchronous request like
// Extract Audio). No I/O here — safe to import from both client and server code, the same
// way compression-precheck.ts is.

export const DOWNLOAD_TTL_MS = 30 * 60 * 1000;

// Phase 1 ships fast (stream-copy) trimming only — see VIDEOTRIMMER.md "FFmpeg Strategy"
// and Open Decision #2. Accurate (re-encode) mode is a documented future addition, not
// implemented here; this type already models a `trimMode` field so a later phase can add
// "accurate" without changing the job shape again.
export const trimModes = ["fast"] as const;
export type TrimMode = (typeof trimModes)[number];

export function isTrimMode(value: string): value is TrimMode {
  return (trimModes as readonly string[]).includes(value);
}

// No "optimized"/"compression_ineffective" equivalent — VIDEOTRIMMER.md Open Decision #5
// resolved: a trim job's success state collapses to a single `completed`, since "did this
// shrink the file" isn't a meaningful question for a trim the way it is for a compression.
export type VideoTrimmerJobStatus =
  | "queued"
  | "starting"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired"
  | "deleted";

export type VideoTrimmerMediaMetadata = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  formatName: string | null;
};

export type VideoTrimmerJobSnapshot = {
  id: string;
  status: VideoTrimmerJobStatus;
  trimMode: TrimMode;
  startSeconds: number;
  endSeconds: number;
  originalName: string;
  inputSize: number;
  outputSize: number | null;
  progress: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  downloadUrl: string | null;
  error: string | null;
};

export function isActiveVideoTrimmerStatus(status: VideoTrimmerJobStatus) {
  return status === "queued" || status === "starting" || status === "running";
}

export function isTerminalVideoTrimmerStatus(status: VideoTrimmerJobStatus) {
  return !isActiveVideoTrimmerStatus(status);
}

export function isDownloadableVideoTrimmerStatus(status: VideoTrimmerJobStatus) {
  return status === "completed";
}

export function getVideoTrimmerDisplayProgress(
  status: VideoTrimmerJobStatus,
  progress: number,
) {
  if (isDownloadableVideoTrimmerStatus(status)) {
    return 100;
  }

  if (status === "cancelled") {
    return 0;
  }

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}

// A source video under this length doesn't leave enough room to pick a meaningful
// start/end range. Enforced here (not just as a client-side ingestion check) specifically
// so the server-side call site (createVideoTrimmerJobFromAnalyzedUpload, re-validating
// against the real FFprobe-derived duration) rejects it too — a direct POST to
// /api/video-trimmer/jobs with a valid uploadReference for a short video and a
// full-duration range would otherwise sail past the only other check (start < end <=
// duration) undetected.
export const MIN_SOURCE_DURATION_SECONDS = 5;

// VIDEOTRIMMER.md "Trim Configuration" validation rules — a single shared function so the
// client-side UX pre-check and the server-side authoritative check can never drift apart
// (the client result is never the security boundary; the server re-runs this exact check).
export type TrimRangeValidationError =
  | "invalid_range"
  | "range_out_of_bounds"
  | "malformed_timestamp"
  | "source_too_short";

export function validateTrimRange(
  startSeconds: number,
  endSeconds: number,
  durationSeconds: number | null,
): TrimRangeValidationError | null {
  if (
    !Number.isFinite(startSeconds) ||
    !Number.isFinite(endSeconds) ||
    startSeconds < 0 ||
    endSeconds < 0
  ) {
    return "malformed_timestamp";
  }

  if (durationSeconds !== null && durationSeconds < MIN_SOURCE_DURATION_SECONDS) {
    return "source_too_short";
  }

  if (startSeconds >= endSeconds) {
    return "invalid_range";
  }

  if (durationSeconds !== null && endSeconds > durationSeconds) {
    return "range_out_of_bounds";
  }

  return null;
}

// Fast (stream-copy) mode only for Phase 1 — see VIDEOTRIMMER.md "FFmpeg Strategy".
// startSeconds/endSeconds must already be validated, finite numbers (see
// validateTrimRange above) before this is called — they are never raw user strings, so
// interpolating them into the argument array never reintroduces a shell-injection risk
// (argument arrays + shell: false remain the only way FFmpeg is ever invoked, matching
// every other processing module in this codebase).
export function buildFfmpegTrimArguments(
  inputPath: string,
  outputPath: string,
  startSeconds: number,
  endSeconds: number,
) {
  const args = [
    "-hide_banner",
    "-nostdin",
    "-y",
    "-ss",
    String(startSeconds),
    "-to",
    String(endSeconds),
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-map_metadata",
    "-1",
    "-c",
    "copy",
    "-avoid_negative_ts",
    "make_zero",
    "-movflags",
    "+faststart",
    "-f",
    "mp4",
    outputPath,
  ];

  return { args };
}
