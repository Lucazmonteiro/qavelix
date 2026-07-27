import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ExtractAudioTool } from "@/components/extract-audio-tool";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";

type ExtractAudioPlaceholderPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Without this, the page silently inherited the root layout's static canonical/hreflang
// (which points at the locale homepage, not this page) — the same self-referential
// canonical mismatch pattern generateMetadata() already avoids on the homepage and every
// [slug] content page. See buildSeoMetadata()'s reuse there.
export async function generateMetadata({
  params,
}: ExtractAudioPlaceholderPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return buildSeoMetadata({
    title: dictionary.tools.extractAudio.title,
    description: dictionary.tools.extractAudio.subtitle,
    locale,
    pathname: "/tools/extract-audio",
  });
}

export default async function ExtractAudioPlaceholderPage({
  params,
}: ExtractAudioPlaceholderPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <ExtractAudioTool />
    </AppShell>
  );
}
