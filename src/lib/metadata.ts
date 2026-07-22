import type { Metadata } from "next";

import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/locales";
import { locales } from "@/i18n/locales";

const openGraphLocales: Record<Locale, string> = {
  en: "en_US",
  "pt-BR": "pt_BR",
  es: "es_ES",
};

export function normalizePathname(pathname = "") {
  if (!pathname || pathname === "/") {
    return "";
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return normalizedPath === "/" ? "" : normalizedPath;
}

export function buildLocalizedUrl(locale: Locale, pathname = "") {
  return `${siteConfig.url}/${locale}${normalizePathname(pathname)}`;
}

export function buildLocalizedAlternates(
  pathname = "",
  locale: Locale = siteConfig.defaultLocale,
): Metadata["alternates"] {
  const normalizedPath = normalizePathname(pathname);

  return {
    canonical: buildLocalizedUrl(locale, normalizedPath),
    languages: Object.fromEntries(
      locales.map((availableLocale) => [
        availableLocale,
        buildLocalizedUrl(availableLocale, normalizedPath),
      ]),
    ) as Record<Locale, string>,
  };
}

export function buildSeoMetadata({
  description,
  locale,
  pathname = "",
  title,
}: {
  description: string;
  locale: Locale;
  pathname?: string;
  title: string;
}): Metadata {
  const url = buildLocalizedUrl(locale, pathname);

  return {
    title,
    description,
    alternates: buildLocalizedAlternates(pathname, locale),
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: openGraphLocales[locale],
      alternateLocale: locales
        .filter((availableLocale) => availableLocale !== locale)
        .map((availableLocale) => openGraphLocales[availableLocale]),
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
