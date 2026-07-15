import type { Locale } from "@/i18n/locales";

type Dictionary = {
  metadata: {
    title: string;
    description: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    statusLabel: string;
    statusValue: string;
    principles: Array<{
      title: string;
      description: string;
    }>;
  };
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    metadata: {
      title: "QAVELIX Foundation",
      description: "The secure, localized, deployment-ready foundation for QAVELIX.",
    },
    home: {
      eyebrow: "Phase 1 foundation",
      title: "QAVELIX",
      description:
        "A production-ready Next.js base with strict TypeScript, localized routes, environment validation, security headers, and deployment scaffolding.",
      statusLabel: "Current scope",
      statusValue:
        "Foundation only. FFmpeg, payments, ads, and accounts are intentionally excluded.",
      principles: [
        {
          title: "Secure by default",
          description:
            "Security headers, strict typing, environment validation, and safe configuration are active from the first phase.",
        },
        {
          title: "Localization-ready",
          description:
            "English, Brazilian Portuguese, and Spanish routes are structured for future product copy.",
        },
        {
          title: "Deployment-ready",
          description:
            "Docker, Vercel, linting, formatting, and build scripts are part of the foundation.",
        },
      ],
    },
  },
  "pt-BR": {
    metadata: {
      title: "Fundação QAVELIX",
      description: "A base segura, localizada e pronta para deploy do QAVELIX.",
    },
    home: {
      eyebrow: "Fundação da fase 1",
      title: "QAVELIX",
      description:
        "Uma base Next.js pronta para produção com TypeScript estrito, rotas localizadas, validação de ambiente, cabeçalhos de segurança e estrutura de deploy.",
      statusLabel: "Escopo atual",
      statusValue:
        "Somente fundação. FFmpeg, pagamentos, anúncios e contas foram excluídos intencionalmente.",
      principles: [
        {
          title: "Seguro por padrão",
          description:
            "Cabeçalhos de segurança, tipagem estrita, validação de ambiente e configuração segura já estão ativos.",
        },
        {
          title: "Pronto para localização",
          description:
            "Rotas em inglês, português do Brasil e espanhol estão estruturadas para textos futuros do produto.",
        },
        {
          title: "Pronto para deploy",
          description:
            "Docker, Vercel, lint, formatação e scripts de build fazem parte da fundação.",
        },
      ],
    },
  },
  es: {
    metadata: {
      title: "Base de QAVELIX",
      description: "La base segura, localizada y lista para despliegue de QAVELIX.",
    },
    home: {
      eyebrow: "Base de la fase 1",
      title: "QAVELIX",
      description:
        "Una base Next.js lista para producción con TypeScript estricto, rutas localizadas, validación de entorno, encabezados de seguridad y estructura de despliegue.",
      statusLabel: "Alcance actual",
      statusValue:
        "Solo base. FFmpeg, pagos, anuncios y cuentas están excluidos intencionalmente.",
      principles: [
        {
          title: "Seguro por defecto",
          description:
            "Encabezados de seguridad, tipado estricto, validación de entorno y configuración segura están activos desde la primera fase.",
        },
        {
          title: "Preparado para localización",
          description:
            "Las rutas en inglés, portugués de Brasil y español están estructuradas para futuros textos del producto.",
        },
        {
          title: "Listo para despliegue",
          description:
            "Docker, Vercel, lint, formato y scripts de build forman parte de la base.",
        },
      ],
    },
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
