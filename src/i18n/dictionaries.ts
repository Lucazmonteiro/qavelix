import type { Locale } from "@/i18n/locales";

type CardCopy = {
  title: string;
  description: string;
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
    presetLabel: string;
    startLabel: string;
    cancelLabel: string;
    progressLabel: string;
    queuedLabel: string;
    runningLabel: string;
    completedLabel: string;
    failedLabel: string;
    cancelledLabel: string;
    expiredLabel: string;
    deletedLabel: string;
    originalSizeLabel: string;
    compressedSizeLabel: string;
    expiresLabel: string;
    downloadLabel: string;
    deleteLabel: string;
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
    errors: {
      noFile: string;
      empty: string;
      tooLarge: string;
      unsupportedExtension: string;
      unsupportedMime: string;
      invalidSignature: string;
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
    },
    home: {
      eyebrow: "Secure media workflow",
      title: "QAVELIX",
      description:
        "A localized browser workflow for validating video files, extracting FFprobe metadata, compressing with queued FFmpeg jobs, and serving downloads through signed temporary links.",
      primaryAction: "Validate a file",
      secondaryAction: "Review safeguards",
      statusLabel: "Active capabilities",
      statusValue:
        "Validation, metadata analysis, queued compression, signed downloads, and security controls are active. Payments, ads, and accounts are intentionally excluded.",
      previewLabel: "Workflow preview",
      previewTitle: "Prepared for secure media intake",
      previewDescription:
        "Files are checked for size, extension, MIME type, binary signature, and FFprobe metadata before compression or download handling begins.",
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
      presetLabel: "Compression preset",
      startLabel: "Start compression",
      cancelLabel: "Cancel job",
      progressLabel: "Progress",
      queuedLabel: "Queued",
      runningLabel: "Running",
      completedLabel: "Completed",
      failedLabel: "Failed",
      cancelledLabel: "Cancelled",
      expiredLabel: "Expired",
      deletedLabel: "Deleted",
      originalSizeLabel: "Original size",
      compressedSizeLabel: "Compressed size",
      expiresLabel: "Expires",
      downloadLabel: "Download",
      deleteLabel: "Delete file",
      presetNames: {
        balanced: "Balanced",
        small: "Small file",
        high: "High quality",
      },
      presetDescriptions: {
        balanced: "1080p target with a practical balance of quality and size.",
        small: "720p target for smaller output files.",
        high: "Higher visual quality with a larger output file.",
      },
      errors: {
        noFile: "Choose one supported video file before starting compression.",
        empty: "The selected file is empty.",
        tooLarge: "The selected file exceeds the 250 MB upload limit.",
        unsupportedExtension: "The selected file extension is not supported.",
        unsupportedMime: "The selected file MIME type is not supported.",
        invalidSignature: "The selected file signature does not match its declared type.",
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
    },
    home: {
      eyebrow: "Fluxo seguro de mídia",
      title: "QAVELIX",
      description:
        "Um fluxo localizado no navegador para validar vídeos, extrair metadados com FFprobe, comprimir com jobs FFmpeg em fila e liberar downloads por links temporários assinados.",
      primaryAction: "Validar arquivo",
      secondaryAction: "Ver salvaguardas",
      statusLabel: "Recursos ativos",
      statusValue:
        "Validação, análise de metadados, compressão em fila, downloads assinados e controles de segurança estão ativos. Pagamentos, anúncios e contas continuam fora do escopo.",
      previewLabel: "Prévia do fluxo",
      previewTitle: "Preparado para entrada segura de mídia",
      previewDescription:
        "Os arquivos são verificados por tamanho, extensão, tipo MIME, assinatura binária e metadados do FFprobe antes da compressão ou do download.",
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
      presetLabel: "Predefinição de compressão",
      startLabel: "Iniciar compressão",
      cancelLabel: "Cancelar job",
      progressLabel: "Progresso",
      queuedLabel: "Na fila",
      runningLabel: "Em execução",
      completedLabel: "Concluído",
      failedLabel: "Falhou",
      cancelledLabel: "Cancelado",
      expiredLabel: "Expirado",
      deletedLabel: "Excluído",
      originalSizeLabel: "Tamanho original",
      compressedSizeLabel: "Tamanho comprimido",
      expiresLabel: "Expira em",
      downloadLabel: "Baixar",
      deleteLabel: "Excluir arquivo",
      presetNames: {
        balanced: "Equilibrada",
        small: "Arquivo menor",
        high: "Alta qualidade",
      },
      presetDescriptions: {
        balanced: "Alvo em 1080p com equilíbrio prático entre qualidade e tamanho.",
        small: "Alvo em 720p para arquivos de saída menores.",
        high: "Maior qualidade visual com um arquivo de saída maior.",
      },
      errors: {
        noFile: "Escolha um vídeo aceito antes de iniciar a compressão.",
        empty: "O arquivo selecionado está vazio.",
        tooLarge: "O arquivo selecionado excede o limite de upload de 250 MB.",
        unsupportedExtension: "A extensão do arquivo selecionado não é aceita.",
        unsupportedMime: "O tipo MIME do arquivo selecionado não é aceito.",
        invalidSignature:
          "A assinatura do arquivo selecionado não corresponde ao tipo declarado.",
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
    },
    home: {
      eyebrow: "Flujo multimedia seguro",
      title: "QAVELIX",
      description:
        "Un flujo localizado en el navegador para validar vídeos, extraer metadatos con FFprobe, comprimir mediante trabajos FFmpeg en cola y ofrecer descargas con enlaces temporales firmados.",
      primaryAction: "Validar archivo",
      secondaryAction: "Revisar medidas",
      statusLabel: "Funciones activas",
      statusValue:
        "La validación, el análisis de metadatos, la compresión en cola, las descargas firmadas y los controles de seguridad están activos. Los pagos, los anuncios y las cuentas quedan fuera del alcance.",
      previewLabel: "Vista previa del flujo",
      previewTitle: "Preparado para una entrada multimedia segura",
      previewDescription:
        "Los archivos se comprueban por tamaño, extensión, tipo MIME, firma binaria y metadatos de FFprobe antes de la compresión o la descarga.",
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
      presetLabel: "Ajuste de compresión",
      startLabel: "Iniciar compresión",
      cancelLabel: "Cancelar trabajo",
      progressLabel: "Progreso",
      queuedLabel: "En cola",
      runningLabel: "En ejecución",
      completedLabel: "Completado",
      failedLabel: "Fallido",
      cancelledLabel: "Cancelado",
      expiredLabel: "Caducado",
      deletedLabel: "Eliminado",
      originalSizeLabel: "Tamaño original",
      compressedSizeLabel: "Tamaño comprimido",
      expiresLabel: "Caduca",
      downloadLabel: "Descargar",
      deleteLabel: "Eliminar archivo",
      presetNames: {
        balanced: "Equilibrado",
        small: "Archivo más pequeño",
        high: "Alta calidad",
      },
      presetDescriptions: {
        balanced: "Objetivo 1080p con un equilibrio práctico entre calidad y tamaño.",
        small: "Objetivo 720p para archivos de salida más pequeños.",
        high: "Mayor calidad visual con un archivo de salida más grande.",
      },
      errors: {
        noFile: "Elige un vídeo admitido antes de iniciar la compresión.",
        empty: "El archivo seleccionado está vacío.",
        tooLarge: "El archivo seleccionado supera el límite de carga de 250 MB.",
        unsupportedExtension: "La extensión del archivo seleccionado no está admitida.",
        unsupportedMime: "El tipo MIME del archivo seleccionado no está admitido.",
        invalidSignature:
          "La firma del archivo seleccionado no coincide con el tipo declarado.",
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
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
