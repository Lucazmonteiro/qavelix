import type { Locale } from "@/i18n/locales";

type Dictionary = {
  metadata: {
    title: string;
    description: string;
  };
  navigation: {
    skipToContent: string;
    product: string;
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
    principles: Array<{
      title: string;
      description: string;
    }>;
    stats: Array<{
      value: string;
      label: string;
    }>;
    sections: {
      designSystem: {
        eyebrow: string;
        title: string;
        description: string;
        items: Array<{
          title: string;
          description: string;
        }>;
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
        items: Array<{
          title: string;
          description: string;
        }>;
      };
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
      title: "QAVELIX Design System",
      description:
        "The responsive, accessible, theme-ready design system foundation for QAVELIX.",
    },
    navigation: {
      skipToContent: "Skip to content",
      product: "Product",
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
      eyebrow: "Phase 2 design system",
      title: "QAVELIX",
      description:
        "A polished, responsive interface foundation for a future browser-based media utility, built with localized content, accessible controls, and resilient light and dark themes.",
      primaryAction: "Explore system",
      secondaryAction: "Review accessibility",
      statusLabel: "Current scope",
      statusValue:
        "Design system and landing experience only. FFmpeg, payments, ads, and accounts remain intentionally excluded.",
      previewLabel: "Interface preview",
      previewTitle: "Prepared for the product phases ahead",
      previewDescription:
        "The layout now supports clear navigation, theme preferences, localized content, and reusable presentation patterns.",
      previewItems: ["Responsive shell", "Theme controls", "Localized navigation"],
      principles: [
        {
          title: "Clear hierarchy",
          description:
            "Large decisions are easy to scan, while supporting content stays compact and predictable.",
        },
        {
          title: "Reusable patterns",
          description:
            "Cards, buttons, navigation, and structured sections share a single visual language.",
        },
        {
          title: "Production posture",
          description:
            "The Phase 1 security, validation, Docker, Vercel, linting, and build foundations are preserved.",
        },
      ],
      stats: [
        { value: "3", label: "Locales" },
        { value: "2", label: "Themes" },
        { value: "100%", label: "Responsive" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Design system",
          title: "A complete visual foundation",
          description:
            "QAVELIX now has tokens, components, content structure, and page composition rules that can carry future upload and compression workflows.",
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
                "Buttons, links, selector controls, and focus rings include hover, active, current, and keyboard states.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accessibility basics",
          title: "Built for keyboard and screen-reader use",
          description:
            "The foundation includes semantic landmarks, skip navigation, visible focus states, contrast-aware theme tokens, and reduced-motion handling.",
          items: [
            "Skip link targets the main content.",
            "Navigation and selectors have explicit labels.",
            "Current locale and active theme are announced.",
            "Motion is restrained for users who request reduced motion.",
          ],
        },
        readiness: {
          eyebrow: "Readiness",
          title: "Ready to extend without rewriting",
          description:
            "The design system is intentionally broad enough for future product surfaces while avoiding future-phase functionality.",
          items: [
            {
              title: "Landing page",
              description:
                "The first screen communicates the product direction without implementing compression features.",
            },
            {
              title: "Navigation",
              description:
                "Header links, language switching, and footer wayfinding are localized and responsive.",
            },
            {
              title: "Theme persistence",
              description:
                "The client stores the user preference and respects system color scheme when requested.",
            },
          ],
        },
      },
    },
    footer: {
      description:
        "QAVELIX is being built in deliberate phases. This phase adds the visual and accessibility foundation.",
      phase: "Phase 2 complete foundation",
      linksLabel: "Footer navigation",
    },
  },
  "pt-BR": {
    metadata: {
      title: "Sistema de design QAVELIX",
      description: "A fundação responsiva, acessível e pronta para temas do QAVELIX.",
    },
    navigation: {
      skipToContent: "Pular para o conteúdo",
      product: "Produto",
      design: "Sistema de design",
      accessibility: "Acessibilidade",
      readiness: "Prontidão",
      languageLabel: "Selecionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Escuro",
      systemTheme: "Sistema",
    },
    home: {
      eyebrow: "Sistema de design da fase 2",
      title: "QAVELIX",
      description:
        "Uma base visual refinada e responsiva para uma futura ferramenta de mídia no navegador, com conteúdo localizado, controles acessíveis e temas claro e escuro.",
      primaryAction: "Explorar sistema",
      secondaryAction: "Ver acessibilidade",
      statusLabel: "Escopo atual",
      statusValue:
        "Somente sistema de design e landing page. FFmpeg, pagamentos, anúncios e contas continuam excluídos intencionalmente.",
      previewLabel: "Prévia da interface",
      previewTitle: "Preparado para as próximas fases do produto",
      previewDescription:
        "O layout agora oferece navegação clara, preferência de tema, conteúdo localizado e padrões visuais reutilizáveis.",
      previewItems: ["Estrutura responsiva", "Controles de tema", "Navegação localizada"],
      principles: [
        {
          title: "Hierarquia clara",
          description:
            "As decisões principais são fáceis de entender, enquanto o conteúdo de apoio permanece compacto e previsível.",
        },
        {
          title: "Padrões reutilizáveis",
          description:
            "Cards, botões, navegação e seções estruturadas compartilham uma única linguagem visual.",
        },
        {
          title: "Postura de produção",
          description:
            "As bases de segurança, validação, Docker, Vercel, lint e build da fase 1 foram preservadas.",
        },
      ],
      stats: [
        { value: "3", label: "Idiomas" },
        { value: "2", label: "Temas" },
        { value: "100%", label: "Responsivo" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Sistema de design",
          title: "Uma fundação visual completa",
          description:
            "O QAVELIX agora tem tokens, componentes, estrutura de conteúdo e regras de composição para futuras telas de upload e compressão.",
          items: [
            {
              title: "Tokens de cor",
              description:
                "Variáveis semânticas definem superfícies, textos, bordas, destaques, foco e estados para os dois temas.",
            },
            {
              title: "Primitivos de layout",
              description:
                "Estrutura responsiva, larguras controladas, espaçamento de seções e ritmo de cards mantêm a consistência.",
            },
            {
              title: "Estados de interação",
              description:
                "Botões, links, seletores e foco por teclado incluem estados de hover, ativo, atual e acessível.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Acessibilidade básica",
          title: "Feito para teclado e leitores de tela",
          description:
            "A fundação inclui landmarks semânticos, link de pular navegação, foco visível, contraste nos temas e tratamento para movimento reduzido.",
          items: [
            "Link de pular navegação aponta para o conteúdo principal.",
            "Navegação e seletores têm rótulos explícitos.",
            "Idioma atual e tema ativo são anunciados.",
            "O movimento é contido para quem prefere movimento reduzido.",
          ],
        },
        readiness: {
          eyebrow: "Prontidão",
          title: "Pronto para evoluir sem reescrever",
          description:
            "O sistema de design é amplo o suficiente para futuras telas do produto sem implementar funcionalidades de fases futuras.",
          items: [
            {
              title: "Landing page",
              description:
                "A primeira tela comunica a direção do produto sem implementar recursos de compressão.",
            },
            {
              title: "Navegação",
              description:
                "Links do cabeçalho, troca de idioma e navegação do rodapé são localizados e responsivos.",
            },
            {
              title: "Persistência de tema",
              description:
                "O cliente salva a preferência do usuário e respeita o esquema de cores do sistema quando solicitado.",
            },
          ],
        },
      },
    },
    footer: {
      description:
        "O QAVELIX está sendo construído em fases deliberadas. Esta fase adiciona a fundação visual e de acessibilidade.",
      phase: "Fundação da fase 2 concluída",
      linksLabel: "Navegação do rodapé",
    },
  },
  es: {
    metadata: {
      title: "Sistema de diseño QAVELIX",
      description: "La base responsive, accesible y preparada para temas de QAVELIX.",
    },
    navigation: {
      skipToContent: "Saltar al contenido",
      product: "Producto",
      design: "Sistema de diseño",
      accessibility: "Accesibilidad",
      readiness: "Preparación",
      languageLabel: "Seleccionar idioma",
      themeLabel: "Tema",
      lightTheme: "Claro",
      darkTheme: "Oscuro",
      systemTheme: "Sistema",
    },
    home: {
      eyebrow: "Sistema de diseño de la fase 2",
      title: "QAVELIX",
      description:
        "Una base visual pulida y responsive para una futura herramienta multimedia en el navegador, con contenido localizado, controles accesibles y temas claro y oscuro.",
      primaryAction: "Explorar sistema",
      secondaryAction: "Ver accesibilidad",
      statusLabel: "Alcance actual",
      statusValue:
        "Solo sistema de diseño y landing page. FFmpeg, pagos, anuncios y cuentas siguen excluidos intencionalmente.",
      previewLabel: "Vista de interfaz",
      previewTitle: "Preparado para las próximas fases del producto",
      previewDescription:
        "El layout ahora ofrece navegación clara, preferencias de tema, contenido localizado y patrones visuales reutilizables.",
      previewItems: [
        "Estructura responsive",
        "Controles de tema",
        "Navegación localizada",
      ],
      principles: [
        {
          title: "Jerarquía clara",
          description:
            "Las decisiones principales son fáciles de revisar, mientras el contenido de apoyo se mantiene compacto y predecible.",
        },
        {
          title: "Patrones reutilizables",
          description:
            "Tarjetas, botones, navegación y secciones estructuradas comparten un mismo lenguaje visual.",
        },
        {
          title: "Postura de producción",
          description:
            "Las bases de seguridad, validación, Docker, Vercel, lint y build de la fase 1 se conservan.",
        },
      ],
      stats: [
        { value: "3", label: "Idiomas" },
        { value: "2", label: "Temas" },
        { value: "100%", label: "Responsive" },
      ],
      sections: {
        designSystem: {
          eyebrow: "Sistema de diseño",
          title: "Una base visual completa",
          description:
            "QAVELIX ahora tiene tokens, componentes, estructura de contenido y reglas de composición para futuras pantallas de carga y compresión.",
          items: [
            {
              title: "Tokens de color",
              description:
                "Variables semánticas definen superficies, texto, bordes, acentos, foco y estados para ambos temas.",
            },
            {
              title: "Primitivos de layout",
              description:
                "Una estructura responsive, anchos controlados, espaciado de secciones y ritmo de tarjetas mantienen la consistencia.",
            },
            {
              title: "Estados de interacción",
              description:
                "Botones, enlaces, selectores y foco por teclado incluyen estados hover, activo, actual y accesible.",
            },
          ],
        },
        accessibility: {
          eyebrow: "Accesibilidad básica",
          title: "Hecho para teclado y lectores de pantalla",
          description:
            "La base incluye landmarks semánticos, enlace de salto, foco visible, tokens con contraste y soporte para movimiento reducido.",
          items: [
            "El enlace de salto apunta al contenido principal.",
            "La navegación y los selectores tienen etiquetas explícitas.",
            "El idioma actual y el tema activo se anuncian.",
            "El movimiento se limita cuando el usuario lo solicita.",
          ],
        },
        readiness: {
          eyebrow: "Preparación",
          title: "Listo para extender sin reescribir",
          description:
            "El sistema de diseño es suficientemente amplio para futuras superficies del producto sin implementar funciones de fases futuras.",
          items: [
            {
              title: "Landing page",
              description:
                "La primera pantalla comunica la dirección del producto sin implementar funciones de compresión.",
            },
            {
              title: "Navegación",
              description:
                "Los enlaces del encabezado, el cambio de idioma y el footer están localizados y son responsive.",
            },
            {
              title: "Persistencia de tema",
              description:
                "El cliente guarda la preferencia del usuario y respeta el esquema de color del sistema cuando se solicita.",
            },
          ],
        },
      },
    },
    footer: {
      description:
        "QAVELIX se está construyendo en fases deliberadas. Esta fase añade la base visual y de accesibilidad.",
      phase: "Base de fase 2 completada",
      linksLabel: "Navegación del footer",
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
