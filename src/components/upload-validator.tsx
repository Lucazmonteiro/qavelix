"use client";

import { useRef, useState, type DragEvent } from "react";

import {
  acceptedExtensions,
  acceptedMimeTypes,
  formatBytes,
  MAX_UPLOAD_BYTES,
  type UploadAnalysis,
} from "@/lib/upload-policy";

type UploadCopy = {
  eyebrow: string;
  title: string;
  description: string;
  dropTitle: string;
  dropDescription: string;
  browseLabel: string;
  analyzingLabel: string;
  supportedLabel: string;
  limitsLabel: string;
  successTitle: string;
  errorTitle: string;
  fileLabel: string;
  sizeLabel: string;
  typeLabel: string;
  durationLabel: string;
  resolutionLabel: string;
  videoCodecLabel: string;
  audioCodecLabel: string;
  bitrateLabel: string;
  frameRateLabel: string;
  formatLabel: string;
  unknownLabel: string;
  emptyState: string;
  clientErrors: {
    unsupportedExtension: string;
    unsupportedMime: string;
    tooLarge: string;
    empty: string;
    multiple: string;
    invalidSignature: string;
    analysisUnavailable: string;
    analysisFailed: string;
  };
};

type UploadValidatorProps = {
  copy: UploadCopy;
};

type UploadState =
  | {
      status: "idle";
    }
  | {
      status: "analyzing";
      fileName: string;
    }
  | {
      status: "success";
      analysis: UploadAnalysis;
    }
  | {
      status: "error";
      message: string;
    };

type UploadError = {
  code?: string;
  message?: string;
};

type UploadResponse =
  | {
      ok: true;
      analysis: UploadAnalysis;
    }
  | {
      ok: false;
      error: UploadError;
    };

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function formatDuration(seconds: number | null, unknownLabel: string) {
  if (seconds === null) {
    return unknownLabel;
  }

  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatBitrate(bitrate: number | null, unknownLabel: string) {
  if (bitrate === null) {
    return unknownLabel;
  }

  return `${Math.round(bitrate / 1000).toLocaleString()} kbps`;
}

function formatValue(value: number | string | null, unknownLabel: string) {
  return value === null || value === "" ? unknownLabel : String(value);
}

function getUploadErrorMessage(copy: UploadCopy, error: UploadError) {
  const errors = copy.clientErrors;

  switch (error.code) {
    case "missing_file":
      return errors.multiple;
    case "empty_file":
      return errors.empty;
    case "file_too_large":
      return errors.tooLarge;
    case "invalid_extension":
      return errors.unsupportedExtension;
    case "invalid_mime":
      return errors.unsupportedMime;
    case "invalid_signature":
      return errors.invalidSignature;
    case "ffprobe_unavailable":
      return errors.analysisUnavailable;
    case "ffprobe_failed":
      return errors.analysisFailed;
    default:
      return errors.analysisFailed;
  }
}

export function UploadValidator({ copy }: UploadValidatorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  function getClientError(files: FileList | File[]) {
    if (files.length !== 1) {
      return copy.clientErrors.multiple;
    }

    const [file] = Array.from(files);

    if (!file || file.size === 0) {
      return copy.clientErrors.empty;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return copy.clientErrors.tooLarge;
    }

    if (
      !acceptedExtensions.includes(
        getExtension(file.name) as (typeof acceptedExtensions)[number],
      )
    ) {
      return copy.clientErrors.unsupportedExtension;
    }

    if (!acceptedMimeTypes.includes(file.type as (typeof acceptedMimeTypes)[number])) {
      return copy.clientErrors.unsupportedMime;
    }

    return null;
  }

  async function analyzeFiles(files: FileList | File[]) {
    const clientError = getClientError(files);

    if (clientError) {
      setState({ status: "error", message: clientError });
      return;
    }

    const file = Array.from(files)[0];

    if (!file) {
      setState({ status: "error", message: copy.clientErrors.empty });
      return;
    }

    setState({ status: "analyzing", fileName: file.name });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadResponse;

      if (!payload.ok) {
        setState({
          status: "error",
          message: getUploadErrorMessage(copy, payload.error),
        });
        return;
      }

      setState({ status: "success", analysis: payload.analysis });
    } catch {
      setState({
        status: "error",
        message: copy.clientErrors.analysisFailed,
      });
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void analyzeFiles(event.dataTransfer.files);
  }

  const acceptedFormats = acceptedExtensions.join(", ");
  const resultTitle =
    state.status === "success"
      ? copy.successTitle
      : state.status === "error"
        ? copy.errorTitle
        : state.status === "analyzing"
          ? `${copy.analyzingLabel}: ${state.fileName}`
          : copy.emptyState;

  return (
    <section className="upload-section" id="upload-validation">
      <div className="section-heading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="upload-panel">
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
                void analyzeFiles(event.target.files);
              }
            }}
            ref={inputRef}
            type="file"
          />
          <span className="upload-dropzone__icon" aria-hidden="true">
            +
          </span>
          <span className="upload-dropzone__title">{copy.dropTitle}</span>
          <span className="upload-dropzone__description">{copy.dropDescription}</span>
          <span className="button button--primary">{copy.browseLabel}</span>
        </label>

        <aside className="upload-result" aria-live="polite">
          <h3>{resultTitle}</h3>
          <dl>
            <div>
              <dt>{copy.supportedLabel}</dt>
              <dd>{acceptedFormats}</dd>
            </div>
            <div>
              <dt>{copy.limitsLabel}</dt>
              <dd>{formatBytes(MAX_UPLOAD_BYTES)}</dd>
            </div>
            {state.status === "success" ? (
              <>
                <div>
                  <dt>{copy.fileLabel}</dt>
                  <dd>{state.analysis.file.name}</dd>
                </div>
                <div>
                  <dt>{copy.sizeLabel}</dt>
                  <dd>{formatBytes(state.analysis.file.size)}</dd>
                </div>
                <div>
                  <dt>{copy.typeLabel}</dt>
                  <dd>{state.analysis.file.mimeType}</dd>
                </div>
                <div>
                  <dt>{copy.durationLabel}</dt>
                  <dd>
                    {formatDuration(
                      state.analysis.media.durationSeconds,
                      copy.unknownLabel,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{copy.resolutionLabel}</dt>
                  <dd>
                    {state.analysis.media.width && state.analysis.media.height
                      ? `${state.analysis.media.width} x ${state.analysis.media.height}`
                      : copy.unknownLabel}
                  </dd>
                </div>
                <div>
                  <dt>{copy.videoCodecLabel}</dt>
                  <dd>
                    {formatValue(state.analysis.media.videoCodec, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.audioCodecLabel}</dt>
                  <dd>
                    {formatValue(state.analysis.media.audioCodec, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.bitrateLabel}</dt>
                  <dd>
                    {formatBitrate(state.analysis.media.bitrate, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.frameRateLabel}</dt>
                  <dd>
                    {formatValue(state.analysis.media.frameRate, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.formatLabel}</dt>
                  <dd>
                    {formatValue(state.analysis.media.formatName, copy.unknownLabel)}
                  </dd>
                </div>
              </>
            ) : null}
            {state.status === "error" ? (
              <div className="upload-result__error">
                <dt>{copy.errorTitle}</dt>
                <dd>{state.message}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </section>
  );
}
