import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ExtractAudioTool } from "@/components/extract-audio-tool";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

type ExtractAudioPlaceholderPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
