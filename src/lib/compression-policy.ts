export const compressionPresets = {
  small: {
    label: "Smaller File",
    crf: 31,
    maxHeight: null,
    preservesResolution: false,
    audioBitrateKbps: 96,
    encoderPreset: "veryfast",
    sourceBitrateRatio: 0.45,
    maxVideoBitrateKbps: 2200,
  },
  balanced: {
    label: "Balanced",
    crf: 26,
    maxHeight: null,
    preservesResolution: true,
    audioBitrateKbps: 160,
    encoderPreset: "veryfast",
    sourceBitrateRatio: 0.7,
    maxVideoBitrateKbps: 6500,
  },
  high: {
    label: "High Quality",
    crf: 20,
    maxHeight: null,
    preservesResolution: true,
    audioBitrateKbps: 256,
    encoderPreset: "fast",
    sourceBitrateRatio: 0.92,
    maxVideoBitrateKbps: 14000,
  },
} as const;

export type CompressionPresetId = keyof typeof compressionPresets;

export const DOWNLOAD_TTL_MS = 30 * 60 * 1000;
export const MAX_LANDSCAPE_OUTPUT_WIDTH = 1920;
export const MAX_LANDSCAPE_OUTPUT_HEIGHT = 1080;
export const MAX_PORTRAIT_OUTPUT_WIDTH = 1080;
export const MAX_PORTRAIT_OUTPUT_HEIGHT = 1920;
export const FFMPEG_ENCODER_THREADS = 2;
export const FFMPEG_X264_LOOKAHEAD_THREADS = 1;

export type CompressionJobStatus =
  | "queued"
  | "starting"
  | "running"
  | "completed"
  | "optimized"
  | "compression_ineffective"
  | "failed"
  | "cancelled"
  | "expired"
  | "deleted";

export type CompressionStats = {
  originalSize: number;
  compressedSize: number;
  deltaBytes: number;
  savedBytes: number;
  increasedBytes: number;
  reductionPercent: number;
  increasePercent: number;
  isIneffective: boolean;
  outputWidth: number | null;
  outputHeight: number | null;
  wasDownscaledToFullHd: boolean;
};

export type CompressionMediaMetadata = {
  durationSeconds: number | null;
  bitrate: number | null;
  formatName: string | null;
  width: number | null;
  height: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  frameRate: number | null;
};

export type CompressionEncodingPlan = {
  preset: CompressionPresetId;
  crf: number;
  maxHeight: number | null;
  preservesResolution: boolean;
  audioBitrate: string;
  videoMaxrate: string;
  videoBufsize: string;
  scaleFilter: string | null;
  outputWidth: number | null;
  outputHeight: number | null;
  wasDownscaledToFullHd: boolean;
  estimatedReductionLikely: boolean;
};

export type CompressionJobSnapshot = {
  id: string;
  status: CompressionJobStatus;
  preset: CompressionPresetId;
  originalName: string;
  inputSize: number;
  outputSize: number | null;
  compression: CompressionStats | null;
  progress: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  downloadUrl: string | null;
  error: string | null;
};

export function isCompressionPresetId(value: string): value is CompressionPresetId {
  return Object.hasOwn(compressionPresets, value);
}

export function isDownloadableCompressionStatus(status: CompressionJobStatus) {
  return (
    status === "completed" ||
    status === "optimized" ||
    status === "compression_ineffective"
  );
}

export function isActiveCompressionStatus(status: CompressionJobStatus) {
  return status === "queued" || status === "starting" || status === "running";
}

export function isTerminalCompressionStatus(status: CompressionJobStatus) {
  return !isActiveCompressionStatus(status);
}

export function getCompressionDisplayProgress(
  status: CompressionJobStatus,
  progress: number,
) {
  if (isDownloadableCompressionStatus(status)) {
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

export function mergePolledCompressionJob(
  currentJob: CompressionJobSnapshot | null,
  nextJob: CompressionJobSnapshot,
) {
  if (!currentJob || currentJob.id !== nextJob.id) {
    return currentJob;
  }

  if (isTerminalCompressionStatus(currentJob.status)) {
    return currentJob;
  }

  if (nextJob.status === "cancelled") {
    return {
      ...nextJob,
      outputSize: null,
      compression: null,
      progress: 0,
      expiresAt: null,
      downloadUrl: null,
    } satisfies CompressionJobSnapshot;
  }

  const progress = Math.max(
    getCompressionDisplayProgress(currentJob.status, currentJob.progress),
    getCompressionDisplayProgress(nextJob.status, nextJob.progress),
  );

  return {
    ...nextJob,
    progress,
  } satisfies CompressionJobSnapshot;
}

export function calculateCompressionStats(
  originalSize: number,
  compressedSize: number,
  outputMetadata: {
    outputWidth?: number | null;
    outputHeight?: number | null;
    wasDownscaledToFullHd?: boolean;
  } = {},
): CompressionStats {
  const deltaBytes = originalSize - compressedSize;
  const savedBytes = Math.max(0, deltaBytes);
  const increasedBytes = Math.max(0, -deltaBytes);
  const ratioBase = originalSize > 0 ? originalSize : 1;

  return {
    originalSize,
    compressedSize,
    deltaBytes,
    savedBytes,
    increasedBytes,
    reductionPercent: Number(((savedBytes / ratioBase) * 100).toFixed(1)),
    increasePercent: Number(((increasedBytes / ratioBase) * 100).toFixed(1)),
    isIneffective: compressedSize >= originalSize,
    outputWidth: outputMetadata.outputWidth ?? null,
    outputHeight: outputMetadata.outputHeight ?? null,
    wasDownscaledToFullHd: outputMetadata.wasDownscaledToFullHd ?? false,
  };
}

export function getCompressionOutcomeStatus(stats: CompressionStats) {
  return stats.isIneffective ? "compression_ineffective" : "optimized";
}

export function createCompressionEncodingPlan(
  metadata: CompressionMediaMetadata,
  presetId: CompressionPresetId,
): CompressionEncodingPlan {
  const preset = compressionPresets[presetId];
  const sourceBitrate =
    metadata.bitrate && metadata.bitrate > 0 ? metadata.bitrate : null;
  const audioBitrateBps = preset.audioBitrateKbps * 1000;
  const presetCeilingBps = preset.maxVideoBitrateKbps * 1000 + audioBitrateBps;
  const targetTotalBitrate = sourceBitrate
    ? Math.min(sourceBitrate * preset.sourceBitrateRatio, presetCeilingBps)
    : presetCeilingBps;
  const videoBitrateBps = Math.max(240_000, targetTotalBitrate - audioBitrateBps);
  const videoKbps = Math.max(240, Math.round(videoBitrateBps / 1000));
  const outputDimensions = getBoundedOutputDimensions(metadata.width, metadata.height);
  const shouldScale =
    outputDimensions.width !== null &&
    outputDimensions.height !== null &&
    (outputDimensions.width !== metadata.width || outputDimensions.height !== metadata.height);
  const scaleFilter = shouldScale
    ? "scale='if(gte(iw,ih),min(iw,1920),min(iw,1080))':'if(gte(iw,ih),min(ih,1080),min(ih,1920))':force_original_aspect_ratio=decrease:force_divisible_by=2"
    : null;

  return {
    preset: presetId,
    crf: preset.crf,
    maxHeight: preset.maxHeight,
    preservesResolution: preset.preservesResolution,
    audioBitrate: `${preset.audioBitrateKbps}k`,
    videoMaxrate: `${videoKbps}k`,
    videoBufsize: `${videoKbps * 2}k`,
    scaleFilter,
    outputWidth: outputDimensions.width,
    outputHeight: outputDimensions.height,
    wasDownscaledToFullHd: outputDimensions.wasDownscaledToFullHd,
    estimatedReductionLikely:
      shouldScale || Boolean(sourceBitrate && targetTotalBitrate < sourceBitrate),
  };
}

function evenFloor(value: number) {
  return Math.max(2, Math.floor(value / 2) * 2);
}

export function getBoundedOutputDimensions(
  width: number | null,
  height: number | null,
) {
  if (!width || !height || width <= 0 || height <= 0) {
    return {
      width: null,
      height: null,
      wasDownscaledToFullHd: false,
    };
  }

  const isLandscape = width >= height;
  const maxWidth = isLandscape
    ? MAX_LANDSCAPE_OUTPUT_WIDTH
    : MAX_PORTRAIT_OUTPUT_WIDTH;
  const maxHeight = isLandscape
    ? MAX_LANDSCAPE_OUTPUT_HEIGHT
    : MAX_PORTRAIT_OUTPUT_HEIGHT;
  const scaleRatio = Math.min(1, maxWidth / width, maxHeight / height);
  const outputWidth = evenFloor(width * scaleRatio);
  const outputHeight = evenFloor(height * scaleRatio);

  return {
    width: outputWidth,
    height: outputHeight,
    wasDownscaledToFullHd: outputWidth < evenFloor(width) || outputHeight < evenFloor(height),
  };
}

export function buildFfmpegCompressionArguments(
  inputPath: string,
  outputPath: string,
  metadata: CompressionMediaMetadata,
  presetId: CompressionPresetId,
) {
  const preset = compressionPresets[presetId];
  const plan = createCompressionEncodingPlan(metadata, presetId);
  const args = [
    "-hide_banner",
    "-nostdin",
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-map_metadata",
    "-1",
    "-sn",
    "-c:v",
    "libx264",
    "-preset",
    preset.encoderPreset,
    "-threads",
    String(FFMPEG_ENCODER_THREADS),
    "-x264-params",
    `threads=${FFMPEG_ENCODER_THREADS}:lookahead-threads=${FFMPEG_X264_LOOKAHEAD_THREADS}`,
    "-crf",
    String(plan.crf),
    "-maxrate",
    plan.videoMaxrate,
    "-bufsize",
    plan.videoBufsize,
    "-pix_fmt",
    "yuv420p",
  ];

  if (plan.scaleFilter) {
    args.push("-vf", plan.scaleFilter);
  }

  args.push(
    "-c:a",
    "aac",
    "-b:a",
    plan.audioBitrate,
    "-ac",
    "2",
    "-movflags",
    "+faststart",
    "-f",
    "mp4",
    "-progress",
    "pipe:1",
    outputPath,
  );

  return {
    plan,
    args,
  };
}
