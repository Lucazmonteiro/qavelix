export const compressionPresets = {
  balanced: {
    label: "Balanced",
    crf: 28,
    maxHeight: 1080,
    audioBitrate: "128k",
  },
  small: {
    label: "Small file",
    crf: 32,
    maxHeight: 720,
    audioBitrate: "96k",
  },
  high: {
    label: "High quality",
    crf: 23,
    maxHeight: 1080,
    audioBitrate: "160k",
  },
} as const;

export type CompressionPresetId = keyof typeof compressionPresets;

export const DOWNLOAD_TTL_MS = 30 * 60 * 1000;

export type CompressionJobStatus =
  "queued" | "running" | "completed" | "failed" | "cancelled" | "expired" | "deleted";

export type CompressionJobSnapshot = {
  id: string;
  status: CompressionJobStatus;
  preset: CompressionPresetId;
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

export function isCompressionPresetId(value: string): value is CompressionPresetId {
  return Object.hasOwn(compressionPresets, value);
}
