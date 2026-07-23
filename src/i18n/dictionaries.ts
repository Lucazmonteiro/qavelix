import type { Locale } from "@/i18n/locales";
import type { ContentPageSlug } from "@/config/content-pages";

type CardCopy = {
  title: string;
  description: string;
};

type ContentPageCopy = {
  label: string;
  metadata: {
    title: string;
    description: string;
  };
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{
    title: string;
    body: string[];
  }>;
};

type Dictionary = {
  metadata: {
    title: string;
    description: string;
  };
  navigation: {
    skipToContent: string;
    homeLabel: string;
    primaryNavigationLabel: string;
    product: string;
    upload: string;
    compression: string;
    design: string;
    accessibility: string;
    readiness: string;
    compressVideo: string;
    languageLabel: string;
    themeLabel: string;
    lightTheme: string;
    darkTheme: string;
    back: string;
    backToCompressor: string;
    backToTop: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    statusLabel: string;
    statusValue: string;
    previewLabel: string;
    previewTitle: string;
    previewDescription: string;
    previewItems: string[];
    principles: CardCopy[];
    stats: Array<{
      value: string;
      label: string;
    }>;
    sections: {
      designSystem: {
        eyebrow: string;
        title: string;
        description: string;
        items: CardCopy[];
      };
      accessibility: {
        eyebrow: string;
        title: string;
        description: string;
        items: string[];
      };
      readiness: {
        eyebrow: string;
        title: string;
        description: string;
        items: CardCopy[];
      };
    };
  };
  upload: {
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
  compression: {
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
    presetNames: {
      balanced: string;
      small: string;
      high: string;
    };
    presetDescriptions: {
      balanced: string;
      small: string;
      high: string;
    };
    presetUseCases: {
      balanced: string[];
      small: string[];
      high: string[];
    };
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
  footer: {
    description: string;
    phase: string;
    linksLabel: string;
  };
  pages: Record<ContentPageSlug, ContentPageCopy>;
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
   metadata: {
  title: "Free Online Video Compressor | QAVELIX",
  description:
    "Compress MP4, MOV, AVI, WebM, MPEG and M4V videos online. Reduce file size quickly and securely with simple compression presets.",
},
    navigation: {
      skipToContent: "Skip to content",
      homeLabel: "QAVELIX home",
      primaryNavigationLabel: "Primary navigation",
      product: "Product",
      upload: "Upload validation",
      compression: "Compression",
      design: "Design system",
      accessibility: "Accessibility",
      readiness: "Reliability",
      compressVideo: "Compress video",
      languageLabel: "Select language",
      themeLabel: "Theme",
      lightTheme: "Light",
      darkTheme: "Dark",
      back: "Back",
      backToCompressor: "Back to compressor",
      backToTop: "Back to top",
    },
    home: {
      eyebrow: "Video compressor",
      title: "QAVELIX Video Compressor",
      description:
        "Compress videos quickly and securely while keeping the quality you need.",
      primaryAction: "Upload a video",
      secondaryAction: "Review safeguards",
      statusLabel: "Active capabilities",
      statusValue:
        "Upload a video, choose a compression level, and download the optimized result when processing is complete.",
      previewLabel: "Workflow preview",
      previewTitle: "Simple video compression",
      previewDescription:
        "QAVELIX checks your selected video, shows useful file information, and guides you through compression.",
      previewItems: [
        "Upload a supported video",
        "Choose the right compression level",
        "Download the optimized file",
      ],
      principles: [
        {
          title: "Secure file handling",
          description:
            "Every file is validated before media analysis begins. Temporary files are removed automatically after inspection or processing.",
        },
        {
          title: "Clear error guidance",
          description:
            "Error messages clearly explain which validation rule failed, making it easy to correct the issue without guesswork.",
        },
        {
          title: "Reliable workflow",
          description:
            "The interface keeps upload, compression, download, and cleanup states easy to follow.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Maximum file size" },
        { value: "5", label: "Supported formats" },
        { value: "3", label: "Compression presets" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Product experience",
          title: "Clear controls from upload to download",
          description:
            "QAVELIX keeps the workflow focused so you always know what to do next.",
          items: [
            {
              title: "Readable file details",
              description:
                "After upload, QAVELIX shows file information such as size, duration, codec, resolution, audio, bitrate, frame rate, and container.",
            },
            {
              title: "Preset guidance",
              description:
                "Compression presets explain their purpose so you can choose between smaller files, balanced results, and higher quality.",
            },
            {
              title: "Temporary downloads",
              description:
                "Completed files are available for a limited time, and the interface shows when the result can be downloaded.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accessibility",
          title: "Designed for clear interaction",
          description:
            "The interface supports keyboard use, visible focus styles, localized labels, live status messages, and reduced-motion preferences.",
          items: [
            "The Skip to Content link takes users directly to the main content area.",
            "Upload and compression controls include clear labels and straightforward instructions.",
            "Validation and compression updates are announced discreetly for assistive technologies.",
            "Animations are automatically reduced for users who prefer less motion.",
          ],
        },
        readiness: {
          eyebrow: "Reliable workflow",
          title: "Built around temporary processing",
          description:
            "QAVELIX guides each video through upload, review, compression, download, and cleanup with clear status messages.",
          items: [
            {
              title: "Language support",
              description:
                "English, Brazilian Portuguese, and Spanish provide the same experience using natural language tailored to each locale.",
            },
            {
              title: "Supported uploads",
              description:
                "Unsupported, empty, or oversized files are rejected before compression begins.",
            },
            {
              title: "Automatic cleanup",
              description:
                "Temporary files are removed after processing, deletion, cancellation, or expiration.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Upload",
      title: "Review your video before compression",
      description:
        "Drop a video file to review its details before compression.",
      dropTitle: "Drop one video file here",
      dropDescription:
        "Files are processed temporarily and removed automatically after the availability period.",
      browseLabel: "Choose video",
      analyzingLabel: "Analyzing file",
      supportedLabel: "Supported formats",
      limitsLabel: "Maximum upload size",
      successTitle: "Validation passed",
      errorTitle: "Validation failed",
      fileLabel: "File",
      sizeLabel: "Size",
      typeLabel: "MIME type",
      durationLabel: "Duration",
      resolutionLabel: "Resolution",
      videoCodecLabel: "Video codec",
      audioCodecLabel: "Audio codec",
      bitrateLabel: "Bitrate",
      frameRateLabel: "Frame rate",
      formatLabel: "Container",
      unknownLabel: "Unknown",
      emptyState: "No file has been analyzed yet.",
      clientErrors: {
        unsupportedExtension: "This file extension is not supported.",
        unsupportedMime: "This MIME type is not supported.",
        tooLarge: "This file exceeds the 250 MB upload limit.",
        empty: "This file is empty.",
        multiple: "Upload one file at a time.",
        invalidSignature: "The file signature does not match the selected file type.",
        analysisUnavailable: "Media analysis is unavailable in this environment.",
        analysisFailed: "The upload could not be analyzed. Try again.",
      },
    },
    compression: {
      eyebrow: "Compression",
      title: "Video compression",
      description:
        "Compress one validated video at a time. Progress is shown while the file is prepared, and you can cancel while processing is active.",
      dropTitle: "Drop a video to get started",
      dropDescription:
        "Your video is processed securely and removed automatically after its availability period.",
      browseLabel: "Choose video",
      validationHelper:
        "Your file has been successfully validated. Review the file information below, choose the compression level that best fits your needs, then start compression.",
      validatingLabel: "Checking video",
      validationStages: {
        preparing: "Preparing file...",
        validating: "Validating media...",
        readingMetadata: "Reading media metadata...",
        complete: "Validation complete.",
      },
      validationSuccessLabel: "File Information",
      validationFailedLabel: "Video cannot be compressed",
      uploadLimitExceededLabel: "Upload limit exceeded",
      fileLabel: "File",
      sizeLabel: "Size",
      statusLabel: "Status",
      maximumAllowedLabel: "Maximum allowed",
      typeLabel: "MIME type",
      durationLabel: "Duration",
      resolutionLabel: "Resolution",
      videoCodecLabel: "Video codec",
      audioCodecLabel: "Audio codec",
      bitrateLabel: "Bitrate",
      frameRateLabel: "Frame rate",
      formatLabel: "Container",
      unknownLabel: "Unknown",
      presetLabel: "Compression preset",
      presetQuestionLabel: "How do you want to compress this video?",
      recommendedLabel: "Recommended",
      expectedReductionLabel: "Typical Result*",
      presetFootnote:
        "*Actual compression results vary depending on the video's codec, bitrate, duration, resolution and existing compression level.",
      useCasesLabel: "Ideal for",
      startLabel: "Start compression",
      cancelLabel: "Cancel",
      progressLabel: "Progress",
      waitingLabel: "Waiting for file",
      readyLabel: "Ready to compress",
      queuedLabel: "Waiting",
      startingLabel: "Starting",
      runningLabel: "Compressing",
      completedLabel: "Completed",
      optimizedLabel: "Optimized",
      ineffectiveLabel: "Compression ineffective",
      failedLabel: "Compression failed",
      cancelledLabel: "Cancelled",
      cancelledMessage: "Compression cancelled.",
      expiredLabel: "Expired",
      deletedLabel: "Deleted",
      originalSizeLabel: "Original size",
      compressedSizeLabel: "Compressed size",
      savedLabel: "Saved",
      increaseLabel: "Increase",
      increasePercentLabel: "Increase percentage",
      reductionLabel: "Reduction",
      originalBitrateLabel: "Original bitrate",
      finalBitrateLabel: "Final bitrate",
      originalResolutionLabel: "Original resolution",
      finalResolutionLabel: "Final resolution",
      originalCodecLabel: "Original codec",
      finalCodecLabel: "Final codec",
      fullHdOptimizationNotice:
        "This video was optimized to Full HD for faster processing and a smaller file.",
      expiresLabel: "Expires",
      downloadLabel: "Download",
      downloadAnywayLabel: "Download anyway",
      deleteLabel: "Delete file",
      ineffectiveWarning:
        "This video is already highly compressed. Using the selected preset, QAVELIX could not generate a file smaller than the original. Try one of the suggested presets below to prioritize a different compression strategy.",
      ineffectiveRecommendationLabel: "Recommended presets",
      successMessage: "✔ Compression completed successfully",
      successMessages: {
        excellent: "✔ Excellent space savings.",
        great: "✔ Great balance between quality and storage.",
        moderate: "✔ Moderate compression completed successfully.",
        light: "✔ Light compression completed.",
        noSavings: "✔ Compression completed, but no space savings were achieved.",
      },
      downloadStartedMessage: "✔ Download started successfully",
      reuseTipTitle: "Compare results",
      reuseTipDescription:
        "Choose another compression preset to generate a new version from this same uploaded video.",
      reuseTipSecondary: "There is no need to upload the file again.",
      presetNames: {
        balanced: "Balanced",
        small: "Smaller File",
        high: "High Quality",
      },
      presetDescriptions: {
        balanced:
          "Provides the best balance between visual quality and file size. Preserves the original resolution whenever possible while reducing bitrate efficiently.",
        small:
          "Prioritizes maximum file size reduction. Best choice when storage space or sharing speed is more important than visual quality.",
        high:
          "Preserves the highest possible visual quality. Uses lighter compression while keeping more image detail.",
      },
      presetUseCases: {
        balanced: ["YouTube", "Instagram", "TikTok", "Web Publishing"],
        small: ["WhatsApp", "Telegram", "Email", "Storage Saving"],
        high: ["Editing", "Archiving", "Backup", "Master Files"],
      },
      errors: {
        noFile: "Choose one supported video file before starting compression.",
        empty: "The selected file is empty.",
        tooLarge: "The selected file exceeds the 250 MB upload limit.",
        unsupportedExtension: "The selected file extension is not supported.",
        unsupportedMime: "The selected file MIME type is not supported.",
        invalidSignature: "The selected file signature does not match its declared type.",
        analysisUnavailable: "Media analysis is unavailable in this environment.",
        analysisFailed: "The video could not be analyzed. Try another supported file.",
        queueFull: "Many videos are being processed right now. Try again later.",
        uploadFailed: "Compression could not be started.",
        jobFailed: "Compression failed. Try another supported video file.",
        cancelFailed:
          "This action could not be completed. Delete this file and select the video again.",
        sourceUnavailable:
          "Compression cannot continue because the original file is no longer available in this session. Delete this file and select the video again.",
      },
      oversizedFileMessage:
        "The selected file is {fileSize}, which exceeds the maximum upload limit of {maxSize}. Please choose a smaller file to continue.",
    },
    footer: {
      description:
        "QAVELIX is a secure media processing platform built in stages with a strong foundation in validation, compression, security, and localization.",
      phase: "Secure and reliable media processing.",
      linksLabel: "Footer navigation",
    },
    pages: {
      about: {
        label: "About",
        metadata: {
          title: "About QAVELIX Video Compressor",
          description:
            "Learn how QAVELIX helps people compress videos with simple presets, temporary processing, and localized guidance.",
        },
        eyebrow: "About",
        title: "Simple, secure video compression",
        description:
          "QAVELIX helps you reduce video file size without turning compression into a technical project.",
        sections: [
          {
            title: "What QAVELIX does",
            body: [
              "QAVELIX lets you upload a supported video, review its file information, choose a compression preset, and download an optimized MP4 result.",
              "The service is designed for people who need smaller videos for sharing, publishing, storage, or everyday delivery without learning video encoding settings.",
            ],
          },
          {
            title: "Temporary processing",
            body: [
              "Uploaded files are handled as temporary processing files. Source files are removed after processing, cancellation, deletion, or expiration, and completed downloads are available only for a limited time.",
              "QAVELIX currently supports Portuguese, English, and Spanish, with the same compression workflow available in each language.",
            ],
          },
          {
            title: "Preset-based control",
            body: [
              "Smaller File focuses on the smallest output. Balanced aims for a practical mix of quality and size. High Quality applies lighter compression when preserving detail matters more.",
              "Compression results vary by source video. Some videos are already highly compressed, so QAVELIX explains when a preset cannot reduce the file further.",
            ],
          },
        ],
      },
      contact: {
        label: "Contact",
        metadata: {
          title: "Contact QAVELIX",
          description:
            "Contact QAVELIX for product support, privacy requests, security reports, and legal notices.",
        },
        eyebrow: "Contact",
        title: "Contact QAVELIX",
        description:
          "The email below is the official contact channel for support, privacy requests, security reports, legal notices, and accessibility feedback.",
        sections: [
          {
            title: "General contact",
            body: [
              "Email: {supportEmail}",
              "For support, privacy requests, security reports, legal notices, or accessibility feedback, contact us using the email above.",
              "For upload, compression, download, or accessibility issues, include the page URL, browser, device, and a short description of what happened. Do not send video files by email unless QAVELIX specifically requests them.",
            ],
          },
          {
            title: "Privacy, security, and legal notices",
            body: [
              "For privacy requests, describe the request and the email address where QAVELIX can reply.",
              "For security reports, include clear reproduction steps and avoid sharing unnecessary personal data. Legal notices use the same official contact email.",
            ],
          },
        ],
      },
      faq: {
        label: "FAQ",
        metadata: {
          title: "QAVELIX FAQ",
          description:
            "Find practical answers about QAVELIX video compression, supported formats, file limits, presets, temporary storage, and downloads.",
        },
        eyebrow: "FAQ",
        title: "Frequently asked questions",
        description:
          "Practical answers about uploading, compressing, downloading, and managing videos in QAVELIX.",
        sections: [
          {
            title: "What does QAVELIX do?",
            body: [
              "QAVELIX compresses supported video files. You upload a video, review its file information, choose a preset, start compression, and download the optimized result.",
            ],
          },
          {
            title: "Which video formats are accepted?",
            body: [
              "QAVELIX accepts MP4, M4V, MOV, WEBM, AVI, MPG, and MPEG files when the browser and server can verify them as supported video uploads.",
            ],
          },
          {
            title: "Is there a maximum file size?",
            body: [
              "Yes. The maximum upload size is 250 MB per video.",
            ],
          },
          {
            title: "How long are files kept?",
            body: [
              "A validated upload can be used to start compression for about 15 minutes. Completed downloads remain available for about 30 minutes unless you delete them sooner.",
              "Temporary source files are removed after processing, cancellation, deletion, or expiration.",
            ],
          },
          {
            title: "Does QAVELIX permanently store uploaded videos?",
            body: [
              "No permanent video library is provided. Videos are handled as temporary processing files and are removed through the cleanup workflow.",
            ],
          },
          {
            title: "What are the compression presets?",
            body: [
              "Smaller File prioritizes maximum size reduction and may reduce resolution. Balanced is designed for everyday sharing and publishing. High Quality uses lighter compression when preserving more detail matters.",
            ],
          },
          {
            title: "Why might compression save little additional space?",
            body: [
              "Some videos are already highly compressed. In those cases, a new compressed file may be similar in size or even larger, and QAVELIX will show guidance instead of pretending the result was useful.",
            ],
          },
          {
            title: "What happens if compression is cancelled?",
            body: [
              "The active processing stops, temporary files are cleaned up, and the download is unavailable. Select the video again if you want to start a new compression.",
            ],
          },
          {
            title: "Why can a download expire?",
            body: [
              "Downloads are temporary so completed files do not remain available indefinitely. If a download expires, upload the original video again and start a new compression.",
            ],
          },
          {
            title: "Can a video be compressed more than once?",
            body: [
              "After a successful result, you can choose another preset while the original source is still available in the session. If the source has been removed or expired, select the video again.",
            ],
          },
          {
            title: "Does QAVELIX change the video resolution?",
            body: [
              "The Smaller File preset may reduce resolution to create a much smaller output. Balanced and High Quality are designed to preserve the original resolution whenever the current compressor strategy allows it.",
            ],
          },
          {
            title: "Which languages are supported?",
            body: [
              "QAVELIX supports English, Brazilian Portuguese, and Spanish.",
            ],
          },
        ],
      },
      "privacy-policy": {
        label: "Privacy Policy",
        metadata: {
          title: "QAVELIX Privacy Policy",
          description:
            "Read how QAVELIX processes uploaded videos, file metadata, temporary files, logs, and browser preferences.",
        },
        eyebrow: "Privacy",
        title: "Privacy Policy",
        description:
          "This notice explains how QAVELIX handles information when you use the video compressor.",
        sections: [
          {
            title: "Last updated",
            body: [
              "July 22, 2026.",
            ],
          },
          {
            title: "Service operator and contact",
            body: [
              "QAVELIX is the service name for this video compression application. The operator is the person or organization that deploys and makes this instance available.",
              "Contact us at {supportEmail}.",
            ],
          },
          {
            title: "Information processed",
            body: [
              "QAVELIX processes the video you choose to upload, the file name, file size, declared file type, extension, and technical media information such as duration, codec, bitrate, resolution, frame rate, and container.",
              "Uploaded videos may contain personal data if the video itself, file name, audio, or visual content identifies a person.",
            ],
          },
          {
            title: "Temporary files and downloads",
            body: [
              "Uploaded files are used to analyze and compress the selected video. Validated uploads are available for a short time so compression can start, and completed compressed files are available for a limited download period.",
              "Source files and output files are removed after processing, cancellation, deletion, or expiration according to the application cleanup workflow.",
            ],
          },
          {
            title: "Logs and security data",
            body: [
              "The server may process request metadata such as IP address, user agent, requested route, request timing, and security event information to protect the service, troubleshoot errors, and prevent misuse.",
              "QAVELIX does not provide user accounts, payment processing, advertising profiles, or a permanent video library.",
            ],
          },
          {
            title: "Browser storage",
            body: [
              "QAVELIX stores the selected Light or Dark theme in localStorage. The language is represented in the URL path and is not stored by a QAVELIX cookie.",
            ],
          },
          {
            title: "Service providers",
            body: [
              "The application may run on the hosting provider configured by the operator. The final provider and region must be confirmed for the public environment.",
              "QAVELIX does not include analytics or advertising scripts in the current application code.",
            ],
          },
          {
            title: "Your requests",
            body: [
              "You may contact QAVELIX to ask about privacy, access, deletion, or correction requests related to information the service may process.",
              "Because files are temporary, QAVELIX may not be able to locate a video after it has expired, been deleted, or completed cleanup.",
            ],
          },
          {
            title: "Security and updates",
            body: [
              "QAVELIX uses validation, origin checks, temporary storage, and protected download links to reduce risk. No internet service can guarantee absolute security.",
              "This policy may be updated as the service, operator details, hosting configuration, or legal requirements change.",
            ],
          },
        ],
      },
      terms: {
        label: "Terms of Service",
        metadata: {
          title: "QAVELIX Terms of Service",
          description:
            "Read the QAVELIX Terms of Service for video uploads, compression, temporary processing, downloads, and permitted use.",
        },
        eyebrow: "Terms",
        title: "Terms of Service",
        description:
          "These terms govern use of the QAVELIX video compressor.",
        sections: [
          {
            title: "Last updated",
            body: [
              "July 22, 2026.",
            ],
          },
          {
            title: "Using the service",
            body: [
              "QAVELIX lets you upload supported videos, choose a compression preset, and download a temporary optimized output.",
              "By using QAVELIX, you confirm that you own the uploaded content or have permission to process it.",
            ],
          },
          {
            title: "Permitted and prohibited use",
            body: [
              "Use QAVELIX only for lawful video processing. Do not upload content that is illegal, harmful, abusive, infringing, or that you are not allowed to process.",
              "Do not attempt to bypass upload limits, security controls, origin checks, download protections, or temporary-file cleanup.",
            ],
          },
          {
            title: "Temporary processing and user responsibility",
            body: [
              "Uploaded files and compressed outputs are temporary. Keep your own original copy because QAVELIX is not a backup or storage service.",
              "Downloads may expire, and cancelled or deleted processing cannot be resumed without selecting the video again.",
            ],
          },
          {
            title: "Compression results",
            body: [
              "QAVELIX does not guarantee a specific file size, quality level, playback compatibility, or percentage reduction.",
              "Compression may reduce quality, change bitrate, and in some presets may reduce resolution. Some videos may not become smaller.",
            ],
          },
          {
            title: "Availability and changes",
            body: [
              "The service may be unavailable, interrupted, rate-limited, or changed. QAVELIX may restrict use that appears abusive or harmful to the service.",
              "You retain ownership of your content. QAVELIX receives only the permission needed to process the video you choose to upload and provide the requested output.",
            ],
          },
          {
            title: "Disclaimers and liability",
            body: [
              "QAVELIX is provided on an as-available basis without a promise that every file will compress successfully or remain downloadable for a specific period beyond the displayed availability window.",
              "To the extent permitted by applicable law, QAVELIX is not responsible for lost files, lost data, failed compression, expired downloads, or indirect damages resulting from use of the service.",
            ],
          },
          {
            title: "Contact and updates",
            body: [
              "Contact us at {supportEmail}.",
              "These terms may be updated when the service, operator information, or legal requirements change.",
            ],
          },
        ],
      },
      "cookie-policy": {
        label: "Cookies and Local Storage Policy",
        metadata: {
          title: "QAVELIX Cookies and Local Storage Policy",
          description:
            "Read how QAVELIX uses localStorage for theme preference and what browser storage is currently used.",
        },
        eyebrow: "Cookies",
        title: "Cookies and Local Storage Policy",
        description:
          "This notice explains the browser storage QAVELIX currently uses.",
        sections: [
          {
            title: "Last updated",
            body: [
              "July 22, 2026.",
            ],
          },
          {
            title: "Local storage",
            body: [
              "QAVELIX stores the selected Light or Dark theme in localStorage under the key qavelix-theme so the interface can preserve your preference across page reloads.",
              "The language is part of the URL path. QAVELIX does not store language selection in a cookie.",
            ],
          },
          {
            title: "Cookies and tracking",
            body: [
              "The current application code does not include analytics cookies, advertising cookies, payment tracking, account sessions, or third-party marketing tags.",
              "Because only necessary preference storage is currently used, QAVELIX does not show a cookie consent banner.",
            ],
          },
          {
            title: "Managing storage",
            body: [
              "You can clear QAVELIX localStorage through your browser settings or site data controls. Clearing storage may reset the theme to the default setting.",
              "If non-essential analytics, advertising, embedded media, or account features are added later, this notice should be updated and consent controls should be added where required.",
            ],
          },
        ],
      },
    },
  },
  "pt-BR": {
   metadata: {
  title: "Compressor de Vídeo Online | QAVELIX",
  description:
    "Comprima vídeos MP4, MOV, AVI, WebM, MPEG e M4V online. Reduza o tamanho do arquivo com rapidez, segurança e presets simples.",
},
    navigation: {
      skipToContent: "Pular para o conteúdo",
      homeLabel: "Página inicial do QAVELIX",
      primaryNavigationLabel: "Navegação principal",
      product: "Produto",
      upload: "Validação de upload",
      compression: "Compressão",
      design: "Sistema de design",
      accessibility: "Acessibilidade",
      readiness: "Confiabilidade",
      compressVideo: "Comprimir vídeo",
      languageLabel: "Selecionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Escuro",
      back: "Voltar",
      backToCompressor: "Voltar ao compressor",
      backToTop: "Voltar ao início",
    },
    home: {
      eyebrow: "Compressor de vídeo",
      title: "Compressor de vídeo QAVELIX",
      description:
        "Comprima vídeos com rapidez e segurança, mantendo a qualidade ideal.",
      primaryAction: "Enviar vídeo",
      secondaryAction: "Ver salvaguardas",
      statusLabel: "Recursos ativos",
      statusValue:
        "Envie um vídeo, escolha o nível de compressão e baixe o resultado otimizado quando o processamento terminar.",
      previewLabel: "Prévia do fluxo",
      previewTitle: "Compressão de vídeo simples",
      previewDescription:
        "O QAVELIX verifica o vídeo selecionado, mostra informações úteis do arquivo e orienta você durante a compressão.",
      previewItems: [
        "Envie um vídeo aceito",
        "Escolha o nível de compressão",
        "Baixe o arquivo otimizado",
      ],
      principles: [
        {
          title: "Entrada segura",
          description:
            "A validação acontece antes da análise de mídia, e os arquivos temporários são removidos depois da inspeção ou do processamento.",
        },
        {
          title: "Correção intuitiva",
          description:
            "As mensagens de erro indicam exatamente qual regra falhou, facilitando a correção sem tentativa e erro.",
        },
        {
          title: "Fluxo confiável",
          description:
            "A interface mantém upload, compressão, download e limpeza fáceis de acompanhar.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Tamanho máximo" },
        { value: "5", label: "Formatos aceitos" },
        { value: "3", label: "Presets de compressão" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Experiência do produto",
          title: "Controles claros do upload ao download",
          description:
            "O QAVELIX mantém o fluxo focado para você saber sempre qual é o próximo passo.",
          items: [
            {
              title: "Detalhes legíveis do arquivo",
              description:
                "Após o upload, o QAVELIX mostra informações como tamanho, duração, codec, resolução, áudio, taxa de bits, taxa de quadros e contêiner.",
            },
            {
              title: "Orientação por presets",
              description:
                "Os presets explicam seu objetivo para você escolher entre arquivo menor, resultado equilibrado e maior qualidade.",
            },
            {
              title: "Downloads temporários",
              description:
                "Arquivos concluídos ficam disponíveis por tempo limitado, e a interface mostra quando o resultado pode ser baixado.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Acessibilidade",
          title: "Criado para interação clara",
          description:
            "A interface oferece uso por teclado, foco visível, rótulos localizados, mensagens de status e respeito à preferência de movimento reduzido.",
          items: [
            'O link "Pular para o conteúdo" leva diretamente ao conteúdo principal.',
            "Os controles de upload e compressão possuem rótulos claros e instruções objetivas.",
            "Os status de validação e compressão utilizam atualizações discretas para tecnologias assistivas.",
            "As animações são reduzidas automaticamente para usuários que preferem menos movimento.",
          ],
        },
        readiness: {
          eyebrow: "Fluxo confiável",
          title: "Criado para processamento temporário",
          description:
            "O QAVELIX guia cada vídeo por upload, revisão, compressão, download e limpeza com mensagens de status claras.",
          items: [
            {
              title: "Suporte a idiomas",
              description:
                "Português do Brasil, inglês e espanhol europeu oferecem a mesma experiência com linguagem adaptada para cada idioma.",
            },
            {
              title: "Uploads aceitos",
              description:
                "Arquivos incompatíveis, vazios ou grandes demais são recusados antes do início da compressão.",
            },
            {
              title: "Limpeza automática",
              description:
                "Arquivos temporários são removidos após processamento, exclusão, cancelamento ou expiração.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Upload",
      title: "Revise seu vídeo antes da compressão",
      description:
        "Solte um vídeo para revisar os detalhes antes da compressão.",
      dropTitle: "Solte um vídeo aqui",
      dropDescription:
        "Os arquivos são processados temporariamente e removidos automaticamente após o período de disponibilidade.",
      browseLabel: "Escolher vídeo",
      analyzingLabel: "Analisando arquivo",
      supportedLabel: "Formatos aceitos",
      limitsLabel: "Tamanho máximo de upload",
      successTitle: "Validação aprovada",
      errorTitle: "A validação falhou",
      fileLabel: "Arquivo",
      sizeLabel: "Tamanho",
      typeLabel: "Tipo MIME",
      durationLabel: "Duração",
      resolutionLabel: "Resolução",
      videoCodecLabel: "Codec de vídeo",
      audioCodecLabel: "Codec de áudio",
      bitrateLabel: "Taxa de bits",
      frameRateLabel: "Taxa de quadros",
      formatLabel: "Contêiner",
      unknownLabel: "Desconhecido",
      emptyState: "Nenhum arquivo foi analisado ainda.",
      clientErrors: {
        unsupportedExtension: "Esta extensão de arquivo não é aceita.",
        unsupportedMime: "Este tipo MIME não é aceito.",
        tooLarge: "Este arquivo excede o limite de upload de 250 MB.",
        empty: "Este arquivo está vazio.",
        multiple: "Envie um arquivo por vez.",
        invalidSignature: "A assinatura do arquivo não corresponde ao tipo selecionado.",
        analysisUnavailable: "A análise de mídia não está disponível neste ambiente.",
        analysisFailed: "Não foi possível analisar o upload. Tente novamente.",
      },
    },
    compression: {
      eyebrow: "Compressão",
      title: "Compressão de vídeo",
      description:
        "Comprima um vídeo validado por vez. O progresso aparece enquanto o arquivo é preparado, e você pode cancelar enquanto o processamento estiver ativo.",
      dropTitle: "Solte um vídeo para começar",
      dropDescription:
        "Seu vídeo é processado com segurança e removido automaticamente após o período de disponibilidade.",
      browseLabel: "Escolher vídeo",
      validationHelper:
        "Seu arquivo foi validado com sucesso. Confira as informações do arquivo abaixo, escolha o nível de compressão ideal para sua necessidade e inicie a compressão.",
      validatingLabel: "Verificando vídeo",
      validationStages: {
        preparing: "Preparando arquivo...",
        validating: "Validando mídia...",
        readingMetadata: "Lendo metadados do vídeo...",
        complete: "Validação concluída.",
      },
      validationSuccessLabel: "Informações do arquivo",
      validationFailedLabel: "Este vídeo não pode ser comprimido",
      uploadLimitExceededLabel: "Limite de upload excedido",
      fileLabel: "Arquivo",
      sizeLabel: "Tamanho",
      statusLabel: "Status",
      maximumAllowedLabel: "Máximo permitido",
      typeLabel: "Tipo MIME",
      durationLabel: "Duração",
      resolutionLabel: "Resolução",
      videoCodecLabel: "Codec de vídeo",
      audioCodecLabel: "Codec de áudio",
      bitrateLabel: "Taxa de bits",
      frameRateLabel: "Taxa de quadros",
      formatLabel: "Contêiner",
      unknownLabel: "Desconhecido",
      presetLabel: "Predefinição de compressão",
      presetQuestionLabel: "Como você deseja comprimir este vídeo?",
      recommendedLabel: "Recomendado",
      expectedReductionLabel: "Resultado típico*",
      presetFootnote:
        "*Os resultados reais de compressão variam conforme codec, taxa de bits, duração, resolução e nível de compressão já existente no vídeo.",
      useCasesLabel: "Ideal para",
      startLabel: "Iniciar compressão",
      cancelLabel: "Cancelar",
      progressLabel: "Progresso",
      waitingLabel: "Aguardando arquivo",
      readyLabel: "Pronto para comprimir",
      queuedLabel: "Aguardando",
      startingLabel: "Iniciando",
      runningLabel: "Comprimindo",
      completedLabel: "Concluído",
      optimizedLabel: "Otimizado",
      ineffectiveLabel: "Compressão ineficaz",
      failedLabel: "Falha na compressão",
      cancelledLabel: "Cancelado",
      cancelledMessage: "Compressão cancelada.",
      expiredLabel: "Expirado",
      deletedLabel: "Excluído",
      originalSizeLabel: "Tamanho original",
      compressedSizeLabel: "Tamanho comprimido",
      savedLabel: "Economia",
      increaseLabel: "Aumento",
      increasePercentLabel: "Percentual de aumento",
      reductionLabel: "Redução",
      originalBitrateLabel: "Taxa de bits original",
      finalBitrateLabel: "Taxa de bits final",
      originalResolutionLabel: "Resolução original",
      finalResolutionLabel: "Resolução final",
      originalCodecLabel: "Codec original",
      finalCodecLabel: "Codec final",
      fullHdOptimizationNotice:
        "Este vídeo foi otimizado em Full HD para processar mais rápido e gerar um arquivo menor.",
      expiresLabel: "Expira em",
      downloadLabel: "Baixar",
      downloadAnywayLabel: "Baixar mesmo assim",
      deleteLabel: "Excluir arquivo",
      ineffectiveWarning:
        "Este vídeo já está altamente comprimido. Com o preset selecionado, o QAVELIX não conseguiu gerar um arquivo menor que o original. Experimente um dos presets sugeridos abaixo para priorizar uma estratégia de compressão diferente.",
      ineffectiveRecommendationLabel: "Presets recomendados",
      successMessage: "✔ Compressão concluída com sucesso",
      successMessages: {
        excellent: "✔ Excelente economia de espaço.",
        great: "✔ Ótimo equilíbrio entre qualidade e armazenamento.",
        moderate: "✔ Compressão moderada concluída com sucesso.",
        light: "✔ Compressão leve concluída.",
        noSavings: "✔ Compressão concluída, mas não houve economia de espaço.",
      },
      downloadStartedMessage: "✔ Download iniciado com sucesso",
      reuseTipTitle: "Compare os resultados",
      reuseTipDescription:
        "Escolha outro preset de compressão para gerar uma nova versão usando este mesmo vídeo.",
      reuseTipSecondary: "Não é necessário enviar o arquivo novamente.",
      presetNames: {
        balanced: "Equilibrada",
        small: "Arquivo menor",
        high: "Alta qualidade",
      },
      presetDescriptions: {
        balanced:
          "Oferece o melhor equilíbrio entre qualidade visual e tamanho do arquivo. Preserva a resolução original sempre que possível enquanto reduz a taxa de bits com eficiência.",
        small:
          "Prioriza a máxima redução do tamanho do arquivo. É a melhor escolha quando espaço de armazenamento ou velocidade de compartilhamento são mais importantes que qualidade visual.",
        high:
          "Preserva a maior qualidade visual possível. Usa compressão mais leve enquanto mantém mais detalhes da imagem.",
      },
      presetUseCases: {
        balanced: ["YouTube", "Instagram", "TikTok", "Publicação web"],
        small: ["WhatsApp", "Telegram", "E-mail", "Economia de armazenamento"],
        high: ["Edição", "Arquivamento", "Backup", "Arquivos master"],
      },
      errors: {
        noFile: "Escolha um vídeo aceito antes de iniciar a compressão.",
        empty: "O arquivo selecionado está vazio.",
        tooLarge: "O arquivo selecionado excede o limite de upload de 250 MB.",
        unsupportedExtension: "A extensão do arquivo selecionado não é aceita.",
        unsupportedMime: "O tipo MIME do arquivo selecionado não é aceito.",
        invalidSignature:
          "A assinatura do arquivo selecionado não corresponde ao tipo declarado.",
        analysisUnavailable: "A análise de mídia não está disponível neste ambiente.",
        analysisFailed: "Não foi possível analisar o vídeo. Tente outro arquivo aceito.",
        queueFull: "Muitos vídeos estão sendo processados agora. Tente novamente mais tarde.",
        uploadFailed: "Não foi possível iniciar a compressão.",
        jobFailed: "A compressão falhou. Tente outro vídeo aceito.",
        cancelFailed:
          "Não foi possível concluir esta ação. Exclua este arquivo e selecione o vídeo novamente.",
        sourceUnavailable:
          "Não foi possível continuar porque o arquivo original não está mais disponível nesta sessão. Exclua este arquivo e selecione o vídeo novamente.",
      },
      oversizedFileMessage:
        "O arquivo selecionado possui {fileSize} e excede o limite máximo de upload de {maxSize}. Escolha um arquivo menor para continuar.",
    },
    footer: {
      description:
        "O QAVELIX é uma plataforma segura para processamento de mídia, desenvolvida em etapas com foco em validação, compressão, segurança e localização.",
      phase: "Processamento de mídia com segurança e desempenho.",
      linksLabel: "Navegação do rodapé",
    },
    pages: {
      about: {
        label: "Sobre",
        metadata: {
          title: "Sobre o Compressor de Vídeo QAVELIX",
          description:
            "Conheça como o QAVELIX ajuda a comprimir vídeos com presets simples, processamento temporário e orientação localizada.",
        },
        eyebrow: "Sobre",
        title: "Comprima vídeos de forma simples e segura",
        description:
          "O QAVELIX ajuda você a reduzir o tamanho de vídeos sem transformar compressão em uma tarefa técnica.",
        sections: [
          {
            title: "O que o QAVELIX faz",
            body: [
              "O QAVELIX permite enviar um vídeo aceito, revisar as informações do arquivo, escolher um preset de compressão e baixar um resultado MP4 otimizado.",
              "O serviço foi pensado para quem precisa de vídeos menores para compartilhar, publicar, armazenar ou enviar no dia a dia sem lidar com configurações avançadas.",
            ],
          },
          {
            title: "Processamento temporário",
            body: [
              "Os arquivos enviados são tratados como arquivos temporários de processamento. Os originais são removidos após processamento, cancelamento, exclusão ou expiração, e os downloads concluídos ficam disponíveis por tempo limitado.",
              "O QAVELIX oferece suporte a português, inglês e espanhol, com o mesmo fluxo de compressão em todos os idiomas.",
            ],
          },
          {
            title: "Controle por presets",
            body: [
              "Arquivo menor prioriza a menor saída possível. Equilibrada busca uma combinação prática entre qualidade e tamanho. Alta qualidade aplica compressão mais leve quando preservar detalhes é mais importante.",
              "Os resultados variam conforme o vídeo original. Alguns vídeos já são muito comprimidos, e o QAVELIX informa quando um preset não consegue reduzir o arquivo.",
            ],
          },
        ],
      },
      contact: {
        label: "Contato",
        metadata: {
          title: "Contato QAVELIX",
          description:
            "Entre em contato com o QAVELIX para suporte, privacidade, relatos de segurança e avisos legais.",
        },
        eyebrow: "Contato",
        title: "Contato QAVELIX",
        description:
          "O email abaixo é o canal oficial de contato para suporte, solicitações de privacidade, avisos de segurança, questões jurídicas e acessibilidade.",
        sections: [
          {
            title: "Contato geral",
            body: [
              "Email: {supportEmail}",
              "Para suporte, solicitações de privacidade, avisos de segurança, questões jurídicas ou acessibilidade, entre em contato pelo email acima.",
              "Para problemas de upload, compressão, download ou acessibilidade, inclua a URL da página, navegador, dispositivo e uma breve descrição do ocorrido. Não envie vídeos por email, a menos que o QAVELIX solicite especificamente.",
            ],
          },
          {
            title: "Privacidade, segurança e avisos legais",
            body: [
              "Para solicitações de privacidade, descreva o pedido e o email em que o QAVELIX pode responder.",
              "Para relatos de segurança, inclua passos claros de reprodução e evite compartilhar dados pessoais desnecessários. Avisos legais usam o mesmo email oficial de contato.",
            ],
          },
        ],
      },
      faq: {
        label: "FAQ",
        metadata: {
          title: "FAQ do QAVELIX",
          description:
            "Veja respostas práticas sobre compressão de vídeo, formatos aceitos, limite de arquivo, presets, armazenamento temporário e downloads.",
        },
        eyebrow: "FAQ",
        title: "Perguntas frequentes",
        description:
          "Respostas práticas sobre envio, compressão, download e gerenciamento de vídeos no QAVELIX.",
        sections: [
          {
            title: "O que o QAVELIX faz?",
            body: [
              "O QAVELIX comprime arquivos de vídeo aceitos. Você envia um vídeo, confere as informações do arquivo, escolhe um preset, inicia a compressão e baixa o resultado otimizado.",
            ],
          },
          {
            title: "Quais formatos de vídeo são aceitos?",
            body: [
              "O QAVELIX aceita arquivos MP4, M4V, MOV, WEBM, AVI, MPG e MPEG quando o navegador e o servidor conseguem verificá-los como vídeos aceitos.",
            ],
          },
          {
            title: "Existe tamanho máximo de arquivo?",
            body: [
              "Sim. O tamanho máximo de upload é 250 MB por vídeo.",
            ],
          },
          {
            title: "Por quanto tempo os arquivos ficam disponíveis?",
            body: [
              "Um upload validado pode ser usado para iniciar a compressão por cerca de 15 minutos. Downloads concluídos ficam disponíveis por cerca de 30 minutos, a menos que você os exclua antes.",
              "Arquivos originais temporários são removidos após processamento, cancelamento, exclusão ou expiração.",
            ],
          },
          {
            title: "O QAVELIX armazena vídeos de forma permanente?",
            body: [
              "Não há biblioteca permanente de vídeos. Os arquivos são tratados como temporários e removidos pelo fluxo de limpeza.",
            ],
          },
          {
            title: "Quais são os presets de compressão?",
            body: [
              "Arquivo menor prioriza a maior redução de tamanho e pode reduzir a resolução. Equilibrada é indicada para compartilhamento e publicação no dia a dia. Alta qualidade usa compressão mais leve para preservar mais detalhes.",
            ],
          },
          {
            title: "Por que a compressão pode economizar pouco espaço?",
            body: [
              "Alguns vídeos já são muito comprimidos. Nesses casos, um novo arquivo pode ficar parecido em tamanho ou até maior, e o QAVELIX mostra uma orientação em vez de tratar o resultado como útil.",
            ],
          },
          {
            title: "O que acontece se a compressão for cancelada?",
            body: [
              "O processamento ativo é interrompido, os arquivos temporários são limpos e o download fica indisponível. Se quiser iniciar uma nova compressão, selecione o vídeo novamente.",
            ],
          },
          {
            title: "Por que um download pode expirar?",
            body: [
              "Os downloads são temporários para que arquivos concluídos não fiquem disponíveis indefinidamente. Se um download expirar, envie o vídeo original novamente e inicie outra compressão.",
            ],
          },
          {
            title: "Posso comprimir o mesmo vídeo mais de uma vez?",
            body: [
              "Depois de um resultado bem-sucedido, você pode escolher outro preset enquanto o arquivo original ainda estiver disponível na sessão. Se a origem tiver sido removida ou expirada, selecione o vídeo novamente.",
            ],
          },
          {
            title: "O QAVELIX altera a resolução do vídeo?",
            body: [
              "O preset Arquivo menor pode reduzir a resolução para gerar uma saída muito menor. Equilibrada e Alta qualidade foram pensados para preservar a resolução original sempre que a estratégia atual de compressão permitir.",
            ],
          },
          {
            title: "Quais idiomas são aceitos?",
            body: [
              "O QAVELIX oferece suporte a português do Brasil, inglês e espanhol.",
            ],
          },
        ],
      },
      "privacy-policy": {
        label: "Política de Privacidade",
        metadata: {
          title: "Política de Privacidade do QAVELIX",
          description:
            "Entenda como o QAVELIX processa vídeos enviados, metadados técnicos, arquivos temporários, logs e preferências do navegador.",
        },
        eyebrow: "Privacidade",
        title: "Política de Privacidade",
        description:
          "Este aviso explica como o QAVELIX trata informações quando você usa o compressor de vídeo.",
        sections: [
          {
            title: "Última atualização",
            body: [
              "22 de julho de 2026.",
            ],
          },
          {
            title: "Operador do serviço e contato",
            body: [
              "QAVELIX é o nome do serviço deste aplicativo de compressão de vídeo. O operador é a pessoa ou organização que implanta e disponibiliza esta instância.",
              "Entre em contato pelo email {supportEmail}.",
            ],
          },
          {
            title: "Informações processadas",
            body: [
              "O QAVELIX processa o vídeo que você escolhe enviar, nome do arquivo, tamanho, tipo declarado, extensão e informações técnicas de mídia, como duração, codec, taxa de bits, resolução, taxa de quadros e contêiner.",
              "Vídeos enviados podem conter dados pessoais se o conteúdo visual, áudio ou nome do arquivo identificar uma pessoa.",
            ],
          },
          {
            title: "Arquivos temporários e downloads",
            body: [
              "Arquivos enviados são usados para analisar e comprimir o vídeo selecionado. Uploads validados ficam disponíveis por pouco tempo para iniciar a compressão, e arquivos comprimidos ficam disponíveis por um período limitado de download.",
              "Arquivos de origem e saída são removidos após processamento, cancelamento, exclusão ou expiração conforme o fluxo de limpeza do aplicativo.",
            ],
          },
          {
            title: "Logs e dados de segurança",
            body: [
              "O servidor pode processar metadados de requisição, como endereço IP, agente do usuário, rota acessada, horários e eventos de segurança para proteger o serviço, investigar erros e evitar abuso.",
              "O QAVELIX não oferece contas de usuário, processamento de pagamentos, perfis de publicidade nem biblioteca permanente de vídeos.",
            ],
          },
          {
            title: "Armazenamento no navegador",
            body: [
              "O QAVELIX armazena o tema Claro ou Escuro selecionado no localStorage. O idioma aparece no caminho da URL e não é armazenado por cookie do QAVELIX.",
            ],
          },
          {
            title: "Provedores de serviço",
            body: [
              "O aplicativo pode ser executado no provedor de hospedagem configurado pelo operador. O provedor e a região finais precisam ser confirmados para o ambiente público.",
              "O código atual do QAVELIX não inclui scripts de analytics ou publicidade.",
            ],
          },
          {
            title: "Suas solicitações",
            body: [
              "Você pode entrar em contato com o QAVELIX para tratar de privacidade, acesso, exclusão ou correção de informações que o serviço possa processar.",
              "Como os arquivos são temporários, talvez o QAVELIX não consiga localizar um vídeo depois de expirado, excluído ou removido pelo fluxo de limpeza.",
            ],
          },
          {
            title: "Segurança e atualizações",
            body: [
              "O QAVELIX usa validação, verificações de origem, armazenamento temporário e links de download protegidos para reduzir riscos. Nenhum serviço na internet pode garantir segurança absoluta.",
              "Esta política pode ser atualizada conforme o serviço, dados do operador, configuração de hospedagem ou requisitos legais mudem.",
            ],
          },
        ],
      },
      terms: {
        label: "Termos de Serviço",
        metadata: {
          title: "Termos de Serviço do QAVELIX",
          description:
            "Leia os Termos de Serviço do QAVELIX para uploads de vídeo, compressão, processamento temporário, downloads e uso permitido.",
        },
        eyebrow: "Termos",
        title: "Termos de Serviço",
        description:
          "Estes termos regem o uso do compressor de vídeo QAVELIX.",
        sections: [
          {
            title: "Última atualização",
            body: [
              "22 de julho de 2026.",
            ],
          },
          {
            title: "Uso do serviço",
            body: [
              "O QAVELIX permite enviar vídeos aceitos, escolher um preset de compressão e baixar uma saída otimizada temporária.",
              "Ao usar o QAVELIX, você confirma que é titular do conteúdo enviado ou tem permissão para processá-lo.",
            ],
          },
          {
            title: "Uso permitido e proibido",
            body: [
              "Use o QAVELIX apenas para processamento lícito de vídeos. Não envie conteúdo ilegal, prejudicial, abusivo, infrator ou que você não tenha autorização para processar.",
              "Não tente contornar limites de upload, controles de segurança, verificações de origem, proteções de download ou limpeza de arquivos temporários.",
            ],
          },
          {
            title: "Processamento temporário e responsabilidade do usuário",
            body: [
              "Arquivos enviados e saídas comprimidas são temporários. Mantenha sua própria cópia original, pois o QAVELIX não é serviço de backup ou armazenamento.",
              "Downloads podem expirar, e processamentos cancelados ou excluídos não podem ser retomados sem selecionar o vídeo novamente.",
            ],
          },
          {
            title: "Resultados de compressão",
            body: [
              "O QAVELIX não garante tamanho específico, nível de qualidade, compatibilidade de reprodução ou percentual de redução.",
              "A compressão pode reduzir qualidade, alterar taxa de bits e, em alguns presets, reduzir resolução. Alguns vídeos podem não ficar menores.",
            ],
          },
          {
            title: "Disponibilidade e alterações",
            body: [
              "O serviço pode ficar indisponível, ser interrompido, limitado ou alterado. O QAVELIX pode restringir usos que pareçam abusivos ou prejudiciais ao serviço.",
              "Você mantém a titularidade do seu conteúdo. O QAVELIX recebe apenas a permissão necessária para processar o vídeo escolhido e fornecer a saída solicitada.",
            ],
          },
          {
            title: "Isenções e responsabilidade",
            body: [
              "O QAVELIX é fornecido conforme disponível, sem promessa de que todo arquivo será comprimido com sucesso ou ficará disponível para download além da janela exibida.",
              "Na medida permitida pela lei aplicável, o QAVELIX não se responsabiliza por arquivos perdidos, dados perdidos, falha de compressão, downloads expirados ou danos indiretos decorrentes do uso do serviço.",
            ],
          },
          {
            title: "Contato e atualizações",
            body: [
              "Entre em contato pelo email {supportEmail}.",
              "Estes termos podem ser atualizados quando o serviço, dados do operador ou requisitos legais mudarem.",
            ],
          },
        ],
      },
      "cookie-policy": {
        label: "Política de Cookies e Armazenamento Local",
        metadata: {
          title: "Política de Cookies e Armazenamento Local do QAVELIX",
          description:
            "Entenda como o QAVELIX usa localStorage para preferência de tema e quais dados de navegador são usados atualmente.",
        },
        eyebrow: "Cookies",
        title: "Política de Cookies e Armazenamento Local",
        description:
          "Este aviso explica o armazenamento de navegador que o QAVELIX usa atualmente.",
        sections: [
          {
            title: "Última atualização",
            body: [
              "22 de julho de 2026.",
            ],
          },
          {
            title: "Armazenamento local",
            body: [
              "O QAVELIX armazena o tema Claro ou Escuro selecionado no localStorage com a chave qavelix-theme para preservar sua preferência entre recarregamentos de página.",
              "O idioma faz parte do caminho da URL. O QAVELIX não armazena a seleção de idioma em cookie.",
            ],
          },
          {
            title: "Cookies e rastreamento",
            body: [
              "O código atual do aplicativo não inclui cookies de analytics, cookies de publicidade, rastreamento de pagamentos, sessões de conta ou tags de marketing de terceiros.",
              "Como apenas armazenamento necessário de preferência é usado atualmente, o QAVELIX não exibe banner de consentimento de cookies.",
            ],
          },
          {
            title: "Como gerenciar o armazenamento",
            body: [
              "Você pode limpar o localStorage do QAVELIX nas configurações do navegador ou nos controles de dados do site. Ao limpar esse armazenamento, o tema pode voltar ao padrão.",
              "Se recursos não essenciais, como analytics, publicidade, mídia incorporada ou contas, forem adicionados depois, este aviso deverá ser atualizado e controles de consentimento deverão ser adicionados quando exigidos.",
            ],
          },
        ],
      },
    },
  },
  es: {
    metadata: {
  title: "Compresor de Video Online | QAVELIX",
  description:
    "Comprime videos MP4, MOV, AVI, WebM, MPEG y M4V online. Reduce el tamaño del archivo de forma rápida, segura y con ajustes simples.",
},
    navigation: {
      skipToContent: "Saltar al contenido",
      homeLabel: "Inicio de QAVELIX",
      primaryNavigationLabel: "Navegación principal",
      product: "Producto",
      upload: "Validación de carga",
      compression: "Compresión",
      design: "Sistema de diseño",
      accessibility: "Accesibilidad",
      readiness: "Fiabilidad",
      compressVideo: "Comprimir video",
      languageLabel: "Seleccionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Oscuro",
      back: "Volver",
      backToCompressor: "Volver al compresor",
      backToTop: "Volver al inicio",
    },
    home: {
      eyebrow: "Compresor de vídeo",
      title: "Compresor de vídeo QAVELIX",
      description:
        "Comprime videos de forma rápida y segura conservando la calidad que necesitas.",
      primaryAction: "Subir vídeo",
      secondaryAction: "Revisar medidas",
      statusLabel: "Funciones activas",
      statusValue:
        "Sube un video, elige el nivel de compresión y descarga el resultado optimizado cuando termine el procesamiento.",
      previewLabel: "Vista previa del flujo",
      previewTitle: "Compresión de video sencilla",
      previewDescription:
        "QAVELIX revisa el video seleccionado, muestra información útil del archivo y te guía durante la compresión.",
      previewItems: [
        "Sube un video admitido",
        "Elige el nivel de compresión",
        "Descarga el archivo optimizado",
      ],
      principles: [
        {
          title: "Gestión segura de archivos",
          description:
            "Cada archivo se valida antes de comenzar el análisis multimedia. Los archivos temporales se eliminan automáticamente después de la inspección o el procesamiento.",
        },
        {
          title: "Corrección guiada",
          description:
            "Los mensajes de error indican claramente qué regla ha fallado para que puedas corregir el problema sin tener que adivinar.",
        },
        {
          title: "Flujo fiable",
          description:
            "La interfaz mantiene la carga, compresión, descarga y limpieza fáciles de seguir.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Tamaño máximo" },
        { value: "5", label: "Formatos compatibles" },
        { value: "3", label: "Ajustes de compresión" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Experiencia de producto",
          title: "Controles claros desde la carga hasta la descarga",
          description:
            "QAVELIX mantiene el flujo centrado para que siempre sepas cuál es el siguiente paso.",
          items: [
            {
              title: "Detalles legibles del archivo",
              description:
                "Después de la carga, QAVELIX muestra información como tamaño, duración, códec, resolución, audio, tasa de bits, frecuencia de fotogramas y contenedor.",
            },
            {
              title: "Orientación por ajustes",
              description:
                "Los ajustes explican su propósito para que puedas elegir entre archivo menor, resultado equilibrado y mayor calidad.",
            },
            {
              title: "Descargas temporales",
              description:
                "Los archivos completados están disponibles durante un tiempo limitado, y la interfaz muestra cuándo puede descargarse el resultado.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accesibilidad",
          title: "Diseñado para una interacción clara",
          description:
            "La interfaz admite uso con teclado, foco visible, etiquetas localizadas, mensajes de estado y preferencia de movimiento reducido.",
          items: [
            "El enlace «Saltar al contenido» lleva directamente al contenido principal.",
            "Los controles de carga y compresión incluyen etiquetas claras e instrucciones fáciles de seguir.",
            "Las actualizaciones de validación y compresión se anuncian de forma discreta para las tecnologías de asistencia.",
            "Las animaciones se reducen automáticamente para quienes prefieren menos movimiento.",
          ],
        },
        readiness: {
          eyebrow: "Flujo fiable",
          title: "Creado alrededor del procesamiento temporal",
          description:
            "QAVELIX guía cada video por carga, revisión, compresión, descarga y limpieza con mensajes de estado claros.",
          items: [
            {
              title: "Compatibilidad con idiomas",
              description:
                "El inglés, el portugués de Brasil y el español de España ofrecen la misma experiencia con un lenguaje adaptado a cada idioma.",
            },
            {
              title: "Cargas admitidas",
              description:
                "Los archivos incompatibles, vacíos o demasiado grandes se rechazan antes de que empiece la compresión.",
            },
            {
              title: "Limpieza automática",
              description:
                "Los archivos temporales se eliminan tras el procesamiento, eliminación, cancelación o caducidad.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Carga",
      title: "Revisa tu video antes de comprimir",
      description:
        "Suelta un video para revisar sus detalles antes de la compresión.",
      dropTitle: "Suelta un video aquí",
      dropDescription:
        "Los archivos se procesan temporalmente y se eliminan automáticamente después del periodo de disponibilidad.",
      browseLabel: "Elegir video",
      analyzingLabel: "Analizando archivo",
      supportedLabel: "Formatos admitidos",
      limitsLabel: "Tamaño máximo de carga",
      successTitle: "Validación superada",
      errorTitle: "La validación ha fallado",
      fileLabel: "Archivo",
      sizeLabel: "Tamaño",
      typeLabel: "Tipo MIME",
      durationLabel: "Duración",
      resolutionLabel: "Resolución",
      videoCodecLabel: "Códec de vídeo",
      audioCodecLabel: "Códec de audio",
      bitrateLabel: "Tasa de bits",
      frameRateLabel: "Frecuencia de fotogramas",
      formatLabel: "Contenedor",
      unknownLabel: "Desconocido",
      emptyState: "Aún no se ha analizado ningún archivo.",
      clientErrors: {
        unsupportedExtension: "Esta extensión de archivo no está admitida.",
        unsupportedMime: "Este tipo MIME no está admitido.",
        tooLarge: "Este archivo supera el límite de carga de 250 MB.",
        empty: "Este archivo está vacío.",
        multiple: "Sube un solo archivo cada vez.",
        invalidSignature: "La firma del archivo no coincide con el tipo seleccionado.",
        analysisUnavailable: "El análisis multimedia no está disponible en este entorno.",
        analysisFailed: "No se ha podido analizar la carga. Inténtalo de nuevo.",
      },
    },
    compression: {
      eyebrow: "Compresión",
      title: "Compresión de video",
      description:
        "Comprime un video validado cada vez. El progreso se muestra mientras se prepara el archivo, y puedes cancelar mientras el procesamiento está activo.",
      dropTitle: "Suelta un video para comenzar",
      dropDescription:
        "Tu video se procesa de forma segura y se elimina automáticamente después de su período de disponibilidad.",
      browseLabel: "Elegir video",
      validationHelper:
        "Tu archivo se ha validado correctamente. Revisa la información del archivo, elige el nivel de compresión que mejor se adapte a lo que necesitas e inicia la compresión.",
      validatingLabel: "Comprobando vídeo",
      validationStages: {
        preparing: "Preparando archivo...",
        validating: "Validando archivo multimedia...",
        readingMetadata: "Leyendo metadatos del archivo...",
        complete: "Validación completada.",
      },
      validationSuccessLabel: "Información del archivo",
      validationFailedLabel: "Este vídeo no se puede comprimir",
      uploadLimitExceededLabel: "Límite de carga excedido",
      fileLabel: "Archivo",
      sizeLabel: "Tamaño",
      statusLabel: "Estado",
      maximumAllowedLabel: "Máximo permitido",
      typeLabel: "Tipo MIME",
      durationLabel: "Duración",
      resolutionLabel: "Resolución",
      videoCodecLabel: "Códec de vídeo",
      audioCodecLabel: "Códec de audio",
      bitrateLabel: "Tasa de bits",
      frameRateLabel: "Frecuencia de fotogramas",
      formatLabel: "Contenedor",
      unknownLabel: "Desconocido",
      presetLabel: "Ajuste de compresión",
      presetQuestionLabel: "¿Cómo quieres comprimir este vídeo?",
      recommendedLabel: "Recomendado",
      expectedReductionLabel: "Resultado habitual*",
      presetFootnote:
        "*Los resultados reales de compresión varían según el códec, la tasa de bits, la duración, la resolución y el nivel de compresión previo del vídeo.",
      useCasesLabel: "Ideal para",
      startLabel: "Iniciar compresión",
      cancelLabel: "Cancelar",
      progressLabel: "Progreso",
      waitingLabel: "Esperando archivo",
      readyLabel: "Listo para comprimir",
      queuedLabel: "En espera",
      startingLabel: "Iniciando",
      runningLabel: "Comprimiendo",
      completedLabel: "Completado",
      optimizedLabel: "Optimizado",
      ineffectiveLabel: "Compresión ineficaz",
      failedLabel: "Error de compresión",
      cancelledLabel: "Cancelado",
      cancelledMessage: "Compresión cancelada.",
      expiredLabel: "Caducado",
      deletedLabel: "Eliminado",
      originalSizeLabel: "Tamaño original",
      compressedSizeLabel: "Tamaño comprimido",
      savedLabel: "Ahorro",
      increaseLabel: "Aumento",
      increasePercentLabel: "Porcentaje de aumento",
      reductionLabel: "Reducción",
      originalBitrateLabel: "Tasa de bits original",
      finalBitrateLabel: "Tasa de bits final",
      originalResolutionLabel: "Resolución original",
      finalResolutionLabel: "Resolución final",
      originalCodecLabel: "Códec original",
      finalCodecLabel: "Códec final",
      fullHdOptimizationNotice:
        "Este vídeo se ha optimizado en Full HD para procesarlo más rápido y generar un archivo más pequeño.",
      expiresLabel: "Caduca",
      downloadLabel: "Descargar",
      downloadAnywayLabel: "Descargar igualmente",
      deleteLabel: "Eliminar archivo",
      ineffectiveWarning:
        "Este vídeo ya está muy comprimido. Con el ajuste seleccionado, QAVELIX no ha podido generar un archivo más pequeño que el original. Prueba uno de los ajustes sugeridos para priorizar otra estrategia de compresión.",
      ineffectiveRecommendationLabel: "Ajustes recomendados",
      successMessage: "✔ Compresión completada correctamente",
      successMessages: {
        excellent: "✔ Excelente ahorro de espacio.",
        great: "✔ Gran equilibrio entre calidad y almacenamiento.",
        moderate: "✔ Compresión moderada completada correctamente.",
        light: "✔ Compresión ligera completada.",
        noSavings: "✔ Compresión completada, pero no se ha conseguido ahorrar espacio.",
      },
      downloadStartedMessage: "✔ Descarga iniciada correctamente",
      reuseTipTitle: "Compara los resultados",
      reuseTipDescription:
        "Elige otro ajuste de compresión para generar una nueva versión usando este mismo vídeo.",
      reuseTipSecondary: "No es necesario volver a subir el archivo.",
      presetNames: {
        balanced: "Equilibrado",
        small: "Archivo más pequeño",
        high: "Alta calidad",
      },
      presetDescriptions: {
        balanced:
          "Ofrece el mejor equilibrio entre calidad visual y tamaño de archivo. Conserva la resolución original siempre que es posible mientras reduce la tasa de bits de forma eficiente.",
        small:
          "Prioriza la máxima reducción del tamaño del archivo. Es la mejor opción cuando el espacio de almacenamiento o la velocidad al compartir importan más que la calidad visual.",
        high:
          "Conserva la mayor calidad visual posible. Usa una compresión más ligera mientras mantiene más detalle de imagen.",
      },
      presetUseCases: {
        balanced: ["YouTube", "Instagram", "TikTok", "Publicación web"],
        small: ["WhatsApp", "Telegram", "Correo electrónico", "Ahorro de almacenamiento"],
        high: ["Edición", "Archivado", "Copia de seguridad", "Archivos máster"],
      },
      errors: {
        noFile: "Elige un vídeo admitido antes de iniciar la compresión.",
        empty: "El archivo seleccionado está vacío.",
        tooLarge: "El archivo seleccionado supera el límite de carga de 250 MB.",
        unsupportedExtension: "La extensión del archivo seleccionado no está admitida.",
        unsupportedMime: "El tipo MIME del archivo seleccionado no está admitido.",
        invalidSignature:
          "La firma del archivo seleccionado no coincide con el tipo declarado.",
        analysisUnavailable: "El análisis multimedia no está disponible en este entorno.",
        analysisFailed:
          "No se ha podido analizar el vídeo. Prueba con otro archivo admitido.",
        queueFull: "Se están procesando muchos videos ahora mismo. Inténtalo de nuevo más tarde.",
        uploadFailed: "No se ha podido iniciar la compresión.",
        jobFailed: "La compresión ha fallado. Prueba con otro vídeo admitido.",
        cancelFailed:
          "No se ha podido completar esta acción. Elimina este archivo y selecciona el vídeo de nuevo.",
        sourceUnavailable:
          "La compresión no puede continuar porque el archivo original ya no está disponible en esta sesión. Elimina este archivo y selecciona el vídeo de nuevo.",
      },
      oversizedFileMessage:
        "El archivo seleccionado tiene un tamaño de {fileSize} y supera el límite máximo de carga de {maxSize}. Selecciona un archivo más pequeño para continuar.",
    },
    footer: {
      description:
        "QAVELIX es una plataforma segura para el procesamiento de archivos multimedia, desarrollada por fases con una sólida base de validación, compresión, seguridad y localización.",
      phase: "Procesamiento multimedia seguro y fiable.",
      linksLabel: "Navegación del pie de página",
    },
    pages: {
      about: {
        label: "Acerca de",
        metadata: {
          title: "Acerca del Compresor de Video QAVELIX",
          description:
            "Descubre cómo QAVELIX ayuda a comprimir videos con ajustes sencillos, procesamiento temporal y orientación localizada.",
        },
        eyebrow: "Acerca de",
        title: "Compresión de video simple y segura",
        description:
          "QAVELIX te ayuda a reducir el tamaño de tus videos sin convertir la compresión en una tarea técnica.",
        sections: [
          {
            title: "Qué hace QAVELIX",
            body: [
              "QAVELIX te permite subir un video admitido, revisar la información del archivo, elegir un ajuste de compresión y descargar un resultado MP4 optimizado.",
              "El servicio está pensado para quienes necesitan videos más pequeños para compartir, publicar, almacenar o enviar a diario sin manejar ajustes avanzados.",
            ],
          },
          {
            title: "Procesamiento temporal",
            body: [
              "Los archivos subidos se tratan como archivos temporales de procesamiento. Los originales se eliminan tras el procesamiento, la cancelación, la eliminación o la caducidad, y las descargas completadas solo están disponibles durante un tiempo limitado.",
              "QAVELIX está disponible en portugués, inglés y español, con el mismo flujo de compresión en cada idioma.",
            ],
          },
          {
            title: "Control mediante ajustes",
            body: [
              "Archivo menor prioriza la salida más pequeña posible. Equilibrada busca una combinación práctica entre calidad y tamaño. Alta calidad aplica una compresión más ligera cuando preservar detalle importa más.",
              "Los resultados dependen del video original. Algunos videos ya están muy comprimidos, y QAVELIX avisa cuando un ajuste no consigue reducir el archivo.",
            ],
          },
        ],
      },
      contact: {
        label: "Contacto",
        metadata: {
          title: "Contacto QAVELIX",
          description:
            "Contacta con QAVELIX para soporte, privacidad, informes de seguridad y avisos legales.",
        },
        eyebrow: "Contacto",
        title: "Contacto QAVELIX",
        description:
          "El correo indicado abajo es el canal oficial de contacto para soporte, solicitudes de privacidad, avisos de seguridad, asuntos legales y comentarios sobre accesibilidad.",
        sections: [
          {
            title: "Contacto general",
            body: [
              "Email: {supportEmail}",
              "Para soporte, solicitudes de privacidad, avisos de seguridad, asuntos legales o comentarios sobre accesibilidad, contáctanos mediante el correo anterior.",
              "Para problemas de carga, compresión, descarga o accesibilidad, incluye la URL de la página, navegador, dispositivo y una breve descripción de lo ocurrido. No envíes videos por email salvo que QAVELIX lo solicite expresamente.",
            ],
          },
          {
            title: "Privacidad, seguridad y avisos legales",
            body: [
              "Para solicitudes de privacidad, describe la solicitud y el email en el que QAVELIX puede responder.",
              "Para informes de seguridad, incluye pasos claros para reproducir el problema y evita compartir datos personales innecesarios. Los avisos legales usan el mismo correo oficial de contacto.",
            ],
          },
        ],
      },
      faq: {
        label: "FAQ",
        metadata: {
          title: "FAQ de QAVELIX",
          description:
            "Consulta respuestas prácticas sobre compresión de video, formatos admitidos, límite de archivo, ajustes, almacenamiento temporal y descargas.",
        },
        eyebrow: "FAQ",
        title: "Preguntas frecuentes",
        description:
          "Respuestas prácticas sobre carga, compresión, descarga y gestión de videos en QAVELIX.",
        sections: [
          {
            title: "¿Qué hace QAVELIX?",
            body: [
              "QAVELIX comprime archivos de video admitidos. Subes un video, revisas la información del archivo, eliges un ajuste, inicias la compresión y descargas el resultado optimizado.",
            ],
          },
          {
            title: "¿Qué formatos de video se admiten?",
            body: [
              "QAVELIX admite archivos MP4, M4V, MOV, WEBM, AVI, MPG y MPEG cuando el navegador y el servidor pueden verificarlos como videos admitidos.",
            ],
          },
          {
            title: "¿Hay un tamaño máximo de archivo?",
            body: [
              "Sí. El tamaño máximo de carga es de 250 MB por video.",
            ],
          },
          {
            title: "¿Durante cuánto tiempo están disponibles los archivos?",
            body: [
              "Una carga validada puede usarse para iniciar la compresión durante unos 15 minutos. Las descargas completadas permanecen disponibles durante unos 30 minutos, salvo que las elimines antes.",
              "Los archivos originales temporales se eliminan tras el procesamiento, la cancelación, la eliminación o la caducidad.",
            ],
          },
          {
            title: "¿QAVELIX almacena videos de forma permanente?",
            body: [
              "No hay una biblioteca permanente de videos. Los archivos se tratan como temporales y se eliminan mediante el flujo de limpieza.",
            ],
          },
          {
            title: "¿Cuáles son los ajustes de compresión?",
            body: [
              "Archivo menor prioriza la mayor reducción de tamaño y puede reducir la resolución. Equilibrada está pensada para compartir y publicar en el día a día. Alta calidad usa una compresión más ligera para preservar más detalle.",
            ],
          },
          {
            title: "¿Por qué la compresión puede ahorrar poco espacio?",
            body: [
              "Algunos videos ya están muy comprimidos. En esos casos, un nuevo archivo puede tener un tamaño parecido o incluso mayor, y QAVELIX muestra una orientación en lugar de presentar el resultado como útil.",
            ],
          },
          {
            title: "¿Qué ocurre si se cancela la compresión?",
            body: [
              "El procesamiento activo se detiene, los archivos temporales se limpian y la descarga queda no disponible. Si quieres iniciar una nueva compresión, selecciona el video de nuevo.",
            ],
          },
          {
            title: "¿Por qué puede caducar una descarga?",
            body: [
              "Las descargas son temporales para que los archivos terminados no queden disponibles indefinidamente. Si una descarga caduca, vuelve a subir el video original e inicia otra compresión.",
            ],
          },
          {
            title: "¿Puedo comprimir un video más de una vez?",
            body: [
              "Después de un resultado correcto, puedes elegir otro ajuste mientras el archivo original siga disponible en la sesión. Si el origen se ha eliminado o ha caducado, selecciona el video de nuevo.",
            ],
          },
          {
            title: "¿QAVELIX cambia la resolución del video?",
            body: [
              "El ajuste Archivo menor puede reducir la resolución para generar una salida mucho más pequeña. Equilibrada y Alta calidad están pensados para conservar la resolución original siempre que la estrategia actual de compresión lo permita.",
            ],
          },
          {
            title: "¿Qué idiomas se admiten?",
            body: [
              "QAVELIX está disponible en portugués de Brasil, inglés y español.",
            ],
          },
        ],
      },
      "privacy-policy": {
        label: "Política de Privacidad",
        metadata: {
          title: "Política de Privacidad de QAVELIX",
          description:
            "Consulta cómo QAVELIX procesa videos subidos, metadatos técnicos, archivos temporales, registros y preferencias del navegador.",
        },
        eyebrow: "Privacidad",
        title: "Política de Privacidad",
        description:
          "Este aviso explica cómo QAVELIX gestiona información cuando usas el compresor de video.",
        sections: [
          {
            title: "Última actualización",
            body: [
              "22 de julio de 2026.",
            ],
          },
          {
            title: "Operador del servicio y contacto",
            body: [
              "QAVELIX es el nombre del servicio de esta aplicación de compresión de video. El operador es la persona u organización que despliega y pone disponible esta instancia.",
              "Contáctanos en {supportEmail}.",
            ],
          },
          {
            title: "Información procesada",
            body: [
              "QAVELIX procesa el video que eliges subir, nombre del archivo, tamaño, tipo declarado, extensión e información técnica multimedia como duración, códec, tasa de bits, resolución, frecuencia de fotogramas y contenedor.",
              "Los videos subidos pueden contener datos personales si el contenido visual, audio o nombre del archivo identifica a una persona.",
            ],
          },
          {
            title: "Archivos temporales y descargas",
            body: [
              "Los archivos subidos se usan para analizar y comprimir el video seleccionado. Las cargas validadas están disponibles durante poco tiempo para iniciar la compresión, y los archivos comprimidos quedan disponibles durante un periodo limitado de descarga.",
              "Los archivos de origen y salida se eliminan tras el procesamiento, la cancelación, la eliminación o la caducidad según el flujo de limpieza de la aplicación.",
            ],
          },
          {
            title: "Registros y datos de seguridad",
            body: [
              "El servidor puede procesar metadatos de solicitud como dirección IP, agente de usuario, ruta solicitada, horarios e información de eventos de seguridad para proteger el servicio, solucionar errores y prevenir abusos.",
              "QAVELIX no ofrece cuentas de usuario, procesamiento de pagos, perfiles publicitarios ni biblioteca permanente de videos.",
            ],
          },
          {
            title: "Almacenamiento del navegador",
            body: [
              "QAVELIX almacena el tema Claro u Oscuro seleccionado en localStorage. El idioma se representa en la ruta de la URL y no se guarda mediante una cookie de QAVELIX.",
            ],
          },
          {
            title: "Proveedores de servicio",
            body: [
              "La aplicación puede ejecutarse en el proveedor de alojamiento configurado por el operador. El proveedor y la región finales deben confirmarse para el entorno público.",
              "El código actual de QAVELIX no incluye scripts de analítica ni publicidad.",
            ],
          },
          {
            title: "Tus solicitudes",
            body: [
              "Puedes contactar con QAVELIX para consultas de privacidad, acceso, eliminación o corrección relacionadas con información que el servicio pueda procesar.",
              "Como los archivos son temporales, es posible que QAVELIX no pueda localizar un video después de que haya caducado, se haya eliminado o se haya limpiado.",
            ],
          },
          {
            title: "Seguridad y actualizaciones",
            body: [
              "QAVELIX usa validación, comprobaciones de origen, almacenamiento temporal y enlaces de descarga protegidos para reducir riesgos. Ningún servicio de internet puede garantizar seguridad absoluta.",
              "Esta política puede actualizarse cuando cambien el servicio, los datos del operador, la configuración de alojamiento o los requisitos legales.",
            ],
          },
        ],
      },
      terms: {
        label: "Términos de Servicio",
        metadata: {
          title: "Términos de Servicio de QAVELIX",
          description:
            "Lee los Términos de Servicio de QAVELIX para cargas de video, compresión, procesamiento temporal, descargas y uso permitido.",
        },
        eyebrow: "Términos",
        title: "Términos de Servicio",
        description:
          "Estos términos regulan el uso del compresor de video QAVELIX.",
        sections: [
          {
            title: "Última actualización",
            body: [
              "22 de julio de 2026.",
            ],
          },
          {
            title: "Uso del servicio",
            body: [
              "QAVELIX permite subir videos admitidos, elegir un ajuste de compresión y descargar una salida optimizada temporal.",
              "Al usar QAVELIX, confirmas que eres titular del contenido subido o tienes permiso para procesarlo.",
            ],
          },
          {
            title: "Uso permitido y prohibido",
            body: [
              "Usa QAVELIX solo para procesamiento lícito de videos. No subas contenido ilegal, perjudicial, abusivo, infractor o que no estés autorizado a procesar.",
              "No intentes eludir límites de carga, controles de seguridad, comprobaciones de origen, protecciones de descarga o limpieza de archivos temporales.",
            ],
          },
          {
            title: "Procesamiento temporal y responsabilidad del usuario",
            body: [
              "Los archivos subidos y las salidas comprimidas son temporales. Conserva tu propia copia original, porque QAVELIX no es un servicio de copia de seguridad ni almacenamiento.",
              "Las descargas pueden caducar, y los procesamientos cancelados o eliminados no pueden reanudarse sin seleccionar el video de nuevo.",
            ],
          },
          {
            title: "Resultados de compresión",
            body: [
              "QAVELIX no garantiza un tamaño de archivo concreto, nivel de calidad, compatibilidad de reproducción ni porcentaje de reducción.",
              "La compresión puede reducir la calidad, cambiar la tasa de bits y, en algunos ajustes, reducir la resolución. Algunos videos pueden no hacerse más pequeños.",
            ],
          },
          {
            title: "Disponibilidad y cambios",
            body: [
              "El servicio puede no estar disponible, sufrir interrupciones, limitarse o cambiar. QAVELIX puede restringir usos que parezcan abusivos o perjudiciales para el servicio.",
              "Conservas la titularidad de tu contenido. QAVELIX recibe solo el permiso necesario para procesar el video elegido y proporcionar la salida solicitada.",
            ],
          },
          {
            title: "Exenciones y responsabilidad",
            body: [
              "QAVELIX se proporciona según disponibilidad, sin prometer que todos los archivos se comprimirán correctamente ni que permanecerán descargables más allá de la ventana de disponibilidad indicada.",
              "En la medida permitida por la ley aplicable, QAVELIX no responde por archivos perdidos, datos perdidos, fallos de compresión, descargas caducadas ni daños indirectos derivados del uso del servicio.",
            ],
          },
          {
            title: "Contacto y actualizaciones",
            body: [
              "Contáctanos en {supportEmail}.",
              "Estos términos pueden actualizarse cuando cambien el servicio, los datos del operador o los requisitos legales.",
            ],
          },
        ],
      },
      "cookie-policy": {
        label: "Política de Cookies y Almacenamiento Local",
        metadata: {
          title: "Política de Cookies y Almacenamiento Local de QAVELIX",
          description:
            "Consulta cómo QAVELIX usa localStorage para la preferencia de tema y qué almacenamiento del navegador se usa actualmente.",
        },
        eyebrow: "Cookies",
        title: "Política de Cookies y Almacenamiento Local",
        description:
          "Este aviso explica el almacenamiento del navegador que QAVELIX usa actualmente.",
        sections: [
          {
            title: "Última actualización",
            body: [
              "22 de julio de 2026.",
            ],
          },
          {
            title: "Almacenamiento local",
            body: [
              "QAVELIX almacena el tema Claro u Oscuro seleccionado en localStorage con la clave qavelix-theme para conservar tu preferencia entre recargas de página.",
              "El idioma forma parte de la ruta de la URL. QAVELIX no guarda la selección de idioma en una cookie.",
            ],
          },
          {
            title: "Cookies y seguimiento",
            body: [
              "El código actual de la aplicación no incluye cookies de analítica, cookies publicitarias, seguimiento de pagos, sesiones de cuenta ni etiquetas de marketing de terceros.",
              "Como actualmente solo se usa almacenamiento necesario de preferencias, QAVELIX no muestra un banner de consentimiento de cookies.",
            ],
          },
          {
            title: "Cómo gestionar el almacenamiento",
            body: [
              "Puedes borrar el localStorage de QAVELIX desde la configuración del navegador o los controles de datos del sitio. Al borrar ese almacenamiento, el tema puede volver al valor predeterminado.",
              "Si más adelante se añaden funciones no esenciales como analítica, publicidad, medios incrustados o cuentas, este aviso deberá actualizarse y añadirse controles de consentimiento cuando sea necesario.",
            ],
          },
        ],
      },
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
