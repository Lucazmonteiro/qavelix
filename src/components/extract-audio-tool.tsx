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
} from "@/lib/upload-policy";
import { useEntitlementGate } from "@/lib/use-entitlement-gate";

type ValidationErrorKey = keyof Dictionary["tools"]["extractAudio"]["validation"];
type ProcessingState =
  | "idle"
  | "validating"
  | "uploading"
  | "analyzing"
  | "extracting"
  | "preparing"
  | "completed"
  | "failed";
type ExtractAudioErrorKey = keyof Dictionary["tools"]["extractAudio"]["errors"];
type ActiveOperation = "analysis" | "extraction" | null;

type FileState = {
  file: File;
  errorKey: ValidationErrorKey | null;
};

type ExtractedAudioResult = {
  fileName: string;
  size: number;
  url: string;
};

type ExtractAudioAnalysisResult =
  | "valid_audio"
  | "no_audio_stream"
  | "silent_audio"
  | "invalid_media"
  | "unsupported_format"
  | "file_too_small"
  | "file_too_large"
  | "analysis_failed";

const acceptedInputValue = [
  ...acceptedExtensions,
  ...acceptedMimeTypes,
].join(",");

function hasAcceptedExtension(fileName: string) {
  const lowerName = fileName.toLowerCase();
  return acceptedExtensions.some((extension) => lowerName.endsWith(extension));
}

// maxUploadBytes must be the caller's already-resolved, plan-aware ceiling — this
// function has no notion of plan itself (see the same convention in
// validateFileIdentity() on the server).
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

function createFallbackMp3FileName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim();

  return `${withoutExtension || "qavelix-audio"}.mp3`;
}

async function readApiError(response: Response): Promise<ExtractAudioErrorKey> {
  try {
    const payload = (await response.json()) as {
      error?: { code?: string };
    };

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
        return "unsupportedFormat";
      case "invalid_mime":
        return "unsupportedFormat";
      case "invalid_signature":
      case "invalid_size":
      case "truncated_upload":
        return "invalidMedia";
      case "no_audio":
        return "noAudio";
      case "silent_audio":
        return "silentAudio";
      case "ffprobe_unavailable":
      case "ffprobe_failed":
        return "ffprobeFailed";
      case "ffmpeg_failed":
        return "ffmpegFailed";
      case "processing_timeout":
        return "timeout";
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

function mapAnalysisResultToError(
  result: ExtractAudioAnalysisResult,
): ExtractAudioErrorKey | null {
  switch (result) {
    case "valid_audio":
      return null;
    case "no_audio_stream":
      return "noAudio";
    case "silent_audio":
      return "silentAudio";
    case "unsupported_format":
      return "unsupportedFormat";
    case "file_too_small":
      return "fileTooSmall";
    case "file_too_large":
      return "fileTooLarge";
    case "invalid_media":
      return "invalidMedia";
    case "analysis_failed":
      return "analysisFailed";
  }
}

async function readAnalysisResult(response: Response) {
  try {
    const payload = (await response.json()) as {
      result?: ExtractAudioAnalysisResult;
    };

    return payload.result ?? "analysis_failed";
  } catch {
    return "analysis_failed";
  }
}

export function ExtractAudioTool() {
  const { dictionary } = useLocaleState();
  const copy = dictionary.tools.extractAudio;
  const pathname = usePathname();
  const gate = useEntitlementGate("extract-audio");
  const isBlocked = gate.blocked;
  // Same resolution as CompressionPanel: MAX_UPLOAD_BYTES (250MB) is the safe default
  // until the entitlement gate resolves the actor's real plan, after which a confirmed
  // Pro actor's own limit (500MB) takes over.
  const resolvedMaxUploadBytes =
    gate.plan === "pro" && gate.proLimits
      ? gate.proLimits.maxUploadBytes
      : (gate.freeLimits?.maxUploadBytes ?? MAX_UPLOAD_BYTES);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const analysisControllerRef = useRef<AbortController | null>(null);
  const statusTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const downloadNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [fileState, setFileState] = useState<FileState | null>(null);
  const [processingState, setProcessingState] =
    useState<ProcessingState>("idle");
  const [result, setResult] = useState<ExtractedAudioResult | null>(null);
  const [isAnalysisApproved, setIsAnalysisApproved] = useState(false);
  const [activeOperation, setActiveOperation] = useState<ActiveOperation>(null);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [processingErrorKey, setProcessingErrorKey] =
    useState<ExtractAudioErrorKey | null>(null);

  const selectedFile = fileState?.file ?? null;
  const validationErrorKey = fileState?.errorKey ?? null;
  const validationError = validationErrorKey
    ? copy.validation[validationErrorKey].replace("{maxSize}", formatBytes(resolvedMaxUploadBytes))
    : null;
  const hasValidFile = Boolean(selectedFile && !validationError);
  const canExtract =
    hasValidFile &&
    isAnalysisApproved &&
    !processingErrorKey &&
    processingState === "idle" &&
    !isBlocked;
  const processingError = processingErrorKey
    ? copy.errors[processingErrorKey].replace("{maxSize}", formatBytes(resolvedMaxUploadBytes))
    : null;
  const isProcessing =
    processingState === "validating" ||
    processingState === "uploading" ||
    processingState === "analyzing" ||
    processingState === "extracting" ||
    processingState === "preparing";
  const isAudioBlocked =
    processingErrorKey === "noAudio" || processingErrorKey === "silentAudio";
  const showProcessingIndicator = isProcessing;
  const processingIndicatorLabel = (() => {
    if (processingState === "preparing") {
      return copy.preparingDownloadMessage;
    }

    if (activeOperation === "extraction") {
      return copy.extractionProgressMessage;
    }

    return copy.analysisProgressMessage;
  })();
  const statusLabel = (() => {
    if (isAudioBlocked) {
      return copy.statusNoAudio;
    }

    if (validationError || processingErrorKey === "invalidMedia") {
      return copy.statusInvalid;
    }

    if (processingState === "failed") {
      return copy.statusFailed;
    }

    if (processingState === "validating") {
      return copy.statusValidating;
    }

    if (processingState === "uploading") {
      return activeOperation === "extraction"
        ? copy.statusProcessing
        : copy.statusAnalyzing;
    }

    if (processingState === "analyzing") {
      return copy.statusAnalyzing;
    }

    if (processingState === "extracting") {
      return copy.statusProcessing;
    }

    if (processingState === "preparing") {
      return copy.statusPreparing;
    }

    if (processingState === "completed") {
      return copy.statusCompleted;
    }

    if (isAnalysisApproved) {
      return copy.statusValidAudio;
    }

    return selectedFile ? copy.statusReady : copy.statusWaiting;
  })();
  // uploadDescription now states both plans' fixed limits directly (never the viewer's
  // single resolved value) so it needs no interpolation — see .upload-limit-comparison
  // below for the dynamic, gate-sourced Free/Pro comparison.
  const uploadDescription = copy.uploadDescription;

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      analysisControllerRef.current?.abort();
      clearStatusTimers();
      clearDownloadNotice();

      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [result?.url]);

  useEffect(() => {
    if (!selectedFile || validationError) {
      return;
    }

    void analyzeSelectedFile(selectedFile);
    // File object identity changes only when the user selects or drops a new file.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile, validationError]);

  function clearResult() {
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }

    setResult(null);
  }

  function clearStatusTimers() {
    for (const timer of statusTimersRef.current) {
      clearTimeout(timer);
    }

    statusTimersRef.current = [];
  }

  function clearDownloadNotice() {
    if (downloadNoticeTimerRef.current) {
      clearTimeout(downloadNoticeTimerRef.current);
      downloadNoticeTimerRef.current = null;
    }

    setDownloadStarted(false);
  }

  function handleDownloadStarted() {
    clearDownloadNotice();
    setDownloadStarted(true);

    downloadNoticeTimerRef.current = setTimeout(() => {
      setDownloadStarted(false);
      downloadNoticeTimerRef.current = null;
    }, 4_000);
  }

  function scheduleProcessingStatusFlow(signal: AbortSignal) {
    clearStatusTimers();

    const analysisTimer = setTimeout(() => {
      if (!signal.aborted) {
        setProcessingState("analyzing");
      }
    }, 700);
    const extractionTimer = setTimeout(() => {
      if (!signal.aborted) {
        setProcessingState("extracting");
      }
    }, 1_600);

    statusTimersRef.current = [analysisTimer, extractionTimer];
  }

  function scheduleAnalysisStatusFlow(signal: AbortSignal) {
    clearStatusTimers();

    const analysisTimer = setTimeout(() => {
      if (!signal.aborted) {
        setProcessingState("analyzing");
      }
    }, 700);

    statusTimersRef.current = [analysisTimer];
  }

  function setSelectedFiles(files: FileList | null) {
    if (isBlocked) {
      return;
    }

    abortControllerRef.current?.abort();
    analysisControllerRef.current?.abort();
    abortControllerRef.current = null;
    analysisControllerRef.current = null;
    clearStatusTimers();
    clearResult();
    clearDownloadNotice();
    setIsAnalysisApproved(false);
    setActiveOperation(null);
    setProcessingState("idle");
    setProcessingErrorKey(null);

    if (!files || files.length === 0) {
      return;
    }

    if (files.length > 1) {
      const firstFile = files.item(0);
      if (!firstFile) {
        return;
      }

      setFileState({
        file: firstFile,
        errorKey: "multipleFiles",
      });
      return;
    }

    const file = files.item(0);
    if (!file) {
      return;
    }

    setFileState({
      file,
      errorKey: validateFile(file, resolvedMaxUploadBytes),
    });
  }

  function resetSelection() {
    abortControllerRef.current?.abort();
    analysisControllerRef.current?.abort();
    abortControllerRef.current = null;
    analysisControllerRef.current = null;
    clearStatusTimers();
    clearResult();
    clearDownloadNotice();
    setIsAnalysisApproved(false);
    setFileState(null);
    setActiveOperation(null);
    setProcessingState("idle");
    setProcessingErrorKey(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function cancelExtraction() {
    const wasAnalyzing = Boolean(analysisControllerRef.current);
    abortControllerRef.current?.abort();
    analysisControllerRef.current?.abort();
    abortControllerRef.current = null;
    analysisControllerRef.current = null;
    clearStatusTimers();

    if (wasAnalyzing) {
      setProcessingErrorKey("analysisCancelled");
      setActiveOperation(null);
      setProcessingState("failed");
      return;
    }

    setActiveOperation(null);
    setProcessingState(hasValidFile ? "idle" : "failed");
  }

  async function analyzeSelectedFile(file: File) {
    analysisControllerRef.current?.abort();
    const abortController = new AbortController();
    analysisControllerRef.current = abortController;
    setActiveOperation("analysis");
    setIsAnalysisApproved(false);
    setProcessingErrorKey(null);
    setProcessingState("uploading");
    scheduleAnalysisStatusFlow(abortController.signal);

    try {
      const response = await fetch("/api/extract-audio/analyze", {
        method: "POST",
        body: file,
        signal: abortController.signal,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "X-Qavelix-File-Name": encodeURIComponent(file.name),
          "X-Qavelix-File-Size": String(file.size),
          "X-Qavelix-File-Type": file.type || "application/octet-stream",
        },
      });

      analysisControllerRef.current = null;
      clearStatusTimers();

      const analysisResult = await readAnalysisResult(response);

      if (response.ok && analysisResult === "valid_audio") {
        setIsAnalysisApproved(true);
        setActiveOperation(null);
        setProcessingState("idle");
        return;
      }

      setProcessingErrorKey(mapAnalysisResultToError(analysisResult));
      setActiveOperation(null);
      setProcessingState("failed");
    } catch (error) {
      analysisControllerRef.current = null;
      clearStatusTimers();

      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setActiveOperation(null);
      setProcessingErrorKey("networkError");
      setProcessingState("failed");
    }
  }

  async function extractAudio() {
    if (!selectedFile || validationError || !isAnalysisApproved || isProcessing) {
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setActiveOperation("extraction");
    clearResult();
    setProcessingErrorKey(null);
    setProcessingState("uploading");
    scheduleProcessingStatusFlow(abortController.signal);

    try {
      const response = await fetch("/api/extract-audio", {
        method: "POST",
        body: selectedFile,
        signal: abortController.signal,
        headers: {
          "Content-Type": selectedFile.type || "application/octet-stream",
          "X-Qavelix-File-Name": encodeURIComponent(selectedFile.name),
          "X-Qavelix-File-Size": String(selectedFile.size),
          "X-Qavelix-File-Type": selectedFile.type || "application/octet-stream",
        },
      });

      abortControllerRef.current = null;
      clearStatusTimers();

      if (!response.ok) {
        const errorKey = await readApiError(response);

        if (errorKey === "accountRequired") {
          gate.reportDenial("account_required");
        } else if (errorKey === "usageLimitReached") {
          gate.reportDenial("usage_limit_reached");
        }

        setProcessingErrorKey(errorKey);
        setActiveOperation(null);
        setProcessingState("failed");
        return;
      }

      setProcessingState("preparing");
      const blob = await response.blob();

      if (blob.size <= 0) {
        setProcessingErrorKey("downloadUnavailable");
        setActiveOperation(null);
        setProcessingState("failed");
        return;
      }

      const fileName =
        getHeaderFileName(response) ?? createFallbackMp3FileName(selectedFile.name);
      const url = URL.createObjectURL(blob);

      setResult({
        fileName,
        size: blob.size,
        url,
      });
      setActiveOperation(null);
      setProcessingState("completed");
    } catch (error) {
      abortControllerRef.current = null;
      clearStatusTimers();

      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setActiveOperation(null);
      setProcessingErrorKey("networkError");
      setProcessingState("failed");
    }
  }

  return (
    <main className="page-shell" id="main-content">
      <section className="hero-section hero-section--tool extract-audio-page">
        <div
          className="hero-section__content hero-section__content--tool"
          aria-labelledby="extract-audio-title"
        >
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="sr-only" id="extract-audio-title">
            {copy.title}
          </h1>
          <p className="hero-section__description">{copy.subtitle}</p>
        </div>

        <div className="homepage-tool extract-audio-tool" aria-label={copy.title}>
          <section className="compression-panel" aria-label={copy.title}>
            <div className="compression-panel__main">
              <div
                className={[
                  "upload-dropzone",
                  "extract-audio-dropzone",
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
                  {"\u266B"}
                </span>
                <span className="upload-dropzone__title">{copy.uploadTitle}</span>
                <span className="upload-dropzone__description">
                  {uploadDescription}
                </span>
                <button
                  className="button button--primary"
                  disabled={isBlocked}
                  type="button"
                  onClick={() => inputRef.current?.click()}
                >
                  {copy.chooseFile}
                </button>
                <span className="extract-audio-dropzone__privacy">
                  {copy.privacyMessage}
                </span>
              </div>

              {isBlocked && !selectedFile ? (
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
            </div>

            <aside className="compression-status extract-audio-status" aria-live="polite">
              <div className="extract-audio-status__body">
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
                        <dt>
                          {processingState === "completed"
                            ? copy.originalFileName
                            : copy.fileName}
                        </dt>
                        <dd
                          className="extract-audio-status__filename"
                          title={selectedFile.name}
                        >
                          {selectedFile.name}
                        </dd>
                      </div>
                      <div>
                        <dt>
                          {processingState === "completed"
                            ? copy.originalFileSize
                            : copy.fileSize}
                        </dt>
                        <dd>{formatBytes(selectedFile.size)}</dd>
                      </div>
                      {result ? (
                        <>
                          <div>
                            <dt>{copy.generatedFileName}</dt>
                            <dd
                              className="extract-audio-status__filename"
                              title={result.fileName}
                            >
                              {result.fileName}
                            </dd>
                          </div>
                          <div>
                            <dt>{copy.audioFileSize}</dt>
                            <dd>{formatBytes(result.size)}</dd>
                          </div>
                        </>
                      ) : null}
                      {processingState !== "completed" ? (
                        <div>
                          <dt>{copy.outputFormat}</dt>
                          <dd>{copy.outputFormatValue}</dd>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </dl>

                {validationError || processingError ? (
                  <div className="extract-audio-status__warning" role="alert">
                    <span aria-hidden="true">!</span>
                    <p>{validationError ?? processingError}</p>
                  </div>
                ) : null}

                {showProcessingIndicator ? (
                  <div className="compression-status__validation" role="status">
                    <p>{processingIndicatorLabel}</p>
                    <span
                      aria-label={processingIndicatorLabel}
                      className="validation-loader"
                      role="progressbar"
                    />
                  </div>
                ) : null}

                {downloadStarted ? (
                  <p
                    className="compression-status__success"
                    role="status"
                    aria-live="polite"
                  >
                    {copy.downloadStartedMessage}
                  </p>
                ) : null}
              </div>

              <div className="compression-status__actions">
                {!selectedFile ? (
                  <button className="button button--primary" type="button" disabled>
                    {copy.extractButton}
                  </button>
                ) : null}

                {canExtract ? (
                  <>
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={extractAudio}
                    >
                      {copy.extractButton}
                    </button>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={resetSelection}
                    >
                      {copy.cancelButton}
                    </button>
                  </>
                ) : null}

                {hasValidFile && isProcessing ? (
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={cancelExtraction}
                  >
                    {copy.cancelButton}
                  </button>
                ) : null}

                {hasValidFile && processingState === "completed" && result ? (
                  <>
                    <a
                      className="button button--primary"
                      href={result.url}
                      download={result.fileName}
                      onClick={handleDownloadStarted}
                    >
                      {copy.downloadButton}
                    </a>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={resetSelection}
                    >
                      {copy.deleteButton}
                    </button>
                  </>
                ) : null}

                {hasValidFile && processingState === "failed" ? (
                  <>
                    <button
                      className="button button--primary"
                      disabled={isBlocked}
                      type="button"
                      onClick={() => inputRef.current?.click()}
                    >
                      {copy.chooseAnotherFile}
                    </button>
                    <button
                      className="button button--secondary"
                      disabled={isBlocked}
                      type="button"
                      onClick={resetSelection}
                    >
                      {copy.deleteButton}
                    </button>
                    {isBlocked && gate.reason === "usage_limit_reached" && gate.plan === "free" ? (
                      <button
                        className="button button--primary"
                        onClick={gate.openUpgradeModal}
                        type="button"
                      >
                        {dictionary.upgradeModal.upgradeButtonLabel}
                      </button>
                    ) : null}
                  </>
                ) : null}

                {selectedFile && validationError ? (
                  <>
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => inputRef.current?.click()}
                    >
                      {copy.chooseAnotherFile}
                    </button>
                    <button
                      className="button button--secondary"
                      type="button"
                      onClick={resetSelection}
                    >
                      {copy.cancelButton}
                    </button>
                  </>
                ) : null}
              </div>
            </aside>
          </section>
        </div>
      </section>

      <section className="extract-audio-info" aria-labelledby="extract-audio-info-title">
        <div className="section-heading">
          <p className="eyebrow">{copy.outputFormatValue}</p>
          <h2 id="extract-audio-info-title">{copy.infoTitle}</h2>
        </div>
        <ol className="extract-audio-info__list">
          {copy.infoItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section
        className="extract-audio-faq"
        id="faq"
        aria-labelledby="extract-audio-faq-title"
      >
        <div className="section-heading">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="extract-audio-faq-title">{copy.faqTitle}</h2>
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
