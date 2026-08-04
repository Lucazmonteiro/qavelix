import type { MetadataRoute } from "next";

import { contentPageSlugs } from "@/config/content-pages";
import { siteConfig } from "@/config/site";
import { locales } from "@/i18n/locales";
import { buildLocalizedUrl } from "@/lib/metadata";

export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

// Real, indexable tool routes that live outside the [slug] content-page registry — today
// just Extract Audio (`src/app/[locale]/tools/extract-audio/page.tsx`). The Video
// Compressor is intentionally NOT listed here: it lives on the localized homepage itself
// (already covered below), not a separate /tools/video-compressor route that doesn't
// exist. Add a route here only once its page actually ships.
const toolPageSlugs = ["tools/extract-audio", "tools/video-trimmer"] as const;

function buildAlternates(pathname = ""): SitemapEntry["alternates"] {
  return {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, buildLocalizedUrl(locale, pathname)]),
    ),
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const localizedRoutes: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: buildLocalizedUrl(locale),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: locale === siteConfig.defaultLocale ? 1 : 0.9,
      alternates: buildAlternates(),
    },
    ...toolPageSlugs.map((slug) => ({
      url: buildLocalizedUrl(locale, `/${slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: buildAlternates(`/${slug}`),
    })),
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
