import type { MetadataRoute } from "next";

import { contentPageSlugs } from "@/config/content-pages";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/locales";
import { buildLocalizedUrl } from "@/lib/metadata";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const buildAlternates = (pathname = "") => ({
    languages: Object.fromEntries(
      locales.map((locale) => [locale, buildLocalizedUrl(locale, pathname)]),
    ),
  });
  const localizedRoutes = locales.flatMap((locale) => [
    {
      url: buildLocalizedUrl(locale),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: locale === siteConfig.defaultLocale ? 1 : 0.9,
      alternates: buildAlternates(),
    },
    ...contentPageSlugs.map((slug) => ({
      url: buildLocalizedUrl(locale, `/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
      alternates: buildAlternates(`/${slug}`),
    })),
  ]);

  return localizedRoutes;
}
