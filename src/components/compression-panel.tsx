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
  validationHelper: string;
  validatingLabel: string;
  validationSuccessLabel: string;
  validationFailedLabel: string;
  uploadLimitExceededLabel: string;
  fileLabel: string;
  sizeLabel: string;
  statusLabel: string;
  maximumAllowedLabel: string;
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
  presetFootnote: string;
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
  originalBitrateLabel: string;
  finalBitrateLabel: string;
  originalResolutionLabel: string;
  finalResolutionLabel: string;
  originalCodecLabel: string;
  finalCodecLabel: string;
  expiresLabel: string;
  downloadLabel: string;
  downloadAnywayLabel: string;
  deleteLabel: string;
  ineffectiveWarning: string;
  ineffectiveRecommendationLabel: string;
  successMessage: string;
  successMessages: {
    excellent: string;
    great: string;
    moderate: string;
    light: string;
    noSavings: string;
  };
  downloadStartedMessage: string;
  reuseTipTitle: string;
  reuseTipDescription: string;
  reuseTipSecondary: string;
  presetNames: Record<CompressionPresetId, string>;
  presetDescriptions: Record<CompressionPresetId, string>;
  presetUseCases: Record<CompressionPresetId, string[]>;
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
    sourceUnavailable: string;
  };
  oversizedFileMessage: string;
};

type CompressionPanelProps = {
  copy: CompressionCopy;
  onValidatedChange?: (hasValidatedFile: boolean) => void;
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
      code?: string;
      fileSize?: number;
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

function formatResolution(
  width: number | null,
  height: number | null,
  unknownLabel: string,
) {
  return width && height ? `${width} x ${height}` : unknownLabel;
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
    if (validation.code === "file_too_large") {
      return copy.uploadLimitExceededLabel;
    }

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

function formatOversizedFileMessage(
  copy: CompressionCopy,
  fileSize: number,
  maxSize: number,
) {
  return copy.oversizedFileMessage
    .replace("{fileSize}", formatBytes(fileSize))
    .replace("{maxSize}", formatBytes(maxSize));
}

function forceEvenDimension(value: number) {
  return Math.max(2, Math.round(value / 2) * 2);
}

function getFinalResolution(
  analysis: UploadAnalysis | null,
  presetId: CompressionPresetId,
) {
  const width = analysis?.media.width ?? null;
  const height = analysis?.media.height ?? null;

  if (!width || !height) {
    return {
      width: null,
      height: null,
    };
  }

  const presetConfig = compressionPresets[presetId];

  if (presetConfig.preservesResolution || !presetConfig.maxHeight) {
    return { width, height };
  }

  if (height <= presetConfig.maxHeight) {
    return {
      width: Math.max(2, Math.trunc(width / 2) * 2),
      height: Math.max(2, Math.trunc(height / 2) * 2),
    };
  }

  const maxWidth = presetConfig.maxHeight * 2;
  const scaleRatio = Math.min(maxWidth / width, presetConfig.maxHeight / height);

  return {
    width: forceEvenDimension(width * scaleRatio),
    height: forceEvenDimension(height * scaleRatio),
  };
}

function getFinalBitrate(
  compression: CompressionJobSnapshot["compression"],
  analysis: UploadAnalysis | null,
) {
  const durationSeconds = analysis?.media.durationSeconds ?? null;

  if (!compression || !durationSeconds || durationSeconds <= 0) {
    return null;
  }

  return Math.round((compression.compressedSize * 8) / durationSeconds);
}

function getRecommendedPresetIds(currentPreset: CompressionPresetId) {
  const recommendedOrder = {
    small: ["balanced", "high"],
    balanced: ["small", "high"],
    high: ["balanced", "small"],
  } satisfies Partial<Record<CompressionPresetId, CompressionPresetId[]>>;
  const orderedRecommendations = (recommendedOrder[currentPreset] ?? []).filter(
    (presetId) => presetIds.includes(presetId),
  );
  const futurePresetRecommendations = presetIds.filter(
    (presetId) =>
      presetId !== currentPreset && !orderedRecommendations.includes(presetId),
  );

  return [...orderedRecommendations, ...futurePresetRecommendations];
}

function getCompressionSuccessMessage(
  copy: CompressionCopy,
  compression: CompressionJobSnapshot["compression"],
) {
  if (!compression) {
    return copy.successMessage;
  }

  if (compression.isIneffective) {
    return copy.successMessages.noSavings;
  }

  if (compression.reductionPercent > 80) {
    return copy.successMessages.excellent;
  }

  if (compression.reductionPercent >= 50) {
    return copy.successMessages.great;
  }

  if (compression.reductionPercent >= 20) {
    return copy.successMessages.moderate;
  }

  return copy.successMessages.light;
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

function scrollCompressionPanelIntoView(panel: HTMLElement | null) {
  if (!panel) {
    return;
  }

  window.requestAnimationFrame(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const headerHeight = header?.getBoundingClientRect().height ?? 0;
    const panelTop = panel.getBoundingClientRect().top + window.scrollY;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: Math.max(panelTop - headerHeight - 16, 0),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });
}

export function CompressionPanel({
  copy,
  onValidatedChange,
}: CompressionPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadDropzoneRef = useRef<HTMLLabelElement>(null);
  const compressionPanelRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preset, setPreset] = useState<CompressionPresetId>("balanced");
  const [job, setJob] = useState<CompressionJobSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ status: "idle" });
  const pollingSequenceRef = useRef(0);
  const validationSequenceRef = useRef(0);
  const settledValidationKeyRef = useRef<string | null>(null);
  const alertedJobIdsRef = useRef<Set<string>>(new Set());
  const jobFailedMessageRef = useRef(copy.errors.jobFailed);
  const activeJobId = job?.id ?? null;
  const activeJobStatus = job?.status ?? null;

  useEffect(() => {
    jobFailedMessageRef.current = copy.errors.jobFailed;
  }, [copy.errors.jobFailed]);

  useEffect(() => {
    if (!file || (validation.status !== "valid" && validation.status !== "invalid")) {
      return;
    }

    const validationKey = `${validation.status}:${file.name}:${file.size}:${
      validation.status === "invalid" ? validation.message : "valid"
    }`;

    if (settledValidationKeyRef.current === validationKey) {
      return;
    }

    settledValidationKeyRef.current = validationKey;
    scrollCompressionPanelIntoView(compressionPanelRef.current);
  }, [file, validation]);

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
          setError(jobFailedMessageRef.current);
          stopPolling();
          return;
        }

        scheduleNextPoll();
      }
    }

    scheduleNextPoll();

    return stopPolling;
  }, [activeJobId, activeJobStatus]);

  useEffect(() => {
    if (!job || !isDownloadableCompressionStatus(job.status)) {
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
        const notificationMessage = getCompressionSuccessMessage(copy, job.compression)
          .replace(/^.\s/, "");

        if (Notification.permission === "granted") {
          new Notification("QAVELIX", {
            body: notificationMessage,
          });
        } else if (Notification.permission === "default") {
          void Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification("QAVELIX", {
                body: notificationMessage,
              });
            }
          });
        }
      }
    } catch {
      // Notification permission or platform support must never affect compression state.
    }
  }, [copy, job]);

  function resetFileInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function resetCompressionResult() {
    pollingSequenceRef.current += 1;
    setJob(null);
    setError(null);
    setDownloadStarted(false);
  }

  function resetCompressionWorkflow() {
    resetCompressionResult();
    validationSequenceRef.current += 1;
    setValidation({ status: "idle" });
    setFile(null);
    setPreset("balanced");
    setIsDragging(false);
    resetFileInput();
  }

  function scrollToInitialScreen() {
    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      uploadDropzoneRef.current?.focus({ preventScroll: true });
    });
  }

  function resetToInitialState() {
    resetCompressionWorkflow();
    scrollToInitialScreen();
  }

  function prepareForNewCompression(nextPreset: CompressionPresetId) {
    if (
      nextPreset === preset ||
      isPolling ||
      isCancelling ||
      isDeleting ||
      !isDownloadable
    ) {
      return;
    }

    if (!file || validation.status !== "valid") {
      resetCompressionWorkflow();
      setError(copy.errors.sourceUnavailable);
      scrollToInitialScreen();
      return;
    }

    setPreset(nextPreset);
    resetCompressionResult();
  }

  function selectFiles(files: FileList | File[]) {
    const selectedFile = Array.from(files)[0];

    if (!selectedFile) {
      setError(copy.errors.noFile);
      setValidation({
        status: "invalid",
        message: copy.errors.noFile,
        code: "missing_file",
      });
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
      setValidation({
        status: "invalid",
        message:
          selectedFile.size > MAX_UPLOAD_BYTES
            ? formatOversizedFileMessage(copy, selectedFile.size, MAX_UPLOAD_BYTES)
            : clientError,
        code:
          selectedFile.size > MAX_UPLOAD_BYTES
            ? "file_too_large"
            : selectedFile.size === 0
              ? "empty_file"
              : undefined,
        fileSize:
          selectedFile.size > MAX_UPLOAD_BYTES ? selectedFile.size : undefined,
      });
      return;
    }

    setValidation({ status: "validating", fileName: selectedFile.name });

    try {
      const response = await fetch("/api/upload/analyze", {
        method: "POST",
        headers: {
          "x-qavelix-file-name": encodeURIComponent(selectedFile.name),
          "x-qavelix-file-size": String(selectedFile.size),
          "x-qavelix-file-type": selectedFile.type,
        },
        body: selectedFile,
      });
      const payload = (await response.json()) as UploadResponse;

      if (validationSequenceRef.current !== validationSequence) {
        return;
      }

      if (!payload.ok) {
        setValidation({
          status: "invalid",
          message:
            payload.error.code === "file_too_large"
              ? formatOversizedFileMessage(copy, selectedFile.size, MAX_UPLOAD_BYTES)
              : getValidationErrorMessage(copy, payload.error),
          code: payload.error.code,
          fileSize:
            payload.error.code === "file_too_large" ? selectedFile.size : undefined,
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
    if (isCancelling || isDeleting) {
      return;
    }

    const clientError = getClientError(file);

    if (clientError || !file || validation.status !== "valid") {
      setError(clientError ?? copy.errors.noFile);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("preset", preset);

    setError(null);
    setDownloadStarted(false);

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
    if (!job || !canPoll(job) || isCancelling || isDeleting) {
      return;
    }

    setIsCancelling(true);
    setError(null);

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
    } finally {
      setIsCancelling(false);
    }
  }

  async function deleteJob() {
    if (!file && !job) {
      return;
    }

    if (isCancelling || isDeleting) {
      return;
    }

    const cleanupJob = job && canRequestJobCleanup(job) ? job : null;

    setIsDeleting(true);
    setError(null);

    try {
      if (cleanupJob) {
        const response = await fetch(`/api/compression/jobs/${cleanupJob.id}`, {
          method: "DELETE",
        });
        const payload = (await response.json()) as JobResponse;

        if (!payload.ok) {
          setError(copy.errors.cancelFailed);
          return;
        }
      }

      resetToInitialState();
    } catch {
      setError(copy.errors.cancelFailed);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFiles(event.dataTransfer.files);
  }

  function handlePresetSelect(nextPreset: CompressionPresetId) {
    if (nextPreset === preset) {
      return;
    }

    if (isPolling || isCancelling || isDeleting) {
      return;
    }

    if (isDownloadable) {
      prepareForNewCompression(nextPreset);
      return;
    }

    setPreset(nextPreset);
  }

  function handleDownloadStarted() {
    if (!downloadUrl) {
      return;
    }

    setError(null);
    setDownloadStarted(true);
  }

  const progress = job ? getCompressionDisplayProgress(job.status, job.progress) : 0;
  const compression = job?.compression ?? null;
  const validatedAnalysis = validation.status === "valid" ? validation.analysis : null;
  const isPolling = canPoll(job);
  const isSuccessful = Boolean(job && isSuccessfulCompressionStatus(job.status));
  const hasCompletedResult = Boolean(
    job && isDownloadableCompressionStatus(job.status),
  );
  const isDownloadable = canDownload(job);
  const hasValidatedFile = validation.status === "valid";
  const canStartCompression =
    Boolean(file) &&
    hasValidatedFile &&
    !isPolling &&
    !isDownloadable &&
    !isCancelling &&
    !isDeleting;
  const canCancelCompression = isPolling && !isCancelling && !isDeleting;
  const canDeleteCompression = Boolean(file || job) && !isPolling && !isCancelling && !isDeleting;
  const arePresetButtonsDisabled = isPolling || isCancelling || isDeleting;
  const hasSelectedFileOrJob = Boolean(file || job);
  const shouldShowUploadDropzone = !hasValidatedFile;
  const shouldShowPresets = hasValidatedFile || Boolean(job);
  const oversizedFileSize =
    validation.status === "invalid" &&
    validation.code === "file_too_large" &&
    typeof validation.fileSize === "number"
      ? validation.fileSize
      : null;
  const isOversizedFile = oversizedFileSize !== null;
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
  const activePreset = job?.preset ?? preset;
  const recommendedPresetIds = getRecommendedPresetIds(activePreset);
  const finalResolution = getFinalResolution(validatedAnalysis, activePreset);
  const finalBitrate = getFinalBitrate(compression, validatedAnalysis);
  const successFeedbackMessage = getCompressionSuccessMessage(copy, compression);

  useEffect(() => {
    onValidatedChange?.(hasValidatedFile);
  }, [hasValidatedFile, onValidatedChange]);

  return (
    <section
      className={`compression-section${
        hasSelectedFileOrJob ? " compression-section--working" : ""
      }`}
      id="compression"
    >
      <div className="section-heading">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="compression-panel" ref={compressionPanelRef}>
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
              ref={uploadDropzoneRef}
              tabIndex={-1}
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
                    disabled={arePresetButtonsDisabled}
                    key={presetId}
                    onClick={() => handlePresetSelect(presetId)}
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
                      {copy.expectedReductionLabel}
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
                  </button>
                ))}
              </div>
              <p className="preset-workflow__footnote">{copy.presetFootnote}</p>
            </div>
          ) : null}
        </div>

        <aside
          className={`compression-status${
            job?.status === "compression_ineffective"
              ? " compression-status--ineffective"
              : ""
          }`}
          aria-live="polite"
        >
          <h3>{getStatusLabel(copy, validation, job)}</h3>
          {hasSelectedFileOrJob ? (
            <>
              {isOversizedFile ? (
                <dl>
                  <div>
                    <dt>{copy.sizeLabel}</dt>
                    <dd>{formatBytes(oversizedFileSize)}</dd>
                  </div>
                  <div>
                    <dt>{copy.maximumAllowedLabel}</dt>
                    <dd>{formatBytes(MAX_UPLOAD_BYTES)}</dd>
                  </div>
                </dl>
              ) : (
                <>
                  <dl>
                    <div>
                      <dt>{copy.presetLabel}</dt>
                      <dd>{copy.presetNames[activePreset]}</dd>
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
                      <dt>{copy.originalBitrateLabel}</dt>
                      <dd>
                        {formatBitrate(
                          validatedAnalysis?.media.bitrate ?? null,
                          copy.unknownLabel,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{copy.finalBitrateLabel}</dt>
                      <dd>{formatBitrate(finalBitrate, copy.unknownLabel)}</dd>
                    </div>
                    <div>
                      <dt>{copy.originalResolutionLabel}</dt>
                      <dd>
                        {formatResolution(
                          validatedAnalysis?.media.width ?? null,
                          validatedAnalysis?.media.height ?? null,
                          copy.unknownLabel,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{copy.finalResolutionLabel}</dt>
                      <dd>
                        {formatResolution(
                          finalResolution.width,
                          finalResolution.height,
                          copy.unknownLabel,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{copy.originalCodecLabel}</dt>
                      <dd>
                        {formatValue(
                          validatedAnalysis?.media.videoCodec ?? null,
                          copy.unknownLabel,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{copy.finalCodecLabel}</dt>
                      <dd>H.264</dd>
                    </div>
                    <div>
                      <dt>{copy.expiresLabel}</dt>
                      <dd>
                        {job?.expiresAt
                          ? new Date(job.expiresAt).toLocaleString()
                          : "-"}
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
              )}
            </>
          ) : null}

          {hasCompletedResult || downloadStarted ? (
            <p className="compression-status__success" role="status" aria-live="polite">
              {downloadStarted ? copy.downloadStartedMessage : successFeedbackMessage}
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
            <div className="compression-status__warning">
              <p>{copy.ineffectiveWarning}</p>
              <strong>{copy.ineffectiveRecommendationLabel}</strong>
              <ul>
                {recommendedPresetIds.map((presetId) => (
                  <li key={presetId}>{copy.presetNames[presetId]}</li>
                ))}
              </ul>
            </div>
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
              <a
                className="button button--primary"
                href={downloadUrl}
                onClick={handleDownloadStarted}
              >
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
              className={`button ${
                canCancelCompression ? "button--primary" : "button--secondary"
              }`}
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

          {isSuccessful ? (
            <aside className="compression-status__tip" aria-label={copy.reuseTipTitle}>
              <strong>
                <span aria-hidden="true">💡</span>
                {copy.reuseTipTitle}
              </strong>
              <p>{copy.reuseTipDescription}</p>
              <p>{copy.reuseTipSecondary}</p>
            </aside>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
