export const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;
export const UPLOAD_REQUEST_OVERHEAD_BYTES = 2 * 1024 * 1024;
export const MAX_UPLOAD_REQUEST_BYTES = MAX_UPLOAD_BYTES + UPLOAD_REQUEST_OVERHEAD_BYTES;

export const acceptedMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/mpeg",
] as const;

export const acceptedExtensions = [
  ".mp4",
  ".m4v",
  ".mov",
  ".webm",
  ".avi",
  ".mpg",
  ".mpeg",
] as const;

export type AcceptedMimeType = (typeof acceptedMimeTypes)[number];

export type UploadValidationErrorCode =
  | "missing_file"
  | "empty_file"
  | "file_too_large"
  | "invalid_size"
  | "invalid_extension"
  | "invalid_mime"
  | "invalid_signature"
  | "truncated_upload"
  | "ffprobe_unavailable"
  | "ffprobe_failed";

export type UploadValidationError = {
  code: UploadValidationErrorCode;
  message: string;
};

export type UploadAnalysis = {
  file: {
    name: string;
    size: number;
    mimeType: string;
    extension: string;
  };
  media: {
    durationSeconds: number | null;
    bitrate: number | null;
    formatName: string | null;
    width: number | null;
    height: number | null;
    videoCodec: string | null;
    audioCodec: string | null;
    frameRate: number | null;
  };
};

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function isAcceptedMimeType(mimeType: string): mimeType is AcceptedMimeType {
  return acceptedMimeTypes.includes(mimeType as AcceptedMimeType);
}
