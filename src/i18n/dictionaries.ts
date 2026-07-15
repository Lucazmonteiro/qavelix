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
    systemTheme: string;
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
    emptyState: string;
    clientErrors: {
      unsupportedExtension: string;
      unsupportedMime: string;
      tooLarge: string;
      empty: string;
      multiple: string;
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
      uploadFailed: string;
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
      title: "QAVELIX Upload Validation",
      description:
        "The secure upload validation and FFprobe metadata analysis foundation for QAVELIX.",
    },
    navigation: {
      skipToContent: "Skip to content",
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
      systemTheme: "System",
    },
    home: {
      eyebrow: "Phase 3 upload validation",
      title: "QAVELIX",
      description:
        "A secure browser-based media utility foundation with localized UI, resilient themes, strict upload validation, and queued FFmpeg compression.",
      primaryAction: "Validate upload",
      secondaryAction: "Review security",
      statusLabel: "Current scope",
      statusValue:
        "Upload validation, FFprobe analysis, and FFmpeg compression are active. Payments, ads, and accounts remain intentionally excluded.",
      previewLabel: "Validation preview",
      previewTitle: "Prepared for safe media intake",
      previewDescription:
        "Files are checked for size, extension, MIME type, binary signature, and FFprobe metadata before future media processing phases.",
      previewItems: [
        "Drag-and-drop upload",
        "Server-side validation",
        "Temporary analysis",
      ],
      principles: [
        {
          title: "Secure intake",
          description:
            "Validation happens before media analysis, and temporary files are cleaned up after inspection.",
        },
        {
          title: "Clear feedback",
          description:
            "Errors explain exactly which upload rule failed so users can recover without guessing.",
        },
        {
          title: "Production posture",
          description:
            "The Phase 1 and Phase 2 security, deployment, i18n, theme, and accessibility foundations are preserved.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Upload limit" },
        { value: "5", label: "Formats" },
        { value: "FFprobe", label: "Analysis" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Design system",
          title: "A complete visual foundation",
          description:
            "QAVELIX keeps the Phase 2 tokens, components, content structure, and page composition rules while adding the upload validation interface.",
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
                "Buttons, links, selector controls, upload states, and focus rings include hover, active, current, and keyboard states.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accessibility basics",
          title: "Built for keyboard and screen-reader use",
          description:
            "The upload surface keeps semantic landmarks, labels, live status messages, visible focus states, contrast-aware theme tokens, and reduced-motion handling.",
          items: [
            "Skip link targets the main content.",
            "Upload controls have explicit labels and instructions.",
            "Validation status uses polite live announcements.",
            "Motion is restrained for users who request reduced motion.",
          ],
        },
        readiness: {
          eyebrow: "Readiness",
          title: "Ready to extend without rewriting",
          description:
            "The compression system is intentionally limited to fixed presets, queueing, progress, cancellation, and secure FFmpeg execution.",
          items: [
            {
              title: "Landing page",
              description:
                "The first screen communicates the product direction and now includes a validation workflow.",
            },
            {
              title: "Validation API",
              description:
                "Server checks MIME type, extension, binary signature, upload size, and FFprobe metadata.",
            },
            {
              title: "Temporary handling",
              description:
                "Files use random temporary names for FFprobe analysis and are deleted after processing.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Phase 3 upload validation",
      title: "Secure media upload checks",
      description:
        "Drop a video file to validate size, extension, MIME type, file signature, and FFprobe metadata before compression.",
      dropTitle: "Drop one video file here",
      dropDescription:
        "Files are temporarily analyzed, never stored permanently, and deleted after FFprobe finishes.",
      browseLabel: "Choose file",
      analyzingLabel: "Analyzing file",
      supportedLabel: "Supported formats",
      limitsLabel: "Maximum upload size: 250 MB",
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
      emptyState: "No file analyzed yet.",
      clientErrors: {
        unsupportedExtension: "This file extension is not supported.",
        unsupportedMime: "This MIME type is not supported.",
        tooLarge: "This file exceeds the 250 MB upload limit.",
        empty: "This file is empty.",
        multiple: "Upload one file at a time.",
      },
    },
    compression: {
      eyebrow: "Phase 4 compression",
      title: "FFmpeg compression queue",
      description:
        "Compress one validated video with a fixed preset. Jobs run through a server queue, report FFmpeg progress, and can be cancelled while queued or running.",
      dropTitle: "Drop one video for compression",
      dropDescription:
        "Compression uses secure FFmpeg execution with fixed argument arrays, temporary random paths, and no shell interpolation.",
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
        balanced: "1080p target with a practical quality and size tradeoff.",
        small: "720p target for smaller output files.",
        high: "Higher visual quality with a larger output.",
      },
      errors: {
        noFile: "Choose one supported video file before starting compression.",
        uploadFailed: "Compression could not be started.",
        cancelFailed: "The compression job could not be cancelled.",
      },
    },
    footer: {
      description:
        "QAVELIX is being built in deliberate phases. This phase adds secure upload validation and metadata analysis.",
      phase: "Phase 3 upload validation complete",
      linksLabel: "Footer navigation",
    },
  },
  "pt-BR": {
    metadata: {
      title: "Validacao de upload QAVELIX",
      description:
        "A fundacao segura de validacao de upload e analise de metadados com FFprobe do QAVELIX.",
    },
    navigation: {
      skipToContent: "Pular para o conteudo",
      product: "Produto",
      upload: "Validacao de upload",
      compression: "Compressao",
      design: "Sistema de design",
      accessibility: "Acessibilidade",
      readiness: "Prontidao",
      languageLabel: "Selecionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Escuro",
      systemTheme: "Sistema",
    },
    home: {
      eyebrow: "Validacao de upload da fase 3",
      title: "QAVELIX",
      description:
        "Uma fundacao segura para utilitario de midia no navegador, com UI localizada, temas resilientes, validacao rigorosa e compressao FFmpeg em fila.",
      primaryAction: "Validar upload",
      secondaryAction: "Ver seguranca",
      statusLabel: "Escopo atual",
      statusValue:
        "Validacao de upload, analise com FFprobe e compressao FFmpeg estao ativas. Pagamentos, anuncios e contas continuam excluidos.",
      previewLabel: "Previa de validacao",
      previewTitle: "Preparado para entrada segura de midia",
      previewDescription:
        "Arquivos sao verificados por tamanho, extensao, MIME, assinatura binaria e metadados do FFprobe antes das proximas fases.",
      previewItems: [
        "Upload com arrastar e soltar",
        "Validacao no servidor",
        "Analise temporaria",
      ],
      principles: [
        {
          title: "Entrada segura",
          description:
            "A validacao acontece antes da analise de midia, e arquivos temporarios sao removidos depois da inspecao.",
        },
        {
          title: "Feedback claro",
          description:
            "Erros explicam exatamente qual regra de upload falhou para que o usuario possa corrigir sem adivinhar.",
        },
        {
          title: "Postura de producao",
          description:
            "As bases de seguranca, deploy, i18n, tema e acessibilidade das fases 1 e 2 foram preservadas.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Limite" },
        { value: "5", label: "Formatos" },
        { value: "FFprobe", label: "Analise" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Sistema de design",
          title: "Uma fundacao visual completa",
          description:
            "O QAVELIX mantem os tokens, componentes, estrutura de conteudo e regras visuais da fase 2 ao adicionar a interface de validacao.",
          items: [
            {
              title: "Tokens de cor",
              description:
                "Variaveis semanticas definem superficies, textos, bordas, destaques, foco e estados para os dois temas.",
            },
            {
              title: "Primitivos de layout",
              description:
                "Estrutura responsiva, larguras controladas, espacamento de secoes e ritmo de cards mantem consistencia.",
            },
            {
              title: "Estados de interacao",
              description:
                "Botoes, links, seletores, estados de upload e foco por teclado incluem hover, ativo, atual e acessivel.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Acessibilidade basica",
          title: "Feito para teclado e leitores de tela",
          description:
            "A area de upload mantem landmarks semanticos, rotulos, mensagens de status, foco visivel, contraste e movimento reduzido.",
          items: [
            "Link de pular navegacao aponta para o conteudo principal.",
            "Controles de upload tem rotulos e instrucoes explicitas.",
            "O status de validacao usa anuncios ao vivo educados.",
            "O movimento e contido para quem prefere movimento reduzido.",
          ],
        },
        readiness: {
          eyebrow: "Prontidao",
          title: "Pronto para evoluir sem reescrever",
          description:
            "A compressao se limita a presets fixos, fila, progresso, cancelamento e execucao segura do FFmpeg.",
          items: [
            {
              title: "Landing page",
              description:
                "A primeira tela comunica a direcao do produto e agora inclui um fluxo de validacao.",
            },
            {
              title: "API de validacao",
              description:
                "O servidor verifica MIME, extensao, assinatura binaria, tamanho e metadados do FFprobe.",
            },
            {
              title: "Tratamento temporario",
              description:
                "Arquivos usam nomes temporarios aleatorios para analise com FFprobe e sao removidos depois.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Validacao de upload da fase 3",
      title: "Verificacoes seguras de midia",
      description:
        "Solte um video para validar tamanho, extensao, MIME, assinatura do arquivo e metadados do FFprobe antes da compressao.",
      dropTitle: "Solte um video aqui",
      dropDescription:
        "Os arquivos sao analisados temporariamente, nunca ficam armazenados de forma permanente e sao removidos apos o FFprobe terminar.",
      browseLabel: "Escolher arquivo",
      analyzingLabel: "Analisando arquivo",
      supportedLabel: "Formatos aceitos",
      limitsLabel: "Tamanho maximo: 250 MB",
      successTitle: "Validacao aprovada",
      errorTitle: "Validacao falhou",
      fileLabel: "Arquivo",
      sizeLabel: "Tamanho",
      typeLabel: "Tipo MIME",
      durationLabel: "Duracao",
      resolutionLabel: "Resolucao",
      videoCodecLabel: "Codec de video",
      audioCodecLabel: "Codec de audio",
      bitrateLabel: "Bitrate",
      frameRateLabel: "Taxa de quadros",
      formatLabel: "Container",
      emptyState: "Nenhum arquivo analisado ainda.",
      clientErrors: {
        unsupportedExtension: "Esta extensao de arquivo nao e aceita.",
        unsupportedMime: "Este tipo MIME nao e aceito.",
        tooLarge: "Este arquivo excede o limite de 250 MB.",
        empty: "Este arquivo esta vazio.",
        multiple: "Envie um arquivo por vez.",
      },
    },
    compression: {
      eyebrow: "Compressao da fase 4",
      title: "Fila de compressao FFmpeg",
      description:
        "Comprima um video validado com um preset fixo. Os trabalhos passam por uma fila no servidor, reportam progresso do FFmpeg e podem ser cancelados.",
      dropTitle: "Solte um video para compressao",
      dropDescription:
        "A compressao usa execucao segura do FFmpeg com argumentos fixos, caminhos temporarios aleatorios e sem interpolacao de shell.",
      browseLabel: "Escolher arquivo",
      presetLabel: "Preset de compressao",
      startLabel: "Iniciar compressao",
      cancelLabel: "Cancelar trabalho",
      progressLabel: "Progresso",
      queuedLabel: "Na fila",
      runningLabel: "Executando",
      completedLabel: "Concluido",
      failedLabel: "Falhou",
      cancelledLabel: "Cancelado",
      expiredLabel: "Expirado",
      deletedLabel: "Excluido",
      originalSizeLabel: "Tamanho original",
      compressedSizeLabel: "Tamanho comprimido",
      expiresLabel: "Expira",
      downloadLabel: "Baixar",
      deleteLabel: "Excluir arquivo",
      presetNames: {
        balanced: "Equilibrado",
        small: "Arquivo menor",
        high: "Alta qualidade",
      },
      presetDescriptions: {
        balanced: "Alvo 1080p com equilibrio pratico entre qualidade e tamanho.",
        small: "Alvo 720p para saidas menores.",
        high: "Maior qualidade visual com arquivo maior.",
      },
      errors: {
        noFile: "Escolha um video aceito antes de iniciar a compressao.",
        uploadFailed: "Nao foi possivel iniciar a compressao.",
        cancelFailed: "Nao foi possivel cancelar o trabalho.",
      },
    },
    footer: {
      description:
        "O QAVELIX esta sendo construido em fases deliberadas. Esta fase adiciona validacao segura de upload e analise de metadados.",
      phase: "Validacao de upload da fase 3 concluida",
      linksLabel: "Navegacao do rodape",
    },
  },
  es: {
    metadata: {
      title: "Validacion de carga QAVELIX",
      description:
        "La base segura de validacion de carga y analisis de metadatos con FFprobe de QAVELIX.",
    },
    navigation: {
      skipToContent: "Saltar al contenido",
      product: "Producto",
      upload: "Validacion de carga",
      compression: "Compresion",
      design: "Sistema de diseno",
      accessibility: "Accesibilidad",
      readiness: "Preparacion",
      languageLabel: "Seleccionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Oscuro",
      systemTheme: "Sistema",
    },
    home: {
      eyebrow: "Validacion de carga de fase 3",
      title: "QAVELIX",
      description:
        "Una base segura para una utilidad multimedia en el navegador, con UI localizada, temas resilientes, validacion estricta y compresion FFmpeg en cola.",
      primaryAction: "Validar carga",
      secondaryAction: "Ver seguridad",
      statusLabel: "Alcance actual",
      statusValue:
        "Validacion de carga, analisis con FFprobe y compresion FFmpeg estan activos. Pagos, anuncios y cuentas siguen excluidos.",
      previewLabel: "Vista de validacion",
      previewTitle: "Preparado para entrada segura de medios",
      previewDescription:
        "Los archivos se verifican por tamano, extension, MIME, firma binaria y metadatos de FFprobe antes de futuras fases.",
      previewItems: [
        "Carga con arrastrar y soltar",
        "Validacion del servidor",
        "Analisis temporal",
      ],
      principles: [
        {
          title: "Entrada segura",
          description:
            "La validacion ocurre antes del analisis de medios, y los archivos temporales se eliminan despues de la inspeccion.",
        },
        {
          title: "Feedback claro",
          description:
            "Los errores explican exactamente que regla de carga fallo para que el usuario pueda corregir sin adivinar.",
        },
        {
          title: "Postura de produccion",
          description:
            "Las bases de seguridad, despliegue, i18n, tema y accesibilidad de las fases 1 y 2 se conservan.",
        },
      ],
      stats: [
        { value: "250 MB", label: "Limite" },
        { value: "5", label: "Formatos" },
        { value: "FFprobe", label: "Analisis" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Sistema de diseno",
          title: "Una base visual completa",
          description:
            "QAVELIX conserva los tokens, componentes, estructura de contenido y reglas visuales de fase 2 al agregar la interfaz de validacion.",
          items: [
            {
              title: "Tokens de color",
              description:
                "Variables semanticas definen superficies, texto, bordes, acentos, foco y estados para ambos temas.",
            },
            {
              title: "Primitivos de layout",
              description:
                "Una estructura responsive, anchos controlados, espaciado de secciones y ritmo de tarjetas mantienen consistencia.",
            },
            {
              title: "Estados de interaccion",
              description:
                "Botones, enlaces, selectores, estados de carga y foco por teclado incluyen hover, activo, actual y accesible.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accesibilidad basica",
          title: "Hecho para teclado y lectores de pantalla",
          description:
            "La superficie de carga conserva landmarks semanticos, etiquetas, mensajes de estado, foco visible, contraste y movimiento reducido.",
          items: [
            "El enlace de salto apunta al contenido principal.",
            "Los controles de carga tienen etiquetas e instrucciones explicitas.",
            "El estado de validacion usa anuncios en vivo educados.",
            "El movimiento se limita cuando el usuario lo solicita.",
          ],
        },
        readiness: {
          eyebrow: "Preparacion",
          title: "Listo para extender sin reescribir",
          description:
            "La compresion se limita a presets fijos, cola, progreso, cancelacion y ejecucion segura de FFmpeg.",
          items: [
            {
              title: "Landing page",
              description:
                "La primera pantalla comunica la direccion del producto y ahora incluye un flujo de validacion.",
            },
            {
              title: "API de validacion",
              description:
                "El servidor verifica MIME, extension, firma binaria, tamano y metadatos de FFprobe.",
            },
            {
              title: "Manejo temporal",
              description:
                "Los archivos usan nombres temporales aleatorios para FFprobe y se eliminan despues del proceso.",
            },
          ],
        },
      },
    },
    upload: {
      eyebrow: "Validacion de carga de fase 3",
      title: "Controles seguros de medios",
      description:
        "Arrastra un video para validar tamano, extension, MIME, firma del archivo y metadatos de FFprobe antes de la compresion.",
      dropTitle: "Suelta un video aqui",
      dropDescription:
        "Los archivos se analizan temporalmente, nunca se almacenan de forma permanente y se eliminan despues de FFprobe.",
      browseLabel: "Elegir archivo",
      analyzingLabel: "Analizando archivo",
      supportedLabel: "Formatos admitidos",
      limitsLabel: "Tamano maximo: 250 MB",
      successTitle: "Validacion aprobada",
      errorTitle: "Validacion fallida",
      fileLabel: "Archivo",
      sizeLabel: "Tamano",
      typeLabel: "Tipo MIME",
      durationLabel: "Duracion",
      resolutionLabel: "Resolucion",
      videoCodecLabel: "Codec de video",
      audioCodecLabel: "Codec de audio",
      bitrateLabel: "Bitrate",
      frameRateLabel: "Fotogramas",
      formatLabel: "Contenedor",
      emptyState: "Aun no se analizo ningun archivo.",
      clientErrors: {
        unsupportedExtension: "Esta extension de archivo no es compatible.",
        unsupportedMime: "Este tipo MIME no es compatible.",
        tooLarge: "Este archivo supera el limite de 250 MB.",
        empty: "Este archivo esta vacio.",
        multiple: "Sube un archivo a la vez.",
      },
    },
    compression: {
      eyebrow: "Compresion de fase 4",
      title: "Cola de compresion FFmpeg",
      description:
        "Comprime un video validado con un preset fijo. Los trabajos pasan por una cola del servidor, reportan progreso de FFmpeg y pueden cancelarse.",
      dropTitle: "Suelta un video para compresion",
      dropDescription:
        "La compresion usa ejecucion segura de FFmpeg con argumentos fijos, rutas temporales aleatorias y sin interpolacion de shell.",
      browseLabel: "Elegir archivo",
      presetLabel: "Preset de compresion",
      startLabel: "Iniciar compresion",
      cancelLabel: "Cancelar trabajo",
      progressLabel: "Progreso",
      queuedLabel: "En cola",
      runningLabel: "Ejecutando",
      completedLabel: "Completado",
      failedLabel: "Fallido",
      cancelledLabel: "Cancelado",
      expiredLabel: "Expirado",
      deletedLabel: "Eliminado",
      originalSizeLabel: "Tamano original",
      compressedSizeLabel: "Tamano comprimido",
      expiresLabel: "Expira",
      downloadLabel: "Descargar",
      deleteLabel: "Eliminar archivo",
      presetNames: {
        balanced: "Equilibrado",
        small: "Archivo pequeno",
        high: "Alta calidad",
      },
      presetDescriptions: {
        balanced: "Objetivo 1080p con equilibrio practico entre calidad y tamano.",
        small: "Objetivo 720p para archivos mas pequenos.",
        high: "Mayor calidad visual con salida mas grande.",
      },
      errors: {
        noFile: "Elige un video admitido antes de iniciar la compresion.",
        uploadFailed: "No se pudo iniciar la compresion.",
        cancelFailed: "No se pudo cancelar el trabajo.",
      },
    },
    footer: {
      description:
        "QAVELIX se esta construyendo en fases deliberadas. Esta fase agrega validacion segura de carga y analisis de metadatos.",
      phase: "Validacion de carga de fase 3 completada",
      linksLabel: "Navegacion del footer",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
