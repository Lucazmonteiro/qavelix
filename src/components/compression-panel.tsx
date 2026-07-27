"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { PlanComparisonModal } from "@/components/plan-comparison-modal";
import { UpgradeModal } from "@/components/upgrade-modal";
import { useLocaleState } from "@/i18n/locale-context";
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
  estimateCompressionRisk,
  getPresetsLikelyToReduceSize,
} from "@/lib/compression-precheck";
import {
  acceptedExtensions,
  acceptedMimeTypes,
  formatBytes,
  MAX_UPLOAD_BYTES,
  type UploadAnalysis,
} from "@/lib/upload-policy";
import { useEntitlementGate } from "@/lib/use-entitlement-gate";

type CompressionCopy = {
  eyebrow: string;
  title: string;
  description: string;
  dropTitle: string;
  dropDescription: string;
  browseLabel: string;
  validationHelper: string;
  validatingLabel: string;
  validationStages: {
    preparing: string;
    validating: string;
    readingMetadata: string;
    complete: string;
  };
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
  cancelledMessage: string;
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
  fullHdOptimizationNotice: string;
  expiresLabel: string;
  downloadLabel: string;
  downloadAnywayLabel: string;
  downloadFailedMessage: string;
  deleteLabel: string;
  ineffectiveWarning: string;
  ineffectiveRecommendationLabel: string;
  predictedIncreaseWarning: string;
  predictedIncreaseRecommendationLabel: string;
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
    predictedIncrease: string;
    accountRequired: string;
    usageLimitReached: string;
    toolUnavailableForPlan: string;
    serviceUnavailable: string;
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

type UploadReference = NonNullable<UploadAnalysis["uploadReference"]>;

type ValidationState =
  | {
      status: "idle";
    }
  | {
      status: "validating";
      fileName: string;
      stage: keyof CompressionCopy["validationStages"];
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
      return copy.validatingLabel;
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

function getFinalResolution(
  analysis: UploadAnalysis | null,
  compression: CompressionJobSnapshot["compression"],
) {
  if (compression?.outputWidth && compression.outputHeight) {
    return {
      width: compression.outputWidth,
      height: compression.outputHeight,
    };
  }

  const width = analysis?.media.width ?? null;
  const height = analysis?.media.height ?? null;

  if (!width || !height) {
    return {
      width: null,
      height: null,
    };
  }

  return {
    width,
    height,
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

function getHeaderFileName(response: Response) {
  const disposition = response.headers.get("Content-Disposition");
  const fileNameMatch = disposition?.match(/filename="([^"]+)"/i);

  return fileNameMatch?.[1] ? fileNameMatch[1] : null;
}

function createFallbackCompressedFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;

  return `${baseName}.qavelix-compressed.mp4`;
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
    case "missing_reference":
    case "missing_file":
    case "metadata_mismatch":
      return copy.errors.sourceUnavailable;
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
    case "account_required":
      return copy.errors.accountRequired;
    case "usage_limit_reached":
      return copy.errors.usageLimitReached;
    case "tool_unavailable_for_plan":
      return copy.errors.toolUnavailableForPlan;
    case "invalid_entitlement_state":
    case "usage_service_unavailable":
      return copy.errors.serviceUnavailable;
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
  const { dictionary } = useLocaleState();
  const pathname = usePathname();
  const gate = useEntitlementGate("video-compressor");
  const isBlocked = gate.blocked;
  // The entitlement gate resolves the actor's real plan (and the Free/Pro comparison
  // numbers) asynchronously on mount — see useEntitlementGate(). Until that resolves,
  // MAX_UPLOAD_BYTES (Free/anonymous, 250MB) is the only safe default: it can never
  // let an anonymous or Free actor through the client-side check early. Once resolved,
  // a confirmed Pro actor's own limit (500MB) takes over — this must never stay pinned
  // at the flat constant for a Pro user, or the client blocks files the server would
  // accept.
  const resolvedMaxUploadBytes =
    gate.plan === "pro" && gate.proLimits
      ? gate.proLimits.maxUploadBytes
      : (gate.freeLimits?.maxUploadBytes ?? MAX_UPLOAD_BYTES);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadDropzoneRef = useRef<HTMLLabelElement>(null);
  const compressionPanelRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preset, setPreset] = useState<CompressionPresetId>("balanced");
  const [job, setJob] = useState<CompressionJobSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadReference, setUploadReference] = useState<UploadReference | null>(null);
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
    if (!uploadReference) {
      return;
    }

    const delay = new Date(uploadReference.expiresAt).getTime() - Date.now();

    const timeoutId = window.setTimeout(() => {
      setUploadReference(null);
    }, Math.max(0, delay));

    return () => window.clearTimeout(timeoutId);
  }, [uploadReference]);

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
    if (uploadReference) {
      void discardUploadReference(uploadReference.value);
    }

    resetCompressionResult();
    validationSequenceRef.current += 1;
    setValidation({ status: "idle" });
    setFile(null);
    setUploadReference(null);
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
    if (isBlocked) {
      return;
    }

    const selectedFile = Array.from(files)[0];

    if (uploadReference) {
      void discardUploadReference(uploadReference.value);
      setUploadReference(null);
    }

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

    if (selectedFile.size > resolvedMaxUploadBytes) {
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
          selectedFile.size > resolvedMaxUploadBytes
            ? formatOversizedFileMessage(copy, selectedFile.size, resolvedMaxUploadBytes)
            : clientError,
        code:
          selectedFile.size > resolvedMaxUploadBytes
            ? "file_too_large"
            : selectedFile.size === 0
              ? "empty_file"
              : undefined,
        fileSize:
          selectedFile.size > resolvedMaxUploadBytes ? selectedFile.size : undefined,
      });
      return;
    }

    setValidation({
      status: "validating",
      fileName: selectedFile.name,
      stage: "preparing",
    });

    const validatingTimeoutId = window.setTimeout(() => {
      if (validationSequenceRef.current === validationSequence) {
        setValidation({
          status: "validating",
          fileName: selectedFile.name,
          stage: "validating",
        });
      }
    }, 120);
    const metadataTimeoutId = window.setTimeout(() => {
      if (validationSequenceRef.current === validationSequence) {
        setValidation({
          status: "validating",
          fileName: selectedFile.name,
          stage: "readingMetadata",
        });
      }
    }, 900);

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
        window.clearTimeout(validatingTimeoutId);
        window.clearTimeout(metadataTimeoutId);
        return;
      }

      if (!payload.ok) {
        window.clearTimeout(validatingTimeoutId);
        window.clearTimeout(metadataTimeoutId);
        setValidation({
          status: "invalid",
          message:
            payload.error.code === "file_too_large"
              ? formatOversizedFileMessage(copy, selectedFile.size, resolvedMaxUploadBytes)
              : getValidationErrorMessage(copy, payload.error),
          code: payload.error.code,
          fileSize:
            payload.error.code === "file_too_large" ? selectedFile.size : undefined,
        });
        return;
      }

      if (!payload.analysis.uploadReference) {
        window.clearTimeout(validatingTimeoutId);
        window.clearTimeout(metadataTimeoutId);
        setValidation({
          status: "invalid",
          message: copy.errors.analysisFailed,
        });
        return;
      }

      setUploadReference(payload.analysis.uploadReference);
      window.clearTimeout(validatingTimeoutId);
      window.clearTimeout(metadataTimeoutId);
      setValidation({
        status: "validating",
        fileName: selectedFile.name,
        stage: "complete",
      });
      await new Promise((resolve) => window.setTimeout(resolve, 180));

      if (validationSequenceRef.current !== validationSequence) {
        return;
      }

      setValidation({ status: "valid", analysis: payload.analysis });
    } catch {
      window.clearTimeout(validatingTimeoutId);
      window.clearTimeout(metadataTimeoutId);
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

    if (isPrecheckBlocked) {
      setError(copy.errors.predictedIncrease);
      return;
    }

    if (!uploadReference) {
      setDownloadStarted(false);
      setError(copy.errors.sourceUnavailable);
      return;
    }

    setError(null);
    setDownloadStarted(false);

    try {
      const response = await fetch("/api/compression/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadReference: uploadReference.value,
          preset,
        }),
      });
      const payload = (await response.json()) as JobResponse;

      if (!payload.ok) {
        const message =
          payload.error.code === "file_too_large" && file
            ? formatOversizedFileMessage(copy, file.size, resolvedMaxUploadBytes)
            : getCompressionErrorMessage(copy, payload.error);

        if (
          payload.error.code === "missing_reference" ||
          payload.error.code === "missing_file" ||
          payload.error.code === "metadata_mismatch"
        ) {
          setUploadReference(null);
          setDownloadStarted(false);
        }

        if (
          payload.error.code === "usage_limit_reached" ||
          payload.error.code === "account_required"
        ) {
          gate.reportDenial(payload.error.code);
        }

        setError(message);
        return;
      }

      setUploadReference(null);
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

      pollingSequenceRef.current += 1;
      setJob(payload.job);

      if (payload.job.status === "cancelled") {
        setDownloadStarted(false);
        setUploadReference(null);
        setError(copy.errors.sourceUnavailable);
      }
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

      if (uploadReference) {
        await discardUploadReference(uploadReference.value);
      }

      resetToInitialState();
    } catch {
      setError(copy.errors.cancelFailed);
    } finally {
      setIsDeleting(false);
    }
  }

  async function discardUploadReference(reference: string) {
    try {
      await fetch("/api/upload/analyze", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadReference: reference }),
      });
    } catch {
      // Expired or already cleaned references should not block the UI.
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isBlocked) {
      return;
    }

    selectFiles(event.dataTransfer.files);
  }

  function handlePresetSelect(nextPreset: CompressionPresetId) {
    if (nextPreset === preset) {
      return;
    }

    if (arePresetButtonsDisabled) {
      return;
    }

    if (isDownloadable) {
      prepareForNewCompression(nextPreset);
      return;
    }

    setPreset(nextPreset);
  }

  async function handleDownloadStarted() {
    if (!downloadUrl || isDownloading) {
      return;
    }

    setError(null);

    try {
      setIsDownloading(true);
      const response = await fetch(downloadUrl, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Download request failed.");
      }

      const blob = await response.blob();

      if (blob.size <= 0) {
        throw new Error("Download response was empty.");
      }

      const fileName =
        getHeaderFileName(response) ??
        createFallbackCompressedFileName(job?.originalName ?? file?.name ?? "video");
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
      setError(copy.downloadFailedMessage);
    } finally {
      setIsDownloading(false);
    }
  }

  const progress = job ? getCompressionDisplayProgress(job.status, job.progress) : 0;
  const compression = job?.compression ?? null;
  const validatedAnalysis = validation.status === "valid" ? validation.analysis : null;
  const compressionRisk =
    validatedAnalysis && file
      ? estimateCompressionRisk(validatedAnalysis.media, file.size, preset)
      : null;
  const isPrecheckBlocked = Boolean(compressionRisk?.willLikelyIncrease);
  const precheckSafePresetIds =
    validatedAnalysis && file
      ? getPresetsLikelyToReduceSize(validatedAnalysis.media, file.size, preset)
      : [];
  const isPolling = canPoll(job);
  const isSuccessful = Boolean(job && isSuccessfulCompressionStatus(job.status));
  const hasCompletedResult = Boolean(
    job && isDownloadableCompressionStatus(job.status),
  );
  const isDownloadable = canDownload(job);
  const hasValidatedFile = validation.status === "valid";
  const isCancelled = job?.status === "cancelled";
  const isSourceUnavailable =
    hasValidatedFile && !uploadReference && !isDownloadable && !isPolling;
  const canStartCompression =
    Boolean(file) &&
    Boolean(uploadReference) &&
    hasValidatedFile &&
    !isPolling &&
    !isDownloadable &&
    !isSourceUnavailable &&
    !isCancelling &&
    !isDeleting &&
    !isPrecheckBlocked &&
    !isBlocked;
  const canCancelCompression = isPolling && !isCancelling && !isDeleting;
  // Explicitly excluded once the backend has confirmed the daily limit is reached — the
  // user must upgrade or wait for the reset rather than clearing state to retry the same
  // day (see useEntitlementGate's comment on this being the informational, not
  // enforcing, layer — the real limit is still enforced at job-creation time regardless).
  const canDeleteCompression =
    Boolean(file || job) && !isPolling && !isCancelling && !isDeleting && !isBlocked;
  const arePresetButtonsDisabled =
    isSourceUnavailable || isPolling || isCancelling || isDeleting || isBlocked;
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
  const precheckRecommendedPresetIds = getRecommendedPresetIds(preset).filter((id) =>
    precheckSafePresetIds.includes(id),
  );
  const finalResolution = getFinalResolution(validatedAnalysis, compression);
  const finalBitrate = getFinalBitrate(compression, validatedAnalysis);
  const successFeedbackMessage = getCompressionSuccessMessage(copy, compression);
  const validationStageMessage =
    validation.status === "validating"
      ? copy.validationStages[validation.stage]
      : null;
  const isCurrentValidationComplete =
    validation.status === "validating" && validation.stage === "complete";
  const shouldShowValidationComplete = validation.status === "valid" && !job;
  // dropDescription now states both plans' fixed limits directly (never the viewer's
  // single resolved value) so it needs no interpolation — see .upload-limit-comparison
  // below for the dynamic, gate-sourced Free/Pro comparison.
  const dropDescription = copy.dropDescription;

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
              className={`upload-dropzone${isDragging ? " upload-dropzone--active" : ""}${
                validation.status === "validating" ? " upload-dropzone--validating" : ""
              }${isBlocked ? " upload-dropzone--blocked" : ""}`}
              aria-disabled={isBlocked}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!isBlocked) {
                  setIsDragging(true);
                }
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
                disabled={isBlocked}
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
                {validation.status === "validating"
                  ? copy.validationStages[validation.stage]
                  : dropDescription}
              </span>
              {validation.status === "validating" ? (
                <>
                  {validation.stage === "complete" ? (
                    <span className="validation-complete-mark" aria-hidden="true">
                      ✓
                    </span>
                  ) : (
                    <span className="validation-loader" aria-hidden="true" />
                  )}
                  <span className="validation-file-name" title={validation.fileName}>
                    {validation.fileName}
                  </span>
                </>
              ) : null}
              <span
                className={`button button--primary${isBlocked ? " button--disabled-look" : ""}`}
              >
                {copy.browseLabel}
              </span>
            </label>
          ) : null}

          {isBlocked && shouldShowUploadDropzone ? (
            <div className="entitlement-lock-notice" role="status">
              <p>
                {gate.reason === "account_required"
                  ? copy.errors.accountRequired
                  : copy.errors.usageLimitReached}
              </p>
              {gate.reason === "usage_limit_reached" && gate.plan === "free" ? (
                <button
                  className="button button--primary"
                  onClick={gate.openUpgradeModal}
                  type="button"
                >
                  {dictionary.upgradeModal.upgradeButtonLabel}
                </button>
              ) : null}
            </div>
          ) : null}

          {validation.status === "valid" ? (
            <aside className="upload-result upload-result--workflow" aria-live="polite">
              <h3>{copy.validationSuccessLabel}</h3>
              <dl>
                <div>
                  <dt>{copy.fileLabel}</dt>
                  <dd className="bounded-file-name" title={validation.analysis.file.name}>
                    {validation.analysis.file.name}
                  </dd>
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
                    aria-disabled={arePresetButtonsDisabled}
                    aria-pressed={arePresetButtonsDisabled ? false : preset === presetId}
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
          {validation.status === "validating" ? (
            <div
              className={`compression-status__validation${
                isCurrentValidationComplete
                  ? " compression-status__validation--complete"
                  : ""
              }`}
              role="status"
            >
              <p>{validationStageMessage}</p>
              <span className="validation-file-name" title={validation.fileName}>
                {validation.fileName}
              </span>
              {validation.stage === "complete" ? (
                <span className="validation-complete-mark" aria-hidden="true">
                  ✓
                </span>
              ) : (
                <span className="validation-loader" aria-hidden="true" />
              )}
            </div>
          ) : null}
          {shouldShowValidationComplete ? (
            <div
              className="compression-status__validation compression-status__validation--complete"
              role="status"
            >
              <p>
                <span aria-hidden="true">✓</span>
                {copy.validationStages.complete}
              </p>
            </div>
          ) : null}
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
                    <dd>{formatBytes(resolvedMaxUploadBytes)}</dd>
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
                      <dt>{copy.originalBitrateLabel}</dt>
                      <dd>
                        {formatBitrate(
                          validatedAnalysis?.media.bitrate ?? null,
                          copy.unknownLabel,
                        )}
                      </dd>
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
                      <dt>{copy.originalCodecLabel}</dt>
                      <dd>
                        {formatValue(
                          validatedAnalysis?.media.videoCodec ?? null,
                          copy.unknownLabel,
                        )}
                      </dd>
                    </div>
                    {compression ? (
                      <>
                        <div>
                          <dt>{copy.compressedSizeLabel}</dt>
                          <dd>{formatBytes(compression.compressedSize)}</dd>
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
                          <dt>{copy.finalBitrateLabel}</dt>
                          <dd>{formatBitrate(finalBitrate, copy.unknownLabel)}</dd>
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
                      </>
                    ) : null}
                  </dl>

                  {job ? (
                    <div className="progress-block">
                    <div className="progress-block__label">
                      <span>{copy.progressLabel}</span>
                      <strong>{progress}%</strong>
                    </div>
                    <progress max={100} value={progress}>
                      {progress}%
                    </progress>
                    </div>
                  ) : null}

                  {compression?.wasDownscaledToFullHd ? (
                    <p className="compression-status__notice">
                      {copy.fullHdOptimizationNotice}
                    </p>
                  ) : null}
                </>
              )}
            </>
          ) : null}

          {hasCompletedResult || downloadStarted ? (
            <p className="compression-status__success" role="status" aria-live="polite">
              {downloadStarted ? copy.downloadStartedMessage : successFeedbackMessage}
            </p>
          ) : null}

          {isCancelled ? (
            <p className="compression-status__notice" role="status" aria-live="polite">
              {copy.cancelledMessage}
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

          {!job && isPrecheckBlocked ? (
            <div className="compression-status__warning">
              <p>{copy.predictedIncreaseWarning}</p>
              <strong>{copy.predictedIncreaseRecommendationLabel}</strong>
              <ul>
                {precheckRecommendedPresetIds.map((presetId) => (
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
              <button
                className="button button--primary"
                disabled={isDownloading}
                onClick={() => void handleDownloadStarted()}
                type="button"
              >
                {job?.status === "compression_ineffective"
                  ? copy.downloadAnywayLabel
                  : copy.downloadLabel}
              </button>
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
    </section>
  );
}
