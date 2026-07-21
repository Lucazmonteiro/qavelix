import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { CompressionMediaMetadata } from "@/lib/compression-policy";

export const ANALYZED_UPLOAD_TTL_MS = 15 * 60 * 1000;

const analyzedUploadDirectory = path.join(os.tmpdir(), "qavelix-upload-analysis");
const recordDirectory = path.join(analyzedUploadDirectory, "records");
const consumedRecordDirectory = path.join(recordDirectory, "consumed");
const referenceSeparator = ".";
const tokenByteLength = 32;

export type AnalyzedUploadRecord = {
  id: string;
  tokenHash: string;
  inputPath: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  media: CompressionMediaMetadata;
  createdAt: string;
  expiresAt: string;
};

export type CreateAnalyzedUploadInput = {
  inputPath: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  media: CompressionMediaMetadata;
};

export type ConsumedAnalyzedUpload = Omit<AnalyzedUploadRecord, "tokenHash">;

type ParsedReference = {
  id: string;
  token: string;
};

export type ConsumeAnalyzedUploadResult =
  | {
      ok: true;
      upload: ConsumedAnalyzedUpload;
    }
  | {
      ok: false;
      code:
        | "missing_reference"
        | "malformed_reference"
        | "invalid_reference"
        | "expired_reference"
        | "consumed_reference"
        | "missing_file"
        | "metadata_mismatch";
      message: string;
    };

function recordPath(id: string) {
  return path.join(recordDirectory, `${id}.json`);
}

function consumedRecordPath(id: string) {
  return path.join(consumedRecordDirectory, `${id}.json`);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function parseReference(reference: string | null | undefined): ParsedReference | null {
  if (!reference) {
    return null;
  }

  const parts = reference.split(referenceSeparator);

  if (parts.length !== 2) {
    return null;
  }

  const [id, token] = parts;

  if (!id || !token || !/^[0-9a-f-]{36}$/i.test(id) || !/^[a-zA-Z0-9_-]{32,256}$/.test(token)) {
    return null;
  }

  return { id, token };
}

function publicRecord(record: AnalyzedUploadRecord): ConsumedAnalyzedUpload {
  return {
    id: record.id,
    inputPath: record.inputPath,
    originalName: record.originalName,
    mimeType: record.mimeType,
    extension: record.extension,
    size: record.size,
    media: record.media,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
}

async function readRecord(id: string) {
  const text = await readFile(recordPath(id), "utf8");

  return JSON.parse(text) as AnalyzedUploadRecord;
}

async function fileExists(filePath: string) {
  try {
    const fileStats = await stat(filePath);

    return fileStats.isFile();
  } catch {
    return false;
  }
}

async function removeRecordFiles(record: AnalyzedUploadRecord, metadataPath: string) {
  await Promise.all([
    rm(record.inputPath, { force: true }),
    rm(metadataPath, { force: true }),
  ]);
}

export async function ensureAnalyzedUploadRegistry() {
  await Promise.all([
    mkdir(recordDirectory, { recursive: true }),
    mkdir(consumedRecordDirectory, { recursive: true }),
  ]);
}

export async function cleanupExpiredAnalyzedUploads(now = Date.now()) {
  await ensureAnalyzedUploadRegistry();

  const files = await readdir(recordDirectory);

  await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const metadataPath = path.join(recordDirectory, file);

        try {
          const text = await readFile(metadataPath, "utf8");
          const record = JSON.parse(text) as AnalyzedUploadRecord;

          if (new Date(record.expiresAt).getTime() <= now) {
            await removeRecordFiles(record, metadataPath);
          }
        } catch {
          await rm(metadataPath, { force: true });
        }
      }),
  );
}

export async function createAnalyzedUploadRecord(input: CreateAnalyzedUploadInput) {
  await ensureAnalyzedUploadRegistry();
  await cleanupExpiredAnalyzedUploads();

  const id = randomUUID();
  const token = randomBytes(tokenByteLength).toString("base64url");
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + ANALYZED_UPLOAD_TTL_MS).toISOString();
  const record: AnalyzedUploadRecord = {
    id,
    tokenHash: hashToken(token),
    inputPath: input.inputPath,
    originalName: input.originalName,
    mimeType: input.mimeType,
    extension: input.extension,
    size: input.size,
    media: input.media,
    createdAt,
    expiresAt,
  };

  await writeFile(recordPath(id), JSON.stringify(record), {
    flag: "wx",
    mode: 0o600,
  });

  return {
    reference: `${id}${referenceSeparator}${token}`,
    expiresAt,
  };
}

export async function consumeAnalyzedUploadReference(
  reference: string | null | undefined,
): Promise<ConsumeAnalyzedUploadResult> {
  await ensureAnalyzedUploadRegistry();

  if (!reference) {
    return {
      ok: false,
      code: "missing_reference",
      message: "A validated upload reference is required.",
    };
  }

  const parsed = parseReference(reference);

  if (!parsed) {
    return {
      ok: false,
      code: "malformed_reference",
      message: "The upload reference is invalid.",
    };
  }

  const sourceRecordPath = recordPath(parsed.id);
  const targetConsumedPath = consumedRecordPath(parsed.id);

  try {
    await rename(sourceRecordPath, targetConsumedPath);
  } catch {
    if (await fileExists(targetConsumedPath)) {
      return {
        ok: false,
        code: "consumed_reference",
        message: "This upload reference has already been used.",
      };
    }

    return {
      ok: false,
      code: "invalid_reference",
      message: "The upload reference is invalid or expired.",
    };
  }

  let record: AnalyzedUploadRecord;

  try {
    const text = await readFile(targetConsumedPath, "utf8");
    record = JSON.parse(text) as AnalyzedUploadRecord;
  } catch {
    await rm(targetConsumedPath, { force: true });
    return {
      ok: false,
      code: "invalid_reference",
      message: "The upload reference is invalid or expired.",
    };
  }

  if (!constantTimeEqual(hashToken(parsed.token), record.tokenHash)) {
    await rename(targetConsumedPath, sourceRecordPath).catch(() => undefined);
    return {
      ok: false,
      code: "invalid_reference",
      message: "The upload reference is invalid or expired.",
    };
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    await removeRecordFiles(record, targetConsumedPath);
    return {
      ok: false,
      code: "expired_reference",
      message: "The upload reference has expired.",
    };
  }

  try {
    const fileStats = await stat(record.inputPath);

    if (!fileStats.isFile()) {
      throw new Error("Analyzed upload path is not a file.");
    }

    if (fileStats.size !== record.size) {
      await removeRecordFiles(record, targetConsumedPath);
      return {
        ok: false,
        code: "metadata_mismatch",
        message: "The analyzed upload metadata no longer matches the stored file.",
      };
    }
  } catch {
    await rm(targetConsumedPath, { force: true });
    return {
      ok: false,
      code: "missing_file",
      message: "The analyzed upload is no longer available.",
    };
  }

  return {
    ok: true,
    upload: publicRecord(record),
  };
}

export async function deleteAnalyzedUploadReference(reference: string | null | undefined) {
  await ensureAnalyzedUploadRegistry();

  const parsed = parseReference(reference);

  if (!parsed) {
    return false;
  }

  try {
    const record = await readRecord(parsed.id);

    if (!constantTimeEqual(hashToken(parsed.token), record.tokenHash)) {
      return false;
    }

    await removeRecordFiles(record, recordPath(parsed.id));
    return true;
  } catch {
    return false;
  }
}
