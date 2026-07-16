import type { MetadataRoute } from "next";

import { contentPageSlugs } from "@/config/content-pages";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/locales";
import { buildLocalizedUrl } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const localizedRoutes = locales.flatMap((locale) => [
    {
      url: buildLocalizedUrl(locale),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: locale === siteConfig.defaultLocale ? 1 : 0.9,
    },
    ...contentPageSlugs.map((slug) => ({
      url: buildLocalizedUrl(locale, `/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ]);

  return localizedRoutes;
}
