import type { Locale } from "@/i18n/locales";

export const siteConfig = {
  name: "QAVELIX",
  description: "A privacy-focused browser tool foundation for future media workflows.",
  defaultLocale: "en" satisfies Locale,
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};
