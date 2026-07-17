"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

import {
  compressionPresets,
  getCompressionDisplayProgress,
  isActiveCompressionStatus,
  isDownloadableCompressionStatus,
  isTerminalCompressionStatus,
  mergePolledCompressionJob,
  type CompressionJobSnapshot,
  type CompressionPresetId,
} from "@/lib/compression-policy";
import {
  acceptedExtensions,
  acceptedMimeTypes,
  formatBytes,
  MAX_UPLOAD_BYTES,
  type UploadAnalysis,
} from "@/lib/upload-policy";

type CompressionCopy = {
  eyebrow: string;
  title: string;
  description: string;
  dropTitle: string;
  dropDescription: string;
  browseLabel: string;
  validatingLabel: string;
  validationSuccessLabel: string;
  validationFailedLabel: string;
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
  presetLabel: string;
  presetQuestionLabel: string;
  recommendedLabel: string;
  expectedReductionLabel: string;
  useCasesLabel: string;
  startLabel: string;
  cancelLabel: string;
  progressLabel: string;
  waitingLabel: string;
  readyLabel: string;
  queuedLabel: string;
  startingLabel: string;
  runningLabel: string;
  completedLabel: string;
  optimizedLabel: string;
  ineffectiveLabel: string;
  failedLabel: string;
  cancelledLabel: string;
  expiredLabel: string;
  deletedLabel: string;
  originalSizeLabel: string;
  compressedSizeLabel: string;
  savedLabel: string;
  increaseLabel: string;
  increasePercentLabel: string;
  reductionLabel: string;
  expiresLabel: string;
  downloadLabel: string;
  downloadAnywayLabel: string;
  deleteLabel: string;
  ineffectiveWarning: string;
  successMessage: string;
  presetNames: Record<CompressionPresetId, string>;
  presetDescriptions: Record<CompressionPresetId, string>;
  presetUseCases: Record<CompressionPresetId, string[]>;
  presetReductionRanges: Record<CompressionPresetId, string>;
  presetNotes: Partial<Record<CompressionPresetId, string>>;
  errors: {
    noFile: string;
    empty: string;
    tooLarge: string;
    unsupportedExtension: string;
    unsupportedMime: string;
    invalidSignature: string;
    analysisUnavailable: string;
    analysisFailed: string;
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

type UploadResponse =
  | {
      ok: true;
      analysis: UploadAnalysis;
    }
  | {
      ok: false;
      error: {
        code?: string;
        message?: string;
      };
    };

type ValidationState =
  | {
      status: "idle";
    }
  | {
      status: "validating";
      fileName: string;
    }
  | {
      status: "valid";
      analysis: UploadAnalysis;
    }
  | {
      status: "invalid";
      message: string;
    };

const presetIds = Object.keys(compressionPresets) as CompressionPresetId[];
const pollingDelayMs = 1000;
const maxPollingFailures = 3;

function getExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : "";
}

function canPoll(job: CompressionJobSnapshot | null) {
  return Boolean(job && isActiveCompressionStatus(job.status));
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

function isSuccessfulCompressionStatus(status: CompressionJobSnapshot["status"]) {
  return status === "completed" || status === "optimized";
}

function getStatusLabel(
  copy: CompressionCopy,
  validation: ValidationState,
  job: CompressionJobSnapshot | null,
) {
  if (!job) {
    if (validation.status === "validating") {
      return `${copy.validatingLabel}: ${validation.fileName}`;
    }

    if (validation.status === "valid") {
      return copy.readyLabel;
    }

    if (validation.status === "invalid") {
      return copy.validationFailedLabel;
    }

    return copy.waitingLabel;
  }

  const labels = {
    queued: copy.queuedLabel,
    starting: copy.startingLabel,
    running: copy.runningLabel,
    completed: copy.completedLabel,
    optimized: copy.optimizedLabel,
    compression_ineffective: copy.ineffectiveLabel,
    failed: copy.failedLabel,
    cancelled: copy.cancelledLabel,
    expired: copy.expiredLabel,
    deleted: copy.deletedLabel,
  } satisfies Record<CompressionJobSnapshot["status"], string>;

  return labels[job.status];
}

function getValidationErrorMessage(
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
    case "ffprobe_unavailable":
      return copy.errors.analysisUnavailable;
    case "ffprobe_failed":
      return copy.errors.analysisFailed;
    default:
      return copy.errors.analysisFailed;
  }
}

function canDownload(job: CompressionJobSnapshot | null) {
  return Boolean(job && isDownloadableCompressionStatus(job.status) && job.downloadUrl);
}

function canRequestJobCleanup(job: CompressionJobSnapshot | null) {
  return Boolean(
    job && (isDownloadableCompressionStatus(job.status) || job.status === "failed"),
  );
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
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });
  const pollingSequenceRef = useRef(0);
  const validationSequenceRef = useRef(0);
  const alertedJobIdsRef = useRef<Set<string>>(new Set());
  const activeJobId = job?.id ?? null;
  const activeJobStatus = job?.status ?? null;

  useEffect(() => {
    if (!activeJobId || !activeJobStatus || !isActiveCompressionStatus(activeJobStatus)) {
      return;
    }

    const pollingSequence = pollingSequenceRef.current + 1;
    const controller = new AbortController();
    let timeoutId: number | null = null;
    let stopped = false;
    let failureCount = 0;

    pollingSequenceRef.current = pollingSequence;

    function stopPolling() {
      stopped = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }

      controller.abort();
    }

    function scheduleNextPoll() {
      if (stopped) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        timeoutId = null;
        void pollJob();
      }, pollingDelayMs);
    }

    async function pollJob() {
      if (stopped || controller.signal.aborted) {
        return;
      }

      try {
        const response = await fetch(`/api/compression/jobs/${activeJobId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as JobResponse;

        if (stopped || pollingSequenceRef.current !== pollingSequence) {
          return;
        }

        if (payload.ok) {
          failureCount = 0;
          setJob((currentJob) => mergePolledCompressionJob(currentJob, payload.job));

          if (isTerminalCompressionStatus(payload.job.status)) {
            stopPolling();
            return;
          }
        }

        scheduleNextPoll();
      } catch {
        if (controller.signal.aborted || stopped) {
          return;
        }

        failureCount += 1;

        if (failureCount >= maxPollingFailures) {
          setError(copy.errors.jobFailed);
          stopPolling();
          return;
        }

        scheduleNextPoll();
      }
    }

    scheduleNextPoll();

    return stopPolling;
  }, [activeJobId, activeJobStatus, copy.errors.jobFailed]);

  useEffect(() => {
    if (!job || !isSuccessfulCompressionStatus(job.status)) {
      return;
    }

    if (alertedJobIdsRef.current.has(job.id)) {
      return;
    }

    alertedJobIdsRef.current.add(job.id);

    try {
      const AudioContextConstructor =
        window.AudioContext ??
        (
          window as typeof window & {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;

      if (AudioContextConstructor) {
        const audioContext = new AudioContextConstructor();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1175, audioContext.currentTime + 0.35);
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, audioContext.currentTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.9);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.95);
        window.setTimeout(() => void audioContext.close(), 1200);
      }
    } catch {
      // Browser audio policies can block programmatic sounds; the UI must keep working.
    }

    try {
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("QAVELIX", {
            body: copy.successMessage.replace(/^.\s/, ""),
          });
        } else if (Notification.permission === "default") {
          void Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("QAVELIX", {
                body: copy.successMessage.replace(/^.\s/, ""),
              });
            }
          });
        }
      }
    } catch {
      // Notification permission or platform support must never affect compression state.
    }
  }, [copy.successMessage, job]);

  function resetFileInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function resetCompressionResult() {
    pollingSequenceRef.current += 1;
    setJob(null);
    setError(null);
  }

  function resetCompressionWorkflow() {
    resetCompressionResult();
    validationSequenceRef.current += 1;
    setValidation({ status: "idle" });
    setFile(null);
    resetFileInput();
  }

  function selectFiles(files: FileList | File[]) {
    const selectedFile = Array.from(files)[0];

    if (!selectedFile) {
      setError(copy.errors.noFile);
      setValidation({ status: "invalid", message: copy.errors.noFile });
      return;
    }

    setFile(selectedFile);
    resetCompressionResult();
    resetFileInput();
    void analyzeSelectedFile(selectedFile);
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

  async function analyzeSelectedFile(selectedFile: File) {
    const validationSequence = validationSequenceRef.current + 1;
    validationSequenceRef.current = validationSequence;

    const clientError = getClientError(selectedFile);

    if (clientError) {
      setValidation({ status: "invalid", message: clientError });
      return;
    }

    setValidation({ status: "validating", fileName: selectedFile.name });

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload/analyze", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadResponse;

      if (validationSequenceRef.current !== validationSequence) {
        return;
      }

      if (!payload.ok) {
        setValidation({
          status: "invalid",
          message: getValidationErrorMessage(copy, payload.error),
        });
        return;
      }

      setValidation({ status: "valid", analysis: payload.analysis });
    } catch {
      if (validationSequenceRef.current !== validationSequence) {
        return;
      }

      setValidation({
        status: "invalid",
        message: copy.errors.analysisFailed,
      });
    }
  }

  async function startCompression() {
    const clientError = getClientError(file);

    if (clientError || !file || validation.status !== "valid") {
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
    if (!job || !canRequestJobCleanup(job)) {
      return;
    }

    const cleanupJob = job;

    try {
      const response = await fetch(`/api/compression/jobs/${cleanupJob.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as JobResponse;

      if (!payload.ok) {
        setError(copy.errors.cancelFailed);
        return;
      }

      resetCompressionWorkflow();
    } catch {
      setError(copy.errors.cancelFailed);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFiles(event.dataTransfer.files);
  }

  const progress = job ? getCompressionDisplayProgress(job.status, job.progress) : 0;
  const compression = job?.compression ?? null;
  const isPolling = canPoll(job);
  const isSuccessful = Boolean(job && isSuccessfulCompressionStatus(job.status));
  const isDownloadable = canDownload(job);
  const hasValidatedFile = validation.status === "valid";
  const canStartCompression =
    Boolean(file) && hasValidatedFile && !isPolling && !isDownloadable;
  const canCancelCompression = isPolling;
  const canDeleteCompression = canRequestJobCleanup(job);
  const hasSelectedFileOrJob = Boolean(file || job);
  const shouldShowUploadDropzone = !hasValidatedFile;
  const shouldShowPresets = hasValidatedFile || Boolean(job);
  const savedOrIncreasedLabel = compression?.isIneffective
    ? copy.increaseLabel
    : copy.savedLabel;
  const savedOrIncreasedValue = compression
    ? compression.isIneffective
      ? formatBytes(compression.increasedBytes)
      : formatBytes(compression.savedBytes)
    : "-";
  const reductionOrIncreasePercentLabel = compression?.isIneffective
    ? copy.increasePercentLabel
    : copy.reductionLabel;
  const reductionValue = compression
    ? compression.isIneffective
      ? `${compression.increasePercent.toFixed(1)}%`
      : `${compression.reductionPercent.toFixed(1)}%`
    : "-";
  const downloadUrl = isDownloadable ? job?.downloadUrl : null;

  return (
    <section className="compression-section" id="compression">
      <div className="section-heading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="compression-panel">
        <div className="compression-panel__main">
          {shouldShowUploadDropzone ? (
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
              <span className="upload-dropzone__description">
                {copy.dropDescription}
              </span>
              <span className="button button--primary">{copy.browseLabel}</span>
            </label>
          ) : null}

          {validation.status === "valid" ? (
            <aside className="upload-result upload-result--workflow" aria-live="polite">
              <h3>{copy.validationSuccessLabel}</h3>
              <dl>
                <div>
                  <dt>{copy.fileLabel}</dt>
                  <dd>{validation.analysis.file.name}</dd>
                </div>
                <div>
                  <dt>{copy.sizeLabel}</dt>
                  <dd>{formatBytes(validation.analysis.file.size)}</dd>
                </div>
                <div>
                  <dt>{copy.typeLabel}</dt>
                  <dd>{validation.analysis.file.mimeType}</dd>
                </div>
                <div>
                  <dt>{copy.durationLabel}</dt>
                  <dd>
                    {formatDuration(
                      validation.analysis.media.durationSeconds,
                      copy.unknownLabel,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{copy.resolutionLabel}</dt>
                  <dd>
                    {validation.analysis.media.width && validation.analysis.media.height
                      ? `${validation.analysis.media.width} x ${validation.analysis.media.height}`
                      : copy.unknownLabel}
                  </dd>
                </div>
                <div>
                  <dt>{copy.videoCodecLabel}</dt>
                  <dd>
                    {formatValue(validation.analysis.media.videoCodec, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.audioCodecLabel}</dt>
                  <dd>
                    {formatValue(validation.analysis.media.audioCodec, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.bitrateLabel}</dt>
                  <dd>
                    {formatBitrate(validation.analysis.media.bitrate, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.frameRateLabel}</dt>
                  <dd>
                    {formatValue(validation.analysis.media.frameRate, copy.unknownLabel)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.formatLabel}</dt>
                  <dd>
                    {formatValue(validation.analysis.media.formatName, copy.unknownLabel)}
                  </dd>
                </div>
              </dl>
            </aside>
          ) : null}

          {shouldShowPresets ? (
            <div className="preset-workflow" aria-label={copy.presetLabel}>
              <h3>{copy.presetQuestionLabel}</h3>
              <div className="preset-group preset-group--workflow">
                {presetIds.map((presetId) => (
                  <button
                    aria-pressed={preset === presetId}
                    className="preset-card preset-card--workflow"
                    key={presetId}
                    onClick={() => setPreset(presetId)}
                    type="button"
                  >
                    <span className="preset-card__header">
                      <strong>{copy.presetNames[presetId]}</strong>
                      {presetId === "balanced" ? (
                        <span className="preset-card__badge">
                          {copy.recommendedLabel}
                        </span>
                      ) : null}
                    </span>
                    <span>{copy.presetDescriptions[presetId]}</span>
                    <span className="preset-card__meta">
                      {copy.expectedReductionLabel}:{" "}
                      <strong>{copy.presetReductionRanges[presetId]}</strong>
                    </span>
                    <span className="preset-card__use-cases">
                      <span className="preset-card__use-cases-label">
                        {copy.useCasesLabel}
                      </span>
                      <span className="preset-card__chips">
                        {copy.presetUseCases[presetId].map((useCase) => (
                          <span className="preset-card__chip" key={useCase}>
                            {useCase}
                          </span>
                        ))}
                      </span>
                    </span>
                    {copy.presetNotes[presetId] ? (
                      <span className="preset-card__note">
                        {copy.presetNotes[presetId]}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="compression-status" aria-live="polite">
          <h3>{getStatusLabel(copy, validation, job)}</h3>
          {hasSelectedFileOrJob ? (
            <>
              <dl>
                <div>
                  <dt>{copy.presetLabel}</dt>
                  <dd>{copy.presetNames[preset]}</dd>
                </div>
                <div>
                  <dt>{copy.originalSizeLabel}</dt>
                  <dd>
                    {compression
                      ? formatBytes(compression.originalSize)
                      : file
                        ? formatBytes(file.size)
                        : "-"}
                  </dd>
                </div>
                <div>
                  <dt>{copy.compressedSizeLabel}</dt>
                  <dd>
                    {compression
                      ? formatBytes(compression.compressedSize)
                      : job?.outputSize
                        ? formatBytes(job.outputSize)
                        : "-"}
                  </dd>
                </div>
                <div>
                  <dt>{savedOrIncreasedLabel}</dt>
                  <dd>{savedOrIncreasedValue}</dd>
                </div>
                <div>
                  <dt>{reductionOrIncreasePercentLabel}</dt>
                  <dd>{reductionValue}</dd>
                </div>
                <div>
                  <dt>{copy.expiresLabel}</dt>
                  <dd>
                    {job?.expiresAt ? new Date(job.expiresAt).toLocaleString() : "-"}
                  </dd>
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
            </>
          ) : null}

          {isSuccessful ? (
            <p className="compression-status__success" role="status" aria-live="polite">
              {copy.successMessage}
            </p>
          ) : null}

          {error ? <p className="compression-status__error">{error}</p> : null}
          {validation.status === "invalid" ? (
            <p className="compression-status__error">{validation.message}</p>
          ) : null}
          {job?.error ? (
            <p className="compression-status__error">{copy.errors.jobFailed}</p>
          ) : null}
          {job?.status === "compression_ineffective" ? (
            <p className="compression-status__warning">{copy.ineffectiveWarning}</p>
          ) : null}

          <div className="compression-status__actions">
            <button
              className="button button--primary"
              disabled={!canStartCompression}
              onClick={() => void startCompression()}
              type="button"
            >
              {copy.startLabel}
            </button>
            {downloadUrl ? (
              <a className="button button--primary" href={downloadUrl}>
                {job?.status === "compression_ineffective"
                  ? copy.downloadAnywayLabel
                  : copy.downloadLabel}
              </a>
            ) : (
              <button className="button button--primary" disabled type="button">
                {copy.downloadLabel}
              </button>
            )}
            <button
              className="button button--secondary"
              disabled={!canCancelCompression}
              onClick={() => void cancelJob()}
              type="button"
            >
              {copy.cancelLabel}
            </button>
            <button
              className="button button--secondary"
              disabled={!canDeleteCompression}
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
