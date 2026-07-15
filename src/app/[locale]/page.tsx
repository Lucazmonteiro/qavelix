import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FoundationCard } from "@/components/foundation-card";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, localeLabels, locales } from "@/i18n/locales";
import { buildLocalizedAlternates } from "@/lib/metadata";

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    alternates: buildLocalizedAlternates(),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between gap-4">
        <a className="text-xl font-bold tracking-normal" href={`/${locale}`}>
          QAVELIX
        </a>
        <nav aria-label="Language selector" className="flex flex-wrap gap-2">
          {locales.map((availableLocale) => (
            <a
              aria-current={availableLocale === locale ? "page" : undefined}
              className="border-border bg-surface rounded-md border px-3 py-2 text-sm font-medium transition hover:border-accent"
              href={`/${availableLocale}`}
              key={availableLocale}
            >
              {localeLabels[availableLocale]}
            </a>
          ))}
        </nav>
      </header>

      <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-accent text-sm font-bold uppercase">
            {dictionary.home.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-normal sm:text-6xl">
            {dictionary.home.title}
          </h1>
          <p className="text-muted mt-6 max-w-2xl text-lg leading-8">
            {dictionary.home.description}
          </p>
        </div>

        <aside className="border-border bg-surface shadow-soft rounded-lg border p-6">
          <p className="text-muted text-sm font-semibold uppercase">
            {dictionary.home.statusLabel}
          </p>
          <p className="mt-3 text-2xl font-semibold leading-9">
            {dictionary.home.statusValue}
          </p>
        </aside>
      </section>

      <section className="grid gap-4 pb-12 md:grid-cols-3">
        {dictionary.home.principles.map((principle) => (
          <FoundationCard
            description={principle.description}
            key={principle.title}
            title={principle.title}
          />
        ))}
      </section>
    </main>
  );
}
