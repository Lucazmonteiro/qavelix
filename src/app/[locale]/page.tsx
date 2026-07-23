import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { HomepageContent } from "@/components/homepage-content";
import { siteConfig } from "@/config/site";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

const productionUrl = "https://qavelix.com";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: productionUrl,
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QAVELIX Video Compressor",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript",
  url: productionUrl,
  inLanguage: "en",
  offers: {
    "@type": "Offer",
    price: 0,
    priceCurrency: "USD",
  },
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return buildSeoMetadata({
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    locale,
  });
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <HomepageContent />
    </AppShell>
  );
}
