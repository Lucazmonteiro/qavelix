export const compressionPresets = {
  small: {
    label: "Smaller File",
    crf: 33,
    maxHeight: 720,
    audioBitrateKbps: 96,
    encoderPreset: "medium",
    sourceBitrateRatio: 0.42,
    maxVideoBitrateKbps: 1200,
  },
  balanced: {
    label: "Balanced",
    crf: 29,
    maxHeight: 1080,
    audioBitrateKbps: 128,
    encoderPreset: "medium",
    sourceBitrateRatio: 0.62,
    maxVideoBitrateKbps: 2800,
  },
  high: {
    label: "High Quality",
    crf: 24,
    maxHeight: 1080,
    audioBitrateKbps: 160,
    encoderPreset: "medium",
    sourceBitrateRatio: 0.82,
    maxVideoBitrateKbps: 5200,
  },
} as const;

export type CompressionPresetId = keyof typeof compressionPresets;

export const DOWNLOAD_TTL_MS = 30 * 60 * 1000;

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
  maxHeight: number;
  audioBitrate: string;
  videoMaxrate: string;
  videoBufsize: string;
  scaleFilter: string | null;
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
  const shouldScale =
    typeof metadata.height === "number" && metadata.height > preset.maxHeight;
  const scaleFilter = shouldScale
    ? `scale='min(iw,${preset.maxHeight * 2})':'min(ih,${preset.maxHeight})':force_original_aspect_ratio=decrease`
    : null;

  return {
    preset: presetId,
    crf: preset.crf,
    maxHeight: preset.maxHeight,
    audioBitrate: `${preset.audioBitrateKbps}k`,
    videoMaxrate: `${videoKbps}k`,
    videoBufsize: `${videoKbps * 2}k`,
    scaleFilter,
    estimatedReductionLikely:
      shouldScale || Boolean(sourceBitrate && targetTotalBitrate < sourceBitrate),
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
    "pipe:2",
    outputPath,
  );

  return {
    plan,
    args,
  };
}
