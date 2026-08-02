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

export type Dictionary = {
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
    tools: string;
    toolsVideoCategory: string;
    videoCompressorTool: string;
    extractAudioTool: string;
    proBadgeLabel: string;
    languageLabel: string;
    themeLabel: string;
    lightTheme: string;
    darkTheme: string;
    back: string;
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
    maxSizeCard: {
      label: string;
      freeLabel: string;
      freeValue: string;
      proLabel: string;
      proValue: string;
    };
    pricing: {
      eyebrow: string;
      title: string;
      description: string;
      note: string;
      plans: Array<{
        name: string;
        price: string;
        cadence: string;
        highlight: boolean;
        badge: string | null;
        features: string[];
        cta: string;
      }>;
    };
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
      predictedIncrease: string;
      accountRequired: string;
      usageLimitReached: string;
      toolUnavailableForPlan: string;
      serviceUnavailable: string;
    };
    oversizedFileMessage: string;
  };
  footer: {
    description: string;
    phase: string;
    linksLabel: string;
  };
  tools: {
    extractAudio: {
      eyebrow: string;
      title: string;
      subtitle: string;
      description: string;
      uploadTitle: string;
      uploadDescription: string;
      privacyMessage: string;
      chooseFile: string;
      chooseAnotherFile: string;
      statusTitle: string;
      statusWaiting: string;
      statusReady: string;
      statusInvalid: string;
      statusValidating: string;
      statusUploading: string;
      statusAnalyzing: string;
      statusProcessing: string;
      statusPreparing: string;
      statusCompleted: string;
      statusFailed: string;
      statusValidAudio: string;
      statusNoAudio: string;
      analysisProgressMessage: string;
      extractionProgressMessage: string;
      preparingDownloadMessage: string;
      selectedFile: string;
      fileName: string;
      fileSize: string;
      originalFileName: string;
      generatedFileName: string;
      originalFileSize: string;
      audioFileSize: string;
      outputFormat: string;
      outputFormatValue: string;
      extractButton: string;
      downloadButton: string;
      downloadStartedMessage: string;
      cancelButton: string;
      deleteButton: string;
      nextStepMessage: string;
      infoTitle: string;
      infoItems: string[];
      faqTitle: string;
      faqItems: Array<{
        question: string;
        answer: string;
      }>;
      validation: {
        multipleFiles: string;
        emptyFile: string;
        fileTooSmall: string;
        fileTooLarge: string;
        invalidExtension: string;
        invalidMime: string;
      };
      errors: {
        missingFile: string;
        emptyFile: string;
        fileTooSmall: string;
        fileTooLarge: string;
        unsupportedFormat: string;
        invalidMedia: string;
        noAudio: string;
        silentAudio: string;
        ffprobeFailed: string;
        ffmpegFailed: string;
        analysisFailed: string;
        analysisTimeout: string;
        analysisCancelled: string;
        timeout: string;
        serverError: string;
        downloadUnavailable: string;
        networkError: string;
        accountRequired: string;
        usageLimitReached: string;
        toolUnavailableForPlan: string;
        serviceUnavailable: string;
      };
    };
  };
  auth: {
    fields: {
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      passwordLabel: string;
      passwordPlaceholder: string;
      newPasswordLabel: string;
      newPasswordPlaceholder: string;
      confirmPasswordLabel: string;
      confirmPasswordPlaceholder: string;
      currentPasswordLabel: string;
      currentPasswordPlaceholder: string;
    };
    validation: {
      nameRequired: string;
      nameTooLong: string;
      emailInvalid: string;
      emailTooLong: string;
      passwordTooShort: string;
      passwordTooLong: string;
      passwordTooWeak: string;
      passwordMismatch: string;
    };
    errors: {
      invalidEmail: string;
      userAlreadyExists: string;
      invalidCredentials: string;
      passwordTooShort: string;
      passwordTooLong: string;
      invalidToken: string;
      tokenExpired: string;
      emailAlreadyVerified: string;
      invalidPassword: string;
      networkError: string;
      unknown: string;
    };
    signIn: {
      eyebrow: string;
      title: string;
      description: string;
      submitLabel: string;
      submittingLabel: string;
      forgotPasswordLink: string;
      noAccountPrompt: string;
      signUpLink: string;
    };
    signUp: {
      eyebrow: string;
      title: string;
      description: string;
      submitLabel: string;
      submittingLabel: string;
      hasAccountPrompt: string;
      signInLink: string;
      successTitle: string;
      successMessage: string;
    };
    forgotPassword: {
      eyebrow: string;
      title: string;
      description: string;
      submitLabel: string;
      submittingLabel: string;
      successTitle: string;
      successMessage: string;
      backToSignInLink: string;
    };
    resetPassword: {
      eyebrow: string;
      title: string;
      description: string;
      submitLabel: string;
      submittingLabel: string;
      successTitle: string;
      successMessage: string;
      successActionLabel: string;
      invalidLinkTitle: string;
      invalidLinkMessage: string;
      requestNewLinkLabel: string;
    };
    verifyEmail: {
      eyebrow: string;
      title: string;
      verifiedTitle: string;
      verifiedMessage: string;
      verifiedNoSessionMessage: string;
      goToSignInLabel: string;
      differentAccountTitle: string;
      differentAccountMessage: string;
      differentAccountMessageGeneric: string;
      signOutAndSignInLabel: string;
      signingOutLabel: string;
      signOutErrorMessage: string;
      verificationFailedTitle: string;
      pendingTitle: string;
      pendingMessage: string;
      resendButton: string;
      resendingLabel: string;
      resendSuccessMessage: string;
      goHomeLabel: string;
    };
    accountMenu: {
      openLabel: string;
      dashboardLabel: string;
      signedInAsLabel: string;
      signOutLabel: string;
      signingOutLabel: string;
    };
    guestNav: {
      signInLabel: string;
      signUpLabel: string;
    };
  };
  upgradeModal: {
    title: string;
    description: string;
    freeTierName: string;
    proTierName: string;
    usesPerDay: string;
    uploadSize: string;
    upgradeButtonLabel: string;
    checkoutPendingLabel: string;
    checkoutErrorMessage: string;
    emailVerificationRequiredMessage: string;
    dismissLabel: string;
    closeLabel: string;
  };
  planComparisonModal: {
    title: string;
    description: string;
    anonymousTierName: string;
    usesLifetime: string;
    createAccountLabel: string;
    signInLabel: string;
  };
  adGateModal: {
    title: string;
    description: string;
    countdownLabel: string;
    readyLabel: string;
    continueLabel: string;
    upsellMessage: string;
    upgradeButtonLabel: string;
  };
  cookieConsentBanner: {
    ariaLabel: string;
    message: string;
    learnMoreLabel: string;
    acceptLabel: string;
    declineLabel: string;
  };
  dashboard: {
    nav: {
      navLabel: string;
      overview: string;
      usage: string;
      plan: string;
      billing: string;
      settings: string;
    };
    overview: {
      eyebrow: string;
      title: string;
      description: string;
      welcomeGreeting: string;
      welcomeFallbackName: string;
      accountSummary: {
        title: string;
        emailLabel: string;
        verifiedLabel: string;
        unverifiedLabel: string;
        membershipLabel: string;
        freeAccountLabel: string;
        proAccountLabel: string;
      };
      tools: {
        title: string;
        videoCompressorLabel: string;
        videoCompressorDescription: string;
        extractAudioLabel: string;
        extractAudioDescription: string;
        openLabel: string;
      };
    };
    usage: {
      eyebrow: string;
      title: string;
      description: string;
      toolLabels: {
        "video-compressor": string;
        "extract-audio": string;
      };
      usedOfLimitDayLabel: string;
      usedOfLimitLifetimeLabel: string;
      limitReachedLabel: string;
      unavailableMessage: string;
    };
    plan: {
      eyebrow: string;
      title: string;
      description: string;
      currentPlanLabel: string;
      freePlanName: string;
      proPlanName: string;
      dailyLimitLabel: string;
      uploadLimitLabel: string;
      upgradeBadge: string;
      upgradeTitle: string;
      upgradeDescription: string;
      priceLabel: string;
      upgradeButtonLabel: string;
      checkoutPendingLabel: string;
      checkoutErrorMessage: string;
      manageBillingLabel: string;
      manageSubscriptionLabel: string;
      portalPendingLabel: string;
      portalErrorMessage: string;
      emailVerificationRequiredMessage: string;
      verificationBannerMessage: string;
      verificationBannerActionLabel: string;
      billingStatusLabel: string;
      renewsOnLabel: string;
      cancelsOnLabel: string;
      checkoutSuccessMessage: string;
      checkoutCancelledMessage: string;
      comparisonTitle: string;
      currentPlanBadge: string;
      proActiveBadge: string;
      activationPendingTitle: string;
      activationPendingMessage: string;
      activationStillPendingMessage: string;
      refreshStatusLabel: string;
      welcome: {
        title: string;
        intro: string;
        supportMessage: string;
        goalMessage: string;
        benefitsTitle: string;
        ctaLabel: string;
        closeLabel: string;
      };
    };
    billing: {
      description: string;
    };
    billingAddress: {
      title: string;
      description: string;
      streetLabel: string;
      streetPlaceholder: string;
      numberLabel: string;
      numberPlaceholder: string;
      complementLabel: string;
      complementPlaceholder: string;
      postalCodeLabel: string;
      postalCodePlaceholder: string;
      cityLabel: string;
      stateLabel: string;
      countryLabel: string;
      saveLabel: string;
      savingLabel: string;
      successMessage: string;
      errorMessage: string;
      notConfiguredMessage: string;
      lookupLoadingLabel: string;
      lookupSuccessLabel: string;
      lookupNotFoundLabel: string;
      lookupErrorLabel: string;
    };
    settings: {
      eyebrow: string;
      title: string;
      description: string;
      profile: {
        title: string;
        nameLabel: string;
        namePlaceholder: string;
        emailLabel: string;
        emailReadOnlyNote: string;
        saveLabel: string;
        savingLabel: string;
        successMessage: string;
      };
      appearance: {
        title: string;
        description: string;
      };
      language: {
        title: string;
        description: string;
      };
      security: {
        title: string;
        changePasswordLabel: string;
        changingPasswordLabel: string;
        passwordChangedMessage: string;
        oauthOnlyNote: string;
      };
      account: {
        title: string;
        signOutLabel: string;
        signingOutLabel: string;
      };
      billing: {
        title: string;
        description: string;
        manageLabel: string;
      };
    };
    placeholder: {
      comingSoonBadge: string;
      billingTitle: string;
      billingDescription: string;
      settingsTitle: string;
      settingsDescription: string;
    };
    loading: string;
    error: {
      title: string;
      description: string;
      retryLabel: string;
    };
  };
  pages: Record<ContentPageSlug, ContentPageCopy>;
  support: {
    metadataTitle: string;
    metadataDescription: string;
    navLabel: string;
    eyebrow: string;
    title: string;
    intro: string;
    story: {
      eyebrow: string;
      title: string;
      paragraphs: string[];
    };
    helps: {
      eyebrow: string;
      title: string;
      description: string;
      cards: CardCopy[];
    };
    transparency: {
      title: string;
      items: string[];
    };
    amountsTitle: string;
    customAmountLabel: string;
    customAmountPlaceholder: string;
    contributeButtonLabel: string;
    contributingLabel: string;
    secureNote: string;
    errorMessage: string;
    invalidAmountMessage: string;
    legalNote: string;
    closingMessage: string;
    success: {
      eyebrow: string;
      title: string;
      description: string;
      amountLabel: string;
      returnHomeLabel: string;
      notVerifiedTitle: string;
      notVerifiedDescription: string;
    };
    cancelled: {
      eyebrow: string;
      title: string;
      description: string;
      tryAgainLabel: string;
      returnHomeLabel: string;
    };
  };
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
      tools: "Tools",
      toolsVideoCategory: "Video",
      videoCompressorTool: "Video Compressor",
      extractAudioTool: "Extract Audio",
      proBadgeLabel: "QAVELIX PRO subscriber",
      languageLabel: "Select language",
      themeLabel: "Theme",
      lightTheme: "Light",
      darkTheme: "Dark",
      back: "Back",
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
        { value: "5", label: "Supported formats" },
        { value: "3", label: "Compression presets" },
      ],
      maxSizeCard: {
        label: "Maximum size",
        freeLabel: "Free",
        freeValue: "250 MB",
        proLabel: "Pro",
        proValue: "500 MB",
      },
      pricing: {
        eyebrow: "Pricing",
        title: "Simple, transparent pricing",
        description:
          "Use Video Compressor and Extract Audio for free, or upgrade to QAVELIX PRO for higher daily limits and larger files.",
        note: "You can also try both tools without creating an account, with a small combined trial allowance.",
        plans: [
          {
            name: "Free",
            price: "$0",
            cadence: "",
            highlight: false,
            badge: null,
            features: [
              "10 compressions or extractions per day, per tool",
              "Up to 250 MB per file",
              "No credit card required",
            ],
            cta: "Create a free account",
          },
          {
            name: "QAVELIX PRO",
            price: "$9.99",
            cadence: "/month",
            highlight: true,
            badge: "Most popular",
            features: [
              "100 compressions or extractions per day, per tool",
              "Up to 500 MB per file",
              "Cancel anytime from your billing portal",
            ],
            cta: "Upgrade to PRO",
          },
        ],
      },
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
        tooLarge: "This file exceeds your plan's upload limit.",
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
        "Accepted formats: MP4, MOV, AVI, WebM, M4V, MPEG and MPG.\nFree plan: 100 KB to 250 MB per file.\nPro plan: 100 KB to 500 MB per file.\nYour file is processed securely and automatically removed after the retention period.",
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
      downloadFailedMessage: "The download could not be started. Try again.",
      deleteLabel: "Delete file",
      ineffectiveWarning:
        "This video is already highly compressed. Using the selected preset, QAVELIX could not generate a file smaller than the original. Try one of the suggested presets below to prioritize a different compression strategy.",
      ineffectiveRecommendationLabel: "Recommended presets",
      predictedIncreaseWarning:
        "This video already appears to be highly optimized for the selected preset. Compressing it is very likely to increase the file size. Try one of the alternative presets below.",
      predictedIncreaseRecommendationLabel: "Presets more likely to reduce the size",
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
        tooLarge: "The selected file exceeds your plan's upload limit.",
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
        predictedIncrease:
          "This preset is very likely to increase the file size for this video. Choose a different preset.",
        accountRequired: "Create a free account to keep using this tool.",
        usageLimitReached: "You have reached today's usage limit for this tool.",
        toolUnavailableForPlan: "This tool is not available on your current plan.",
        serviceUnavailable: "The usage service is temporarily unavailable. Try again shortly.",
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
  tools: {
    extractAudio: {
      eyebrow: "Extract Audio",
      title: "Extract audio from video",
      subtitle: "Turn your video into a clean MP3 audio file quickly and securely.",
      description:
        "Upload a supported video, review the selected file, and prepare it for MP3 extraction. Processing will be connected in the next development step.",
      uploadTitle: "Drop a video to extract audio",
      uploadDescription:
        "Choose a supported video file for audio extraction.\nAccepted formats: MP4, MOV, AVI, WebM, M4V, MPEG and MPG.\nFree plan: 100 KB to 250 MB per file.\nPro plan: 100 KB to 500 MB per file.",
      privacyMessage:
        "Files are handled temporarily and removed automatically after the availability period.",
      chooseFile: "Choose video",
      chooseAnotherFile: "Choose another video",
      statusTitle: "Audio extraction",
      statusWaiting: "Waiting for file",
      statusReady: "File ready",
      statusInvalid: "Invalid video",
      statusValidating: "Validating file",
      statusUploading: "Uploading video",
      statusAnalyzing: "Analyzing video",
      statusProcessing: "Extracting audio",
      statusPreparing: "Preparing download",
      statusCompleted: "Completed",
      statusFailed: "Failed",
      statusValidAudio: "Valid audio detected",
      statusNoAudio: "Video has no audio",
      analysisProgressMessage: "Checking the audio track...",
      extractionProgressMessage: "Converting the audio to MP3...",
      preparingDownloadMessage: "Preparing the download...",
      selectedFile: "Selected file",
      fileName: "File name",
      fileSize: "File size",
      originalFileName: "Original file",
      generatedFileName: "MP3 file",
      originalFileSize: "Original size",
      audioFileSize: "Audio size",
      outputFormat: "Output format",
      outputFormatValue: "MP3",
      extractButton: "Extract Audio",
      downloadButton: "Download",
      downloadStartedMessage: "Download started successfully.",
      cancelButton: "Cancel",
      deleteButton: "Delete file",
      nextStepMessage:
        "Audio extraction processing is the next development step. No file has been uploaded or processed yet.",
      infoTitle: "How Extract Audio will work",
      infoItems: [
        "Upload a supported video file.",
        "QAVELIX extracts the audio track as an MP3 file.",
        "Download the audio file when processing is complete.",
        "Temporary files are removed automatically after the availability period.",
      ],
      faqTitle: "Extract Audio FAQ",
      faqItems: [
        {
          question: "What does Extract Audio do?",
          answer:
            "It creates a separate MP3 audio file from an uploaded video.",
        },
        {
          question: "Which video formats are supported?",
          answer:
            "Extract Audio supports the same video formats as Video Compressor: MP4, M4V, MOV, WebM, AVI, MPG, and MPEG.",
        },
        {
          question: "Is the output MP3?",
          answer: "Yes. The output format is MP3.",
        },
        {
          question: "What is the upload limit?",
          answer: "The file limit is 250 MB on the Free plan and 500 MB on QAVELIX PRO.",
        },
        {
          question: "How are files handled?",
          answer:
            "Files are temporary and are removed automatically after the availability period.",
        },
      ],
      validation: {
        multipleFiles: "Choose one video file at a time.",
        emptyFile: "The selected file is empty. Choose another video.",
        fileTooSmall:
          "This video is too small to process. Choose a video of at least 100 KB.",
        fileTooLarge:
          "This video exceeds the {maxSize} upload limit. Choose a smaller video to continue.",
        invalidExtension:
          "This file extension is not supported. Choose MP4, M4V, MOV, WebM, AVI, MPG, or MPEG.",
        invalidMime:
          "This file type is not supported. Choose a valid video file.",
      },
      errors: {
        missingFile: "Choose one supported video file before extracting audio.",
        emptyFile: "The selected file is empty. Choose another video.",
        fileTooSmall:
          "This video is too small to process. Choose a video of at least 100 KB.",
        fileTooLarge:
          "This video exceeds the {maxSize} upload limit. Choose a smaller video to continue.",
        unsupportedFormat:
          "This video format is not supported. Choose MP4, MOV, AVI, WebM, M4V, MPEG, or MPG.",
        invalidMedia:
          "This file is corrupted or is not a valid video. Choose another file to continue.",
        noAudio:
          "This video does not contain an audio track. Choose another video with audio to continue.",
        silentAudio:
          "This video has no audible sound. Choose another video with sound to continue.",
        ffprobeFailed:
          "QAVELIX could not analyze this video. Choose another supported video file.",
        ffmpegFailed:
          "QAVELIX could not extract audio from this video. Choose another file and try again.",
        analysisFailed:
          "QAVELIX could not complete the audio analysis. Choose another video or try again.",
        analysisTimeout:
          "Audio analysis took too long. Choose a shorter video or try again.",
        analysisCancelled: "Audio analysis was cancelled.",
        timeout:
          "Audio extraction took too long. Choose a shorter video or try again.",
        serverError:
          "Audio extraction is temporarily unavailable. Try again in a moment.",
        downloadUnavailable:
          "The MP3 download could not be prepared. Try extracting the audio again.",
        networkError:
          "The request could not be completed. Check your connection and try again.",
        accountRequired: "Create a free account to keep using this tool.",
        usageLimitReached: "You have reached today's usage limit for this tool.",
        toolUnavailableForPlan: "This tool is not available on your current plan.",
        serviceUnavailable: "The usage service is temporarily unavailable. Try again shortly.",
      },
    },
  },
  auth: {
    fields: {
      nameLabel: "Full name",
      namePlaceholder: "Jane Doe",
      emailLabel: "Email address",
      emailPlaceholder: "you@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      newPasswordLabel: "New password",
      newPasswordPlaceholder: "Enter a new password",
      confirmPasswordLabel: "Confirm password",
      confirmPasswordPlaceholder: "Enter the password again",
      currentPasswordLabel: "Current password",
      currentPasswordPlaceholder: "Enter your current password",
    },
    validation: {
      nameRequired: "Enter your name.",
      nameTooLong: "Name must be 100 characters or fewer.",
      emailInvalid: "Enter a valid email address.",
      emailTooLong: "Email must be 254 characters or fewer.",
      passwordTooShort: "Password must be at least 8 characters.",
      passwordTooLong: "Password must be 128 characters or fewer.",
      passwordTooWeak:
        "Password must include at least one uppercase letter, one lowercase letter, and one special character.",
      passwordMismatch: "Passwords do not match.",
    },
    errors: {
      invalidEmail: "Enter a valid email address.",
      userAlreadyExists: "An account with this email already exists.",
      invalidCredentials: "Incorrect email or password.",
      passwordTooShort: "Password must be at least 8 characters.",
      passwordTooLong: "Password must be 128 characters or fewer.",
      invalidToken: "This link is invalid. Request a new one.",
      tokenExpired: "This link has expired. Request a new one.",
      emailAlreadyVerified: "This email is already verified.",
      invalidPassword: "Your current password is incorrect.",
      networkError:
        "The request could not be completed. Check your connection and try again.",
      unknown: "Something went wrong. Try again.",
    },
    signIn: {
      eyebrow: "Account",
      title: "Sign in",
      description: "Sign in to your QAVELIX account.",
      submitLabel: "Sign in",
      submittingLabel: "Signing in...",
      forgotPasswordLink: "Forgot your password?",
      noAccountPrompt: "Don't have an account?",
      signUpLink: "Sign up",
    },
    signUp: {
      eyebrow: "Account",
      title: "Create your account",
      description: "Create a QAVELIX account to get started.",
      submitLabel: "Create account",
      submittingLabel: "Creating account...",
      hasAccountPrompt: "Already have an account?",
      signInLink: "Sign in",
      successTitle: "Check your email",
      successMessage:
        "Your account was created. We sent a verification link to your email address.",
    },
    forgotPassword: {
      eyebrow: "Account",
      title: "Reset your password",
      description:
        "Enter your email address and we'll send you a link to reset your password.",
      submitLabel: "Send reset link",
      submittingLabel: "Sending...",
      successTitle: "Check your email",
      successMessage:
        "If an account exists for this email address, a reset link is on its way.",
      backToSignInLink: "Back to sign in",
    },
    resetPassword: {
      eyebrow: "Account",
      title: "Set a new password",
      description: "Choose a new password for your account.",
      submitLabel: "Reset password",
      submittingLabel: "Resetting...",
      successTitle: "Password updated",
      successMessage:
        "Your password has been reset. You can now sign in with your new password.",
      successActionLabel: "Sign in",
      invalidLinkTitle: "Link invalid or expired",
      invalidLinkMessage:
        "This password reset link is invalid or has expired. Request a new one to continue.",
      requestNewLinkLabel: "Request a new link",
    },
    verifyEmail: {
      eyebrow: "Account",
      title: "Verify your email",
      verifiedTitle: "Email verified",
      verifiedMessage: "Your email address has been verified.",
      verifiedNoSessionMessage: "Your email address has been verified. Sign in to continue.",
      goToSignInLabel: "Go to sign in",
      differentAccountTitle: "A different account is signed in",
      differentAccountMessage:
        "{email} was just verified, but you're currently signed in with a different QAVELIX account.",
      differentAccountMessageGeneric:
        "Your email address was just verified, but you're currently signed in with a different QAVELIX account.",
      signOutAndSignInLabel: "Sign in with the verified account",
      signingOutLabel: "Signing out...",
      signOutErrorMessage: "Could not sign out. Try again.",
      verificationFailedTitle: "Verification failed",
      pendingTitle: "Verify your email",
      pendingMessage:
        "We sent a verification link to your email address. Open it to verify your account.",
      resendButton: "Resend verification email",
      resendingLabel: "Sending...",
      resendSuccessMessage: "Verification email sent. Check your inbox.",
      goHomeLabel: "Go to homepage",
    },
    accountMenu: {
      openLabel: "Account",
      dashboardLabel: "Dashboard",
      signedInAsLabel: "Signed in as",
      signOutLabel: "Sign out",
      signingOutLabel: "Signing out...",
    },
    guestNav: {
      signInLabel: "Sign in",
      signUpLabel: "Sign up",
    },
  },
  upgradeModal: {
    title: "You've reached the Free plan's daily limit",
    description:
      "You've used all of today's free processing runs for this tool. Upgrade to Pro to keep going right now, with higher limits and larger files.",
    freeTierName: "Free",
    proTierName: "Pro",
    usesPerDay: "{limit} uses per day",
    uploadSize: "Up to {maxSize} per file",
    upgradeButtonLabel: "Upgrade to Pro",
    checkoutPendingLabel: "Redirecting to checkout...",
    checkoutErrorMessage: "Could not start checkout. Try again.",
    emailVerificationRequiredMessage:
      "Verify your email address before upgrading to Pro. Check your inbox for the verification link, or request a new one.",
    dismissLabel: "Not now",
    closeLabel: "Close",
  },
  planComparisonModal: {
    title: "You've reached the free trial limit",
    description:
      "You've used all of your free anonymous processing runs. Create a free account to keep going today, or explore what QAVELIX PRO adds on top.",
    anonymousTierName: "Without an account",
    usesLifetime: "{limit} uses total",
    createAccountLabel: "Create free account",
    signInLabel: "Sign in",
  },
  adGateModal: {
    title: "Your next run is one ad away",
    description:
      "Your first run today was completely free. Watch this short ad to unlock processing again, or skip ads entirely with QAVELIX PRO.",
    countdownLabel: "Continue in {seconds}s...",
    readyLabel: "You're all set — continue whenever you're ready.",
    continueLabel: "Continue",
    upsellMessage: "Remove ads and unlock unlimited uploads up to 500MB with QAVELIX PRO.",
    upgradeButtonLabel: "Upgrade to Pro",
  },
  cookieConsentBanner: {
    ariaLabel: "Cookie consent",
    message:
      "QAVELIX uses a strictly necessary session cookie for sign-in, and, if you accept, Google AdSense may set advertising cookies to show ads on Free and anonymous-tier pages. QAVELIX PRO is always ad-free.",
    learnMoreLabel: "Read our Cookie Policy",
    acceptLabel: "Accept",
    declineLabel: "Decline non-essential",
  },
  dashboard: {
    nav: {
      navLabel: "Dashboard navigation",
      overview: "Overview",
      usage: "Usage",
      plan: "Plan",
      billing: "Billing",
      settings: "Settings",
    },
    overview: {
      eyebrow: "Dashboard",
      title: "Overview",
      description: "A quick look at your account and tools.",
      welcomeGreeting: "Welcome",
      welcomeFallbackName: "there",
      accountSummary: {
        title: "Your account",
        emailLabel: "Email",
        verifiedLabel: "Verified",
        unverifiedLabel: "Not verified",
        membershipLabel: "Membership",
        freeAccountLabel: "Free",
        proAccountLabel: "Pro",
      },
      tools: {
        title: "Your tools",
        videoCompressorLabel: "Video Compressor",
        videoCompressorDescription: "Compress videos quickly and securely.",
        extractAudioLabel: "Extract Audio",
        extractAudioDescription: "Pull the audio track out of a video as an MP3.",
        openLabel: "Open",
      },
    },
    usage: {
      eyebrow: "Dashboard",
      title: "Usage",
      description: "Today's usage for each tool on your current plan.",
      toolLabels: {
        "video-compressor": "Video Compressor",
        "extract-audio": "Extract Audio",
      },
      usedOfLimitDayLabel: "{used} of {limit} used today",
      usedOfLimitLifetimeLabel: "{used} of {limit} used",
      limitReachedLabel: "Limit reached",
      unavailableMessage: "Usage data is temporarily unavailable. Try again shortly.",
    },
    plan: {
      eyebrow: "Dashboard",
      title: "Plan",
      description: "Your current plan and its limits for each tool.",
      currentPlanLabel: "Current plan",
      freePlanName: "Free",
      proPlanName: "Pro",
      dailyLimitLabel: "{limit} uses per day",
      uploadLimitLabel: "Up to {maxSize} per file",
      upgradeBadge: "Coming soon",
      upgradeTitle: "Upgrade to Pro",
      upgradeDescription: "Pro plans are not available for purchase yet. Check back soon.",
      priceLabel: "{price} / month",
      upgradeButtonLabel: "Upgrade to Pro",
      checkoutPendingLabel: "Redirecting to checkout...",
      checkoutErrorMessage: "Could not start checkout. Try again.",
      manageBillingLabel: "Manage billing",
      manageSubscriptionLabel: "Manage subscription",
      portalPendingLabel: "Opening billing portal...",
      portalErrorMessage: "Could not open the billing portal. Try again.",
      emailVerificationRequiredMessage:
        "Verify your email address before managing your subscription or payments. Check your inbox for the verification link, or request a new one.",
      verificationBannerMessage:
        "Verify your email address to manage your subscription or payments.",
      verificationBannerActionLabel: "Verify email",
      billingStatusLabel: "Billing",
      renewsOnLabel: "Renews on {date}",
      cancelsOnLabel: "Access ends on {date}",
      checkoutSuccessMessage: "You're now on the Pro plan.",
      checkoutCancelledMessage: "Checkout was cancelled. You're still on the Free plan.",
      comparisonTitle: "Compare plans",
      currentPlanBadge: "Current plan",
      proActiveBadge: "Active",
      activationPendingTitle: "Activating your subscription...",
      activationPendingMessage:
        "We're confirming your payment with Stripe. This usually takes just a few seconds.",
      activationStillPendingMessage:
        "Still confirming your subscription. Refresh in a moment, or contact support if this continues.",
      refreshStatusLabel: "Refresh status",
      welcome: {
        title: "🎉 Welcome to QAVELIX PRO!",
        intro: "Thank you for supporting QAVELIX.",
        supportMessage:
          "Your subscription directly helps us improve the platform and build new tools.",
        goalMessage: "Our goal is to save you time and make your day-to-day workflow easier.",
        benefitsTitle: "What you've unlocked",
        ctaLabel: "Go to the tools",
        closeLabel: "Close",
      },
    },
    billing: {
      description: "Manage your subscription, payment method, and invoices.",
    },
    billingAddress: {
      title: "Billing address",
      description:
        "This address is stored with Stripe and used for your invoices. Enter a postal code to try prefilling city and state.",
      streetLabel: "Street address",
      streetPlaceholder: "Street name",
      numberLabel: "Number",
      numberPlaceholder: "House / building number",
      complementLabel: "Apartment, unit (optional)",
      complementPlaceholder: "Apt, suite, unit",
      postalCodeLabel: "Postal code",
      postalCodePlaceholder: "Postal or ZIP code",
      cityLabel: "City",
      stateLabel: "State / province",
      countryLabel: "Country",
      saveLabel: "Save address",
      savingLabel: "Saving...",
      successMessage: "Your billing address has been saved.",
      errorMessage: "Could not save your billing address. Try again.",
      notConfiguredMessage: "Billing isn't configured yet.",
      lookupLoadingLabel: "Looking up address...",
      lookupSuccessLabel: "City and state filled in from the postal code.",
      lookupNotFoundLabel: "No address found for this postal code — enter it manually.",
      lookupErrorLabel: "Couldn't look up this postal code — enter the address manually.",
    },
    settings: {
      eyebrow: "Settings",
      title: "Account settings",
      description: "Manage your profile, appearance, language, and account security.",
      profile: {
        title: "Profile",
        nameLabel: "Name",
        namePlaceholder: "Your name",
        emailLabel: "Email",
        emailReadOnlyNote:
          "Email changes require verification and aren't available yet — contact support if you need to update it.",
        saveLabel: "Save changes",
        savingLabel: "Saving...",
        successMessage: "Your profile has been updated.",
      },
      appearance: {
        title: "Appearance",
        description: "Choose how QAVELIX looks on this device.",
      },
      language: {
        title: "Language",
        description: "Choose your preferred language. This keeps you on the current page.",
      },
      security: {
        title: "Security",
        changePasswordLabel: "Change password",
        changingPasswordLabel: "Changing password...",
        passwordChangedMessage: "Your password has been changed.",
        oauthOnlyNote: "Your account signs in through an external provider and has no password to change.",
      },
      account: {
        title: "Account",
        signOutLabel: "Sign out",
        signingOutLabel: "Signing out...",
      },
      billing: {
        title: "Billing",
        description: "Manage your subscription and payment details.",
        manageLabel: "Go to Billing",
      },
    },
    placeholder: {
      comingSoonBadge: "Coming soon",
      billingTitle: "Billing",
      billingDescription: "Billing history and payment methods will appear here in a future update.",
      settingsTitle: "Settings",
      settingsDescription: "Account settings will appear here in a future update.",
    },
    loading: "Loading your dashboard...",
    error: {
      title: "Something went wrong",
      description: "Your dashboard could not be loaded. Try again.",
      retryLabel: "Try again",
    },
  },
  pages: {
      about: {
        label: "About",
        metadata: {
          title: "About QAVELIX",
          description:
            "Learn how QAVELIX's Video Compressor and Extract Audio tools work.",
        },
        eyebrow: "About",
        title: "Practical media tools, built for clarity",
        description:
          "QAVELIX is a platform for focused media tools that help people complete everyday file tasks with less friction.",
        sections: [
          {
            title: "What QAVELIX does",
            body: [
              "QAVELIX currently offers Video Compressor and Extract Audio, two focused media tools you can use directly in your browser.",
              "Both tools are designed to feel simple instead of technical: upload a file, review its details, choose an option, and download the result.",
            ],
          },
          {
            title: "Privacy-minded processing",
            body: [
              "Files are handled as temporary processing files. Source files and generated outputs are removed after processing, cancellation, deletion, or expiration according to each tool workflow.",
              "QAVELIX focuses on clear limits and localized guidance. Creating an account is optional and is only needed to unlock QAVELIX PRO — every tool works without one.",
            ],
          },
          {
            title: "QAVELIX PRO",
            body: [
              "Video Compressor and Extract Audio are both fully available today, for anonymous use or with a free account.",
              "QAVELIX PRO is a paid upgrade with higher daily usage limits and larger file sizes on both tools.",
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
          "The email below is the official contact channel for product questions, technical issues, privacy requests, feedback, tool suggestions, and business inquiries.",
        sections: [
          {
            title: "General contact",
            body: [
              "Email: {supportEmail}",
              "For product questions, technical issues, privacy requests, feedback, tool suggestions, business inquiries, or accessibility feedback, contact us using the email above.",
              "For upload, processing, download, or accessibility issues, include the page URL, browser, device, selected tool, and a short description of what happened. Do not send files by email unless QAVELIX specifically requests them.",
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
              "Yes. The maximum upload size is 250 MB per video on the Free plan and 500 MB on QAVELIX PRO.",
            ],
          },
          {
            title: "Can I cancel QAVELIX PRO, and are refunds available?",
            body: [
              "Yes. You can cancel your QAVELIX PRO subscription at any time from the billing portal in your account dashboard. Cancellation takes effect at the end of the current billing period, and Pro access continues until then.",
              "QAVELIX does not offer prorated refunds for partial billing periods. If you believe a charge was made in error, reach out through the Contact page.",
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
            "Read how QAVELIX processes uploaded files, file metadata, temporary files, logs, browser preferences, and Google AdSense advertising.",
        },
        eyebrow: "Privacy",
        title: "Privacy Policy",
        description:
          "This notice explains how QAVELIX handles information when you use its media tools, including the advertising Google AdSense may show.",
        sections: [
          {
            title: "Last updated",
            body: [
              "August 2, 2026.",
            ],
          },
          {
            title: "Service operator and contact",
            body: [
              "QAVELIX is the service name for this media tools platform. The operator is the person or organization that deploys and makes this instance available.",
              "Contact us at {supportEmail}.",
            ],
          },
          {
            title: "Information processed",
            body: [
              "QAVELIX processes the file you choose to upload, the file name, file size, declared file type, extension, and tool-specific technical information such as duration, codec, bitrate, resolution, frame rate, and container when relevant.",
              "Uploaded files may contain personal data if the file itself, file name, audio, visual content, or document content identifies a person.",
            ],
          },
          {
            title: "Temporary files and downloads",
            body: [
              "Uploaded files are used only for the tool action you request. Validated uploads are available for a short time so processing can start, and completed outputs are available for a limited download period.",
              "Source files and output files are removed after processing, cancellation, deletion, or expiration according to the application cleanup workflow.",
            ],
          },
          {
            title: "Logs and security data",
            body: [
              "The server may process request metadata such as IP address, user agent, requested route, request timing, and security event information to protect the service, troubleshoot errors, and prevent misuse.",
              "QAVELIX does not provide a permanent file library for uploaded media; media files are always temporary (see \"Temporary files and downloads\" above).",
            ],
          },
          {
            title: "Accounts and billing",
            body: [
              "Creating an account is optional and is only needed to use QAVELIX PRO. An account stores your email address, a securely hashed password, and your current plan.",
              "If you subscribe to QAVELIX PRO, payment is processed by Stripe. QAVELIX does not store your card details.",
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
              "QAVELIX uses Google AdSense to display advertising; see \"Advertising (Google AdSense)\" below for what that involves.",
            ],
          },
          {
            title: "Advertising (Google AdSense)",
            body: [
              "QAVELIX may show advertisements served by Google AdSense on Free and anonymous-tier tool pages. QAVELIX PRO subscribers never see ads.",
              "Google acts as a third-party advertising vendor and may use cookies — including __gads, __gpi, and IDE, and the test_cookie used to check whether your browser supports cookies — to serve ads based on your visits to this and other websites. These advertising cookies are only set after you accept them in the cookie consent banner; see the Cookies and Local Storage Policy for how that choice works.",
              "You can opt out of personalized advertising at Google Ads Settings (adssettings.google.com), or opt out of a participating vendor's use of cookies for personalized advertising at www.aboutads.info/choices. Learn more about how Google uses information from sites that use its services at policies.google.com/technologies/partner-sites.",
            ],
          },
          {
            title: "Your requests",
            body: [
              "You may contact QAVELIX to ask about privacy, access, deletion, or correction requests related to information the service may process.",
              "Because files are temporary, QAVELIX may not be able to locate a file after it has expired, been deleted, or completed cleanup.",
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
            "Read the QAVELIX Terms of Service for uploads, temporary processing, downloads, and permitted use.",
        },
        eyebrow: "Terms",
        title: "Terms of Service",
        description:
          "These terms govern use of the QAVELIX media tools platform.",
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
              "QAVELIX lets you use supported tools to upload files, request temporary processing, and download temporary outputs when processing is available.",
              "By using QAVELIX, you confirm that you own the uploaded content or have permission to process it.",
            ],
          },
          {
            title: "Permitted and prohibited use",
            body: [
              "Use QAVELIX only for lawful file processing. Do not upload content that is illegal, harmful, abusive, infringing, or that you are not allowed to process.",
              "Do not attempt to bypass upload limits, security controls, origin checks, download protections, or temporary-file cleanup.",
            ],
          },
          {
            title: "Temporary processing and user responsibility",
            body: [
              "Uploaded files and generated outputs are temporary. Keep your own original copy because QAVELIX is not a backup or storage service.",
              "Downloads may expire, and cancelled or deleted processing cannot be resumed without selecting the file again.",
            ],
          },
          {
            title: "Processing results",
            body: [
              "QAVELIX does not guarantee a specific file size, quality level, playback compatibility, output format behavior, or processing result.",
              "Tool results depend on the uploaded file, selected action, browser behavior, and server environment. Some files may not produce the expected result.",
            ],
          },
          {
            title: "Availability and changes",
            body: [
              "The service may be unavailable, interrupted, rate-limited, or changed. QAVELIX may restrict use that appears abusive or harmful to the service.",
              "You retain ownership of your content. QAVELIX receives only the permission needed to process the file you choose to upload and provide the requested output.",
            ],
          },
          {
            title: "Disclaimers and liability",
            body: [
              "QAVELIX is provided on an as-available basis without a promise that every file will process successfully or remain downloadable for a specific period beyond the displayed availability window.",
              "To the extent permitted by applicable law, QAVELIX is not responsible for lost files, lost data, failed processing, expired downloads, or indirect damages resulting from use of the service.",
            ],
          },
          {
            title: "QAVELIX PRO subscriptions and cancellation",
            body: [
              "QAVELIX PRO is a recurring monthly subscription billed through Stripe. You can cancel at any time from the billing portal in your account dashboard; access continues until the end of the current billing period, after which the account returns to the Free plan.",
              "QAVELIX does not provide prorated refunds for partial billing periods. If you believe you were charged in error, contact {supportEmail}.",
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
            "Read how QAVELIX uses localStorage for theme and cookie-consent preferences, and the cookies Google AdSense may set.",
        },
        eyebrow: "Cookies",
        title: "Cookies and Local Storage Policy",
        description:
          "This notice explains the cookies and browser storage QAVELIX uses, including cookies Google AdSense may set once you accept them.",
        sections: [
          {
            title: "Last updated",
            body: [
              "August 2, 2026.",
            ],
          },
          {
            title: "Local storage",
            body: [
              "QAVELIX stores the selected Light or Dark theme in localStorage under the key qavelix-theme so the interface can preserve your preference across page reloads.",
              "QAVELIX also stores your cookie consent choice (\"accepted\" or \"declined\") in localStorage under the key qavelix-cookie-consent — see \"Your consent choice\" below.",
              "The language is part of the URL path. QAVELIX does not store language selection in a cookie.",
            ],
          },
          {
            title: "Cookies and tracking",
            body: [
              "QAVELIX sets one strictly necessary session cookie when you sign in, solely to keep you authenticated. This cookie is always set, regardless of your cookie consent choice.",
              "QAVELIX uses Google AdSense to display advertising on Free and anonymous-tier tool pages (QAVELIX PRO subscribers never see ads). Google, as a third-party advertising vendor, may set advertising and measurement cookies — including __gads, __gpi, IDE, and test_cookie — to serve ads based on your visits to this and other websites. These cookies are not strictly necessary, and QAVELIX does not allow them to be set until you accept the cookie consent banner described below.",
            ],
          },
          {
            title: "Your consent choice",
            body: [
              "Because QAVELIX may set non-essential advertising cookies through Google AdSense, a cookie consent banner is shown to visitors who have not yet made a choice. Choosing \"Accept\" allows AdSense's advertising cookies to be set and ads to load; choosing \"Decline non-essential\" keeps only the strictly necessary session cookie described above, and no ads are loaded.",
              "You can change your mind at any time by clearing your browser's site data for QAVELIX (which removes the stored choice and shows the banner again), or by using Google's own opt-out at adssettings.google.com, independent of the QAVELIX banner.",
            ],
          },
          {
            title: "Managing storage",
            body: [
              "You can clear QAVELIX's stored preferences (theme and cookie consent choice) through your browser settings or site data controls. Clearing storage resets the theme to the default setting and shows the cookie consent banner again on your next visit.",
              "This notice will be updated if QAVELIX adds any further non-essential analytics, advertising, or third-party marketing feature beyond Google AdSense.",
            ],
          },
        ],
      },
    },
    support: {
      metadataTitle: "Support QAVELIX",
      metadataDescription:
        "Support QAVELIX's development with a voluntary one-time contribution. Completely optional — every tool stays free either way.",
      navLabel: "Support QAVELIX",
      eyebrow: "Support QAVELIX",
      title: "Help QAVELIX keep growing",
      intro:
        "QAVELIX exists to make video and audio tasks simpler, faster, and safer. If our tools have saved you time, you're welcome to support the project's development — entirely on a voluntary basis.",
      story: {
        eyebrow: "The story behind QAVELIX",
        title: "Built by an independent developer",
        paragraphs: [
          "I'm an independent developer, and I build QAVELIX with the goal of creating tools that are genuinely useful for everyday tasks.",
          "My aim is a transparent, practical, and respectful platform — no tricks to mislead people or pressure them into paying.",
          "Every tool stays free to use. Development, hosting, media processing, security, and translation all have real, ongoing costs, and voluntary support helps cover them.",
        ],
      },
      helps: {
        eyebrow: "Where support helps",
        title: "What your contribution supports",
        description: "Every contribution goes toward keeping QAVELIX reliable and improving it over time.",
        cards: [
          {
            title: "Development & improvements",
            description: "New features, fixes, and a better experience across every tool.",
          },
          {
            title: "Servers & media processing",
            description: "The compute power behind every compression and audio-extraction job.",
          },
          {
            title: "Security & infrastructure",
            description: "Keeping uploads, accounts, and payments safe and reliable.",
          },
          {
            title: "Translation & accessibility",
            description: "Making QAVELIX usable and welcoming in more languages, for more people.",
          },
        ],
      },
      transparency: {
        title: "Good to know before you contribute",
        items: [
          "Supporting QAVELIX is entirely optional — it never affects your access to any tool.",
          "A contribution doesn't unlock QAVELIX PRO or change your account's usage limits.",
          "Free access stays exactly the same, whether or not you contribute.",
          "This is a voluntary contribution, not a tax-deductible donation to a registered charity or nonprofit — QAVELIX isn't one.",
        ],
      },
      amountsTitle: "Choose an amount",
      customAmountLabel: "Or enter a custom amount (USD)",
      customAmountPlaceholder: "Amount",
      contributeButtonLabel: "Contribute",
      contributingLabel: "Redirecting to checkout...",
      secureNote: "Payment is processed securely by Stripe. QAVELIX never sees or stores your card details.",
      errorMessage: "Could not start checkout. Try again.",
      invalidAmountMessage: "Enter an amount between $1 and $500.",
      legalNote:
        "This is a voluntary contribution, not a charitable donation, and it isn't tax-deductible. Stripe emails a payment receipt after checkout.",
      closingMessage:
        "Whether you contribute or not, thank you for using QAVELIX. Every user is part of this project's growth.",
      success: {
        eyebrow: "Support QAVELIX",
        title: "Thank you for your support",
        description:
          "Your contribution helps keep QAVELIX running and improving. It doesn't change your account or plan in any way.",
        amountLabel: "Contribution: {amount}",
        returnHomeLabel: "Return to QAVELIX",
        notVerifiedTitle: "We couldn't confirm this payment",
        notVerifiedDescription:
          "If you completed checkout, this may just take a moment to confirm — check your email for a receipt from Stripe, or try the support page again.",
      },
      cancelled: {
        eyebrow: "Support QAVELIX",
        title: "Checkout cancelled",
        description: "No payment was made. You can try again whenever you'd like.",
        tryAgainLabel: "Back to Support QAVELIX",
        returnHomeLabel: "Return to QAVELIX",
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
      tools: "Ferramentas",
      toolsVideoCategory: "Vídeo",
      videoCompressorTool: "Compressor de Vídeo",
      extractAudioTool: "Extrair Áudio",
      proBadgeLabel: "Assinante QAVELIX PRO",
      languageLabel: "Selecionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Escuro",
      back: "Voltar",
      backToTop: "Ir para o topo",
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
        { value: "5", label: "Formatos aceitos" },
        { value: "3", label: "Presets de compressão" },
      ],
      maxSizeCard: {
        label: "Tamanho máximo",
        freeLabel: "Free",
        freeValue: "250 MB",
        proLabel: "Pro",
        proValue: "500 MB",
      },
      pricing: {
        eyebrow: "Preços",
        title: "Preços simples e transparentes",
        description:
          "Use o Compressor de Vídeo e o Extrair Áudio gratuitamente, ou faça upgrade para o QAVELIX PRO para limites diários maiores e arquivos maiores.",
        note: "Você também pode testar as duas ferramentas sem criar uma conta, com uma pequena cota de teste combinada.",
        plans: [
          {
            name: "Free",
            price: "$0",
            cadence: "",
            highlight: false,
            badge: null,
            features: [
              "10 compressões ou extrações por dia, por ferramenta",
              "Até 250 MB por arquivo",
              "Sem necessidade de cartão de crédito",
            ],
            cta: "Criar conta gratuita",
          },
          {
            name: "QAVELIX PRO",
            price: "$9.99",
            cadence: "/mês",
            highlight: true,
            badge: "Mais popular",
            features: [
              "100 compressões ou extrações por dia, por ferramenta",
              "Até 500 MB por arquivo",
              "Cancele quando quiser pelo portal de cobrança",
            ],
            cta: "Fazer upgrade para o PRO",
          },
        ],
      },
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
        tooLarge: "Este arquivo excede o limite de upload do seu plano.",
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
        "Formatos aceitos: MP4, MOV, AVI, WebM, M4V, MPEG e MPG.\nPlano Free: 100 KB a 250 MB por arquivo.\nPlano Pro: 100 KB a 500 MB por arquivo.\nSeu arquivo é processado com segurança e removido automaticamente após o período de retenção.",
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
      downloadFailedMessage:
        "Não foi possível iniciar o download. Tente novamente.",
      deleteLabel: "Excluir arquivo",
      ineffectiveWarning:
        "Este vídeo já está altamente comprimido. Com o preset selecionado, o QAVELIX não conseguiu gerar um arquivo menor que o original. Experimente um dos presets sugeridos abaixo para priorizar uma estratégia de compressão diferente.",
      ineffectiveRecommendationLabel: "Presets recomendados",
      predictedIncreaseWarning:
        "Este vídeo já parece estar bastante otimizado para o preset selecionado. É muito provável que a compressão aumente o tamanho do arquivo. Experimente um dos presets alternativos abaixo.",
      predictedIncreaseRecommendationLabel: "Presets com mais chance de reduzir o tamanho",
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
        tooLarge: "O arquivo selecionado excede o limite de upload do seu plano.",
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
        predictedIncrease:
          "Este preset tem grande chance de aumentar o tamanho do arquivo para este vídeo. Escolha outro preset.",
        accountRequired: "Crie uma conta gratuita para continuar usando esta ferramenta.",
        usageLimitReached: "Você atingiu o limite de uso de hoje para esta ferramenta.",
        toolUnavailableForPlan: "Esta ferramenta não está disponível no seu plano atual.",
        serviceUnavailable:
          "O serviço de uso está temporariamente indisponível. Tente novamente em instantes.",
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
    tools: {
      extractAudio: {
        eyebrow: "Extrair áudio",
        title: "Extraia áudio de vídeo",
        subtitle: "Transforme seu vídeo em um arquivo de áudio MP3 limpo, com rapidez e segurança.",
        description:
          "Envie um vídeo compatível, revise o arquivo selecionado e prepare-o para extração em MP3. O processamento será conectado na próxima etapa de desenvolvimento.",
        uploadTitle: "Solte um vídeo para extrair áudio",
        uploadDescription:
          "Escolha um arquivo de vídeo compatível para extração de áudio.\nFormatos aceitos: MP4, MOV, AVI, WebM, M4V, MPEG e MPG.\nPlano Free: 100 KB a 250 MB por arquivo.\nPlano Pro: 100 KB a 500 MB por arquivo.",
        privacyMessage:
          "Os arquivos são tratados temporariamente e removidos automaticamente após o período de disponibilidade.",
        chooseFile: "Escolher vídeo",
        chooseAnotherFile: "Escolher outro vídeo",
        statusTitle: "Extração de áudio",
        statusWaiting: "Aguardando arquivo",
        statusReady: "Arquivo pronto",
        statusInvalid: "Vídeo inválido",
        statusValidating: "Validando arquivo",
        statusUploading: "Enviando vídeo",
        statusAnalyzing: "Analisando vídeo",
        statusProcessing: "Extraindo áudio",
        statusPreparing: "Preparando download",
        statusCompleted: "Concluído",
        statusFailed: "Falha",
        statusValidAudio: "Áudio válido detectado",
        statusNoAudio: "Vídeo sem áudio",
        analysisProgressMessage: "Verificando a faixa de áudio...",
        extractionProgressMessage: "Convertendo o áudio para MP3...",
        preparingDownloadMessage: "Preparando o download...",
        selectedFile: "Arquivo selecionado",
        fileName: "Nome do arquivo",
        fileSize: "Tamanho do arquivo",
        originalFileName: "Arquivo original",
        generatedFileName: "Arquivo MP3",
        originalFileSize: "Tamanho original",
        audioFileSize: "Tamanho do áudio",
        outputFormat: "Formato de saída",
        outputFormatValue: "MP3",
        extractButton: "Extrair áudio",
        downloadButton: "Baixar",
        downloadStartedMessage: "Download iniciado com sucesso.",
        cancelButton: "Cancelar",
        deleteButton: "Excluir arquivo",
        nextStepMessage:
          "A integração do processamento de extração de áudio é a próxima etapa de desenvolvimento. Nenhum arquivo foi enviado ou processado.",
        infoTitle: "Como a extração de áudio vai funcionar",
        infoItems: [
          "Envie um arquivo de vídeo compatível.",
          "O QAVELIX extrai a faixa de áudio como arquivo MP3.",
          "Baixe o áudio quando o processamento terminar.",
          "Arquivos temporários são removidos automaticamente após o período de disponibilidade.",
        ],
        faqTitle: "Perguntas frequentes sobre extração de áudio",
        faqItems: [
          {
            question: "O que a ferramenta Extrair Áudio faz?",
            answer:
              "Ela cria um arquivo de áudio MP3 separado a partir de um vídeo enviado.",
          },
          {
            question: "Quais formatos de vídeo são aceitos?",
            answer:
              "Extrair Áudio aceita os mesmos formatos do Compressor de Vídeo: MP4, M4V, MOV, WebM, AVI, MPG e MPEG.",
          },
          {
            question: "A saída é em MP3?",
            answer: "Sim. O formato de saída é MP3.",
          },
          {
            question: "Qual é o limite de upload?",
            answer: "O limite por arquivo é de 250 MB no plano Free e 500 MB no QAVELIX PRO.",
          },
          {
            question: "Como os arquivos são tratados?",
            answer:
              "Os arquivos são temporários e removidos automaticamente após o período de disponibilidade.",
          },
        ],
        validation: {
          multipleFiles: "Escolha apenas um arquivo de vídeo por vez.",
          emptyFile: "O arquivo selecionado está vazio. Escolha outro vídeo.",
          fileTooSmall:
            "Este vídeo é pequeno demais para processamento. Escolha um vídeo de pelo menos 100 KB.",
          fileTooLarge:
            "Este vídeo excede o limite de upload de {maxSize}. Escolha um vídeo menor para continuar.",
          invalidExtension:
            "Esta extensão de arquivo não é aceita. Escolha MP4, M4V, MOV, WebM, AVI, MPG ou MPEG.",
          invalidMime:
            "Este tipo de arquivo não é aceito. Escolha um arquivo de vídeo válido.",
        },
        errors: {
          missingFile:
            "Escolha um arquivo de vídeo compatível antes de extrair o áudio.",
          emptyFile: "O arquivo selecionado está vazio. Escolha outro vídeo.",
          fileTooSmall:
            "Este vídeo é pequeno demais para processamento. Escolha um vídeo de pelo menos 100 KB.",
          fileTooLarge:
            "Este vídeo excede o limite de upload de {maxSize}. Escolha um vídeo menor para continuar.",
          unsupportedFormat:
            "Este formato de vídeo não é aceito. Escolha MP4, MOV, AVI, WebM, M4V, MPEG ou MPG.",
          invalidMedia:
            "Este arquivo está corrompido ou não é um vídeo válido. Escolha outro arquivo para continuar.",
          noAudio:
            "Este vídeo não contém uma faixa de áudio. Escolha outro vídeo com áudio para continuar.",
          silentAudio:
            "Este vídeo está sem áudio. Escolha outro vídeo com som para continuar.",
          ffprobeFailed:
            "O QAVELIX não conseguiu analisar este vídeo. Escolha outro arquivo compatível.",
          ffmpegFailed:
            "O QAVELIX não conseguiu extrair o áudio deste vídeo. Escolha outro arquivo e tente novamente.",
          analysisFailed:
            "O QAVELIX não conseguiu concluir a análise de áudio. Escolha outro vídeo ou tente novamente.",
          analysisTimeout:
            "A análise de áudio demorou demais. Escolha um vídeo mais curto ou tente novamente.",
          analysisCancelled: "A análise de áudio foi cancelada.",
          timeout:
            "A extração de áudio demorou demais. Escolha um vídeo mais curto ou tente novamente.",
          serverError:
            "A extração de áudio está temporariamente indisponível. Tente novamente em instantes.",
          downloadUnavailable:
            "Não foi possível preparar o download do MP3. Tente extrair o áudio novamente.",
          networkError:
            "Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.",
          accountRequired: "Crie uma conta gratuita para continuar usando esta ferramenta.",
          usageLimitReached: "Você atingiu o limite de uso de hoje para esta ferramenta.",
          toolUnavailableForPlan: "Esta ferramenta não está disponível no seu plano atual.",
          serviceUnavailable:
            "O serviço de uso está temporariamente indisponível. Tente novamente em instantes.",
        },
      },
    },
    auth: {
      fields: {
        nameLabel: "Nome completo",
        namePlaceholder: "Maria Silva",
        emailLabel: "Endereço de email",
        emailPlaceholder: "voce@exemplo.com",
        passwordLabel: "Senha",
        passwordPlaceholder: "Digite sua senha",
        newPasswordLabel: "Nova senha",
        newPasswordPlaceholder: "Digite uma nova senha",
        confirmPasswordLabel: "Confirmar senha",
        confirmPasswordPlaceholder: "Digite a senha novamente",
        currentPasswordLabel: "Senha atual",
        currentPasswordPlaceholder: "Digite sua senha atual",
      },
      validation: {
        nameRequired: "Digite seu nome.",
        nameTooLong: "O nome deve ter no máximo 100 caracteres.",
        emailInvalid: "Digite um endereço de email válido.",
        emailTooLong: "O email deve ter no máximo 254 caracteres.",
        passwordTooShort: "A senha deve ter pelo menos 8 caracteres.",
        passwordTooLong: "A senha deve ter no máximo 128 caracteres.",
        passwordTooWeak:
          "A senha deve incluir pelo menos uma letra maiúscula, uma letra minúscula e um caractere especial.",
        passwordMismatch: "As senhas não coincidem.",
      },
      errors: {
        invalidEmail: "Digite um endereço de email válido.",
        userAlreadyExists: "Já existe uma conta com este email.",
        invalidCredentials: "Email ou senha incorretos.",
        passwordTooShort: "A senha deve ter pelo menos 8 caracteres.",
        passwordTooLong: "A senha deve ter no máximo 128 caracteres.",
        invalidToken: "Este link é inválido. Solicite um novo.",
        tokenExpired: "Este link expirou. Solicite um novo.",
        emailAlreadyVerified: "Este email já foi verificado.",
        invalidPassword: "Sua senha atual está incorreta.",
        networkError:
          "Não foi possível concluir a solicitação. Verifique sua conexão e tente novamente.",
        unknown: "Algo deu errado. Tente novamente.",
      },
      signIn: {
        eyebrow: "Conta",
        title: "Entrar",
        description: "Entre na sua conta QAVELIX.",
        submitLabel: "Entrar",
        submittingLabel: "Entrando...",
        forgotPasswordLink: "Esqueceu sua senha?",
        noAccountPrompt: "Não tem uma conta?",
        signUpLink: "Cadastre-se",
      },
      signUp: {
        eyebrow: "Conta",
        title: "Crie sua conta",
        description: "Crie uma conta QAVELIX para começar.",
        submitLabel: "Criar conta",
        submittingLabel: "Criando conta...",
        hasAccountPrompt: "Já tem uma conta?",
        signInLink: "Entrar",
        successTitle: "Verifique seu email",
        successMessage:
          "Sua conta foi criada. Enviamos um link de verificação para o seu email.",
      },
      forgotPassword: {
        eyebrow: "Conta",
        title: "Redefina sua senha",
        description:
          "Digite seu endereço de email e enviaremos um link para redefinir sua senha.",
        submitLabel: "Enviar link de redefinição",
        submittingLabel: "Enviando...",
        successTitle: "Verifique seu email",
        successMessage:
          "Se existir uma conta com este email, um link de redefinição está a caminho.",
        backToSignInLink: "Voltar para o login",
      },
      resetPassword: {
        eyebrow: "Conta",
        title: "Defina uma nova senha",
        description: "Escolha uma nova senha para sua conta.",
        submitLabel: "Redefinir senha",
        submittingLabel: "Redefinindo...",
        successTitle: "Senha atualizada",
        successMessage:
          "Sua senha foi redefinida. Agora você pode entrar com sua nova senha.",
        successActionLabel: "Entrar",
        invalidLinkTitle: "Link inválido ou expirado",
        invalidLinkMessage:
          "Este link de redefinição de senha é inválido ou expirou. Solicite um novo para continuar.",
        requestNewLinkLabel: "Solicitar novo link",
      },
      verifyEmail: {
        eyebrow: "Conta",
        title: "Verifique seu email",
        verifiedTitle: "Email verificado",
        verifiedMessage: "Seu endereço de email foi verificado.",
        verifiedNoSessionMessage: "Seu endereço de email foi verificado. Entre para continuar.",
        goToSignInLabel: "Ir para o login",
        differentAccountTitle: "Uma conta diferente está conectada",
        differentAccountMessage:
          "{email} acabou de ser verificado, mas você está conectado no momento com uma conta QAVELIX diferente.",
        differentAccountMessageGeneric:
          "Seu endereço de email acabou de ser verificado, mas você está conectado no momento com uma conta QAVELIX diferente.",
        signOutAndSignInLabel: "Entrar com a conta verificada",
        signingOutLabel: "Saindo...",
        signOutErrorMessage: "Não foi possível sair. Tente novamente.",
        verificationFailedTitle: "Falha na verificação",
        pendingTitle: "Verifique seu email",
        pendingMessage:
          "Enviamos um link de verificação para o seu email. Abra-o para verificar sua conta.",
        resendButton: "Reenviar email de verificação",
        resendingLabel: "Enviando...",
        resendSuccessMessage: "Email de verificação enviado. Verifique sua caixa de entrada.",
        goHomeLabel: "Ir para a página inicial",
      },
      accountMenu: {
        openLabel: "Conta",
        dashboardLabel: "Painel",
        signedInAsLabel: "Conectado como",
        signOutLabel: "Sair",
        signingOutLabel: "Saindo...",
      },
      guestNav: {
        signInLabel: "Entrar",
        signUpLabel: "Registrar-se",
      },
    },
    upgradeModal: {
      title: "Você atingiu o limite diário do plano Gratuito",
      description:
        "Você já usou todos os processamentos gratuitos de hoje para esta ferramenta. Faça upgrade para o Pro para continuar agora mesmo, com limites maiores e arquivos maiores.",
      freeTierName: "Gratuito",
      proTierName: "Pro",
      usesPerDay: "{limit} usos por dia",
      uploadSize: "Até {maxSize} por arquivo",
      upgradeButtonLabel: "Fazer upgrade para o Pro",
      checkoutPendingLabel: "Redirecionando para o checkout...",
      checkoutErrorMessage: "Não foi possível iniciar o checkout. Tente novamente.",
      emailVerificationRequiredMessage:
        "Verifique seu endereço de email antes de fazer upgrade para o Pro. Confira sua caixa de entrada para o link de verificação, ou solicite um novo.",
      dismissLabel: "Agora não",
      closeLabel: "Fechar",
    },
    planComparisonModal: {
      title: "Você atingiu o limite do teste gratuito",
      description:
        "Você já usou todos os processamentos gratuitos anônimos disponíveis. Crie uma conta gratuita para continuar hoje, ou conheça o que o QAVELIX PRO oferece a mais.",
      anonymousTierName: "Sem conta",
      usesLifetime: "{limit} usos no total",
      createAccountLabel: "Criar conta gratuita",
      signInLabel: "Entrar",
    },
    adGateModal: {
      title: "Seu próximo uso está a um anúncio de distância",
      description:
        "Seu primeiro uso hoje foi totalmente gratuito. Assista a este anúncio curto para liberar o processamento novamente, ou pule os anúncios com o QAVELIX PRO.",
      countdownLabel: "Continuar em {seconds}s...",
      readyLabel: "Tudo pronto — continue quando quiser.",
      continueLabel: "Continuar",
      upsellMessage: "Remova os anúncios e libere uploads ilimitados de até 500MB com o QAVELIX PRO.",
      upgradeButtonLabel: "Fazer upgrade para o Pro",
    },
    cookieConsentBanner: {
      ariaLabel: "Consentimento de cookies",
      message:
        "O QAVELIX usa um cookie de sessão estritamente necessário para o login e, se você aceitar, o Google AdSense pode definir cookies de publicidade para exibir anúncios nas páginas dos planos Gratuito e anônimo. O QAVELIX PRO é sempre livre de anúncios.",
      learnMoreLabel: "Leia nossa Política de Cookies",
      acceptLabel: "Aceitar",
      declineLabel: "Recusar não essenciais",
    },
    dashboard: {
      nav: {
        navLabel: "Navegação do painel",
        overview: "Visão geral",
        usage: "Uso",
        plan: "Plano",
        billing: "Faturamento",
        settings: "Configurações",
      },
      overview: {
        eyebrow: "Painel",
        title: "Visão geral",
        description: "Um resumo rápido da sua conta e ferramentas.",
        welcomeGreeting: "Bem-vindo",
        welcomeFallbackName: "você",
        accountSummary: {
          title: "Sua conta",
          emailLabel: "Email",
          verifiedLabel: "Verificado",
          unverifiedLabel: "Não verificado",
          membershipLabel: "Assinatura",
          freeAccountLabel: "Gratuito",
          proAccountLabel: "Pro",
        },
        tools: {
          title: "Suas ferramentas",
          videoCompressorLabel: "Compressor de Vídeo",
          videoCompressorDescription: "Comprima vídeos de forma rápida e segura.",
          extractAudioLabel: "Extrair Áudio",
          extractAudioDescription: "Extraia a trilha de áudio de um vídeo como MP3.",
          openLabel: "Abrir",
        },
      },
      usage: {
        eyebrow: "Painel",
        title: "Uso",
        description: "Uso de hoje para cada ferramenta no seu plano atual.",
        toolLabels: {
          "video-compressor": "Compressor de Vídeo",
          "extract-audio": "Extrair Áudio",
        },
        usedOfLimitDayLabel: "{used} de {limit} usados hoje",
        usedOfLimitLifetimeLabel: "{used} de {limit} usados",
        limitReachedLabel: "Limite atingido",
        unavailableMessage:
          "Os dados de uso estão temporariamente indisponíveis. Tente novamente em instantes.",
      },
      plan: {
        eyebrow: "Painel",
        title: "Plano",
        description: "Seu plano atual e os limites de cada ferramenta.",
        currentPlanLabel: "Plano atual",
        freePlanName: "Gratuito",
        proPlanName: "Pro",
        dailyLimitLabel: "{limit} usos por dia",
        uploadLimitLabel: "Até {maxSize} por arquivo",
        upgradeBadge: "Em breve",
        upgradeTitle: "Fazer upgrade para o Pro",
        upgradeDescription: "Os planos Pro ainda não estão disponíveis para compra. Volte em breve.",
        priceLabel: "{price} / mês",
        upgradeButtonLabel: "Fazer upgrade para o Pro",
        checkoutPendingLabel: "Redirecionando para o checkout...",
        checkoutErrorMessage: "Não foi possível iniciar o checkout. Tente novamente.",
        manageBillingLabel: "Gerenciar cobrança",
        manageSubscriptionLabel: "Gerenciar assinatura",
        portalPendingLabel: "Abrindo o portal de cobrança...",
        portalErrorMessage: "Não foi possível abrir o portal de cobrança. Tente novamente.",
        emailVerificationRequiredMessage:
          "Verifique seu endereço de email antes de gerenciar sua assinatura ou pagamentos. Confira sua caixa de entrada para o link de verificação, ou solicite um novo.",
        verificationBannerMessage:
          "Verifique seu endereço de email para gerenciar sua assinatura ou pagamentos.",
        verificationBannerActionLabel: "Verificar email",
        billingStatusLabel: "Cobrança",
        renewsOnLabel: "Renova em {date}",
        cancelsOnLabel: "O acesso termina em {date}",
        checkoutSuccessMessage: "Agora você está no plano Pro.",
        checkoutCancelledMessage: "O checkout foi cancelado. Você continua no plano Gratuito.",
        comparisonTitle: "Compare os planos",
        currentPlanBadge: "Plano atual",
        proActiveBadge: "Ativo",
        activationPendingTitle: "Ativando sua assinatura...",
        activationPendingMessage:
          "Estamos confirmando seu pagamento com o Stripe. Isso costuma levar apenas alguns segundos.",
        activationStillPendingMessage:
          "Ainda estamos confirmando sua assinatura. Atualize a página em instantes ou entre em contato com o suporte caso o problema persista.",
        refreshStatusLabel: "Atualizar status",
        welcome: {
          title: "🎉 Bem-vindo ao QAVELIX PRO!",
          intro: "Obrigado por apoiar o QAVELIX.",
          supportMessage:
            "Sua assinatura ajuda diretamente a melhorar a plataforma e a desenvolver novas ferramentas.",
          goalMessage: "Nosso objetivo é economizar seu tempo e facilitar seu dia a dia.",
          benefitsTitle: "O que você desbloqueou",
          ctaLabel: "Ir para as ferramentas",
          closeLabel: "Fechar",
        },
      },
      billing: {
        description: "Gerencie sua assinatura, forma de pagamento e faturas.",
      },
      billingAddress: {
        title: "Endereço de cobrança",
        description:
          "Este endereço fica armazenado na Stripe e é usado nas suas faturas. Digite um CEP para tentar preencher cidade e estado automaticamente.",
        streetLabel: "Endereço",
        streetPlaceholder: "Nome da rua",
        numberLabel: "Número",
        numberPlaceholder: "Número da casa/prédio",
        complementLabel: "Complemento (opcional)",
        complementPlaceholder: "Apto, bloco, unidade",
        postalCodeLabel: "CEP",
        postalCodePlaceholder: "CEP",
        cityLabel: "Cidade",
        stateLabel: "Estado",
        countryLabel: "País",
        saveLabel: "Salvar endereço",
        savingLabel: "Salvando...",
        successMessage: "Seu endereço de cobrança foi salvo.",
        errorMessage: "Não foi possível salvar seu endereço de cobrança. Tente novamente.",
        notConfiguredMessage: "O faturamento ainda não está configurado.",
        lookupLoadingLabel: "Buscando endereço...",
        lookupSuccessLabel: "Cidade e estado preenchidos a partir do CEP.",
        lookupNotFoundLabel: "Nenhum endereço encontrado para este CEP — preencha manualmente.",
        lookupErrorLabel: "Não foi possível consultar este CEP — preencha o endereço manualmente.",
      },
      settings: {
        eyebrow: "Configurações",
        title: "Configurações da conta",
        description: "Gerencie seu perfil, aparência, idioma e segurança da conta.",
        profile: {
          title: "Perfil",
          nameLabel: "Nome",
          namePlaceholder: "Seu nome",
          emailLabel: "Email",
          emailReadOnlyNote:
            "Alterar o email requer verificação e ainda não está disponível — entre em contato com o suporte se precisar atualizá-lo.",
          saveLabel: "Salvar alterações",
          savingLabel: "Salvando...",
          successMessage: "Seu perfil foi atualizado.",
        },
        appearance: {
          title: "Aparência",
          description: "Escolha a aparência do QAVELIX neste dispositivo.",
        },
        language: {
          title: "Idioma",
          description: "Escolha seu idioma preferido. Isso mantém você na página atual.",
        },
        security: {
          title: "Segurança",
          changePasswordLabel: "Alterar senha",
          changingPasswordLabel: "Alterando senha...",
          passwordChangedMessage: "Sua senha foi alterada.",
          oauthOnlyNote: "Sua conta entra por meio de um provedor externo e não possui senha para alterar.",
        },
        account: {
          title: "Conta",
          signOutLabel: "Sair",
          signingOutLabel: "Saindo...",
        },
        billing: {
          title: "Faturamento",
          description: "Gerencie sua assinatura e dados de pagamento.",
          manageLabel: "Ir para Faturamento",
        },
      },
      placeholder: {
        comingSoonBadge: "Em breve",
        billingTitle: "Faturamento",
        billingDescription:
          "O histórico de faturamento e as formas de pagamento aparecerão aqui em uma atualização futura.",
        settingsTitle: "Configurações",
        settingsDescription:
          "As configurações da conta aparecerão aqui em uma atualização futura.",
      },
      loading: "Carregando seu painel...",
      error: {
        title: "Algo deu errado",
        description: "Não foi possível carregar seu painel. Tente novamente.",
        retryLabel: "Tentar novamente",
      },
    },
    pages: {
      about: {
        label: "Sobre",
        metadata: {
          title: "Sobre o QAVELIX",
          description:
            "Conheça como funcionam o Compressor de Vídeo e o Extrair Áudio do QAVELIX.",
        },
        eyebrow: "Sobre",
        title: "Ferramentas de mídia práticas, criadas para clareza",
        description:
          "O QAVELIX é uma plataforma de ferramentas de mídia focadas, pensada para resolver tarefas de arquivo do dia a dia com menos atrito.",
        sections: [
          {
            title: "O que o QAVELIX faz",
            body: [
              "O QAVELIX oferece atualmente o Compressor de Vídeo e o Extrair Áudio, duas ferramentas de mídia focadas que você usa diretamente no navegador.",
              "As duas ferramentas foram pensadas para parecer simples, não técnicas: envie um arquivo, revise os detalhes, escolha uma opção e baixe o resultado.",
            ],
          },
          {
            title: "Processamento com foco em privacidade",
            body: [
              "Os arquivos enviados são tratados como arquivos temporários de processamento. Arquivos de origem e resultados gerados são removidos após processamento, cancelamento, exclusão ou expiração conforme o fluxo de cada ferramenta.",
              "O QAVELIX prioriza limites claros e orientação localizada. Criar uma conta é opcional e só é necessário para desbloquear o QAVELIX PRO — todas as ferramentas funcionam sem conta.",
            ],
          },
          {
            title: "QAVELIX PRO",
            body: [
              "O Compressor de Vídeo e o Extrair Áudio já estão totalmente disponíveis hoje, para uso anônimo ou com uma conta gratuita.",
              "O QAVELIX PRO é um upgrade pago com limites diários mais altos e arquivos maiores nas duas ferramentas.",
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
          "O email abaixo é o canal oficial para dúvidas sobre produtos, problemas técnicos, solicitações de privacidade, feedback, sugestões de ferramentas e contatos comerciais.",
        sections: [
          {
            title: "Contato geral",
            body: [
              "Email: {supportEmail}",
              "Para dúvidas sobre produtos, problemas técnicos, solicitações de privacidade, feedback, sugestões de ferramentas, contatos comerciais ou acessibilidade, entre em contato pelo email acima.",
              "Para problemas de upload, processamento, download ou acessibilidade, inclua a URL da página, navegador, dispositivo, ferramenta selecionada e uma breve descrição do ocorrido. Não envie arquivos por email, a menos que o QAVELIX solicite especificamente.",
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
              "Sim. O tamanho máximo de upload é 250 MB por vídeo no plano Free e 500 MB no QAVELIX PRO.",
            ],
          },
          {
            title: "Posso cancelar o QAVELIX PRO, e existem reembolsos?",
            body: [
              "Sim. Você pode cancelar sua assinatura do QAVELIX PRO a qualquer momento pelo portal de cobrança no seu painel de conta. O cancelamento tem efeito no fim do período de cobrança atual, e o acesso PRO continua até lá.",
              "O QAVELIX não oferece reembolsos proporcionais por períodos parciais de cobrança. Se você acredita que uma cobrança foi feita por engano, entre em contato pela página de Contato.",
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
            "Entenda como o QAVELIX processa arquivos enviados, metadados técnicos, arquivos temporários, logs, preferências do navegador e publicidade do Google AdSense.",
        },
        eyebrow: "Privacidade",
        title: "Política de Privacidade",
        description:
          "Este aviso explica como o QAVELIX trata informações quando você usa suas ferramentas de mídia, incluindo a publicidade que o Google AdSense pode exibir.",
        sections: [
          {
            title: "Última atualização",
            body: [
              "2 de agosto de 2026.",
            ],
          },
          {
            title: "Operador do serviço e contato",
            body: [
              "QAVELIX é o nome do serviço desta plataforma de ferramentas de mídia. O operador é a pessoa ou organização que implanta e disponibiliza esta instância.",
              "Entre em contato pelo email {supportEmail}.",
            ],
          },
          {
            title: "Informações processadas",
            body: [
              "O QAVELIX processa o arquivo que você escolhe enviar, nome do arquivo, tamanho, tipo declarado, extensão e informações técnicas específicas da ferramenta, como duração, codec, taxa de bits, resolução, taxa de quadros e contêiner quando aplicável.",
              "Arquivos enviados podem conter dados pessoais se o próprio arquivo, nome, áudio, conteúdo visual ou conteúdo de documento identificar uma pessoa.",
            ],
          },
          {
            title: "Arquivos temporários e downloads",
            body: [
              "Arquivos enviados são usados apenas para a ação da ferramenta solicitada. Uploads validados ficam disponíveis por pouco tempo para iniciar o processamento, e resultados concluídos ficam disponíveis por um período limitado de download.",
              "Arquivos de origem e saída são removidos após processamento, cancelamento, exclusão ou expiração conforme o fluxo de limpeza do aplicativo.",
            ],
          },
          {
            title: "Logs e dados de segurança",
            body: [
              "O servidor pode processar metadados de requisição, como endereço IP, agente do usuário, rota acessada, horários e eventos de segurança para proteger o serviço, investigar erros e evitar abuso.",
              "O QAVELIX não oferece biblioteca permanente de arquivos enviados; os arquivos de mídia são sempre temporários (veja \"Arquivos temporários e downloads\" acima).",
            ],
          },
          {
            title: "Contas e cobrança",
            body: [
              "Criar uma conta é opcional e só é necessário para usar o QAVELIX PRO. Uma conta armazena seu email, uma senha protegida por hash e seu plano atual.",
              "Se você assinar o QAVELIX PRO, o pagamento é processado pela Stripe. O QAVELIX não armazena os dados do seu cartão.",
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
              "O QAVELIX usa o Google AdSense para exibir publicidade; veja \"Publicidade (Google AdSense)\" abaixo para entender o que isso envolve.",
            ],
          },
          {
            title: "Publicidade (Google AdSense)",
            body: [
              "O QAVELIX pode exibir anúncios fornecidos pelo Google AdSense nas páginas de ferramentas dos planos Gratuito e anônimo. Assinantes do QAVELIX PRO nunca veem anúncios.",
              "O Google atua como fornecedor de publicidade terceirizado e pode usar cookies — incluindo __gads, __gpi e IDE, além do test_cookie, usado para verificar se o navegador aceita cookies — para exibir anúncios com base nas suas visitas a este e a outros sites. Esses cookies de publicidade só são definidos depois que você os aceita no banner de consentimento de cookies; veja a Política de Cookies e Armazenamento Local para saber como essa escolha funciona.",
              "Você pode desativar a publicidade personalizada nas Configurações de anúncios do Google (adssettings.google.com), ou recusar o uso de cookies para publicidade personalizada por fornecedores participantes em www.aboutads.info/choices. Saiba mais sobre como o Google usa informações de sites que utilizam seus serviços em policies.google.com/technologies/partner-sites.",
            ],
          },
          {
            title: "Suas solicitações",
            body: [
              "Você pode entrar em contato com o QAVELIX para tratar de privacidade, acesso, exclusão ou correção de informações que o serviço possa processar.",
              "Como os arquivos são temporários, talvez o QAVELIX não consiga localizar um arquivo depois de expirado, excluído ou removido pelo fluxo de limpeza.",
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
            "Leia os Termos de Serviço do QAVELIX para uploads, processamento temporário, downloads e uso permitido.",
        },
        eyebrow: "Termos",
        title: "Termos de Serviço",
        description:
          "Estes termos regem o uso da plataforma de ferramentas de mídia QAVELIX.",
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
              "O QAVELIX permite usar ferramentas compatíveis para enviar arquivos, solicitar processamento temporário e baixar resultados temporários quando o processamento estiver disponível.",
              "Ao usar o QAVELIX, você confirma que é titular do conteúdo enviado ou tem permissão para processá-lo.",
            ],
          },
          {
            title: "Uso permitido e proibido",
            body: [
              "Use o QAVELIX apenas para processamento lícito de arquivos. Não envie conteúdo ilegal, prejudicial, abusivo, infrator ou que você não tenha autorização para processar.",
              "Não tente contornar limites de upload, controles de segurança, verificações de origem, proteções de download ou limpeza de arquivos temporários.",
            ],
          },
          {
            title: "Processamento temporário e responsabilidade do usuário",
            body: [
              "Arquivos enviados e resultados gerados são temporários. Mantenha sua própria cópia original, pois o QAVELIX não é serviço de backup ou armazenamento.",
              "Downloads podem expirar, e processamentos cancelados ou excluídos não podem ser retomados sem selecionar o arquivo novamente.",
            ],
          },
          {
            title: "Resultados de processamento",
            body: [
              "O QAVELIX não garante tamanho específico, nível de qualidade, compatibilidade de reprodução, comportamento de formato de saída ou resultado de processamento.",
              "Os resultados dependem do arquivo enviado, ação selecionada, comportamento do navegador e ambiente do servidor. Alguns arquivos podem não produzir o resultado esperado.",
            ],
          },
          {
            title: "Disponibilidade e alterações",
            body: [
              "O serviço pode ficar indisponível, ser interrompido, limitado ou alterado. O QAVELIX pode restringir usos que pareçam abusivos ou prejudiciais ao serviço.",
              "Você mantém a titularidade do seu conteúdo. O QAVELIX recebe apenas a permissão necessária para processar o arquivo escolhido e fornecer a saída solicitada.",
            ],
          },
          {
            title: "Isenções e responsabilidade",
            body: [
              "O QAVELIX é fornecido conforme disponível, sem promessa de que todo arquivo será processado com sucesso ou ficará disponível para download além da janela exibida.",
              "Na medida permitida pela lei aplicável, o QAVELIX não se responsabiliza por arquivos perdidos, dados perdidos, falha de processamento, downloads expirados ou danos indiretos decorrentes do uso do serviço.",
            ],
          },
          {
            title: "Assinaturas do QAVELIX PRO e cancelamento",
            body: [
              "O QAVELIX PRO é uma assinatura mensal recorrente cobrada através da Stripe. Você pode cancelar a qualquer momento pelo portal de cobrança no seu painel de conta; o acesso continua até o fim do período de cobrança atual, após o qual a conta volta ao plano Free.",
              "O QAVELIX não oferece reembolsos proporcionais por períodos parciais de cobrança. Se você acredita que foi cobrado por engano, entre em contato pelo email {supportEmail}.",
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
            "Entenda como o QAVELIX usa localStorage para preferências de tema e consentimento de cookies, e quais cookies o Google AdSense pode definir.",
        },
        eyebrow: "Cookies",
        title: "Política de Cookies e Armazenamento Local",
        description:
          "Este aviso explica os cookies e o armazenamento de navegador que o QAVELIX usa, incluindo os cookies que o Google AdSense pode definir depois que você os aceitar.",
        sections: [
          {
            title: "Última atualização",
            body: [
              "2 de agosto de 2026.",
            ],
          },
          {
            title: "Armazenamento local",
            body: [
              "O QAVELIX armazena o tema Claro ou Escuro selecionado no localStorage com a chave qavelix-theme para preservar sua preferência entre recarregamentos de página.",
              "O QAVELIX também armazena sua escolha de consentimento de cookies (\"aceito\" ou \"recusado\") no localStorage com a chave qavelix-cookie-consent — veja \"Sua escolha de consentimento\" abaixo.",
              "O idioma faz parte do caminho da URL. O QAVELIX não armazena a seleção de idioma em cookie.",
            ],
          },
          {
            title: "Cookies e rastreamento",
            body: [
              "O QAVELIX define um cookie de sessão estritamente necessário quando você entra na conta, apenas para manter você autenticado. Esse cookie é sempre definido, independentemente da sua escolha de consentimento.",
              "O QAVELIX usa o Google AdSense para exibir publicidade nas páginas de ferramentas dos planos Gratuito e anônimo (assinantes do QAVELIX PRO nunca veem anúncios). O Google, como fornecedor de publicidade terceirizado, pode definir cookies de publicidade e medição — incluindo __gads, __gpi, IDE e test_cookie — para exibir anúncios com base nas suas visitas a este e a outros sites. Esses cookies não são estritamente necessários, e o QAVELIX não permite que sejam definidos até que você aceite o banner de consentimento de cookies descrito abaixo.",
            ],
          },
          {
            title: "Sua escolha de consentimento",
            body: [
              "Como o QAVELIX pode definir cookies de publicidade não essenciais através do Google AdSense, um banner de consentimento de cookies é exibido para visitantes que ainda não fizeram uma escolha. Escolher \"Aceitar\" permite que os cookies de publicidade do AdSense sejam definidos e que os anúncios sejam carregados; escolher \"Recusar não essenciais\" mantém apenas o cookie de sessão estritamente necessário descrito acima, e nenhum anúncio é carregado.",
              "Você pode mudar de ideia a qualquer momento limpando os dados do site do QAVELIX no seu navegador (o que remove a escolha armazenada e exibe o banner novamente), ou usando o próprio mecanismo de exclusão do Google em adssettings.google.com, independentemente do banner do QAVELIX.",
            ],
          },
          {
            title: "Como gerenciar o armazenamento",
            body: [
              "Você pode limpar as preferências armazenadas do QAVELIX (tema e escolha de consentimento de cookies) nas configurações do navegador ou nos controles de dados do site. Ao limpar esse armazenamento, o tema volta ao padrão e o banner de consentimento de cookies é exibido novamente na sua próxima visita.",
              "Este aviso será atualizado se o QAVELIX adicionar qualquer outro recurso não essencial de analytics, publicidade ou marketing de terceiros além do Google AdSense.",
            ],
          },
        ],
      },
    },
    support: {
      metadataTitle: "Apoie o QAVELIX",
      metadataDescription:
        "Apoie o desenvolvimento do QAVELIX com uma contribuição voluntária única. Totalmente opcional — todas as ferramentas continuam gratuitas de qualquer forma.",
      navLabel: "Apoie o QAVELIX",
      eyebrow: "Apoie o QAVELIX",
      title: "Ajude o QAVELIX a continuar crescendo",
      intro:
        "O QAVELIX nasceu para tornar tarefas com vídeo e áudio mais simples, rápidas e seguras. Se nossas ferramentas já ajudaram você a economizar tempo, você pode colaborar voluntariamente com a evolução do projeto.",
      story: {
        eyebrow: "A história por trás do QAVELIX",
        title: "Construído por um desenvolvedor independente",
        paragraphs: [
          "Sou um desenvolvedor independente e construo o QAVELIX com o objetivo de criar ferramentas realmente úteis para o dia a dia.",
          "Quero desenvolver uma plataforma transparente, prática e respeitosa, sem truques para enganar usuários ou pressioná-los a pagar.",
          "Todas as ferramentas continuam gratuitas. Desenvolvimento, hospedagem, processamento de mídia, segurança e tradução têm custos reais e contínuos, e o apoio voluntário ajuda a cobri-los.",
        ],
      },
      helps: {
        eyebrow: "Onde o apoio ajuda",
        title: "Para onde vai sua contribuição",
        description: "Cada contribuição ajuda a manter o QAVELIX confiável e a evoluir com o tempo.",
        cards: [
          {
            title: "Desenvolvimento e melhorias",
            description: "Novos recursos, correções e uma experiência melhor em todas as ferramentas.",
          },
          {
            title: "Servidores e processamento de mídia",
            description: "O poder de processamento por trás de cada compressão e extração de áudio.",
          },
          {
            title: "Segurança e infraestrutura",
            description: "Manter uploads, contas e pagamentos seguros e confiáveis.",
          },
          {
            title: "Traduções e acessibilidade",
            description: "Tornar o QAVELIX utilizável e acolhedor em mais idiomas, para mais pessoas.",
          },
        ],
      },
      transparency: {
        title: "Bom saber antes de contribuir",
        items: [
          "Apoiar o QAVELIX é totalmente opcional — isso nunca afeta seu acesso a nenhuma ferramenta.",
          "Uma contribuição não libera o QAVELIX PRO nem altera os limites de uso da sua conta.",
          "O acesso gratuito continua exatamente o mesmo, com ou sem contribuição.",
          "Esta é uma contribuição voluntária, não uma doação dedutível de impostos para uma instituição de caridade registrada — o QAVELIX não é uma.",
        ],
      },
      amountsTitle: "Escolha um valor",
      customAmountLabel: "Ou digite um valor personalizado (USD)",
      customAmountPlaceholder: "Valor",
      contributeButtonLabel: "Contribuir",
      contributingLabel: "Redirecionando para o checkout...",
      secureNote: "O pagamento é processado com segurança pela Stripe. O QAVELIX nunca vê nem armazena os dados do seu cartão.",
      errorMessage: "Não foi possível iniciar o checkout. Tente novamente.",
      invalidAmountMessage: "Digite um valor entre US$ 1 e US$ 500.",
      legalNote:
        "Esta é uma contribuição voluntária, não uma doação beneficente, e não é dedutível de impostos. A Stripe envia um recibo de pagamento por email após o checkout.",
      closingMessage:
        "Independentemente de você contribuir ou não, obrigado por usar o QAVELIX. Cada usuário faz parte do crescimento deste projeto.",
      success: {
        eyebrow: "Apoie o QAVELIX",
        title: "Obrigado pelo seu apoio",
        description:
          "Sua contribuição ajuda a manter o QAVELIX funcionando e evoluindo. Ela não altera sua conta ou seu plano de forma alguma.",
        amountLabel: "Contribuição: {amount}",
        returnHomeLabel: "Voltar ao QAVELIX",
        notVerifiedTitle: "Não foi possível confirmar este pagamento",
        notVerifiedDescription:
          "Se você concluiu o checkout, a confirmação pode levar um instante — verifique seu email em busca de um recibo da Stripe, ou tente novamente na página de apoio.",
      },
      cancelled: {
        eyebrow: "Apoie o QAVELIX",
        title: "Checkout cancelado",
        description: "Nenhum pagamento foi feito. Você pode tentar novamente quando quiser.",
        tryAgainLabel: "Voltar para Apoie o QAVELIX",
        returnHomeLabel: "Voltar ao QAVELIX",
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
      tools: "Herramientas",
      toolsVideoCategory: "Video",
      videoCompressorTool: "Compresor de video",
      extractAudioTool: "Extraer audio",
      proBadgeLabel: "Suscriptor de QAVELIX PRO",
      languageLabel: "Seleccionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Oscuro",
      back: "Volver",
      backToTop: "Ir arriba",
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
        { value: "5", label: "Formatos compatibles" },
        { value: "3", label: "Ajustes de compresión" },
      ],
      maxSizeCard: {
        label: "Tamaño máximo",
        freeLabel: "Free",
        freeValue: "250 MB",
        proLabel: "Pro",
        proValue: "500 MB",
      },
      pricing: {
        eyebrow: "Precios",
        title: "Precios simples y transparentes",
        description:
          "Usa Compresor de Video y Extraer Audio de forma gratuita, o mejora a QAVELIX PRO para límites diarios más altos y archivos más grandes.",
        note: "También puedes probar ambas herramientas sin crear una cuenta, con una pequeña cuota de prueba combinada.",
        plans: [
          {
            name: "Free",
            price: "$0",
            cadence: "",
            highlight: false,
            badge: null,
            features: [
              "10 compresiones o extracciones al día, por herramienta",
              "Hasta 250 MB por archivo",
              "No se requiere tarjeta de crédito",
            ],
            cta: "Crear cuenta gratuita",
          },
          {
            name: "QAVELIX PRO",
            price: "$9.99",
            cadence: "/mes",
            highlight: true,
            badge: "Más popular",
            features: [
              "100 compresiones o extracciones al día, por herramienta",
              "Hasta 500 MB por archivo",
              "Cancela cuando quieras desde el portal de facturación",
            ],
            cta: "Mejorar a PRO",
          },
        ],
      },
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
        tooLarge: "Este archivo supera el límite de carga de tu plan.",
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
        "Formatos admitidos: MP4, MOV, AVI, WebM, M4V, MPEG y MPG.\nPlan Free: 100 KB a 250 MB por archivo.\nPlan Pro: 100 KB a 500 MB por archivo.\nTu archivo se procesa de forma segura y se elimina automáticamente después del periodo de retención.",
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
      downloadFailedMessage:
        "No se pudo iniciar la descarga. Inténtalo de nuevo.",
      deleteLabel: "Eliminar archivo",
      ineffectiveWarning:
        "Este vídeo ya está muy comprimido. Con el ajuste seleccionado, QAVELIX no ha podido generar un archivo más pequeño que el original. Prueba uno de los ajustes sugeridos para priorizar otra estrategia de compresión.",
      ineffectiveRecommendationLabel: "Ajustes recomendados",
      predictedIncreaseWarning:
        "Este vídeo ya parece estar muy optimizado para el ajuste seleccionado. Es muy probable que la compresión aumente el tamaño del archivo. Prueba uno de los ajustes alternativos a continuación.",
      predictedIncreaseRecommendationLabel: "Ajustes con más probabilidad de reducir el tamaño",
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
        tooLarge: "El archivo seleccionado supera el límite de carga de tu plan.",
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
        predictedIncrease:
          "Es muy probable que este ajuste aumente el tamaño del archivo para este vídeo. Elige otro ajuste.",
        accountRequired: "Crea una cuenta gratuita para seguir usando esta herramienta.",
        usageLimitReached: "Has alcanzado el límite de uso de hoy para esta herramienta.",
        toolUnavailableForPlan: "Esta herramienta no está disponible en tu plan actual.",
        serviceUnavailable:
          "El servicio de uso no está disponible temporalmente. Inténtalo de nuevo en unos instantes.",
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
    tools: {
      extractAudio: {
        eyebrow: "Extraer audio",
        title: "Extrae audio de video",
        subtitle: "Convierte tu video en un archivo de audio MP3 limpio, rápido y seguro.",
        description:
          "Sube un video compatible, revisa el archivo seleccionado y prepáralo para la extracción en MP3. El procesamiento se conectará en la siguiente fase de desarrollo.",
        uploadTitle: "Suelta un video para extraer el audio",
        uploadDescription:
          "Elige un archivo de video compatible para extraer el audio.\nFormatos admitidos: MP4, MOV, AVI, WebM, M4V, MPEG y MPG.\nPlan Free: 100 KB a 250 MB por archivo.\nPlan Pro: 100 KB a 500 MB por archivo.",
        privacyMessage:
          "Los archivos se gestionan temporalmente y se eliminan automáticamente después del periodo de disponibilidad.",
        chooseFile: "Elegir video",
        chooseAnotherFile: "Elegir otro video",
        statusTitle: "Extracción de audio",
        statusWaiting: "Esperando archivo",
        statusReady: "Archivo listo",
        statusInvalid: "Vídeo inválido",
        statusValidating: "Validando archivo",
        statusUploading: "Subiendo video",
        statusAnalyzing: "Analizando video",
        statusProcessing: "Extrayendo audio",
        statusPreparing: "Preparando descarga",
        statusCompleted: "Completado",
        statusFailed: "Error",
        statusValidAudio: "Audio válido detectado",
        statusNoAudio: "Video sin audio",
        analysisProgressMessage: "Verificando la pista de audio...",
        extractionProgressMessage: "Convirtiendo el audio a MP3...",
        preparingDownloadMessage: "Preparando la descarga...",
        selectedFile: "Archivo seleccionado",
        fileName: "Nombre del archivo",
        fileSize: "Tamaño del archivo",
        originalFileName: "Archivo original",
        generatedFileName: "Archivo MP3",
        originalFileSize: "Tamaño original",
        audioFileSize: "Tamaño del audio",
        outputFormat: "Formato de salida",
        outputFormatValue: "MP3",
        extractButton: "Extraer audio",
        downloadButton: "Descargar",
        downloadStartedMessage: "La descarga se inició correctamente.",
        cancelButton: "Cancelar",
        deleteButton: "Eliminar archivo",
        nextStepMessage:
          "La integración del procesamiento de extracción de audio es el siguiente paso de desarrollo. Todavía no se ha subido ni procesado ningún archivo.",
        infoTitle: "Cómo funcionará Extraer audio",
        infoItems: [
          "Sube un archivo de video compatible.",
          "QAVELIX extrae la pista de audio como archivo MP3.",
          "Descarga el audio cuando finalice el procesamiento.",
          "Los archivos temporales se eliminan automáticamente después del periodo de disponibilidad.",
        ],
        faqTitle: "Preguntas frecuentes sobre Extraer audio",
        faqItems: [
          {
            question: "¿Qué hace Extraer audio?",
            answer:
              "Crea un archivo de audio MP3 separado a partir de un video subido.",
          },
          {
            question: "¿Qué formatos de video son compatibles?",
            answer:
              "Extraer audio admite los mismos formatos que el Compresor de video: MP4, M4V, MOV, WebM, AVI, MPG y MPEG.",
          },
          {
            question: "¿La salida es MP3?",
            answer: "Sí. El formato de salida es MP3.",
          },
          {
            question: "¿Cuál es el límite de subida?",
            answer: "El límite por archivo es de 250 MB en el plan Free y 500 MB en QAVELIX PRO.",
          },
          {
            question: "¿Cómo se gestionan los archivos?",
            answer:
              "Los archivos son temporales y se eliminan automáticamente después del periodo de disponibilidad.",
          },
        ],
        validation: {
          multipleFiles: "Elige un solo archivo de video cada vez.",
          emptyFile: "El archivo seleccionado está vacío. Elige otro video.",
          fileTooSmall:
            "Este video es demasiado pequeño para procesarlo. Elige un video de al menos 100 KB.",
          fileTooLarge:
            "Este video supera el límite de subida de {maxSize}. Elige un video más pequeño para continuar.",
          invalidExtension:
            "Esta extensión de archivo no es compatible. Elige MP4, M4V, MOV, WebM, AVI, MPG o MPEG.",
          invalidMime:
            "Este tipo de archivo no es compatible. Elige un archivo de video válido.",
        },
        errors: {
          missingFile:
            "Elige un archivo de video compatible antes de extraer el audio.",
          emptyFile: "El archivo seleccionado está vacío. Elige otro video.",
          fileTooSmall:
            "Este video es demasiado pequeño para procesarlo. Elige un video de al menos 100 KB.",
          fileTooLarge:
            "Este video supera el límite de subida de {maxSize}. Elige un video más pequeño para continuar.",
          unsupportedFormat:
            "Este formato de video no es compatible. Elige MP4, MOV, AVI, WebM, M4V, MPEG o MPG.",
          invalidMedia:
            "Este archivo está dañado o no es un video válido. Elige otro archivo para continuar.",
          noAudio:
            "Este video no contiene una pista de audio. Elige otro video con audio para continuar.",
          silentAudio:
            "Este video está sin audio. Elige otro video con sonido para continuar.",
          ffprobeFailed:
            "QAVELIX no ha podido analizar este video. Elige otro archivo compatible.",
          ffmpegFailed:
            "QAVELIX no ha podido extraer el audio de este video. Elige otro archivo e inténtalo de nuevo.",
          analysisFailed:
            "QAVELIX no ha podido completar el análisis de audio. Elige otro video o inténtalo de nuevo.",
          analysisTimeout:
            "El análisis de audio ha tardado demasiado. Elige un video más corto o inténtalo de nuevo.",
          analysisCancelled: "El análisis de audio se ha cancelado.",
          timeout:
            "La extracción de audio ha tardado demasiado. Elige un video más corto o inténtalo de nuevo.",
          serverError:
            "La extracción de audio no está disponible temporalmente. Inténtalo de nuevo en unos instantes.",
          downloadUnavailable:
            "No se ha podido preparar la descarga del MP3. Intenta extraer el audio de nuevo.",
          networkError:
            "No se ha podido completar la solicitud. Comprueba tu conexión e inténtalo de nuevo.",
          accountRequired: "Crea una cuenta gratuita para seguir usando esta herramienta.",
          usageLimitReached: "Has alcanzado el límite de uso de hoy para esta herramienta.",
          toolUnavailableForPlan: "Esta herramienta no está disponible en tu plan actual.",
          serviceUnavailable:
            "El servicio de uso no está disponible temporalmente. Inténtalo de nuevo en unos instantes.",
        },
      },
    },
    auth: {
      fields: {
        nameLabel: "Nombre completo",
        namePlaceholder: "María García",
        emailLabel: "Correo electrónico",
        emailPlaceholder: "tu@ejemplo.com",
        passwordLabel: "Contraseña",
        passwordPlaceholder: "Introduce tu contraseña",
        newPasswordLabel: "Nueva contraseña",
        newPasswordPlaceholder: "Introduce una nueva contraseña",
        confirmPasswordLabel: "Confirmar contraseña",
        confirmPasswordPlaceholder: "Introduce la contraseña de nuevo",
        currentPasswordLabel: "Contraseña actual",
        currentPasswordPlaceholder: "Introduce tu contraseña actual",
      },
      validation: {
        nameRequired: "Introduce tu nombre.",
        nameTooLong: "El nombre debe tener 100 caracteres como máximo.",
        emailInvalid: "Introduce un correo electrónico válido.",
        emailTooLong: "El correo electrónico debe tener 254 caracteres como máximo.",
        passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
        passwordTooLong: "La contraseña debe tener 128 caracteres como máximo.",
        passwordTooWeak:
          "La contraseña debe incluir al menos una letra mayúscula, una letra minúscula y un carácter especial.",
        passwordMismatch: "Las contraseñas no coinciden.",
      },
      errors: {
        invalidEmail: "Introduce un correo electrónico válido.",
        userAlreadyExists: "Ya existe una cuenta con este correo electrónico.",
        invalidCredentials: "Correo electrónico o contraseña incorrectos.",
        passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
        passwordTooLong: "La contraseña debe tener 128 caracteres como máximo.",
        invalidToken: "Este enlace no es válido. Solicita uno nuevo.",
        tokenExpired: "Este enlace ha caducado. Solicita uno nuevo.",
        emailAlreadyVerified: "Este correo electrónico ya está verificado.",
        invalidPassword: "Tu contraseña actual es incorrecta.",
        networkError:
          "No se ha podido completar la solicitud. Comprueba tu conexión e inténtalo de nuevo.",
        unknown: "Algo salió mal. Inténtalo de nuevo.",
      },
      signIn: {
        eyebrow: "Cuenta",
        title: "Iniciar sesión",
        description: "Inicia sesión en tu cuenta de QAVELIX.",
        submitLabel: "Iniciar sesión",
        submittingLabel: "Iniciando sesión...",
        forgotPasswordLink: "¿Olvidaste tu contraseña?",
        noAccountPrompt: "¿No tienes una cuenta?",
        signUpLink: "Regístrate",
      },
      signUp: {
        eyebrow: "Cuenta",
        title: "Crea tu cuenta",
        description: "Crea una cuenta de QAVELIX para empezar.",
        submitLabel: "Crear cuenta",
        submittingLabel: "Creando cuenta...",
        hasAccountPrompt: "¿Ya tienes una cuenta?",
        signInLink: "Iniciar sesión",
        successTitle: "Revisa tu correo",
        successMessage:
          "Tu cuenta se ha creado. Te hemos enviado un enlace de verificación a tu correo electrónico.",
      },
      forgotPassword: {
        eyebrow: "Cuenta",
        title: "Restablece tu contraseña",
        description:
          "Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.",
        submitLabel: "Enviar enlace",
        submittingLabel: "Enviando...",
        successTitle: "Revisa tu correo",
        successMessage:
          "Si existe una cuenta con este correo electrónico, un enlace de restablecimiento está en camino.",
        backToSignInLink: "Volver a iniciar sesión",
      },
      resetPassword: {
        eyebrow: "Cuenta",
        title: "Establece una nueva contraseña",
        description: "Elige una nueva contraseña para tu cuenta.",
        submitLabel: "Restablecer contraseña",
        submittingLabel: "Restableciendo...",
        successTitle: "Contraseña actualizada",
        successMessage:
          "Tu contraseña se ha restablecido. Ya puedes iniciar sesión con tu nueva contraseña.",
        successActionLabel: "Iniciar sesión",
        invalidLinkTitle: "Enlace no válido o caducado",
        invalidLinkMessage:
          "Este enlace de restablecimiento de contraseña no es válido o ha caducado. Solicita uno nuevo para continuar.",
        requestNewLinkLabel: "Solicitar un nuevo enlace",
      },
      verifyEmail: {
        eyebrow: "Cuenta",
        title: "Verifica tu correo",
        verifiedTitle: "Correo verificado",
        verifiedMessage: "Tu correo electrónico ha sido verificado.",
        verifiedNoSessionMessage: "Tu correo electrónico ha sido verificado. Inicia sesión para continuar.",
        goToSignInLabel: "Ir a iniciar sesión",
        differentAccountTitle: "Hay una cuenta diferente conectada",
        differentAccountMessage:
          "{email} acaba de ser verificado, pero actualmente tienes la sesión iniciada con una cuenta QAVELIX diferente.",
        differentAccountMessageGeneric:
          "Tu correo electrónico acaba de ser verificado, pero actualmente tienes la sesión iniciada con una cuenta QAVELIX diferente.",
        signOutAndSignInLabel: "Iniciar sesión con la cuenta verificada",
        signingOutLabel: "Cerrando sesión...",
        signOutErrorMessage: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
        verificationFailedTitle: "Verificación fallida",
        pendingTitle: "Verifica tu correo",
        pendingMessage:
          "Te hemos enviado un enlace de verificación a tu correo electrónico. Ábrelo para verificar tu cuenta.",
        resendButton: "Reenviar correo de verificación",
        resendingLabel: "Enviando...",
        resendSuccessMessage: "Correo de verificación enviado. Revisa tu bandeja de entrada.",
        goHomeLabel: "Ir a la página de inicio",
      },
      accountMenu: {
        openLabel: "Cuenta",
        dashboardLabel: "Panel",
        signedInAsLabel: "Sesión iniciada como",
        signOutLabel: "Cerrar sesión",
        signingOutLabel: "Cerrando sesión...",
      },
      guestNav: {
        signInLabel: "Iniciar sesión",
        signUpLabel: "Registrarse",
      },
    },
    upgradeModal: {
      title: "Alcanzaste el límite diario del plan Gratis",
      description:
        "Ya usaste todos los procesamientos gratuitos de hoy para esta herramienta. Actualiza a Pro para continuar ahora mismo, con límites más altos y archivos más grandes.",
      freeTierName: "Gratis",
      proTierName: "Pro",
      usesPerDay: "{limit} usos por día",
      uploadSize: "Hasta {maxSize} por archivo",
      upgradeButtonLabel: "Actualizar a Pro",
      checkoutPendingLabel: "Redirigiendo al checkout...",
      checkoutErrorMessage: "No se pudo iniciar el checkout. Inténtalo de nuevo.",
      emailVerificationRequiredMessage:
        "Verifica tu correo electrónico antes de actualizar a Pro. Revisa tu bandeja de entrada para el enlace de verificación, o solicita uno nuevo.",
      dismissLabel: "Ahora no",
      closeLabel: "Cerrar",
    },
    planComparisonModal: {
      title: "Alcanzaste el límite de la prueba gratuita",
      description:
        "Ya usaste todos los procesamientos gratuitos anónimos disponibles. Crea una cuenta gratuita para continuar hoy, o descubre lo que ofrece QAVELIX PRO.",
      anonymousTierName: "Sin cuenta",
      usesLifetime: "{limit} usos en total",
      createAccountLabel: "Crear cuenta gratuita",
      signInLabel: "Iniciar sesión",
    },
    adGateModal: {
      title: "Tu próximo uso está a un anuncio de distancia",
      description:
        "Tu primer uso de hoy fue completamente gratis. Mira este breve anuncio para desbloquear el procesamiento otra vez, o evita los anuncios con QAVELIX PRO.",
      countdownLabel: "Continuar en {seconds}s...",
      readyLabel: "Todo listo — continúa cuando quieras.",
      continueLabel: "Continuar",
      upsellMessage: "Elimina los anuncios y desbloquea subidas ilimitadas de hasta 500MB con QAVELIX PRO.",
      upgradeButtonLabel: "Actualizar a Pro",
    },
    cookieConsentBanner: {
      ariaLabel: "Consentimiento de cookies",
      message:
        "QAVELIX usa una cookie de sesión estrictamente necesaria para iniciar sesión y, si aceptas, Google AdSense puede establecer cookies publicitarias para mostrar anuncios en las páginas de los planes Gratis y anónimo. QAVELIX PRO siempre está libre de anuncios.",
      learnMoreLabel: "Lee nuestra Política de Cookies",
      acceptLabel: "Aceptar",
      declineLabel: "Rechazar no esenciales",
    },
    dashboard: {
      nav: {
        navLabel: "Navegación del panel",
        overview: "Resumen",
        usage: "Uso",
        plan: "Plan",
        billing: "Facturación",
        settings: "Configuración",
      },
      overview: {
        eyebrow: "Panel",
        title: "Resumen",
        description: "Un vistazo rápido a tu cuenta y herramientas.",
        welcomeGreeting: "Bienvenido",
        welcomeFallbackName: "de nuevo",
        accountSummary: {
          title: "Tu cuenta",
          emailLabel: "Correo electrónico",
          verifiedLabel: "Verificado",
          unverifiedLabel: "No verificado",
          membershipLabel: "Membresía",
          freeAccountLabel: "Gratis",
          proAccountLabel: "Pro",
        },
        tools: {
          title: "Tus herramientas",
          videoCompressorLabel: "Compresor de Video",
          videoCompressorDescription: "Comprime videos de forma rápida y segura.",
          extractAudioLabel: "Extraer Audio",
          extractAudioDescription: "Extrae la pista de audio de un video como MP3.",
          openLabel: "Abrir",
        },
      },
      usage: {
        eyebrow: "Panel",
        title: "Uso",
        description: "Uso de hoy para cada herramienta en tu plan actual.",
        toolLabels: {
          "video-compressor": "Compresor de Video",
          "extract-audio": "Extraer Audio",
        },
        usedOfLimitDayLabel: "{used} de {limit} usados hoy",
        usedOfLimitLifetimeLabel: "{used} de {limit} usados",
        limitReachedLabel: "Límite alcanzado",
        unavailableMessage:
          "Los datos de uso no están disponibles temporalmente. Inténtalo de nuevo en unos instantes.",
      },
      plan: {
        eyebrow: "Panel",
        title: "Plan",
        description: "Tu plan actual y los límites de cada herramienta.",
        currentPlanLabel: "Plan actual",
        freePlanName: "Gratis",
        proPlanName: "Pro",
        dailyLimitLabel: "{limit} usos por día",
        uploadLimitLabel: "Hasta {maxSize} por archivo",
        upgradeBadge: "Próximamente",
        upgradeTitle: "Actualizar a Pro",
        upgradeDescription: "Los planes Pro aún no están disponibles para comprar. Vuelve pronto.",
        priceLabel: "{price} / mes",
        upgradeButtonLabel: "Actualizar a Pro",
        checkoutPendingLabel: "Redirigiendo al checkout...",
        checkoutErrorMessage: "No se pudo iniciar el checkout. Inténtalo de nuevo.",
        manageBillingLabel: "Gestionar facturación",
        manageSubscriptionLabel: "Gestionar suscripción",
        portalPendingLabel: "Abriendo el portal de facturación...",
        portalErrorMessage: "No se pudo abrir el portal de facturación. Inténtalo de nuevo.",
        emailVerificationRequiredMessage:
          "Verifica tu correo electrónico antes de gestionar tu suscripción o pagos. Revisa tu bandeja de entrada para el enlace de verificación, o solicita uno nuevo.",
        verificationBannerMessage:
          "Verifica tu correo electrónico para gestionar tu suscripción o pagos.",
        verificationBannerActionLabel: "Verificar correo",
        billingStatusLabel: "Facturación",
        renewsOnLabel: "Se renueva el {date}",
        cancelsOnLabel: "El acceso termina el {date}",
        checkoutSuccessMessage: "Ahora tienes el plan Pro.",
        checkoutCancelledMessage: "El checkout se canceló. Sigues en el plan Gratis.",
        comparisonTitle: "Compara los planes",
        currentPlanBadge: "Plan actual",
        proActiveBadge: "Activo",
        activationPendingTitle: "Activando tu suscripción...",
        activationPendingMessage:
          "Estamos confirmando tu pago con Stripe. Esto suele tardar solo unos segundos.",
        activationStillPendingMessage:
          "Todavía estamos confirmando tu suscripción. Actualiza la página en un momento o contacta con soporte si esto continúa.",
        refreshStatusLabel: "Actualizar estado",
        welcome: {
          title: "🎉 ¡Bienvenido a QAVELIX PRO!",
          intro: "Gracias por apoyar a QAVELIX.",
          supportMessage:
            "Tu suscripción ayuda directamente a mejorar la plataforma y a desarrollar nuevas herramientas.",
          goalMessage: "Nuestro objetivo es ahorrarte tiempo y facilitar tu día a día.",
          benefitsTitle: "Lo que has desbloqueado",
          ctaLabel: "Ir a las herramientas",
          closeLabel: "Cerrar",
        },
      },
      billing: {
        description: "Gestiona tu suscripción, método de pago y facturas.",
      },
      billingAddress: {
        title: "Dirección de facturación",
        description:
          "Esta dirección se guarda en Stripe y se usa en tus facturas. Introduce un código postal para intentar completar la ciudad y el estado.",
        streetLabel: "Dirección",
        streetPlaceholder: "Nombre de la calle",
        numberLabel: "Número",
        numberPlaceholder: "Número de la casa/edificio",
        complementLabel: "Piso, apartamento (opcional)",
        complementPlaceholder: "Piso, apto, unidad",
        postalCodeLabel: "Código postal",
        postalCodePlaceholder: "Código postal",
        cityLabel: "Ciudad",
        stateLabel: "Estado / provincia",
        countryLabel: "País",
        saveLabel: "Guardar dirección",
        savingLabel: "Guardando...",
        successMessage: "Tu dirección de facturación se ha guardado.",
        errorMessage: "No se pudo guardar tu dirección de facturación. Inténtalo de nuevo.",
        notConfiguredMessage: "La facturación aún no está configurada.",
        lookupLoadingLabel: "Buscando dirección...",
        lookupSuccessLabel: "Ciudad y estado completados a partir del código postal.",
        lookupNotFoundLabel: "No se encontró ninguna dirección para este código postal — introdúcela manualmente.",
        lookupErrorLabel: "No se pudo consultar este código postal — introduce la dirección manualmente.",
      },
      settings: {
        eyebrow: "Configuración",
        title: "Configuración de la cuenta",
        description: "Gestiona tu perfil, apariencia, idioma y seguridad de la cuenta.",
        profile: {
          title: "Perfil",
          nameLabel: "Nombre",
          namePlaceholder: "Tu nombre",
          emailLabel: "Correo electrónico",
          emailReadOnlyNote:
            "Cambiar el correo electrónico requiere verificación y aún no está disponible — contacta con soporte si necesitas actualizarlo.",
          saveLabel: "Guardar cambios",
          savingLabel: "Guardando...",
          successMessage: "Tu perfil se ha actualizado.",
        },
        appearance: {
          title: "Apariencia",
          description: "Elige cómo se ve QAVELIX en este dispositivo.",
        },
        language: {
          title: "Idioma",
          description: "Elige tu idioma preferido. Esto te mantiene en la página actual.",
        },
        security: {
          title: "Seguridad",
          changePasswordLabel: "Cambiar contraseña",
          changingPasswordLabel: "Cambiando contraseña...",
          passwordChangedMessage: "Tu contraseña se ha cambiado.",
          oauthOnlyNote: "Tu cuenta inicia sesión mediante un proveedor externo y no tiene contraseña para cambiar.",
        },
        account: {
          title: "Cuenta",
          signOutLabel: "Cerrar sesión",
          signingOutLabel: "Cerrando sesión...",
        },
        billing: {
          title: "Facturación",
          description: "Gestiona tu suscripción y datos de pago.",
          manageLabel: "Ir a Facturación",
        },
      },
      placeholder: {
        comingSoonBadge: "Próximamente",
        billingTitle: "Facturación",
        billingDescription:
          "El historial de facturación y los métodos de pago aparecerán aquí en una futura actualización.",
        settingsTitle: "Configuración",
        settingsDescription:
          "La configuración de la cuenta aparecerá aquí en una futura actualización.",
      },
      loading: "Cargando tu panel...",
      error: {
        title: "Algo salió mal",
        description: "No se pudo cargar tu panel. Inténtalo de nuevo.",
        retryLabel: "Inténtalo de nuevo",
      },
    },
    pages: {
      about: {
        label: "Acerca de",
        metadata: {
          title: "Acerca de QAVELIX",
          description:
            "Descubre cómo funcionan el Compresor de Video y Extraer Audio de QAVELIX.",
        },
        eyebrow: "Acerca de",
        title: "Herramientas multimedia prácticas, creadas para aportar claridad",
        description:
          "QAVELIX es una plataforma de herramientas multimedia enfocadas, pensada para resolver tareas cotidianas con archivos de forma más sencilla.",
        sections: [
          {
            title: "Qué hace QAVELIX",
            body: [
              "QAVELIX ofrece actualmente el Compresor de Video y Extraer Audio, dos herramientas multimedia enfocadas que puedes usar directamente en el navegador.",
              "Ambas herramientas están pensadas para sentirse sencillas, no técnicas: sube un archivo, revisa sus detalles, elige una opción y descarga el resultado.",
            ],
          },
          {
            title: "Procesamiento con enfoque de privacidad",
            body: [
              "Los archivos subidos se tratan como archivos temporales de procesamiento. Los archivos de origen y los resultados generados se eliminan tras el procesamiento, la cancelación, la eliminación o la caducidad según el flujo de cada herramienta.",
              "QAVELIX prioriza límites claros y orientación localizada. Crear una cuenta es opcional y solo se necesita para desbloquear QAVELIX PRO: todas las herramientas funcionan sin cuenta.",
            ],
          },
          {
            title: "QAVELIX PRO",
            body: [
              "El Compresor de Video y Extraer Audio ya están totalmente disponibles hoy, para uso anónimo o con una cuenta gratuita.",
              "QAVELIX PRO es una mejora de pago con límites diarios más altos y archivos más grandes en ambas herramientas.",
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
          "El correo indicado abajo es el canal oficial para preguntas sobre producto, problemas técnicos, solicitudes de privacidad, comentarios, sugerencias de herramientas y consultas comerciales.",
        sections: [
          {
            title: "Contacto general",
            body: [
              "Email: {supportEmail}",
              "Para preguntas sobre producto, problemas técnicos, solicitudes de privacidad, comentarios, sugerencias de herramientas, consultas comerciales o accesibilidad, contáctanos mediante el correo anterior.",
              "Para problemas de subida, procesamiento, descarga o accesibilidad, incluye la URL de la página, navegador, dispositivo, herramienta seleccionada y una breve descripción de lo ocurrido. No envíes archivos por email salvo que QAVELIX lo solicite expresamente.",
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
              "Sí. El tamaño máximo de carga es de 250 MB por video en el plan Free y 500 MB en QAVELIX PRO.",
            ],
          },
          {
            title: "¿Puedo cancelar QAVELIX PRO, y hay reembolsos disponibles?",
            body: [
              "Sí. Puedes cancelar tu suscripción a QAVELIX PRO en cualquier momento desde el portal de facturación en tu panel de cuenta. La cancelación entra en vigor al final del período de facturación actual, y el acceso PRO continúa hasta entonces.",
              "QAVELIX no ofrece reembolsos prorrateados por períodos de facturación parciales. Si crees que se realizó un cargo por error, contáctanos a través de la página de Contacto.",
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
            "Consulta cómo QAVELIX procesa archivos subidos, metadatos técnicos, archivos temporales, registros, preferencias del navegador y la publicidad de Google AdSense.",
        },
        eyebrow: "Privacidad",
        title: "Política de Privacidad",
        description:
          "Este aviso explica cómo QAVELIX gestiona información cuando usas sus herramientas multimedia, incluida la publicidad que puede mostrar Google AdSense.",
        sections: [
          {
            title: "Última actualización",
            body: [
              "2 de agosto de 2026.",
            ],
          },
          {
            title: "Operador del servicio y contacto",
            body: [
              "QAVELIX es el nombre del servicio de esta plataforma de herramientas multimedia. El operador es la persona u organización que despliega y pone disponible esta instancia.",
              "Contáctanos en {supportEmail}.",
            ],
          },
          {
            title: "Información procesada",
            body: [
              "QAVELIX procesa el archivo que eliges subir, nombre, tamaño, tipo declarado, extensión e información técnica específica de la herramienta, como duración, códec, tasa de bits, resolución, frecuencia de fotogramas y contenedor cuando corresponda.",
              "Los archivos subidos pueden contener datos personales si el propio archivo, el nombre, el audio, el contenido visual o el contenido de un documento identifica a una persona.",
            ],
          },
          {
            title: "Archivos temporales y descargas",
            body: [
              "Los archivos subidos se usan solo para la acción de herramienta que solicitas. Las cargas validadas están disponibles durante poco tiempo para iniciar el procesamiento, y los resultados completados quedan disponibles durante un periodo limitado de descarga.",
              "Los archivos de origen y salida se eliminan tras el procesamiento, la cancelación, la eliminación o la caducidad según el flujo de limpieza de la aplicación.",
            ],
          },
          {
            title: "Registros y datos de seguridad",
            body: [
              "El servidor puede procesar metadatos de solicitud como dirección IP, agente de usuario, ruta solicitada, horarios e información de eventos de seguridad para proteger el servicio, solucionar errores y prevenir abusos.",
              "QAVELIX no ofrece una biblioteca permanente de archivos subidos; los archivos multimedia son siempre temporales (consulta \"Archivos temporales y descargas\" más arriba).",
            ],
          },
          {
            title: "Cuentas y facturación",
            body: [
              "Crear una cuenta es opcional y solo se necesita para usar QAVELIX PRO. Una cuenta almacena tu correo electrónico, una contraseña protegida con hash y tu plan actual.",
              "Si te suscribes a QAVELIX PRO, el pago lo procesa Stripe. QAVELIX no almacena los datos de tu tarjeta.",
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
              "QAVELIX usa Google AdSense para mostrar publicidad; consulta \"Publicidad (Google AdSense)\" más abajo para saber qué implica.",
            ],
          },
          {
            title: "Publicidad (Google AdSense)",
            body: [
              "QAVELIX puede mostrar anuncios servidos por Google AdSense en las páginas de herramientas de los planes Gratis y anónimo. Los suscriptores de QAVELIX PRO nunca ven anuncios.",
              "Google actúa como proveedor de publicidad externo y puede usar cookies — incluidas __gads, __gpi e IDE, además de test_cookie, usada para comprobar si tu navegador admite cookies — para mostrar anuncios según tus visitas a este sitio y a otros. Estas cookies publicitarias solo se establecen después de que las aceptes en el banner de consentimiento de cookies; consulta la Política de Cookies y Almacenamiento Local para saber cómo funciona esa elección.",
              "Puedes desactivar la publicidad personalizada en la Configuración de anuncios de Google (adssettings.google.com), o rechazar el uso de cookies para publicidad personalizada por parte de proveedores participantes en www.aboutads.info/choices. Obtén más información sobre cómo usa Google la información de los sitios que utilizan sus servicios en policies.google.com/technologies/partner-sites.",
            ],
          },
          {
            title: "Tus solicitudes",
            body: [
              "Puedes contactar con QAVELIX para consultas de privacidad, acceso, eliminación o corrección relacionadas con información que el servicio pueda procesar.",
              "Como los archivos son temporales, es posible que QAVELIX no pueda localizar un archivo después de que haya caducado, se haya eliminado o se haya limpiado.",
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
            "Lee los Términos de Servicio de QAVELIX para subidas, procesamiento temporal, descargas y uso permitido.",
        },
        eyebrow: "Términos",
        title: "Términos de Servicio",
        description:
          "Estos términos regulan el uso de la plataforma de herramientas multimedia QAVELIX.",
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
              "QAVELIX permite usar herramientas compatibles para subir archivos, solicitar procesamiento temporal y descargar resultados temporales cuando el procesamiento está disponible.",
              "Al usar QAVELIX, confirmas que eres titular del contenido subido o tienes permiso para procesarlo.",
            ],
          },
          {
            title: "Uso permitido y prohibido",
            body: [
              "Usa QAVELIX solo para procesamiento lícito de archivos. No subas contenido ilegal, perjudicial, abusivo, infractor o que no estés autorizado a procesar.",
              "No intentes eludir límites de carga, controles de seguridad, comprobaciones de origen, protecciones de descarga o limpieza de archivos temporales.",
            ],
          },
          {
            title: "Procesamiento temporal y responsabilidad del usuario",
            body: [
              "Los archivos subidos y los resultados generados son temporales. Conserva tu propia copia original, porque QAVELIX no es un servicio de copia de seguridad ni almacenamiento.",
              "Las descargas pueden caducar, y los procesamientos cancelados o eliminados no pueden reanudarse sin seleccionar el archivo de nuevo.",
            ],
          },
          {
            title: "Resultados de procesamiento",
            body: [
              "QAVELIX no garantiza un tamaño de archivo concreto, nivel de calidad, compatibilidad de reproducción, comportamiento del formato de salida ni resultado de procesamiento.",
              "Los resultados dependen del archivo subido, la acción seleccionada, el comportamiento del navegador y el entorno del servidor. Algunos archivos pueden no producir el resultado esperado.",
            ],
          },
          {
            title: "Disponibilidad y cambios",
            body: [
              "El servicio puede no estar disponible, sufrir interrupciones, limitarse o cambiar. QAVELIX puede restringir usos que parezcan abusivos o perjudiciales para el servicio.",
              "Conservas la titularidad de tu contenido. QAVELIX recibe solo el permiso necesario para procesar el archivo elegido y proporcionar la salida solicitada.",
            ],
          },
          {
            title: "Exenciones y responsabilidad",
            body: [
              "QAVELIX se proporciona según disponibilidad, sin prometer que todos los archivos se procesarán correctamente ni que permanecerán descargables más allá de la ventana de disponibilidad indicada.",
              "En la medida permitida por la ley aplicable, QAVELIX no responde por archivos perdidos, datos perdidos, fallos de procesamiento, descargas caducadas ni daños indirectos derivados del uso del servicio.",
            ],
          },
          {
            title: "Suscripciones a QAVELIX PRO y cancelación",
            body: [
              "QAVELIX PRO es una suscripción mensual recurrente facturada a través de Stripe. Puedes cancelar en cualquier momento desde el portal de facturación en tu panel de cuenta; el acceso continúa hasta el final del período de facturación actual, tras el cual la cuenta vuelve al plan Free.",
              "QAVELIX no ofrece reembolsos prorrateados por períodos de facturación parciales. Si crees que se te cobró por error, contáctanos en {supportEmail}.",
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
            "Consulta cómo QAVELIX usa localStorage para las preferencias de tema y consentimiento de cookies, y qué cookies puede establecer Google AdSense.",
        },
        eyebrow: "Cookies",
        title: "Política de Cookies y Almacenamiento Local",
        description:
          "Este aviso explica las cookies y el almacenamiento del navegador que usa QAVELIX, incluidas las cookies que Google AdSense puede establecer una vez que las aceptes.",
        sections: [
          {
            title: "Última actualización",
            body: [
              "2 de agosto de 2026.",
            ],
          },
          {
            title: "Almacenamiento local",
            body: [
              "QAVELIX almacena el tema Claro u Oscuro seleccionado en localStorage con la clave qavelix-theme para conservar tu preferencia entre recargas de página.",
              "QAVELIX también almacena tu elección de consentimiento de cookies (\"aceptado\" o \"rechazado\") en localStorage con la clave qavelix-cookie-consent — consulta \"Tu elección de consentimiento\" más abajo.",
              "El idioma forma parte de la ruta de la URL. QAVELIX no guarda la selección de idioma en una cookie.",
            ],
          },
          {
            title: "Cookies y seguimiento",
            body: [
              "QAVELIX establece una cookie de sesión estrictamente necesaria cuando inicias sesión, únicamente para mantenerte autenticado. Esta cookie siempre se establece, independientemente de tu elección de consentimiento.",
              "QAVELIX usa Google AdSense para mostrar publicidad en las páginas de herramientas de los planes Gratis y anónimo (los suscriptores de QAVELIX PRO nunca ven anuncios). Google, como proveedor de publicidad externo, puede establecer cookies de publicidad y medición — incluidas __gads, __gpi, IDE y test_cookie — para mostrar anuncios según tus visitas a este sitio y a otros. Estas cookies no son estrictamente necesarias, y QAVELIX no permite que se establezcan hasta que aceptes el banner de consentimiento de cookies descrito a continuación.",
            ],
          },
          {
            title: "Tu elección de consentimiento",
            body: [
              "Como QAVELIX puede establecer cookies publicitarias no esenciales a través de Google AdSense, se muestra un banner de consentimiento de cookies a los visitantes que aún no han hecho una elección. Elegir \"Aceptar\" permite que se establezcan las cookies publicitarias de AdSense y que se carguen los anuncios; elegir \"Rechazar no esenciales\" conserva solo la cookie de sesión estrictamente necesaria descrita arriba, y no se carga ningún anuncio.",
              "Puedes cambiar de opinión en cualquier momento borrando los datos del sitio de QAVELIX en tu navegador (lo que elimina la elección almacenada y muestra el banner de nuevo), o usando la propia opción de exclusión de Google en adssettings.google.com, independientemente del banner de QAVELIX.",
            ],
          },
          {
            title: "Cómo gestionar el almacenamiento",
            body: [
              "Puedes borrar las preferencias almacenadas de QAVELIX (tema y elección de consentimiento de cookies) desde la configuración del navegador o los controles de datos del sitio. Al borrar ese almacenamiento, el tema vuelve al valor predeterminado y el banner de consentimiento de cookies se muestra de nuevo en tu próxima visita.",
              "Este aviso se actualizará si QAVELIX añade alguna otra función no esencial de analítica, publicidad o marketing de terceros además de Google AdSense.",
            ],
          },
        ],
      },
    },
    support: {
      metadataTitle: "Apoya a QAVELIX",
      metadataDescription:
        "Apoya el desarrollo de QAVELIX con una contribución voluntaria única. Totalmente opcional — todas las herramientas siguen siendo gratuitas de todos modos.",
      navLabel: "Apoya a QAVELIX",
      eyebrow: "Apoya a QAVELIX",
      title: "Ayuda a que QAVELIX siga creciendo",
      intro:
        "QAVELIX nació para hacer que las tareas de video y audio sean más simples, rápidas y seguras. Si nuestras herramientas ya te han ayudado a ahorrar tiempo, puedes colaborar voluntariamente con la evolución del proyecto.",
      story: {
        eyebrow: "La historia detrás de QAVELIX",
        title: "Creado por un desarrollador independiente",
        paragraphs: [
          "Soy un desarrollador independiente y construyo QAVELIX con el objetivo de crear herramientas realmente útiles para el día a día.",
          "Quiero desarrollar una plataforma transparente, práctica y respetuosa, sin trucos para engañar a los usuarios ni presionarlos a pagar.",
          "Todas las herramientas siguen siendo gratuitas. El desarrollo, el alojamiento, el procesamiento de medios, la seguridad y la traducción tienen costos reales y constantes, y el apoyo voluntario ayuda a cubrirlos.",
        ],
      },
      helps: {
        eyebrow: "Dónde ayuda tu apoyo",
        title: "A dónde va tu contribución",
        description: "Cada contribución ayuda a mantener QAVELIX confiable y a mejorarlo con el tiempo.",
        cards: [
          {
            title: "Desarrollo y mejoras",
            description: "Nuevas funciones, correcciones y una mejor experiencia en todas las herramientas.",
          },
          {
            title: "Servidores y procesamiento de medios",
            description: "La capacidad de cómputo detrás de cada compresión y extracción de audio.",
          },
          {
            title: "Seguridad e infraestructura",
            description: "Mantener seguros y confiables los archivos, las cuentas y los pagos.",
          },
          {
            title: "Traducciones y accesibilidad",
            description: "Hacer que QAVELIX sea usable y accesible en más idiomas, para más personas.",
          },
        ],
      },
      transparency: {
        title: "Antes de contribuir, ten en cuenta",
        items: [
          "Apoyar a QAVELIX es totalmente opcional — nunca afecta tu acceso a ninguna herramienta.",
          "Una contribución no desbloquea QAVELIX PRO ni cambia los límites de uso de tu cuenta.",
          "El acceso gratuito sigue siendo exactamente el mismo, contribuyas o no.",
          "Esta es una contribución voluntaria, no una donación deducible de impuestos a una organización benéfica registrada — QAVELIX no lo es.",
        ],
      },
      amountsTitle: "Elige un monto",
      customAmountLabel: "O introduce un monto personalizado (USD)",
      customAmountPlaceholder: "Monto",
      contributeButtonLabel: "Contribuir",
      contributingLabel: "Redirigiendo al checkout...",
      secureNote: "El pago se procesa de forma segura con Stripe. QAVELIX nunca ve ni almacena los datos de tu tarjeta.",
      errorMessage: "No se pudo iniciar el checkout. Inténtalo de nuevo.",
      invalidAmountMessage: "Introduce un monto entre $1 y $500.",
      legalNote:
        "Esta es una contribución voluntaria, no una donación benéfica, y no es deducible de impuestos. Stripe envía un recibo de pago por correo electrónico después del checkout.",
      closingMessage:
        "Contribuyas o no, gracias por usar QAVELIX. Cada usuario forma parte del crecimiento de este proyecto.",
      success: {
        eyebrow: "Apoya a QAVELIX",
        title: "Gracias por tu apoyo",
        description:
          "Tu contribución ayuda a mantener QAVELIX funcionando y mejorando. No cambia tu cuenta ni tu plan de ninguna manera.",
        amountLabel: "Contribución: {amount}",
        returnHomeLabel: "Volver a QAVELIX",
        notVerifiedTitle: "No pudimos confirmar este pago",
        notVerifiedDescription:
          "Si completaste el checkout, la confirmación puede tardar un momento — revisa tu correo en busca de un recibo de Stripe, o inténtalo de nuevo en la página de apoyo.",
      },
      cancelled: {
        eyebrow: "Apoya a QAVELIX",
        title: "Checkout cancelado",
        description: "No se realizó ningún pago. Puedes intentarlo de nuevo cuando quieras.",
        tryAgainLabel: "Volver a Apoya a QAVELIX",
        returnHomeLabel: "Volver a QAVELIX",
      },
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
