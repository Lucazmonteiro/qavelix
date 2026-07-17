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
    presetReductionRanges: {
      balanced: string;
      small: string;
      high: string;
    };
    presetNotes: Partial<{
      balanced: string;
      small: string;
      high: string;
    }>;
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
        "Validation, metadata analysis, queued compression, signed downloads, and security controls are active. Payments, ads, and accounts are intentionally excluded.",
      previewLabel: "Workflow preview",
      previewTitle: "Validation runs automatically",
      previewDescription:
        "Every selected file is checked for size, extension, MIME type, binary signature, and media metadata before compression starts.",
      previewItems: [
        "Drag-and-drop upload",
        "Server-side validation",
        "Temporary file cleanup",
      ],
      principles: [
        {
          title: "Secure intake",
          description:
            "Validation runs before media analysis, and temporary files are removed after inspection or processing.",
        },
        {
          title: "Clear recovery",
          description:
            "Errors identify the rule that failed so users can fix the file selection without guesswork.",
        },
        {
          title: "Production posture",
          description:
            "Security headers, deployment readiness, localization, themes, accessibility, and API safeguards are preserved as the workflow grows.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Upload limit" },
        { value: "5", label: "Formats" },
        { value: "FFmpeg", label: "Processing" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Design system",
          title: "A complete visual foundation",
          description:
            "QAVELIX keeps consistent tokens, components, content structure, and page composition while adding validation, compression, and download states.",
          items: [
            {
              title: "Color tokens",
              description:
                "Semantic variables define surfaces, text, borders, accents, focus states, and status colors for both themes.",
            },
            {
              title: "Layout primitives",
              description:
                "A responsive shell, constrained content widths, section spacing, and card rhythm keep pages consistent.",
            },
            {
              title: "Interaction states",
              description:
                "Buttons, links, selector controls, upload states, compression presets, and focus rings include hover, active, current, and keyboard states.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accessibility basics",
          title: "Built for keyboard and screen-reader use",
          description:
            "The interface keeps semantic landmarks, localized labels, live status messages, visible focus states, contrast-aware theme tokens, and reduced-motion handling.",
          items: [
            "The skip link targets the main content.",
            "Upload and compression controls have explicit labels and instructions.",
            "Validation and compression status use polite live announcements.",
            "Motion is restrained for users who request reduced motion.",
          ],
        },
        readiness: {
          eyebrow: "Readiness",
          title: "Ready to extend without rewriting",
          description:
            "The media workflow is intentionally bounded to fixed validation rules, fixed compression presets, queued execution, signed downloads, and cleanup controls.",
          items: [
            {
              title: "Localized product surface",
              description:
                "English, Brazilian Portuguese, and European Spanish share the same product meaning with locale-specific wording.",
            },
            {
              title: "Validation and compression APIs",
              description:
                "Server checks cover MIME type, extension, binary signature, upload size, FFprobe metadata, and safe FFmpeg execution.",
            },
            {
              title: "Temporary file lifecycle",
              description:
                "Files use random temporary paths, signed download URLs, automatic expiration, and manual cleanup after processing.",
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
      validatingLabel: "Checking video",
      validationSuccessLabel: "Video ready",
      validationFailedLabel: "Video cannot be compressed",
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
      presetLabel: "Compression preset",
      presetQuestionLabel: "How do you want to compress this video?",
      recommendedLabel: "Recommended",
      expectedReductionLabel: "Expected reduction",
      useCasesLabel: "Ideal for",
      startLabel: "Start compression",
      cancelLabel: "Cancel job",
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
      expiresLabel: "Expires",
      downloadLabel: "Download",
      downloadAnywayLabel: "Download anyway",
      deleteLabel: "Delete file",
      ineffectiveWarning:
        "The selected preset could not reduce the file size. The resulting file is larger than the original. Try the Balanced or Smaller File preset to attempt a smaller output.",
      successMessage: "✔ Compression completed successfully",
      presetNames: {
        balanced: "Balanced",
        small: "Smaller File",
        high: "High Quality",
      },
      presetDescriptions: {
        balanced:
          "The best balance between visual quality and file size for everyday publishing.",
        small: "The strongest size reduction for quick sharing and saving space.",
        high: "Prioritizes visual quality when preserving detail matters most.",
      },
      presetUseCases: {
        balanced: ["YouTube", "Instagram", "TikTok"],
        small: ["WhatsApp", "Email", "Saving space"],
        high: ["Archiving", "Editing", "Master files"],
      },
      presetReductionRanges: {
        balanced: "20-50%",
        small: "40-70%",
        high: "10-25%",
      },
      presetNotes: {
        high: "Files that are already heavily compressed may not become smaller.",
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
      },
    },
    footer: {
      description:
        "QAVELIX is a secure media workflow built in deliberate phases with validation, compression, download cleanup, and localization foundations.",
      phase: "Secure media workflow foundation",
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
        "Validação, análise de metadados, compressão em fila, downloads assinados e controles de segurança estão ativos. Pagamentos, anúncios e contas continuam fora do escopo.",
      previewLabel: "Prévia do fluxo",
      previewTitle: "A validação acontece automaticamente",
      previewDescription:
        "Cada arquivo selecionado é verificado por tamanho, extensão, tipo MIME, assinatura binária e metadados de mídia antes da compressão.",
      previewItems: [
        "Upload com arrastar e soltar",
        "Validação no servidor",
        "Limpeza de arquivos temporários",
      ],
      principles: [
        {
          title: "Entrada segura",
          description:
            "A validação acontece antes da análise de mídia, e os arquivos temporários são removidos depois da inspeção ou do processamento.",
        },
        {
          title: "Correção sem atrito",
          description:
            "Os erros identificam a regra que falhou para que o usuário corrija a seleção sem precisar adivinhar.",
        },
        {
          title: "Postura de produção",
          description:
            "Cabeçalhos de segurança, prontidão para deploy, localização, temas, acessibilidade e proteções de API são preservados conforme o fluxo evolui.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Limite de upload" },
        { value: "5", label: "Formatos" },
        { value: "FFmpeg", label: "Processamento" },
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
                "Variáveis semânticas definem superfícies, texto, bordas, destaques, foco e cores de status para os dois temas.",
            },
            {
              title: "Primitivos de layout",
              description:
                "Shell responsivo, larguras controladas, espaçamento de seções e ritmo de cards mantêm as páginas consistentes.",
            },
            {
              title: "Estados de interação",
              description:
                "Botões, links, seletores, estados de upload, predefinições de compressão e foco por teclado incluem estados de hover, ativo e atual.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Acessibilidade básica",
          title: "Criado para teclado e leitores de tela",
          description:
            "A interface mantém landmarks semânticos, rótulos localizados, mensagens de status ao vivo, foco visível, tokens com contraste adequado e suporte a movimento reduzido.",
          items: [
            "O link de pular navegação aponta para o conteúdo principal.",
            "Os controles de upload e compressão têm rótulos e instruções explícitas.",
            "Os status de validação e compressão usam anúncios ao vivo discretos.",
            "O movimento é contido para usuários que preferem movimento reduzido.",
          ],
        },
        readiness: {
          eyebrow: "Prontidão",
          title: "Pronto para evoluir sem reescrever",
          description:
            "O fluxo de mídia é intencionalmente limitado a regras fixas de validação, predefinições fixas de compressão, execução em fila, downloads assinados e controles de limpeza.",
          items: [
            {
              title: "Superfície localizada",
              description:
                "Inglês, português do Brasil e espanhol europeu mantêm o mesmo sentido do produto com linguagem própria de cada localidade.",
            },
            {
              title: "APIs de validação e compressão",
              description:
                "As verificações no servidor cobrem tipo MIME, extensão, assinatura binária, tamanho do upload, metadados do FFprobe e execução segura do FFmpeg.",
            },
            {
              title: "Ciclo de vida temporário",
              description:
                "Os arquivos usam caminhos temporários aleatórios, URLs de download assinadas, expiração automática e limpeza manual após o processamento.",
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
      validatingLabel: "Verificando vídeo",
      validationSuccessLabel: "Vídeo pronto",
      validationFailedLabel: "Este vídeo não pode ser comprimido",
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
      presetLabel: "Predefinição de compressão",
      presetQuestionLabel: "Como você deseja comprimir este vídeo?",
      recommendedLabel: "Recomendado",
      expectedReductionLabel: "Redução esperada",
      useCasesLabel: "Ideal para",
      startLabel: "Iniciar compressão",
      cancelLabel: "Cancelar job",
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
      expiresLabel: "Expira em",
      downloadLabel: "Baixar",
      downloadAnywayLabel: "Baixar mesmo assim",
      deleteLabel: "Excluir arquivo",
      ineffectiveWarning:
        "O preset selecionado não conseguiu reduzir o tamanho do arquivo. O arquivo resultante ficou maior que o original. Experimente o preset 'Equilibrada' ou 'Arquivo menor' para tentar reduzir o tamanho.",
      successMessage: "✔ Compressão concluída com sucesso",
      presetNames: {
        balanced: "Equilibrada",
        small: "Arquivo menor",
        high: "Alta qualidade",
      },
      presetDescriptions: {
        balanced:
          "Melhor equilíbrio entre qualidade visual e tamanho para publicações do dia a dia.",
        small: "Maior redução de tamanho para compartilhar rápido e economizar espaço.",
        high: "Prioriza a qualidade visual quando preservar detalhes é o mais importante.",
      },
      presetUseCases: {
        balanced: ["YouTube", "Instagram", "TikTok"],
        small: ["WhatsApp", "E-mail", "Economizar espaço"],
        high: ["Arquivamento", "Edição", "Master files"],
      },
      presetReductionRanges: {
        balanced: "20-50%",
        small: "40-70%",
        high: "10-25%",
      },
      presetNotes: {
        high: "Arquivos que já estão muito comprimidos podem não reduzir de tamanho.",
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
      },
    },
    footer: {
      description:
        "O QAVELIX é um fluxo seguro de mídia construído em fases, com bases de validação, compressão, limpeza de downloads e localização.",
      phase: "Base segura para fluxo de mídia",
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
        "La validación, el análisis de metadatos, la compresión en cola, las descargas firmadas y los controles de seguridad están activos. Los pagos, los anuncios y las cuentas quedan fuera del alcance.",
      previewLabel: "Vista previa del flujo",
      previewTitle: "La validación se ejecuta automáticamente",
      previewDescription:
        "Cada archivo seleccionado se comprueba por tamaño, extensión, tipo MIME, firma binaria y metadatos multimedia antes de iniciar la compresión.",
      previewItems: [
        "Carga mediante arrastrar y soltar",
        "Validación en el servidor",
        "Limpieza de archivos temporales",
      ],
      principles: [
        {
          title: "Entrada segura",
          description:
            "La validación se ejecuta antes del análisis multimedia, y los archivos temporales se eliminan después de la inspección o el procesamiento.",
        },
        {
          title: "Corrección clara",
          description:
            "Los errores identifican la regla que ha fallado para que el usuario pueda corregir la selección sin hacer pruebas a ciegas.",
        },
        {
          title: "Preparación para producción",
          description:
            "Las cabeceras de seguridad, la preparación para despliegue, la localización, los temas, la accesibilidad y las protecciones de API se mantienen a medida que crece el flujo.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Límite de carga" },
        { value: "5", label: "Formatos" },
        { value: "FFmpeg", label: "Procesamiento" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Sistema de diseño",
          title: "Una base visual completa",
          description:
            "QAVELIX mantiene tokens, componentes, estructura de contenido y composición de páginas coherentes al añadir validación, compresión y estados de descarga.",
          items: [
            {
              title: "Tokens de color",
              description:
                "Las variables semánticas definen superficies, texto, bordes, acentos, foco y colores de estado para ambos temas.",
            },
            {
              title: "Primitivas de diseño",
              description:
                "Una estructura adaptable, anchos controlados, espaciado de secciones y ritmo de tarjetas mantienen la coherencia de las páginas.",
            },
            {
              title: "Estados de interacción",
              description:
                "Botones, enlaces, selectores, estados de carga, ajustes de compresión y foco por teclado incluyen estados hover, activo y actual.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accesibilidad básica",
          title: "Diseñado para teclado y lectores de pantalla",
          description:
            "La interfaz mantiene landmarks semánticos, etiquetas localizadas, mensajes de estado en directo, foco visible, tokens con contraste adecuado y soporte para movimiento reducido.",
          items: [
            "El enlace de salto apunta al contenido principal.",
            "Los controles de carga y compresión tienen etiquetas e instrucciones explícitas.",
            "Los estados de validación y compresión usan avisos en directo no intrusivos.",
            "El movimiento se limita para quienes prefieren movimiento reducido.",
          ],
        },
        readiness: {
          eyebrow: "Preparación",
          title: "Listo para ampliarse sin reescribir",
          description:
            "El flujo multimedia se mantiene acotado a reglas fijas de validación, ajustes fijos de compresión, ejecución en cola, descargas firmadas y controles de limpieza.",
          items: [
            {
              title: "Superficie localizada",
              description:
                "Inglés, portugués de Brasil y español europeo conservan el mismo sentido del producto con lenguaje propio de cada región.",
            },
            {
              title: "API de validación y compresión",
              description:
                "Las comprobaciones del servidor cubren tipo MIME, extensión, firma binaria, tamaño de carga, metadatos de FFprobe y ejecución segura de FFmpeg.",
            },
            {
              title: "Ciclo de vida temporal",
              description:
                "Los archivos usan rutas temporales aleatorias, URL de descarga firmadas, caducidad automática y limpieza manual después del procesamiento.",
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
      validatingLabel: "Comprobando vídeo",
      validationSuccessLabel: "Vídeo listo",
      validationFailedLabel: "Este vídeo no se puede comprimir",
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
      presetLabel: "Ajuste de compresión",
      presetQuestionLabel: "¿Cómo quieres comprimir este vídeo?",
      recommendedLabel: "Recomendado",
      expectedReductionLabel: "Reducción esperada",
      useCasesLabel: "Ideal para",
      startLabel: "Iniciar compresión",
      cancelLabel: "Cancelar trabajo",
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
      expiresLabel: "Caduca",
      downloadLabel: "Descargar",
      downloadAnywayLabel: "Descargar igualmente",
      deleteLabel: "Eliminar archivo",
      ineffectiveWarning:
        "El ajuste seleccionado no pudo reducir el tamaño del archivo. El archivo resultante quedó más grande que el original. Prueba el ajuste Equilibrado o Archivo más pequeño para intentar reducir el tamaño.",
      successMessage: "✔ Compresión completada correctamente",
      presetNames: {
        balanced: "Equilibrado",
        small: "Archivo más pequeño",
        high: "Alta calidad",
      },
      presetDescriptions: {
        balanced:
          "El mejor equilibrio entre calidad visual y tamaño para publicar a diario.",
        small: "La mayor reducción de tamaño para compartir rápido y ahorrar espacio.",
        high: "Prioriza la calidad visual cuando conservar el detalle es lo más importante.",
      },
      presetUseCases: {
        balanced: ["YouTube", "Instagram", "TikTok"],
        small: ["WhatsApp", "Correo electrónico", "Ahorrar espacio"],
        high: ["Archivado", "Edición", "Másteres"],
      },
      presetReductionRanges: {
        balanced: "20-50%",
        small: "40-70%",
        high: "10-25%",
      },
      presetNotes: {
        high: "Los archivos que ya están muy comprimidos pueden no reducir su tamaño.",
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
      },
    },
    footer: {
      description:
        "QAVELIX es un flujo multimedia seguro construido por fases, con bases de validación, compresión, limpieza de descargas y localización.",
      phase: "Base segura para el flujo multimedia",
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
