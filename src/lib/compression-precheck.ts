import {
  compressionPresets,
  createCompressionEncodingPlan,
  type CompressionMediaMetadata,
  type CompressionPresetId,
} from "@/lib/compression-policy";

const presetIds = Object.keys(compressionPresets) as CompressionPresetId[];

// createCompressionEncodingPlan floors the video bitrate at 240kbps and adds a
// fixed per-preset audio bitrate, so for an already very-low-bitrate source the
// resulting cap (videoMaxrate + audioBitrate) can sit above the source bitrate
// even though the ratio-scaled target never does. The cap is only an upper bound
// on what the CRF-driven encode is allowed to produce, not a precise prediction,
// so a safety margin keeps this pre-check from blocking borderline cases where
// the actual encode is likely to still land at or below the original size.
export const COMPRESSION_RISK_SAFETY_MARGIN = 1.2;

export type CompressionRiskReason =
  | "insufficient-data"
  | "will-downscale"
  | "estimated-safe"
  | "capped-bitrate-exceeds-original";

export type CompressionRiskEstimate = {
  willLikelyIncrease: boolean;
  reason: CompressionRiskReason;
  estimatedOutputBytes: number | null;
};

function parseKbpsValue(value: string) {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

export function estimateCompressionRisk(
  metadata: CompressionMediaMetadata,
  originalSize: number,
  presetId: CompressionPresetId,
): CompressionRiskEstimate {
  if (
    !metadata.bitrate ||
    metadata.bitrate <= 0 ||
    !metadata.durationSeconds ||
    metadata.durationSeconds <= 0 ||
    !originalSize ||
    originalSize <= 0
  ) {
    return {
      willLikelyIncrease: false,
      reason: "insufficient-data",
      estimatedOutputBytes: null,
    };
  }

  const plan = createCompressionEncodingPlan(metadata, presetId);
  const videoKbps = parseKbpsValue(plan.videoMaxrate);
  const audioKbps = parseKbpsValue(plan.audioBitrate);

  if (videoKbps === null || audioKbps === null) {
    return {
      willLikelyIncrease: false,
      reason: "insufficient-data",
      estimatedOutputBytes: null,
    };
  }

  const capTotalBitrateBps = (videoKbps + audioKbps) * 1000;
  const estimatedOutputBytes =
    (capTotalBitrateBps * metadata.durationSeconds) / 8;

  if (plan.wasDownscaledToFullHd) {
    return {
      willLikelyIncrease: false,
      reason: "will-downscale",
      estimatedOutputBytes,
    };
  }

  if (estimatedOutputBytes > originalSize * COMPRESSION_RISK_SAFETY_MARGIN) {
    return {
      willLikelyIncrease: true,
      reason: "capped-bitrate-exceeds-original",
      estimatedOutputBytes,
    };
  }

  return {
    willLikelyIncrease: false,
    reason: "estimated-safe",
    estimatedOutputBytes,
  };
}

export function getPresetsLikelyToReduceSize(
  metadata: CompressionMediaMetadata,
  originalSize: number,
  excludePresetId?: CompressionPresetId,
): CompressionPresetId[] {
  return presetIds.filter(
    (presetId) =>
      presetId !== excludePresetId &&
      !estimateCompressionRisk(metadata, originalSize, presetId).willLikelyIncrease,
  );
}
