import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { VideoTrimmerTool } from "@/components/video-trimmer-tool";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";

type VideoTrimmerPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Without this, the page silently inherited the root layout's static canonical/hreflang —
// same reasoning as extract-audio's page.tsx, which this file mirrors exactly.
export async function generateMetadata({
  params,
}: VideoTrimmerPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return buildSeoMetadata({
    title: dictionary.tools.videoTrimmer.title,
    description: dictionary.tools.videoTrimmer.subtitle,
    locale,
    pathname: "/tools/video-trimmer",
  });
}

export default async function VideoTrimmerPage({ params }: VideoTrimmerPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <VideoTrimmerTool />
    </AppShell>
  );
}
