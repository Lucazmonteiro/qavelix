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
      title: "QAVELIX Secure Media Workflow",
      description:
        "A secure, localized media workflow for validating, analyzing, compressing, and downloading video files.",
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
      readiness: "Readiness",
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
        "Compress videos quickly and securely, with the quality you need in just a few clicks.",
      primaryAction: "Upload a video",
      secondaryAction: "Review safeguards",
      statusLabel: "Active capabilities",
      statusValue:
        "Validation, media metadata analysis, queued compression, protected downloads, and security controls are fully enabled. User accounts, payments, and advertising are intentionally outside the scope of this version.",
      previewLabel: "Workflow preview",
      previewTitle: "Automatic validation",
      previewDescription:
        "Before compression begins, we automatically verify the file size, extension, MIME type, binary signature, and media metadata.",
      previewItems: [
        "Drag and drop files",
        "Secure server-side validation",
        "Automatic temporary file cleanup",
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
          title: "Production ready",
          description:
            "Security, localization, accessibility, theming, and API safeguards remain consistent as the platform continues to evolve.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Maximum file size" },
        { value: "5", label: "Supported formats" },
        { value: "FFmpeg", label: "Compression engine" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Design system",
          title: "A complete visual foundation",
          description:
            "QAVELIX maintains a consistent design system while supporting validation, compression, downloads, and future platform growth.",
          items: [
            {
              title: "Color tokens",
              description:
                "Semantic design tokens define surfaces, text, borders, highlights, focus states, and status colors across both light and dark themes.",
            },
            {
              title: "Layout primitives",
              description:
                "Responsive layouts, controlled content widths, and consistent spacing create a cohesive experience across every page.",
            },
            {
              title: "Interaction states",
              description:
                "Buttons, links, selectors, upload controls, and compression settings provide consistent interaction, focus, and keyboard navigation states.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accessibility basics",
          title: "Built for keyboard and screen-reader use",
          description:
            "The interface includes semantic landmarks, localized labels, visible focus indicators, live status updates, and reduced-motion support to improve accessibility.",
          items: [
            "The Skip to Content link takes users directly to the main content area.",
            "Upload and compression controls include clear labels and straightforward instructions.",
            "Validation and compression updates are announced discreetly for assistive technologies.",
            "Animations are automatically reduced for users who prefer less motion.",
          ],
        },
        readiness: {
          eyebrow: "Readiness",
          title: "Ready to extend without rewriting",
          description:
            "The media workflow follows well-defined validation rules, compression presets, queued processing, protected downloads, and automatic temporary file cleanup.",
          items: [
            {
              title: "Language support",
              description:
                "English, Brazilian Portuguese, and European Spanish provide the same experience using natural language tailored to each locale.",
            },
            {
              title: "Validation and compression",
              description:
                "The server validates MIME type, extension, binary signature, file size, FFprobe metadata, and executes FFmpeg securely.",
            },
            {
              title: "Temporary files",
              description:
                "Temporary files use randomized storage paths, protected downloads, automatic expiration, and are removed after processing.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Upload validation",
      title: "Secure media upload checks",
      description:
        "Drop a video file to validate size, extension, MIME type, file signature, and FFprobe metadata before compression.",
      dropTitle: "Drop one video file here",
      dropDescription:
        "Files are analyzed temporarily, never stored permanently, and removed after FFprobe finishes.",
      browseLabel: "Choose file",
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
      title: "FFmpeg compression queue",
      description:
        "Compress one validated video with a fixed preset. Jobs run through a server queue, report FFmpeg progress, and can be cancelled while queued or running.",
      dropTitle: "Drop one video for compression",
      dropDescription:
        "Compression uses secure FFmpeg execution with fixed argument arrays, random temporary paths, and no shell interpolation.",
      browseLabel: "Choose compression file",
      validationHelper:
        "Your file has been successfully validated. Review the file information below, choose the compression level that best fits your needs, then start compression.",
      validatingLabel: "Checking video",
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
      queuedLabel: "Queued",
      startingLabel: "Starting",
      runningLabel: "Compressing",
      completedLabel: "Completed",
      optimizedLabel: "Optimized",
      ineffectiveLabel: "Compression ineffective",
      failedLabel: "Compression failed",
      cancelledLabel: "Cancelled",
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
        queueFull: "The compression queue is full. Try again later.",
        uploadFailed: "Compression could not be started.",
        jobFailed: "Compression failed. Try another supported video file.",
        cancelFailed: "The compression job could not be updated.",
        sourceUnavailable:
          "The original file is no longer available in this session. Upload it again to start a new compression.",
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
          title: "About QAVELIX",
          description:
            "Learn about the QAVELIX secure media workflow, its current scope, and the principles behind the product.",
        },
        eyebrow: "About",
        title: "Secure media workflows, built deliberately",
        description:
          "QAVELIX is a privacy-focused browser workflow for validating, analyzing, compressing, and downloading video files through a controlled server process.",
        sections: [
          {
            title: "Current scope",
            body: [
              "The current product foundation focuses on secure file intake, FFprobe metadata analysis, queued FFmpeg compression, signed temporary downloads, and localized user interface patterns.",
              "Payments, ads, accounts, arbitrary conversion settings, and long-term file storage remain outside the current scope.",
            ],
          },
          {
            title: "Product principles",
            body: [
              "Every phase is designed to preserve security, accessibility, localization, and deployment readiness while adding only the capabilities needed for the next milestone.",
              "Temporary files are treated as short-lived processing artifacts and are removed after analysis, completion, deletion, or expiration.",
            ],
          },
        ],
      },
      contact: {
        label: "Contact",
        metadata: {
          title: "Contact QAVELIX",
          description:
            "Find the placeholder contact information for QAVELIX product, security, and legal inquiries.",
        },
        eyebrow: "Contact",
        title: "Contact placeholders",
        description:
          "This page reserves the contact surface for future support, security, and legal channels.",
        sections: [
          {
            title: "General inquiries",
            body: [
              "A production contact address will be added before public launch.",
              "Until then, this placeholder confirms where product and support contact information will live.",
            ],
          },
          {
            title: "Security and legal notices",
            body: [
              "Dedicated security and legal contact channels will be published before QAVELIX is offered to external users.",
              "Do not submit sensitive personal data through placeholder contact surfaces.",
            ],
          },
        ],
      },
      faq: {
        label: "FAQ",
        metadata: {
          title: "QAVELIX FAQ",
          description:
            "Read answers to common questions about QAVELIX validation, compression, downloads, storage, and current product scope.",
        },
        eyebrow: "FAQ",
        title: "Frequently asked questions",
        description:
          "These answers describe the current foundation and will evolve as future phases add production policies and support channels.",
        sections: [
          {
            title: "Does QAVELIX store uploaded files?",
            body: [
              "Uploaded files are treated as temporary processing inputs. Validation files are removed after metadata analysis, and compression inputs are removed after the job leaves active processing.",
              "Completed compressed outputs are available through signed temporary download links until they expire or are manually deleted.",
            ],
          },
          {
            title: "Which files are supported?",
            body: [
              "The current workflow supports a fixed set of common video formats and rejects unsupported extensions, MIME types, empty files, oversized files, and mismatched binary signatures.",
            ],
          },
          {
            title: "Is this a final legal policy?",
            body: [
              "No. The FAQ, privacy policy, terms, and cookie policy pages are placeholders for Phase 7 and must be reviewed before public launch.",
            ],
          },
        ],
      },
      "privacy-policy": {
        label: "Privacy Policy",
        metadata: {
          title: "QAVELIX Privacy Policy",
          description:
            "Read the placeholder privacy policy for QAVELIX, including temporary file handling and future policy scope.",
        },
        eyebrow: "Privacy",
        title: "Privacy Policy placeholder",
        description:
          "This placeholder outlines the intended privacy posture for the current QAVELIX foundation and is not a final legal policy.",
        sections: [
          {
            title: "Data handling",
            body: [
              "QAVELIX currently processes selected video files to validate file identity, extract media metadata, run queued compression jobs, and provide signed temporary downloads.",
              "Temporary files are not intended for permanent storage and are removed through the workflow cleanup lifecycle.",
            ],
          },
          {
            title: "Future policy review",
            body: [
              "Before any public launch, this page should be replaced or reviewed by qualified legal counsel and updated with the production data controller, contact details, retention periods, subprocessors, user rights, and jurisdiction-specific disclosures.",
            ],
          },
        ],
      },
      terms: {
        label: "Terms",
        metadata: {
          title: "QAVELIX Terms",
          description:
            "Read the placeholder terms for QAVELIX, including current feature scope and future legal review requirements.",
        },
        eyebrow: "Terms",
        title: "Terms placeholder",
        description:
          "These terms are placeholders for the current development phase and are not a final agreement for public use.",
        sections: [
          {
            title: "Permitted use",
            body: [
              "The current product foundation is intended for controlled testing of secure media validation, compression, and temporary downloads.",
              "Users should only upload files they are authorized to process and should not upload unlawful, sensitive, or confidential material during development.",
            ],
          },
          {
            title: "No production agreement yet",
            body: [
              "Final terms should define acceptable use, service availability, disclaimers, liability limits, intellectual property rights, dispute terms, and account or payment terms if those features are added later.",
            ],
          },
        ],
      },
      "cookie-policy": {
        label: "Cookie Policy",
        metadata: {
          title: "QAVELIX Cookie Policy",
          description:
            "Read the placeholder cookie policy for QAVELIX, including current local theme preference storage.",
        },
        eyebrow: "Cookies",
        title: "Cookie Policy placeholder",
        description:
          "This placeholder explains the current preference storage behavior and reserves space for a future production cookie policy.",
        sections: [
          {
            title: "Current storage",
            body: [
              "QAVELIX currently stores the selected Light or Dark theme in localStorage so the interface can preserve the user's preference across page reloads.",
              "The current foundation does not include advertising cookies, analytics cookies, payment tracking, or account sessions.",
            ],
          },
          {
            title: "Future policy review",
            body: [
              "If analytics, authentication, marketing, embedded media, or third-party services are added later, this page should be updated with a full cookie inventory and any required consent controls.",
            ],
          },
        ],
      },
    },
  },
  "pt-BR": {
    metadata: {
      title: "Fluxo seguro de mídia QAVELIX",
      description:
        "Um fluxo localizado e seguro para validar, analisar, comprimir e baixar vídeos.",
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
      readiness: "Prontidão",
      languageLabel: "Selecionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Escuro",
      back: "Voltar",
      backToTop: "Voltar ao início",
    },
    home: {
      eyebrow: "Compressor de vídeo",
      title: "Compressor de vídeo QAVELIX",
      description:
        "Comprima vídeos com rapidez e segurança, mantendo a qualidade ideal em poucos cliques.",
      primaryAction: "Enviar vídeo",
      secondaryAction: "Ver salvaguardas",
      statusLabel: "Recursos ativos",
      statusValue:
        "Validação, análise de metadados, compressão em fila, downloads protegidos e controles de segurança estão ativos. Recursos como contas, pagamentos e anúncios permanecem fora do escopo desta versão.",
      previewLabel: "Prévia do fluxo",
      previewTitle: "Validação automática",
      previewDescription:
        "Antes da compressão, verificamos automaticamente o tamanho, a extensão, o tipo MIME, a assinatura binária e os metadados do vídeo.",
      previewItems: [
        "Arraste e solte arquivos",
        "Validação segura no servidor",
        "Remoção automática de arquivos temporários",
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
          title: "Pronto para produção",
          description:
            "Segurança, localização, acessibilidade, temas e proteções da API são mantidos para garantir um fluxo consistente à medida que o produto evolui.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Tamanho máximo" },
        { value: "5", label: "Formatos aceitos" },
        { value: "FFmpeg", label: "Motor de compressão" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Sistema de design",
          title: "Uma base visual completa",
          description:
            "O QAVELIX mantém tokens, componentes, estrutura de conteúdo e composição de páginas consistentes ao adicionar validação, compressão e estados de download.",
          items: [
            {
              title: "Tokens de cor",
              description:
                "Variáveis semânticas definem superfícies, textos, bordas, destaques, foco e cores de status para os temas claro e escuro.",
            },
            {
              title: "Primitivos de layout",
              description:
                "Layout responsivo, larguras controladas e espaçamento consistente garantem uma experiência uniforme em todas as páginas.",
            },
            {
              title: "Estados de interação",
              description:
                "Botões, links, seletores, upload e controles de compressão oferecem estados consistentes de foco, interação e navegação por teclado.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Acessibilidade básica",
          title: "Criado para teclado e leitores de tela",
          description:
            "A interface utiliza landmarks semânticos, rótulos localizados, foco visível, mensagens de status e suporte a movimento reduzido para oferecer uma experiência acessível.",
          items: [
            'O link "Pular para o conteúdo" leva diretamente ao conteúdo principal.',
            "Os controles de upload e compressão possuem rótulos claros e instruções objetivas.",
            "Os status de validação e compressão utilizam atualizações discretas para tecnologias assistivas.",
            "As animações são reduzidas automaticamente para usuários que preferem menos movimento.",
          ],
        },
        readiness: {
          eyebrow: "Prontidão",
          title: "Pronto para evoluir sem reescrever",
          description:
            "O fluxo de mídia segue regras fixas de validação, compressão, execução em fila, downloads protegidos e limpeza automática de arquivos temporários.",
          items: [
            {
              title: "Suporte a idiomas",
              description:
                "Português do Brasil, inglês e espanhol europeu oferecem a mesma experiência com linguagem adaptada para cada idioma.",
            },
            {
              title: "Validação e compressão",
              description:
                "O servidor verifica tipo MIME, extensão, assinatura binária, tamanho do arquivo, metadados do FFprobe e executa o FFmpeg de forma segura.",
            },
            {
              title: "Arquivos temporários",
              description:
                "Os arquivos utilizam caminhos temporários aleatórios, downloads protegidos, expiração automática e remoção após o processamento.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Validação de upload",
      title: "Verificações seguras de mídia",
      description:
        "Solte um vídeo para validar tamanho, extensão, tipo MIME, assinatura do arquivo e metadados do FFprobe antes da compressão.",
      dropTitle: "Solte um vídeo aqui",
      dropDescription:
        "Os arquivos são analisados temporariamente, nunca ficam armazenados de forma permanente e são removidos quando o FFprobe termina.",
      browseLabel: "Escolher arquivo",
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
      title: "Fila de compressão FFmpeg",
      description:
        "Comprima um vídeo validado com uma predefinição fixa. Os jobs passam por uma fila no servidor, exibem o progresso do FFmpeg e podem ser cancelados enquanto aguardam ou executam.",
      dropTitle: "Solte um vídeo para compressão",
      dropDescription:
        "A compressão usa execução segura do FFmpeg com listas fixas de argumentos, caminhos temporários aleatórios e sem interpolação de shell.",
      browseLabel: "Escolher arquivo para compressão",
      validationHelper:
        "Seu arquivo foi validado com sucesso. Confira as informações do arquivo abaixo, escolha o nível de compressão ideal para sua necessidade e inicie a compressão.",
      validatingLabel: "Verificando vídeo",
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
      queuedLabel: "Na fila",
      startingLabel: "Iniciando",
      runningLabel: "Comprimindo",
      completedLabel: "Concluído",
      optimizedLabel: "Otimizado",
      ineffectiveLabel: "Compressão ineficaz",
      failedLabel: "Falha na compressão",
      cancelledLabel: "Cancelado",
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
        queueFull: "A fila de compressão está cheia. Tente novamente mais tarde.",
        uploadFailed: "Não foi possível iniciar a compressão.",
        jobFailed: "A compressão falhou. Tente outro vídeo aceito.",
        cancelFailed: "Não foi possível atualizar o job de compressão.",
        sourceUnavailable:
          "O arquivo original não está mais disponível nesta sessão. Envie-o novamente para iniciar uma nova compressão.",
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
          title: "Sobre o QAVELIX",
          description:
            "Conheça o fluxo seguro de mídia do QAVELIX, o escopo atual e os princípios do produto.",
        },
        eyebrow: "Sobre",
        title: "Fluxos seguros de mídia, construídos com cuidado",
        description:
          "O QAVELIX é um fluxo no navegador, com foco em privacidade, para validar, analisar, comprimir e baixar vídeos por meio de um processo controlado no servidor.",
        sections: [
          {
            title: "Escopo atual",
            body: [
              "A base atual do produto se concentra em entrada segura de arquivos, análise de metadados com FFprobe, compressão FFmpeg em fila, downloads temporários assinados e padrões de interface localizados.",
              "Pagamentos, anúncios, contas, configurações arbitrárias de conversão e armazenamento permanente de arquivos continuam fora do escopo atual.",
            ],
          },
          {
            title: "Princípios do produto",
            body: [
              "Cada fase foi pensada para preservar segurança, acessibilidade, localização e prontidão para deploy enquanto adiciona apenas os recursos necessários para o próximo marco.",
              "Arquivos temporários são tratados como artefatos de processamento de curta duração e são removidos após análise, conclusão, exclusão ou expiração.",
            ],
          },
        ],
      },
      contact: {
        label: "Contato",
        metadata: {
          title: "Contato QAVELIX",
          description:
            "Veja as informações provisórias de contato para assuntos de produto, segurança e jurídico do QAVELIX.",
        },
        eyebrow: "Contato",
        title: "Canais de contato provisórios",
        description:
          "Esta página reserva o espaço de contato para futuros canais de suporte, segurança e jurídico.",
        sections: [
          {
            title: "Dúvidas gerais",
            body: [
              "Um endereço de contato de produção será adicionado antes do lançamento público.",
              "Até lá, este placeholder confirma onde ficarão as informações de produto e suporte.",
            ],
          },
          {
            title: "Avisos de segurança e jurídico",
            body: [
              "Canais dedicados para segurança e jurídico serão publicados antes de o QAVELIX ser oferecido a usuários externos.",
              "Não envie dados pessoais sensíveis por superfícies de contato provisórias.",
            ],
          },
        ],
      },
      faq: {
        label: "FAQ",
        metadata: {
          title: "FAQ do QAVELIX",
          description:
            "Leia respostas sobre validação, compressão, downloads, armazenamento e escopo atual do QAVELIX.",
        },
        eyebrow: "FAQ",
        title: "Perguntas frequentes",
        description:
          "Estas respostas descrevem a base atual e serão atualizadas conforme fases futuras adicionarem políticas de produção e canais de suporte.",
        sections: [
          {
            title: "O QAVELIX armazena arquivos enviados?",
            body: [
              "Arquivos enviados são tratados como entradas temporárias de processamento. Arquivos de validação são removidos depois da análise de metadados, e entradas de compressão são removidas quando o job sai do processamento ativo.",
              "Arquivos comprimidos concluídos ficam disponíveis por links temporários assinados até expirarem ou serem excluídos manualmente.",
            ],
          },
          {
            title: "Quais arquivos são aceitos?",
            body: [
              "O fluxo atual aceita um conjunto fixo de formatos comuns de vídeo e rejeita extensões não aceitas, tipos MIME não aceitos, arquivos vazios, arquivos grandes demais e assinaturas binárias incompatíveis.",
            ],
          },
          {
            title: "Esta é uma política jurídica final?",
            body: [
              "Não. As páginas de FAQ, política de privacidade, termos e política de cookies são placeholders da Fase 7 e precisam de revisão antes do lançamento público.",
            ],
          },
        ],
      },
      "privacy-policy": {
        label: "Política de Privacidade",
        metadata: {
          title: "Política de Privacidade do QAVELIX",
          description:
            "Leia a política de privacidade provisória do QAVELIX, incluindo tratamento temporário de arquivos e escopo futuro.",
        },
        eyebrow: "Privacidade",
        title: "Placeholder da Política de Privacidade",
        description:
          "Este placeholder descreve a postura de privacidade pretendida para a base atual do QAVELIX e não é uma política jurídica final.",
        sections: [
          {
            title: "Tratamento de dados",
            body: [
              "O QAVELIX atualmente processa vídeos selecionados para validar identidade do arquivo, extrair metadados de mídia, executar jobs de compressão em fila e fornecer downloads temporários assinados.",
              "Arquivos temporários não são destinados a armazenamento permanente e são removidos pelo ciclo de limpeza do fluxo.",
            ],
          },
          {
            title: "Revisão futura da política",
            body: [
              "Antes de qualquer lançamento público, esta página deve ser substituída ou revisada por assessoria jurídica qualificada e atualizada com controlador de dados, contatos, prazos de retenção, subprocessadores, direitos dos usuários e divulgações específicas por jurisdição.",
            ],
          },
        ],
      },
      terms: {
        label: "Termos",
        metadata: {
          title: "Termos do QAVELIX",
          description:
            "Leia os termos provisórios do QAVELIX, incluindo o escopo atual de recursos e a necessidade de revisão jurídica futura.",
        },
        eyebrow: "Termos",
        title: "Placeholder dos Termos",
        description:
          "Estes termos são provisórios para a fase atual de desenvolvimento e não são um acordo final para uso público.",
        sections: [
          {
            title: "Uso permitido",
            body: [
              "A base atual do produto se destina a testes controlados de validação segura de mídia, compressão e downloads temporários.",
              "Usuários devem enviar apenas arquivos que tenham autorização para processar e não devem enviar material ilegal, sensível ou confidencial durante o desenvolvimento.",
            ],
          },
          {
            title: "Ainda não há contrato de produção",
            body: [
              "Os termos finais devem definir uso aceitável, disponibilidade do serviço, isenções, limites de responsabilidade, direitos de propriedade intelectual, resolução de disputas e termos de conta ou pagamento se esses recursos forem adicionados depois.",
            ],
          },
        ],
      },
      "cookie-policy": {
        label: "Política de Cookies",
        metadata: {
          title: "Política de Cookies do QAVELIX",
          description:
            "Leia a política de cookies provisória do QAVELIX, incluindo o armazenamento local da preferência de tema.",
        },
        eyebrow: "Cookies",
        title: "Placeholder da Política de Cookies",
        description:
          "Este placeholder explica o comportamento atual de armazenamento de preferências e reserva espaço para uma futura política de cookies de produção.",
        sections: [
          {
            title: "Armazenamento atual",
            body: [
              "O QAVELIX atualmente armazena o tema Claro ou Escuro selecionado no localStorage para preservar a preferência do usuário entre recarregamentos de página.",
              "A base atual não inclui cookies de publicidade, cookies de analytics, rastreamento de pagamentos ou sessões de conta.",
            ],
          },
          {
            title: "Revisão futura da política",
            body: [
              "Se analytics, autenticação, marketing, mídia incorporada ou serviços de terceiros forem adicionados depois, esta página deve ser atualizada com um inventário completo de cookies e os controles de consentimento necessários.",
            ],
          },
        ],
      },
    },
  },
  es: {
    metadata: {
      title: "Flujo multimedia seguro de QAVELIX",
      description:
        "Un flujo localizado y seguro para validar, analizar, comprimir y descargar vídeos.",
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
      readiness: "Preparación",
      languageLabel: "Seleccionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Oscuro",
      back: "Volver",
      backToTop: "Volver al inicio",
    },
    home: {
      eyebrow: "Compresor de vídeo",
      title: "Compresor de vídeo QAVELIX",
      description:
        "Comprime vídeos de forma rápida y segura, con la calidad que necesitas en pocos clics.",
      primaryAction: "Subir vídeo",
      secondaryAction: "Revisar medidas",
      statusLabel: "Funciones activas",
      statusValue:
        "La validación, el análisis de metadatos, la compresión en cola, las descargas protegidas y los controles de seguridad están plenamente activos. Las cuentas de usuario, los pagos y la publicidad quedan fuera del alcance de esta versión.",
      previewLabel: "Vista previa del flujo",
      previewTitle: "Validación automática",
      previewDescription:
        "Antes de iniciar la compresión, verificamos automáticamente el tamaño, la extensión, el tipo MIME, la firma binaria y los metadatos del archivo.",
      previewItems: [
        "Arrastra y suelta archivos",
        "Validación segura en el servidor",
        "Eliminación automática de archivos temporales",
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
          title: "Listo para producción",
          description:
            "La seguridad, la localización, la accesibilidad, los temas y las protecciones de la API se mantienen de forma coherente a medida que evoluciona la plataforma.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Tamaño máximo" },
        { value: "5", label: "Formatos compatibles" },
        { value: "FFmpeg", label: "Motor de compresión" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Sistema de diseño",
          title: "Una base visual completa",
          description:
            "QAVELIX mantiene un sistema de diseño coherente mientras incorpora validación, compresión, descargas y futuras funcionalidades de la plataforma.",
          items: [
            {
              title: "Tokens de color",
              description:
                "Los tokens semánticos definen superficies, texto, bordes, resaltados, estados de foco y colores de estado para los temas claro y oscuro.",
            },
            {
              title: "Primitivas de diseño",
              description:
                "Un diseño adaptable, anchos controlados y un espaciado uniforme garantizan una experiencia coherente en todas las páginas.",
            },
            {
              title: "Estados de interacción",
              description:
                "Los botones, enlaces, selectores, controles de carga y opciones de compresión ofrecen estados coherentes de interacción, foco y navegación mediante teclado.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accesibilidad básica",
          title: "Diseñado para teclado y lectores de pantalla",
          description:
            "La interfaz incorpora landmarks semánticos, etiquetas localizadas, indicadores visibles de foco, mensajes de estado y compatibilidad con movimiento reducido para ofrecer una experiencia más accesible.",
          items: [
            "El enlace «Saltar al contenido» lleva directamente al contenido principal.",
            "Los controles de carga y compresión incluyen etiquetas claras e instrucciones fáciles de seguir.",
            "Las actualizaciones de validación y compresión se anuncian de forma discreta para las tecnologías de asistencia.",
            "Las animaciones se reducen automáticamente para quienes prefieren menos movimiento.",
          ],
        },
        readiness: {
          eyebrow: "Preparación",
          title: "Listo para ampliarse sin reescribir",
          description:
            "El flujo multimedia sigue reglas definidas de validación, ajustes de compresión, procesamiento en cola, descargas protegidas y eliminación automática de archivos temporales.",
          items: [
            {
              title: "Compatibilidad con idiomas",
              description:
                "El inglés, el portugués de Brasil y el español de España ofrecen la misma experiencia con un lenguaje adaptado a cada idioma.",
            },
            {
              title: "Validación y compresión",
              description:
                "El servidor verifica el tipo MIME, la extensión, la firma binaria, el tamaño del archivo, los metadatos de FFprobe y ejecuta FFmpeg de forma segura.",
            },
            {
              title: "Archivos temporales",
              description:
                "Los archivos utilizan rutas temporales aleatorias, descargas protegidas, caducidad automática y se eliminan tras finalizar el procesamiento.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Validación de carga",
      title: "Comprobaciones multimedia seguras",
      description:
        "Suelta un vídeo para validar tamaño, extensión, tipo MIME, firma del archivo y metadatos de FFprobe antes de la compresión.",
      dropTitle: "Suelta un vídeo aquí",
      dropDescription:
        "Los archivos se analizan temporalmente, nunca se almacenan de forma permanente y se eliminan cuando termina FFprobe.",
      browseLabel: "Elegir archivo",
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
      title: "Cola de compresión FFmpeg",
      description:
        "Comprime un vídeo validado con un ajuste fijo. Los trabajos pasan por una cola del servidor, muestran el progreso de FFmpeg y pueden cancelarse mientras están en cola o en ejecución.",
      dropTitle: "Suelta un vídeo para comprimirlo",
      dropDescription:
        "La compresión usa una ejecución segura de FFmpeg con listas fijas de argumentos, rutas temporales aleatorias y sin interpolación de shell.",
      browseLabel: "Elegir archivo para compresión",
      validationHelper:
        "Tu archivo se ha validado correctamente. Revisa la información del archivo, elige el nivel de compresión que mejor se adapte a lo que necesitas e inicia la compresión.",
      validatingLabel: "Comprobando vídeo",
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
      queuedLabel: "En cola",
      startingLabel: "Iniciando",
      runningLabel: "Comprimiendo",
      completedLabel: "Completado",
      optimizedLabel: "Optimizado",
      ineffectiveLabel: "Compresión ineficaz",
      failedLabel: "Error de compresión",
      cancelledLabel: "Cancelado",
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
        queueFull: "La cola de compresión está llena. Inténtalo de nuevo más tarde.",
        uploadFailed: "No se ha podido iniciar la compresión.",
        jobFailed: "La compresión ha fallado. Prueba con otro vídeo admitido.",
        cancelFailed: "No se ha podido actualizar el trabajo de compresión.",
        sourceUnavailable:
          "El archivo original ya no está disponible en esta sesión. Súbelo de nuevo para iniciar otra compresión.",
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
          title: "Acerca de QAVELIX",
          description:
            "Conoce el flujo multimedia seguro de QAVELIX, su alcance actual y los principios del producto.",
        },
        eyebrow: "Acerca de",
        title: "Flujos multimedia seguros, construidos con criterio",
        description:
          "QAVELIX es un flujo en el navegador, centrado en la privacidad, para validar, analizar, comprimir y descargar vídeos mediante un proceso controlado en el servidor.",
        sections: [
          {
            title: "Alcance actual",
            body: [
              "La base actual del producto se centra en la entrada segura de archivos, el análisis de metadatos con FFprobe, la compresión FFmpeg en cola, las descargas temporales firmadas y patrones de interfaz localizados.",
              "Los pagos, anuncios, cuentas, ajustes arbitrarios de conversión y almacenamiento permanente de archivos quedan fuera del alcance actual.",
            ],
          },
          {
            title: "Principios del producto",
            body: [
              "Cada fase está diseñada para preservar seguridad, accesibilidad, localización y preparación para despliegue mientras añade solo las capacidades necesarias para el siguiente hito.",
              "Los archivos temporales se tratan como artefactos de procesamiento de corta duración y se eliminan tras el análisis, la finalización, la eliminación o la caducidad.",
            ],
          },
        ],
      },
      contact: {
        label: "Contacto",
        metadata: {
          title: "Contacto QAVELIX",
          description:
            "Consulta la información provisional de contacto para asuntos de producto, seguridad y legales de QAVELIX.",
        },
        eyebrow: "Contacto",
        title: "Canales de contacto provisionales",
        description:
          "Esta página reserva la superficie de contacto para futuros canales de soporte, seguridad y asuntos legales.",
        sections: [
          {
            title: "Consultas generales",
            body: [
              "Se añadirá una dirección de contacto de producción antes del lanzamiento público.",
              "Hasta entonces, este placeholder confirma dónde estarán las vías de contacto de producto y soporte.",
            ],
          },
          {
            title: "Avisos de seguridad y legales",
            body: [
              "Los canales dedicados de seguridad y asuntos legales se publicarán antes de que QAVELIX se ofrezca a usuarios externos.",
              "No envíes datos personales sensibles a través de superficies de contacto provisionales.",
            ],
          },
        ],
      },
      faq: {
        label: "FAQ",
        metadata: {
          title: "FAQ de QAVELIX",
          description:
            "Lee respuestas sobre validación, compresión, descargas, almacenamiento y alcance actual de QAVELIX.",
        },
        eyebrow: "FAQ",
        title: "Preguntas frecuentes",
        description:
          "Estas respuestas describen la base actual y evolucionarán cuando fases futuras añadan políticas de producción y canales de soporte.",
        sections: [
          {
            title: "¿QAVELIX almacena los archivos cargados?",
            body: [
              "Los archivos cargados se tratan como entradas temporales de procesamiento. Los archivos de validación se eliminan después del análisis de metadatos, y las entradas de compresión se eliminan cuando el trabajo sale del procesamiento activo.",
              "Los archivos comprimidos completados quedan disponibles mediante enlaces temporales firmados hasta que caducan o se eliminan manualmente.",
            ],
          },
          {
            title: "¿Qué archivos se admiten?",
            body: [
              "El flujo actual admite un conjunto fijo de formatos de vídeo habituales y rechaza extensiones no admitidas, tipos MIME no admitidos, archivos vacíos, archivos demasiado grandes y firmas binarias incompatibles.",
            ],
          },
          {
            title: "¿Es una política legal definitiva?",
            body: [
              "No. Las páginas de FAQ, política de privacidad, términos y política de cookies son placeholders de la Fase 7 y deben revisarse antes del lanzamiento público.",
            ],
          },
        ],
      },
      "privacy-policy": {
        label: "Política de Privacidad",
        metadata: {
          title: "Política de Privacidad de QAVELIX",
          description:
            "Lee la política de privacidad provisional de QAVELIX, incluido el tratamiento temporal de archivos y el alcance futuro.",
        },
        eyebrow: "Privacidad",
        title: "Placeholder de la Política de Privacidad",
        description:
          "Este placeholder resume la postura de privacidad prevista para la base actual de QAVELIX y no es una política legal definitiva.",
        sections: [
          {
            title: "Tratamiento de datos",
            body: [
              "QAVELIX procesa actualmente vídeos seleccionados para validar la identidad del archivo, extraer metadatos multimedia, ejecutar trabajos de compresión en cola y proporcionar descargas temporales firmadas.",
              "Los archivos temporales no están pensados para almacenamiento permanente y se eliminan mediante el ciclo de limpieza del flujo.",
            ],
          },
          {
            title: "Revisión futura de la política",
            body: [
              "Antes de cualquier lanzamiento público, esta página debe sustituirse o revisarse por asesoría legal cualificada y actualizarse con el responsable del tratamiento, datos de contacto, plazos de conservación, subencargados, derechos de los usuarios e información específica por jurisdicción.",
            ],
          },
        ],
      },
      terms: {
        label: "Términos",
        metadata: {
          title: "Términos de QAVELIX",
          description:
            "Lee los términos provisionales de QAVELIX, incluido el alcance actual de funciones y los requisitos de revisión legal futura.",
        },
        eyebrow: "Términos",
        title: "Placeholder de los Términos",
        description:
          "Estos términos son provisionales para la fase actual de desarrollo y no son un acuerdo definitivo para uso público.",
        sections: [
          {
            title: "Uso permitido",
            body: [
              "La base actual del producto está pensada para pruebas controladas de validación multimedia segura, compresión y descargas temporales.",
              "Los usuarios solo deben cargar archivos que estén autorizados a procesar y no deben cargar material ilícito, sensible o confidencial durante el desarrollo.",
            ],
          },
          {
            title: "Aún no existe un contrato de producción",
            body: [
              "Los términos definitivos deben definir uso aceptable, disponibilidad del servicio, exenciones, límites de responsabilidad, derechos de propiedad intelectual, resolución de disputas y términos de cuenta o pago si esas funciones se añaden más adelante.",
            ],
          },
        ],
      },
      "cookie-policy": {
        label: "Política de Cookies",
        metadata: {
          title: "Política de Cookies de QAVELIX",
          description:
            "Lee la política de cookies provisional de QAVELIX, incluido el almacenamiento local de la preferencia de tema.",
        },
        eyebrow: "Cookies",
        title: "Placeholder de la Política de Cookies",
        description:
          "Este placeholder explica el comportamiento actual de almacenamiento de preferencias y reserva espacio para una futura política de cookies de producción.",
        sections: [
          {
            title: "Almacenamiento actual",
            body: [
              "QAVELIX almacena actualmente el tema Claro u Oscuro seleccionado en localStorage para conservar la preferencia del usuario entre recargas de página.",
              "La base actual no incluye cookies publicitarias, cookies de analítica, seguimiento de pagos ni sesiones de cuenta.",
            ],
          },
          {
            title: "Revisión futura de la política",
            body: [
              "Si más adelante se añaden analítica, autenticación, marketing, medios incrustados o servicios de terceros, esta página debe actualizarse con un inventario completo de cookies y los controles de consentimiento necesarios.",
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
