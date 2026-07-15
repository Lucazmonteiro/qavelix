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
  originalSizeLabel: string;
  compressedSizeLabel: string;
  presetNames: Record<CompressionPresetId, string>;
  presetDescriptions: Record<CompressionPresetId, string>;
  errors: {
    noFile: string;
    uploadFailed: string;
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
        message: string;
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
  } satisfies Record<CompressionJobSnapshot["status"], string>;

  return labels[job.status];
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
      return "The selected file is empty.";
    }

    if (selectedFile.size > MAX_UPLOAD_BYTES) {
      return `The selected file exceeds ${formatBytes(MAX_UPLOAD_BYTES)}.`;
    }

    if (
      !acceptedExtensions.includes(
        getExtension(selectedFile.name) as (typeof acceptedExtensions)[number],
      )
    ) {
      return "The selected file extension is not supported.";
    }

    if (
      !acceptedMimeTypes.includes(selectedFile.type as (typeof acceptedMimeTypes)[number])
    ) {
      return "The selected file MIME type is not supported.";
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
        setError(payload.error.message || copy.errors.uploadFailed);
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
        setError(payload.error.message || copy.errors.cancelFailed);
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
          {job?.error ? <p className="compression-status__error">{job.error}</p> : null}

          <div className="compression-status__actions">
            <button
              className="button button--primary"
              disabled={canPoll(job)}
              onClick={() => void startCompression()}
              type="button"
            >
              {copy.startLabel}
            </button>
            <button
              className="button button--secondary"
              disabled={!canPoll(job)}
              onClick={() => void cancelJob()}
              type="button"
            >
              {copy.cancelLabel}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
