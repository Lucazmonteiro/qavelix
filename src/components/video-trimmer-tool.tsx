"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PlanComparisonModal } from "@/components/plan-comparison-modal";
import { UpgradeModal } from "@/components/upgrade-modal";
import type { Dictionary } from "@/i18n/dictionaries";
import { useLocaleState } from "@/i18n/locale-context";
import {
  acceptedExtensions,
  acceptedMimeTypes,
  formatBytes,
  isAcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MIN_UPLOAD_BYTES,
  type UploadAnalysis,
} from "@/lib/upload-policy";
import { useEntitlementGate } from "@/lib/use-entitlement-gate";
import {
  isTerminalVideoTrimmerStatus,
  validateTrimRange,
  type VideoTrimmerJobSnapshot,
} from "@/lib/video-trimmer-policy";

type ValidationErrorKey = keyof Dictionary["tools"]["videoTrimmer"]["validation"];
type ErrorKey = keyof Dictionary["tools"]["videoTrimmer"]["errors"];
type ProcessingState =
  | "idle"
  | "validating"
  | "analyzing"
  | "ready"
  | "queued"
  | "processing"
  | "preparing"
  | "completed"
  | "failed"
  | "cancelled";

type FileState = {
  file: File;
  errorKey: ValidationErrorKey | null;
};

const acceptedInputValue = [...acceptedExtensions, ...acceptedMimeTypes].join(",");
const pollingDelayMs = 1000;
const maxPollingFailures = 3;

function hasAcceptedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return acceptedExtensions.some((extension) => lowerName.endsWith(extension));
}

// maxUploadBytes must be the caller's already-resolved, plan-aware ceiling — same
// convention as extract-audio-tool.tsx's validateFile().
function validateFile(file: File, maxUploadBytes: number): ValidationErrorKey | null {
  if (file.size === 0) {
    return "emptyFile";
  }

  if (file.size < MIN_UPLOAD_BYTES) {
    return "fileTooSmall";
  }

  if (file.size > maxUploadBytes) {
    return "fileTooLarge";
  }

  if (!hasAcceptedExtension(file.name)) {
    return "invalidExtension";
  }

  if (file.type && !isAcceptedMimeType(file.type)) {
    return "invalidMime";
  }

  return null;
}

// HH:MM:SS / MM:SS / SS input parsing — see VIDEOTRIMMER.md "Trim Configuration": the
// underlying source of truth is always plain seconds (matching FFprobe's own
// durationSeconds), with HH:MM:SS as a display/input convenience layer only.
function parseTimestampToSeconds(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(":");

  if (parts.length < 1 || parts.length > 3) {
    return null;
  }

  if (parts.some((part) => !/^\d{1,2}(\.\d+)?$/.test(part))) {
    return null;
  }

  const numbers = parts.map(Number);

  if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
    return null;
  }

  return numbers.reduce((total, part) => total * 60 + part, 0);
}

function formatSecondsToTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

async function readApiError(response: Response): Promise<ErrorKey> {
  try {
    const payload = (await response.json()) as { error?: { code?: string } };

    switch (payload.error?.code) {
      case "missing_file":
        return "missingFile";
      case "empty_file":
        return "emptyFile";
      case "file_too_small":
        return "fileTooSmall";
      case "file_too_large":
        return "fileTooLarge";
      case "invalid_extension":
      case "invalid_mime":
        return "unsupportedFormat";
      case "invalid_signature":
      case "invalid_size":
      case "truncated_upload":
        return "invalidMedia";
      case "invalid_range":
      case "range_out_of_bounds":
      case "malformed_timestamp":
        return "invalidRange";
      case "metadata_mismatch":
      case "queue_full":
        return "jobFailed";
      case "account_required":
        return "accountRequired";
      case "usage_limit_reached":
        return "usageLimitReached";
      case "tool_unavailable_for_plan":
        return "toolUnavailableForPlan";
      case "invalid_entitlement_state":
      case "usage_service_unavailable":
        return "serviceUnavailable";
      default:
        return response.status === 404 ? "downloadUnavailable" : "serverError";
    }
  } catch {
    return "serverError";
  }
}

function getHeaderFileName(response: Response) {
  const encodedFileName = response.headers.get("x-qavelix-output-file-name");

  if (!encodedFileName) {
    return null;
  }

  try {
    return decodeURIComponent(encodedFileName);
  } catch {
    return encodedFileName;
  }
}

function createFallbackTrimmedFileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim();

  return `${withoutExtension || "qavelix-video"}.trimmed.mp4`;
}

export function VideoTrimmerTool() {
  const { dictionary } = useLocaleState();
  const copy = dictionary.tools.videoTrimmer;
  const pathname = usePathname();
  const gate = useEntitlementGate("video-trimmer");
  const isBlocked = gate.blocked;
  const resolvedMaxUploadBytes =
    gate.plan === "pro" && gate.proLimits
      ? gate.proLimits.maxUploadBytes
      : (gate.freeLimits?.maxUploadBytes ?? MAX_UPLOAD_BYTES);

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const pollingControllerRef = useRef<AbortController | null>(null);
  const pollingSequenceRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [analysis, setAnalysis] = useState<UploadAnalysis | null>(null);
  const [startTimeInput, setStartTimeInput] = useState("00:00:00");
  const [endTimeInput, setEndTimeInput] = useState("00:00:00");
  const [rangeErrorKey, setRangeErrorKey] = useState<ValidationErrorKey | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [job, setJob] = useState<VideoTrimmerJobSnapshot | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const selectedFile = fileState?.file ?? null;
  const validationErrorKey = fileState?.errorKey ?? null;
  const validationError = validationErrorKey
    ? copy.validation[validationErrorKey].replace("{maxSize}", formatBytes(resolvedMaxUploadBytes))
    : null;
  const rangeError = rangeErrorKey ? copy.validation[rangeErrorKey] : null;
  const hasValidFile = Boolean(selectedFile && !validationError);
  const durationSeconds = analysis?.media.durationSeconds ?? null;
  const isProcessing =
    processingState === "validating" ||
    processingState === "analyzing" ||
    processingState === "queued" ||
    processingState === "processing" ||
    processingState === "preparing";
  const canTrim = hasValidFile && processingState === "ready" && !isBlocked;
  const processingError = errorKey ? copy.errors[errorKey].replace("{maxSize}", formatBytes(resolvedMaxUploadBytes)) : null;
  const statusLabel = (() => {
    if (validationError) {
      return copy.statusInvalid;
    }

    if (processingState === "validating") {
      return copy.statusValidating;
    }

    if (processingState === "analyzing") {
      return copy.statusAnalyzing;
    }

    if (processingState === "queued") {
      return copy.statusQueued;
    }

    if (processingState === "processing") {
      return copy.statusProcessing;
    }

    if (processingState === "preparing") {
      return copy.statusPreparing;
    }

    if (processingState === "completed") {
      return copy.statusCompleted;
    }

    if (processingState === "failed") {
      return copy.statusFailed;
    }

    if (processingState === "cancelled") {
      return copy.statusCancelled;
    }

    return selectedFile ? copy.statusReady : copy.statusWaiting;
  })();
  const processingIndicatorLabel =
    processingState === "preparing"
      ? copy.preparingDownloadMessage
      : processingState === "processing" || processingState === "queued"
        ? copy.trimProgressMessage
        : copy.analysisProgressMessage;
  const downloadUrl = job?.downloadUrl ?? null;

  useEffect(() => {
    return () => {
      uploadControllerRef.current?.abort();
      pollingControllerRef.current?.abort();
    };
  }, []);

  function resetAll() {
    uploadControllerRef.current?.abort();
    pollingControllerRef.current?.abort();
    uploadControllerRef.current = null;
    pollingControllerRef.current = null;
    pollingSequenceRef.current += 1;
    setFileState(null);
    setAnalysis(null);
    setStartTimeInput("00:00:00");
    setEndTimeInput("00:00:00");
    setRangeErrorKey(null);
    setProcessingState("idle");
    setJob(null);
    setErrorKey(null);
    setDownloadStarted(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function setSelectedFiles(files: FileList | null) {
    if (isBlocked) {
      return;
    }

    resetAll();

    if (!files || files.length === 0) {
      return;
    }

    if (files.length > 1) {
      const firstFile = files.item(0);
      if (!firstFile) {
        return;
      }

      setFileState({ file: firstFile, errorKey: "multipleFiles" });
      return;
    }

    const file = files.item(0);
    if (!file) {
      return;
    }

    const clientErrorKey = validateFile(file, resolvedMaxUploadBytes);

    setFileState({ file, errorKey: clientErrorKey });

    // Triggered directly from this selection event, not reactively via an effect
    // watching selectedFile — this is the actual user action that should kick off
    // analysis, not a derived state change (see "you might not need an effect",
    // https://react.dev/learn/you-might-not-need-an-effect).
    if (!clientErrorKey) {
      void analyzeSelectedFile(file);
    }
  }

  async function analyzeSelectedFile(file: File) {
    uploadControllerRef.current?.abort();
    const abortController = new AbortController();
    uploadControllerRef.current = abortController;
    setProcessingState("validating");
    setErrorKey(null);

    try {
      const response = await fetch("/api/upload/analyze", {
        method: "POST",
        signal: abortController.signal,
        headers: {
          "x-qavelix-file-name": encodeURIComponent(file.name),
          "x-qavelix-file-size": String(file.size),
          "x-qavelix-file-type": file.type,
        },
        body: file,
      });

      uploadControllerRef.current = null;

      if (!response.ok) {
        setErrorKey(await readApiError(response));
        setProcessingState("failed");
        return;
      }

      const payload = (await response.json()) as { ok: true; analysis: UploadAnalysis } | { ok: false };

      if (!payload.ok || !payload.analysis.uploadReference) {
        setErrorKey("invalidMedia");
        setProcessingState("failed");
        return;
      }

      setAnalysis(payload.analysis);
      setEndTimeInput(formatSecondsToTimestamp(payload.analysis.media.durationSeconds ?? 0));
      setProcessingState("ready");
    } catch (error) {
      uploadControllerRef.current = null;

      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setErrorKey("networkError");
      setProcessingState("failed");
    }
  }

  function stopPolling() {
    pollingSequenceRef.current += 1;
    pollingControllerRef.current?.abort();
    pollingControllerRef.current = null;
  }

  function pollJob(jobId: string) {
    const sequence = pollingSequenceRef.current;
    const controller = new AbortController();
    pollingControllerRef.current = controller;
    let failureCount = 0;

    async function tick() {
      if (pollingSequenceRef.current !== sequence || controller.signal.aborted) {
        return;
      }

      try {
        const response = await fetch(`/api/video-trimmer/jobs/${jobId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as
          | { ok: true; job: VideoTrimmerJobSnapshot }
          | { ok: false };

        if (pollingSequenceRef.current !== sequence) {
          return;
        }

        if (payload.ok) {
          failureCount = 0;
          setJob(payload.job);

          if (payload.job.status === "queued") {
            setProcessingState("queued");
          } else if (payload.job.status === "running" || payload.job.status === "starting") {
            setProcessingState("processing");
          } else if (payload.job.status === "completed") {
            setProcessingState("completed");
          } else if (payload.job.status === "cancelled") {
            setProcessingState("cancelled");
          } else if (payload.job.status === "failed") {
            setErrorKey("jobFailed");
            setProcessingState("failed");
          }

          if (isTerminalVideoTrimmerStatus(payload.job.status)) {
            return;
          }
        }

        window.setTimeout(() => void tick(), pollingDelayMs);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        failureCount += 1;

        if (failureCount >= maxPollingFailures) {
          setErrorKey("networkError");
          setProcessingState("failed");
          return;
        }

        window.setTimeout(() => void tick(), pollingDelayMs);
      }
    }

    void tick();
  }

  async function startTrim() {
    if (!selectedFile || !analysis?.uploadReference || processingState !== "ready") {
      return;
    }

    const startSeconds = parseTimestampToSeconds(startTimeInput);
    const endSeconds = parseTimestampToSeconds(endTimeInput);

    if (startSeconds === null || endSeconds === null) {
      setRangeErrorKey("malformedTimestamp");
      return;
    }

    const rangeValidationError = validateTrimRange(startSeconds, endSeconds, durationSeconds);

    if (rangeValidationError === "invalid_range") {
      setRangeErrorKey("invalidRange");
      return;
    }

    if (rangeValidationError === "range_out_of_bounds") {
      setRangeErrorKey("rangeOutOfBounds");
      return;
    }

    if (rangeValidationError === "malformed_timestamp") {
      setRangeErrorKey("malformedTimestamp");
      return;
    }

    setRangeErrorKey(null);
    setErrorKey(null);
    setDownloadStarted(false);
    setProcessingState("queued");

    try {
      const response = await fetch("/api/video-trimmer/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadReference: analysis.uploadReference.value,
          startSeconds,
          endSeconds,
        }),
      });

      if (!response.ok) {
        const key = await readApiError(response);

        if (key === "accountRequired") {
          gate.reportDenial("account_required");
        } else if (key === "usageLimitReached") {
          gate.reportDenial("usage_limit_reached");
        }

        setErrorKey(key);
        setProcessingState("failed");
        return;
      }

      const payload = (await response.json()) as { ok: true; job: VideoTrimmerJobSnapshot };

      setJob(payload.job);
      pollJob(payload.job.id);
    } catch {
      setErrorKey("networkError");
      setProcessingState("failed");
    }
  }

  async function cancelJob() {
    stopPolling();

    if (job && !isTerminalVideoTrimmerStatus(job.status)) {
      try {
        await fetch(`/api/video-trimmer/jobs/${job.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      } catch {
        // Best-effort — the job will still expire/clean up server-side on its own.
      }
    }

    setJob(null);
    setProcessingState(hasValidFile ? "ready" : "idle");
  }

  async function handleDownloadStarted() {
    if (!downloadUrl || isDownloading) {
      return;
    }

    setErrorKey(null);

    try {
      setIsDownloading(true);
      const response = await fetch(downloadUrl, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Download request failed.");
      }

      const blob = await response.blob();

      if (blob.size <= 0) {
        throw new Error("Download response was empty.");
      }

      const fileName =
        getHeaderFileName(response) ??
        createFallbackTrimmedFileName(job?.originalName ?? selectedFile?.name ?? "video");
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
      setDownloadStarted(true);
    } catch {
      setDownloadStarted(false);
      setErrorKey("downloadUnavailable");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <main className="page-shell" id="main-content">
      <section className="hero-section hero-section--tool video-trimmer-page">
        <div
          className="hero-section__content hero-section__content--tool"
          aria-labelledby="video-trimmer-title"
        >
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="sr-only" id="video-trimmer-title">
            {copy.title}
          </h1>
          <p className="hero-section__description">{copy.subtitle}</p>
        </div>

        <div className="homepage-tool video-trimmer-tool" aria-label={copy.title}>
          <section className="compression-panel" aria-label={copy.title}>
            <div className="compression-panel__main">
              <div
                className={[
                  "upload-dropzone",
                  "video-trimmer-dropzone",
                  isDragging ? "upload-dropzone--active" : "",
                  isBlocked ? "upload-dropzone--blocked" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-disabled={isBlocked}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (!isBlocked) {
                    setIsDragging(true);
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!isBlocked) {
                    setIsDragging(true);
                  }
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);

                  if (isBlocked) {
                    return;
                  }

                  setSelectedFiles(event.dataTransfer.files);
                }}
              >
                <input
                  ref={inputRef}
                  aria-label={copy.chooseFile}
                  className="upload-dropzone__input"
                  type="file"
                  accept={acceptedInputValue}
                  disabled={isBlocked}
                  onChange={(event) => setSelectedFiles(event.target.files)}
                />
                <span className="upload-dropzone__icon" aria-hidden="true">
                  {"✂️"}
                </span>
                <span className="upload-dropzone__title">{copy.uploadTitle}</span>
                <span className="upload-dropzone__description">{copy.uploadDescription}</span>
                <button
                  className="button button--primary"
                  disabled={isBlocked}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  {copy.chooseFile}
                </button>
                <span className="video-trimmer-dropzone__privacy">{copy.privacyMessage}</span>
              </div>

              {isBlocked && !selectedFile ? (
                <div className="entitlement-lock-notice" role="status">
                  <p>
                    {gate.reason === "account_required"
                      ? copy.errors.accountRequired
                      : copy.errors.usageLimitReached}
                  </p>
                  {gate.reason === "usage_limit_reached" && gate.plan === "free" ? (
                    <button className="button button--primary" onClick={gate.openUpgradeModal} type="button">
                      {dictionary.upgradeModal.upgradeButtonLabel}
                    </button>
                  ) : null}
                </div>
              ) : null}

              {hasValidFile && (processingState === "ready" || processingState === "queued" || processingState === "processing") ? (
                <div className="preset-workflow">
                  <h3>{copy.nextStepMessage}</h3>
                  <div className="video-trimmer-range">
                    <div className="video-trimmer-range__field">
                      <label htmlFor="video-trimmer-start-time">{copy.startTimeLabel}</label>
                      <input
                        disabled={processingState !== "ready"}
                        id="video-trimmer-start-time"
                        inputMode="numeric"
                        onChange={(event) => {
                          setStartTimeInput(event.target.value);
                          setRangeErrorKey(null);
                        }}
                        placeholder={copy.startTimePlaceholder}
                        type="text"
                        value={startTimeInput}
                      />
                    </div>
                    <div className="video-trimmer-range__field">
                      <label htmlFor="video-trimmer-end-time">{copy.endTimeLabel}</label>
                      <input
                        disabled={processingState !== "ready"}
                        id="video-trimmer-end-time"
                        inputMode="numeric"
                        onChange={(event) => {
                          setEndTimeInput(event.target.value);
                          setRangeErrorKey(null);
                        }}
                        placeholder={copy.endTimePlaceholder}
                        type="text"
                        value={endTimeInput}
                      />
                    </div>
                  </div>
                  {durationSeconds !== null ? (
                    <p className="video-trimmer-range__summary">
                      {copy.durationLabel}: {formatSecondsToTimestamp(durationSeconds)}
                      {" · "}
                      {copy.remainingDurationLabel}:{" "}
                      {(() => {
                        const start = parseTimestampToSeconds(startTimeInput);
                        const end = parseTimestampToSeconds(endTimeInput);

                        return start !== null && end !== null && end > start
                          ? formatSecondsToTimestamp(end - start)
                          : "—";
                      })()}
                    </p>
                  ) : null}
                  {rangeError ? (
                    <p className="video-trimmer-range__error" role="alert">
                      {rangeError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <aside className="compression-status video-trimmer-status" aria-live="polite">
              <div className="video-trimmer-status__body">
                <h2>{copy.statusTitle}</h2>
                {gate.freeLimits && gate.proLimits ? (
                  <dl className="upload-limit-comparison">
                    <div
                      className={
                        gate.plan !== "pro"
                          ? "upload-limit-comparison__row upload-limit-comparison__row--current"
                          : "upload-limit-comparison__row"
                      }
                    >
                      <dt>{dictionary.upgradeModal.freeTierName}</dt>
                      <dd>{formatBytes(gate.freeLimits.maxUploadBytes)}</dd>
                    </div>
                    <div
                      className={
                        gate.plan === "pro"
                          ? "upload-limit-comparison__row upload-limit-comparison__row--current"
                          : "upload-limit-comparison__row"
                      }
                    >
                      <dt>{dictionary.upgradeModal.proTierName}</dt>
                      <dd>{formatBytes(gate.proLimits.maxUploadBytes)}</dd>
                    </div>
                  </dl>
                ) : null}
                <dl>
                  <div>
                    <dt>{copy.selectedFile}</dt>
                    <dd>{statusLabel}</dd>
                  </div>
                  {selectedFile && hasValidFile ? (
                    <>
                      <div>
                        <dt>{copy.fileName}</dt>
                        <dd className="video-trimmer-status__filename" title={selectedFile.name}>
                          {selectedFile.name}
                        </dd>
                      </div>
                      <div>
                        <dt>{copy.fileSize}</dt>
                        <dd>{formatBytes(selectedFile.size)}</dd>
                      </div>
                      {analysis ? (
                        <>
                          <div>
                            <dt>{copy.fileDuration}</dt>
                            <dd>
                              {analysis.media.durationSeconds !== null
                                ? formatSecondsToTimestamp(analysis.media.durationSeconds)
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt>{copy.fileResolution}</dt>
                            <dd>
                              {analysis.media.width && analysis.media.height
                                ? `${analysis.media.width}×${analysis.media.height}`
                                : "—"}
                            </dd>
                          </div>
                          <div>
                            <dt>{copy.fileFormat}</dt>
                            <dd>{analysis.media.formatName ?? "—"}</dd>
                          </div>
                        </>
                      ) : null}
                      {job && job.status === "completed" ? (
                        <>
                          <div>
                            <dt>{copy.trimmedFileName}</dt>
                            <dd className="video-trimmer-status__filename">
                              {createFallbackTrimmedFileName(job.originalName)}
                            </dd>
                          </div>
                          <div>
                            <dt>{copy.trimmedFileSize}</dt>
                            <dd>{job.outputSize !== null ? formatBytes(job.outputSize) : "—"}</dd>
                          </div>
                        </>
                      ) : null}
                    </>
                  ) : null}
                </dl>

                {validationError || processingError ? (
                  <div className="compression-status__warning" role="alert">
                    <span aria-hidden="true">!</span>
                    <p>{validationError ?? processingError}</p>
                  </div>
                ) : null}

                {isProcessing ? (
                  <div className="compression-status__validation" role="status">
                    <p>{processingIndicatorLabel}</p>
                    <span aria-label={processingIndicatorLabel} className="validation-loader" role="progressbar" />
                  </div>
                ) : null}

                {downloadStarted ? (
                  <p className="compression-status__success" role="status" aria-live="polite">
                    {copy.downloadStartedMessage}
                  </p>
                ) : null}
              </div>

              <div className="compression-status__actions">
                {!selectedFile ? (
                  <button className="button button--primary" type="button" disabled>
                    {copy.trimButton}
                  </button>
                ) : null}

                {canTrim ? (
                  <>
                    <button className="button button--primary" type="button" onClick={() => void startTrim()}>
                      {copy.trimButton}
                    </button>
                    <button className="button button--secondary" type="button" onClick={resetAll}>
                      {copy.cancelButton}
                    </button>
                  </>
                ) : null}

                {hasValidFile && isProcessing ? (
                  <button className="button button--primary" type="button" onClick={() => void cancelJob()}>
                    {copy.cancelButton}
                  </button>
                ) : null}

                {hasValidFile && processingState === "completed" && downloadUrl ? (
                  <>
                    <button
                      className="button button--primary"
                      disabled={isDownloading}
                      type="button"
                      onClick={() => void handleDownloadStarted()}
                    >
                      {copy.downloadButton}
                    </button>
                    <button className="button button--secondary" type="button" onClick={resetAll}>
                      {copy.deleteButton}
                    </button>
                  </>
                ) : null}

                {hasValidFile && (processingState === "failed" || processingState === "cancelled") ? (
                  <>
                    <button
                      className="button button--primary"
                      disabled={isBlocked}
                      type="button"
                      onClick={() => inputRef.current?.click()}
                    >
                      {copy.chooseAnotherFile}
                    </button>
                    <button className="button button--secondary" disabled={isBlocked} type="button" onClick={resetAll}>
                      {copy.deleteButton}
                    </button>
                    {isBlocked && gate.reason === "usage_limit_reached" && gate.plan === "free" ? (
                      <button className="button button--primary" onClick={gate.openUpgradeModal} type="button">
                        {dictionary.upgradeModal.upgradeButtonLabel}
                      </button>
                    ) : null}
                  </>
                ) : null}

                {selectedFile && validationError ? (
                  <>
                    <button className="button button--primary" type="button" onClick={() => inputRef.current?.click()}>
                      {copy.chooseAnotherFile}
                    </button>
                    <button className="button button--secondary" type="button" onClick={resetAll}>
                      {copy.cancelButton}
                    </button>
                  </>
                ) : null}
              </div>
            </aside>
          </section>
        </div>
      </section>

      <section className="extract-audio-info" aria-labelledby="video-trimmer-info-title">
        <div className="section-heading">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="video-trimmer-info-title">{copy.infoTitle}</h2>
        </div>
        <ol className="extract-audio-info__list">
          {copy.infoItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="extract-audio-faq" id="faq" aria-labelledby="video-trimmer-faq-title">
        <div className="section-heading">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="video-trimmer-faq-title">{copy.faqTitle}</h2>
        </div>
        <div className="extract-audio-faq__grid">
          {copy.faqItems.map((item) => (
            <article className="feature-card" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {gate.plan === "anonymous" && gate.anonymousLimits && gate.freeLimits && gate.proLimits ? (
        <PlanComparisonModal
          anonymousLimits={gate.anonymousLimits}
          freeLimits={gate.freeLimits}
          onClose={gate.closeUpgradeModal}
          open={gate.showUpgradeModal}
          proLimits={gate.proLimits}
          returnPath={pathname}
        />
      ) : null}
      {gate.plan === "free" && gate.freeLimits && gate.proLimits ? (
        <UpgradeModal
          cancelPath={pathname}
          freeLimits={gate.freeLimits}
          onClose={gate.closeUpgradeModal}
          open={gate.showUpgradeModal}
          proLimits={gate.proLimits}
        />
      ) : null}
    </main>
  );
}
