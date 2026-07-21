import path from "node:path";

import {
  acceptedExtensions,
  isAcceptedMimeType,
  MAX_UPLOAD_BYTES,
  type UploadValidationError,
} from "@/lib/upload-policy";

type SignatureValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: UploadValidationError;
    };

type UploadIdentity = Pick<File, "name" | "size" | "type">;

function hasAsciiSignature(bytes: Uint8Array, offset: number, signature: string) {
  return [...signature].every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0),
  );
}

function hasMp4FamilySignature(bytes: Uint8Array) {
  return bytes.length >= 12 && hasAsciiSignature(bytes, 4, "ftyp");
}

function hasWebmSignature(bytes: Uint8Array) {
  return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
}

function hasAviSignature(bytes: Uint8Array) {
  return hasAsciiSignature(bytes, 0, "RIFF") && hasAsciiSignature(bytes, 8, "AVI ");
}

function hasMpegSignature(bytes: Uint8Array) {
  return (
    (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0xba) ||
    (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0xb3)
  );
}

export function validateFileIdentity(
  file: UploadIdentity,
  firstBytes: Uint8Array,
): UploadValidationError | null {
  if (file.size === 0) {
    return {
      code: "empty_file",
      message: "The selected file is empty.",
    };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      code: "file_too_large",
      message: `The selected file exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB upload limit.`,
    };
  }

  const extension = path.extname(file.name).toLowerCase();

  if (!acceptedExtensions.includes(extension as (typeof acceptedExtensions)[number])) {
    return {
      code: "invalid_extension",
      message: "The selected file extension is not supported.",
    };
  }

  if (!isAcceptedMimeType(file.type)) {
    return {
      code: "invalid_mime",
      message: "The selected file MIME type is not supported.",
    };
  }

  const signature = validateSignature(extension, file.type, firstBytes);

  return signature.ok ? null : signature.error;
}

function validateSignature(
  extension: string,
  mimeType: string,
  bytes: Uint8Array,
): SignatureValidationResult {
  const invalidSignature = {
    ok: false,
    error: {
      code: "invalid_signature",
      message: "The selected file signature does not match its declared type.",
    },
  } satisfies SignatureValidationResult;

  if (
    extension === ".mp4" ||
    extension === ".m4v" ||
    extension === ".mov" ||
    mimeType === "video/mp4" ||
    mimeType === "video/quicktime"
  ) {
    return hasMp4FamilySignature(bytes) ? { ok: true } : invalidSignature;
  }

  if (extension === ".webm" || mimeType === "video/webm") {
    return hasWebmSignature(bytes) ? { ok: true } : invalidSignature;
  }

  if (extension === ".avi" || mimeType === "video/x-msvideo") {
    return hasAviSignature(bytes) ? { ok: true } : invalidSignature;
  }

  if (extension === ".mpg" || extension === ".mpeg" || mimeType === "video/mpeg") {
    return hasMpegSignature(bytes) ? { ok: true } : invalidSignature;
  }

  return invalidSignature;
}
