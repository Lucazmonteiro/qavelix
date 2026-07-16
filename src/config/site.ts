import type { Locale } from "@/i18n/locales";

export const siteConfig: {
  name: string;
  description: string;
  defaultLocale: Locale;
  url: string;
} = {
  name: "QAVELIX",
  description:
    "A secure, localized media workflow for validation, compression, temporary downloads, and legal-readiness placeholders.",
  defaultLocale: "en",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
