import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/locales";
import { locales } from "@/i18n/locales";

export function buildLocalizedAlternates(pathname = ""): Metadata["alternates"] {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return {
    canonical: `${siteConfig.url}/${siteConfig.defaultLocale}${normalizedPath}`,
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `${siteConfig.url}/${locale}${normalizedPath}`]),
    ) as Record<Locale, string>,
  };
}
