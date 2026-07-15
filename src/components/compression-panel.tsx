"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

import {
  compressionPresets,
  type CompressionJobSnapshot,
  type CompressionPresetId,
} from "@/lib/compression-policy";
import {
  acceptedExtensions,
  acceptedMimeTypes,
  formatBytes,
  MAX_UPLOAD_BYTES,
} from "@/lib/upload-policy";

type CompressionCopy = {
  eyebrow: string;
  title: string;
  description: string;
  dropTitle: string;
  dropDescription: string;
  browseLabel: string;
  presetLabel: string;
  startLabel: string;
  cancelLabel: string;
  progressLabel: string;
  queuedLabel: string;
  runningLabel: string;
  completedLabel: string;
  failedLabel: string;
  cancelledLabel: string;
  expiredLabel: string;
  deletedLabel: string;
  originalSizeLabel: string;
  compressedSizeLabel: string;
  expiresLabel: string;
  downloadLabel: string;
  deleteLabel: string;
  presetNames: Record<CompressionPresetId, string>;
  presetDescriptions: Record<CompressionPresetId, string>;
  errors: {
    noFile: string;
    empty: string;
    tooLarge: string;
    unsupportedExtension: string;
    unsupportedMime: string;
    invalidSignature: string;
    queueFull: string;
    uploadFailed: string;
    jobFailed: string;
    cancelFailed: string;
  };
};

type CompressionPanelProps = {
  copy: CompressionCopy;
};

type JobResponse =
  | {
      ok: true;
      job: CompressionJobSnapshot;
    }
  | {
      ok: false;
      error: {
        code?: string;
        message?: string;
      };
    };

const presetIds = Object.keys(compressionPresets) as CompressionPresetId[];

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function canPoll(job: CompressionJobSnapshot | null) {
  return job?.status === "queued" || job?.status === "running";
}

function getStatusLabel(copy: CompressionCopy, job: CompressionJobSnapshot | null) {
  if (!job) {
    return copy.queuedLabel;
  }

  const labels = {
    queued: copy.queuedLabel,
    running: copy.runningLabel,
    completed: copy.completedLabel,
    failed: copy.failedLabel,
    cancelled: copy.cancelledLabel,
    expired: copy.expiredLabel,
    deleted: copy.deletedLabel,
  } satisfies Record<CompressionJobSnapshot["status"], string>;

  return labels[job.status];
}

function getCompressionErrorMessage(
  copy: CompressionCopy,
  error: { code?: string; message?: string },
) {
  switch (error.code) {
    case "missing_file":
      return copy.errors.noFile;
    case "empty_file":
      return copy.errors.empty;
    case "file_too_large":
      return copy.errors.tooLarge;
    case "invalid_extension":
      return copy.errors.unsupportedExtension;
    case "invalid_mime":
      return copy.errors.unsupportedMime;
    case "invalid_signature":
      return copy.errors.invalidSignature;
    case "queue_full":
      return copy.errors.queueFull;
    default:
      return copy.errors.uploadFailed;
  }
}

export function CompressionPanel({ copy }: CompressionPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preset, setPreset] = useState<CompressionPresetId>("balanced");
  const [job, setJob] = useState<CompressionJobSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!job || !canPoll(job)) {
      return;
    }

    const jobId = job.id;

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/compression/jobs/${jobId}`);
        const payload = (await response.json()) as JobResponse;

        if (payload.ok) {
          setJob(payload.job);
        }
      } catch {
        window.clearInterval(interval);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [job]);

  function selectFiles(files: FileList | File[]) {
    const selectedFile = Array.from(files)[0];

    if (!selectedFile) {
      setError(copy.errors.noFile);
      return;
    }

    setFile(selectedFile);
    setJob(null);
    setError(null);
  }

  function getClientError(selectedFile: File | null) {
    if (!selectedFile) {
      return copy.errors.noFile;
    }

    if (selectedFile.size === 0) {
      return copy.errors.empty;
    }

    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      return copy.errors.tooLarge;
    }

    if (
      !acceptedExtensions.includes(
        getExtension(selectedFile.name) as (typeof acceptedExtensions)[number],
      )
    ) {
      return copy.errors.unsupportedExtension;
    }

    if (
      !acceptedMimeTypes.includes(selectedFile.type as (typeof acceptedMimeTypes)[number])
    ) {
      return copy.errors.unsupportedMime;
    }

    return null;
  }

  async function startCompression() {
    const clientError = getClientError(file);

    if (clientError || !file) {
      setError(clientError ?? copy.errors.noFile);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("preset", preset);

    setError(null);

    try {
      const response = await fetch("/api/compression/jobs", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as JobResponse;

      if (!payload.ok) {
        setError(getCompressionErrorMessage(copy, payload.error));
        return;
      }

      setJob(payload.job);
    } catch {
      setError(copy.errors.uploadFailed);
    }
  }

  async function cancelJob() {
    if (!job || !canPoll(job)) {
      return;
    }

    try {
      const response = await fetch(`/api/compression/jobs/${job.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as JobResponse;

      if (!payload.ok) {
        setError(copy.errors.cancelFailed);
        return;
      }

      setJob(payload.job);
    } catch {
      setError(copy.errors.cancelFailed);
    }
  }

  async function deleteJob() {
    if (!job || job.status !== "completed") {
      return;
    }

    try {
      const response = await fetch(`/api/compression/jobs/${job.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as JobResponse;

      if (!payload.ok) {
        setError(copy.errors.cancelFailed);
        return;
      }

      setJob(payload.job);
    } catch {
      setError(copy.errors.cancelFailed);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFiles(event.dataTransfer.files);
  }

  const progress = job?.progress ?? 0;

  return (
    <section className="compression-section" id="compression">
      <div className="section-heading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="compression-panel">
        <div className="compression-panel__main">
          <label
            className={`upload-dropzone${isDragging ? " upload-dropzone--active" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              accept={acceptedMimeTypes.join(",")}
              className="upload-dropzone__input"
              onChange={(event) => {
                if (event.target.files) {
                  selectFiles(event.target.files);
                }
              }}
              ref={inputRef}
              type="file"
            />
            <span className="upload-dropzone__icon" aria-hidden="true">
              v
            </span>
            <span className="upload-dropzone__title">{copy.dropTitle}</span>
            <span className="upload-dropzone__description">{copy.dropDescription}</span>
            <span className="button button--primary">{copy.browseLabel}</span>
          </label>

          <div className="preset-group" aria-label={copy.presetLabel}>
            {presetIds.map((presetId) => (
              <button
                aria-pressed={preset === presetId}
                className="preset-card"
                key={presetId}
                onClick={() => setPreset(presetId)}
                type="button"
              >
                <strong>{copy.presetNames[presetId]}</strong>
                <span>{copy.presetDescriptions[presetId]}</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="compression-status" aria-live="polite">
          <h3>{getStatusLabel(copy, job)}</h3>
          <dl>
            <div>
              <dt>{copy.presetLabel}</dt>
              <dd>{copy.presetNames[preset]}</dd>
            </div>
            <div>
              <dt>{copy.originalSizeLabel}</dt>
              <dd>{file ? formatBytes(file.size) : "-"}</dd>
            </div>
            <div>
              <dt>{copy.compressedSizeLabel}</dt>
              <dd>{job?.outputSize ? formatBytes(job.outputSize) : "-"}</dd>
            </div>
            <div>
              <dt>{copy.expiresLabel}</dt>
              <dd>{job?.expiresAt ? new Date(job.expiresAt).toLocaleString() : "-"}</dd>
            </div>
          </dl>

          <div className="progress-block">
            <div className="progress-block__label">
              <span>{copy.progressLabel}</span>
              <strong>{progress}%</strong>
            </div>
            <progress max={100} value={progress}>
              {progress}%
            </progress>
          </div>

          {error ? <p className="compression-status__error">{error}</p> : null}
          {job?.error ? (
            <p className="compression-status__error">{copy.errors.jobFailed}</p>
          ) : null}

          <div className="compression-status__actions">
            <button
              className="button button--primary"
              disabled={canPoll(job)}
              onClick={() => void startCompression()}
              type="button"
            >
              {copy.startLabel}
            </button>
            {job?.status === "completed" && job.downloadUrl ? (
              <a className="button button--primary" href={job.downloadUrl}>
                {copy.downloadLabel}
              </a>
            ) : null}
            <button
              className="button button--secondary"
              disabled={!canPoll(job)}
              onClick={() => void cancelJob()}
              type="button"
            >
              {copy.cancelLabel}
            </button>
            <button
              className="button button--secondary"
              disabled={job?.status !== "completed"}
              onClick={() => void deleteJob()}
              type="button"
            >
              {copy.deleteLabel}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
