"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

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
// Client-side UX guard only, not a security/quota boundary the way upload size limits
// are (see CLAUDE.md on client pre-checks) — a sub-5-second source video doesn't leave
// enough room to pick a meaningful start/end range, so it's rejected the same way an
// oversized or wrong-format file already is, reusing all the same invalid-file UI.
const minSourceDurationSeconds = 5;
const downloadClickCooldownMs = 3000;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Slider precision matches formatSecondsToTimestamp's whole-second display exactly —
// offering finer step values would be a false precision the text field immediately
// truncates away on every drag.
const timelineStepSeconds = 1;

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

// Only called from the "use client" component's own event handlers, so `window` is
// always available here — no SSR guard needed.
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const pollingControllerRef = useRef<AbortController | null>(null);
  const pollingSequenceRef = useRef(0);
  const downloadCooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [analysis, setAnalysis] = useState<UploadAnalysis | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTimeInput, setStartTimeInput] = useState("00:00:00");
  const [endTimeInput, setEndTimeInput] = useState("00:00:00");
  const [rangeErrorKey, setRangeErrorKey] = useState<ValidationErrorKey | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [job, setJob] = useState<VideoTrimmerJobSnapshot | null>(null);
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadCoolingDown, setIsDownloadCoolingDown] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const selectedFile = fileState?.file ?? null;
  const validationErrorKey = fileState?.errorKey ?? null;
  const validationError = validationErrorKey
    ? copy.validation[validationErrorKey].replace("{maxSize}", formatBytes(resolvedMaxUploadBytes))
    : null;
  const rangeError = rangeErrorKey ? copy.validation[rangeErrorKey] : null;
  const hasValidFile = Boolean(selectedFile && !validationError);
  const durationSeconds = analysis?.media.durationSeconds ?? null;
  // Whole-second bound for the timeline slider — kept in lockstep with
  // timelineStepSeconds/formatSecondsToTimestamp's own second-level precision. Guarded to
  // >= 1 by hasTimeline below so this is never used as a divide-by-zero denominator.
  const timelineMaxSeconds = durationSeconds !== null ? Math.floor(durationSeconds) : 0;
  const hasTimeline = durationSeconds !== null && timelineMaxSeconds >= 1;
  // The manual timestamp text inputs remain the single source of truth for the selected
  // range (matching this file's existing "derive, don't duplicate" convention — see
  // hasValidFile/canTrim above): the slider's thumb positions are derived from them on
  // every render rather than tracked in parallel state, so there is exactly one place a
  // sync bug could hide, and typing vs. dragging can never disagree.
  const parsedStartSeconds = parseTimestampToSeconds(startTimeInput);
  const parsedEndSeconds = parseTimestampToSeconds(endTimeInput);
  const timelineStartSeconds = clamp(parsedStartSeconds ?? 0, 0, timelineMaxSeconds);
  const timelineEndSeconds = clamp(parsedEndSeconds ?? timelineMaxSeconds, 0, timelineMaxSeconds);
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

      if (downloadCooldownTimeoutRef.current !== null) {
        clearTimeout(downloadCooldownTimeoutRef.current);
      }
    };
  }, []);

  // Live preview object URL: created for the current valid file, revoked whenever it's
  // replaced or cleared, and revoked again on unmount — the effect's cleanup function is
  // the one place this runs, so every exit path (new selection, reset, navigating away)
  // is covered by construction rather than needing a revoke() call at each call site.
  const previewFile = hasValidFile ? selectedFile : null;

  useEffect(() => {
    // URL.createObjectURL/revokeObjectURL is a browser-only object-URL registry with no
    // derived-render equivalent — the string itself must come from a real side effect,
    // so there's no way to compute videoUrl during render the way this lint rule expects.
    if (!previewFile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVideoUrl(null);
      setCurrentTime(0);
      return;
    }

    const objectUrl = URL.createObjectURL(previewFile);
    setVideoUrl(objectUrl);
    setCurrentTime(0);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [previewFile]);

  // Shared by resetAll() (explicit Cancel/Delete/reset actions, where clearing the file
  // input's value is correct — it's what lets the user re-pick the exact same file) and
  // setSelectedFiles() (a fresh selection, where it is NOT: inputRef.current is the same
  // DOM node a <input type="file"> selection's FileList came from, and clearing that
  // node's .value invalidates its .files — since setSelectedFiles still needs to read
  // `files` after this call, doing so here silently emptied the just-selected file and
  // left fileState stuck at null. See extract-audio-tool.tsx's own setSelectedFiles,
  // which never touches the input value during a fresh selection for the same reason.
  function resetProcessingState() {
    uploadControllerRef.current?.abort();
    pollingControllerRef.current?.abort();
    uploadControllerRef.current = null;
    pollingControllerRef.current = null;
    pollingSequenceRef.current += 1;

    if (downloadCooldownTimeoutRef.current !== null) {
      clearTimeout(downloadCooldownTimeoutRef.current);
      downloadCooldownTimeoutRef.current = null;
    }

    setAnalysis(null);
    setStartTimeInput("00:00:00");
    setEndTimeInput("00:00:00");
    setRangeErrorKey(null);
    setProcessingState("idle");
    setJob(null);
    setErrorKey(null);
    setIsDownloadCoolingDown(false);
    setDownloadStarted(false);
  }

  function resetAll() {
    resetProcessingState();
    setFileState(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    // The dropzone reappears once selectedFile goes back to null (see its render gate
    // above) — scroll back up to it so deleting a file from a long, scrolled-down
    // completed/locked view doesn't strand the user staring at an empty sidebar.
    scrollToTop();
  }

  function setSelectedFiles(files: FileList | null) {
    if (isBlocked) {
      return;
    }

    resetProcessingState();

    if (!files || files.length === 0) {
      setFileState(null);
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

      const analyzedDurationSeconds = payload.analysis.media.durationSeconds;

      // Duration is only known after this server round-trip completes, so this can't be
      // a client pre-check the way validateFile()'s size/extension/mime checks are — it
      // has to be applied here, post-analysis, before the file is ever treated as ready.
      if (analyzedDurationSeconds !== null && analyzedDurationSeconds < minSourceDurationSeconds) {
        setFileState((current) => (current ? { ...current, errorKey: "videoTooShort" } : current));
        setProcessingState("failed");
        return;
      }

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

  // Best-effort — the preview video may not have finished loading metadata yet (e.g. the
  // user drags a handle before the browser has buffered enough to seek), in which case
  // this is a silent no-op rather than a thrown error; the text input / slider position
  // itself is authoritative regardless of whether the preview could follow along.
  function seekVideoTo(targetSeconds: number) {
    const video = videoRef.current;

    if (!video || !Number.isFinite(targetSeconds)) {
      return;
    }

    const clampedTarget = clamp(targetSeconds, 0, timelineMaxSeconds);
    video.currentTime = clampedTarget;
    setCurrentTime(clampedTarget);
  }

  function handleStartTimeInputChange(value: string) {
    setStartTimeInput(value);
    setRangeErrorKey(null);

    const parsed = parseTimestampToSeconds(value);
    if (parsed !== null) {
      seekVideoTo(parsed);
    }
  }

  function handleEndTimeInputChange(value: string) {
    setEndTimeInput(value);
    setRangeErrorKey(null);

    const parsed = parseTimestampToSeconds(value);
    if (parsed !== null) {
      seekVideoTo(parsed);
    }
  }

  // Converts a pointer's viewport X position into a clamped seconds value for the given
  // handle and writes it through the same text-input handlers manual typing uses — a
  // formatSecondsToTimestamp() round-trip always reparses cleanly, so this also drives
  // the live video seek for free (see handleStartTimeInputChange/handleEndTimeInputChange).
  // Handles are clamped against each other (never allowed to cross or touch) so an
  // out-of-range or inverted selection simply cannot be produced by dragging — the
  // "start >= end" case validateTrimRange guards against for manual text entry never
  // reaches the timeline at all.
  function updateHandleFromClientX(handle: "start" | "end", clientX: number) {
    const track = timelineTrackRef.current;

    if (!track || timelineMaxSeconds <= 0) {
      return;
    }

    const rect = track.getBoundingClientRect();

    if (rect.width <= 0) {
      return;
    }

    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const rawSeconds = Math.round(ratio * timelineMaxSeconds);

    if (handle === "start") {
      const maxAllowed = Math.max(0, timelineEndSeconds - timelineStepSeconds);
      handleStartTimeInputChange(formatSecondsToTimestamp(clamp(rawSeconds, 0, maxAllowed)));
    } else {
      const minAllowed = Math.min(timelineMaxSeconds, timelineStartSeconds + timelineStepSeconds);
      handleEndTimeInputChange(formatSecondsToTimestamp(clamp(rawSeconds, minAllowed, timelineMaxSeconds)));
    }
  }

  // Pointer Events (not separate mouse/touch listeners) cover mouse, touch, and pen with
  // one code path — this is what the previous two-overlaid-<input type="range"> attempt
  // was missing, and why dragging on touch/near-each-other handles felt broken. Pointer
  // capture is set on the handle itself in onPointerDown, so every subsequent move/up for
  // that pointerId keeps firing on this same element even once the finger/cursor leaves
  // it — no document-level listeners or "which handle is active" state needed, and each
  // handle can never intercept the other's drag.
  //
  // These take `handle` as a plain parameter (bound via an inline arrow at the JSX call
  // site) rather than being curried factories — a `(handle) => (event) => ...` shape here
  // trips react-hooks/refs's static analysis into flagging the ref access inside as if it
  // could run during render, since the outer factory call itself is evaluated at render
  // time even though the returned closure isn't.
  function handleTimelinePointerDown(handle: "start" | "end", event: PointerEvent<HTMLDivElement>) {
    if (processingState !== "ready") {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateHandleFromClientX(handle, event.clientX);
  }

  function handleTimelinePointerMove(handle: "start" | "end", event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    updateHandleFromClientX(handle, event.clientX);
  }

  function handleTimelinePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // role="slider" carries a keyboard contract of its own (WAI-ARIA slider pattern) — the
  // two native <input type="range"> elements this replaced gave arrow-key support for
  // free, so this custom implementation has to provide it explicitly to not regress a11y.
  function handleTimelineKeyDown(handle: "start" | "end", event: KeyboardEvent<HTMLDivElement>) {
    if (processingState !== "ready") {
      return;
    }

    const current = handle === "start" ? timelineStartSeconds : timelineEndSeconds;
    let next: number;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = current - timelineStepSeconds;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = current + timelineStepSeconds;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = timelineMaxSeconds;
        break;
      default:
        return;
    }

    event.preventDefault();

    if (handle === "start") {
      const maxAllowed = Math.max(0, timelineEndSeconds - timelineStepSeconds);
      handleStartTimeInputChange(formatSecondsToTimestamp(clamp(next, 0, maxAllowed)));
    } else {
      const minAllowed = Math.min(timelineMaxSeconds, timelineStartSeconds + timelineStepSeconds);
      handleEndTimeInputChange(formatSecondsToTimestamp(clamp(next, minAllowed, timelineMaxSeconds)));
    }
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
    if (!downloadUrl || isDownloading || isDownloadCoolingDown) {
      return;
    }

    setErrorKey(null);

    // Locked for a flat 3s from the moment of click, independent of how long the actual
    // fetch/blob/link-click flow below takes — isDownloading alone isn't enough to stop
    // rapid double-clicks on a fast connection, since a small file can finish (and
    // re-enable the button) well within the time it takes to click twice.
    setIsDownloadCoolingDown(true);

    if (downloadCooldownTimeoutRef.current !== null) {
      clearTimeout(downloadCooldownTimeoutRef.current);
    }

    downloadCooldownTimeoutRef.current = setTimeout(() => {
      downloadCooldownTimeoutRef.current = null;
      setIsDownloadCoolingDown(false);
    }, downloadClickCooldownMs);

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
              {/* The file input lives outside the dropzone's own conditional render so
                  "Change Video" (in the actions sidebar) can still trigger it via inputRef
                  once a file is loaded and the dropzone itself is hidden. */}
              <input
                ref={inputRef}
                aria-label={copy.chooseFile}
                className="upload-dropzone__input"
                type="file"
                accept={acceptedInputValue}
                disabled={isBlocked}
                onChange={(event) => setSelectedFiles(event.target.files)}
              />

              {!selectedFile ? (
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
              ) : null}

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

              {/* Rendered for every state once a valid file is loaded — including
                  "completed"/"failed"/"cancelled" — so the left column never unmounts
                  down to an empty void once a job finishes; only the dropzone (above)
                  is gated to "no file yet". The completed state additionally gets
                  .preset-workflow--locked (dimmed, pointer-events: none) so a stale
                  player/timeline can't be fiddled with post-download — "Escolher outro
                  vídeo" in the sidebar, outside this wrapper, is the only way out. */}
              {hasValidFile ? (
                <div
                  className={
                    processingState === "completed"
                      ? "preset-workflow preset-workflow--locked"
                      : "preset-workflow"
                  }
                  aria-disabled={processingState === "completed"}
                >
                  <h3>{copy.nextStepMessage}</h3>

                  {videoUrl ? (
                    <div className="video-trimmer-player">
                      <video
                        ref={videoRef}
                        className="video-trimmer-player__video"
                        controls
                        onLoadedMetadata={() => seekVideoTo(timelineStartSeconds)}
                        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                        playsInline
                        preload="metadata"
                        src={videoUrl}
                      />
                      <p className="video-trimmer-player__time" role="status">
                        {formatSecondsToTimestamp(currentTime)}
                        {durationSeconds !== null
                          ? ` / ${formatSecondsToTimestamp(durationSeconds)}`
                          : null}
                      </p>
                    </div>
                  ) : null}

                  {hasTimeline ? (
                    <div className="video-trimmer-timeline">
                      <div className="video-trimmer-timeline__track" ref={timelineTrackRef}>
                        <div
                          className="video-trimmer-timeline__range"
                          style={{
                            left: `${(timelineStartSeconds / timelineMaxSeconds) * 100}%`,
                            width: `${((timelineEndSeconds - timelineStartSeconds) / timelineMaxSeconds) * 100}%`,
                          }}
                        />
                        <div
                          aria-disabled={processingState !== "ready"}
                          aria-label={copy.startTimeLabel}
                          aria-valuemax={timelineMaxSeconds}
                          aria-valuemin={0}
                          aria-valuenow={timelineStartSeconds}
                          aria-valuetext={formatSecondsToTimestamp(timelineStartSeconds)}
                          className="video-trimmer-timeline__handle video-trimmer-timeline__handle--start"
                          onKeyDown={(event) => handleTimelineKeyDown("start", event)}
                          onPointerDown={(event) => handleTimelinePointerDown("start", event)}
                          onPointerMove={(event) => handleTimelinePointerMove("start", event)}
                          onPointerUp={handleTimelinePointerUp}
                          role="slider"
                          style={{ left: `${(timelineStartSeconds / timelineMaxSeconds) * 100}%` }}
                          tabIndex={processingState === "ready" ? 0 : -1}
                        />
                        <div
                          aria-disabled={processingState !== "ready"}
                          aria-label={copy.endTimeLabel}
                          aria-valuemax={timelineMaxSeconds}
                          aria-valuemin={0}
                          aria-valuenow={timelineEndSeconds}
                          aria-valuetext={formatSecondsToTimestamp(timelineEndSeconds)}
                          className="video-trimmer-timeline__handle video-trimmer-timeline__handle--end"
                          onKeyDown={(event) => handleTimelineKeyDown("end", event)}
                          onPointerDown={(event) => handleTimelinePointerDown("end", event)}
                          onPointerMove={(event) => handleTimelinePointerMove("end", event)}
                          onPointerUp={handleTimelinePointerUp}
                          role="slider"
                          style={{ left: `${(timelineEndSeconds / timelineMaxSeconds) * 100}%` }}
                          tabIndex={processingState === "ready" ? 0 : -1}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="video-trimmer-range">
                    <div className="video-trimmer-range__field">
                      <label htmlFor="video-trimmer-start-time">{copy.startTimeLabel}</label>
                      <input
                        disabled={processingState !== "ready"}
                        id="video-trimmer-start-time"
                        inputMode="numeric"
                        onChange={(event) => handleStartTimeInputChange(event.target.value)}
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
                        onChange={(event) => handleEndTimeInputChange(event.target.value)}
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
                  <div className="compression-status__warning video-trimmer-status__warning" role="alert">
                    <span className="video-trimmer-status__warning-icon" aria-hidden="true">
                      !
                    </span>
                    <p className="video-trimmer-status__warning-text">
                      {validationError ?? processingError}
                    </p>
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
                  <button className="button button--primary" type="button" onClick={() => void startTrim()}>
                    {copy.trimButton}
                  </button>
                ) : null}

                {hasValidFile && isProcessing ? (
                  <button className="button button--primary" type="button" onClick={() => void cancelJob()}>
                    {copy.cancelButton}
                  </button>
                ) : null}

                {hasValidFile && processingState === "completed" && downloadUrl ? (
                  <button
                    className="button button--primary"
                    disabled={isDownloading || isDownloadCoolingDown}
                    type="button"
                    onClick={() => void handleDownloadStarted()}
                  >
                    {copy.downloadButton}
                  </button>
                ) : null}

                {/* Change Video / Delete Video: the file-lifecycle actions that stay
                    visible for the entire time a file is loaded (valid or not), replacing
                    the dropzone's own "choose file" affordance now that the dropzone is
                    hidden once a file is selected. Disabled while a job is actually
                    running so a video can't be swapped or cleared out from under an
                    in-flight reservation without cancelling it first (see cancelJob()'s
                    DELETE /jobs/:id call, the one thing that actually releases it). */}
                {selectedFile ? (
                  <>
                    <button
                      className="button button--secondary"
                      disabled={isBlocked || isProcessing}
                      type="button"
                      onClick={() => {
                        // Scrolled up front: if the user cancels the native file dialog
                        // without picking anything, setSelectedFiles(null) clears
                        // fileState and the dropzone reappears at the top they're
                        // already scrolled to; if they do pick a file, they land there
                        // too, ready to see the new player/timeline from the top.
                        scrollToTop();
                        inputRef.current?.click();
                      }}
                    >
                      {copy.chooseAnotherFile}
                    </button>
                    <button
                      className="button button--secondary"
                      disabled={isProcessing}
                      type="button"
                      onClick={resetAll}
                    >
                      {copy.deleteButton}
                    </button>
                  </>
                ) : null}

                {isBlocked && gate.reason === "usage_limit_reached" && gate.plan === "free" ? (
                  <button className="button button--primary" onClick={gate.openUpgradeModal} type="button">
                    {dictionary.upgradeModal.upgradeButtonLabel}
                  </button>
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
