import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { FoundationCard } from "@/components/foundation-card";
import { SectionHeading } from "@/components/section-heading";
import { UploadValidator } from "@/components/upload-validator";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
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
  const design = dictionary.home.sections.designSystem;
  const accessibility = dictionary.home.sections.accessibility;
  const readiness = dictionary.home.sections.readiness;

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <main className="page-shell" id="main-content">
        <section className="hero-section" id="product">
          <div className="hero-section__content">
            <p className="eyebrow">{dictionary.home.eyebrow}</p>
            <h1>{dictionary.home.title}</h1>
            <p className="hero-section__description">{dictionary.home.description}</p>

            <div className="hero-section__actions">
              <a className="button button--primary" href={`/${locale}#upload-validation`}>
                {dictionary.home.primaryAction}
              </a>
              <a className="button button--secondary" href={`/${locale}#readiness`}>
                {dictionary.home.secondaryAction}
              </a>
            </div>

            <dl className="stat-grid" aria-label={dictionary.home.statusLabel}>
              {dictionary.home.stats.map((stat) => (
                <div className="stat-grid__item" key={stat.label}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="product-preview" aria-labelledby="preview-title">
            <p className="product-preview__label">{dictionary.home.previewLabel}</p>
            <h2 id="preview-title">{dictionary.home.previewTitle}</h2>
            <p>{dictionary.home.previewDescription}</p>
            <ul>
              {dictionary.home.previewItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="scope-note">
              <span>{dictionary.home.statusLabel}</span>
              <strong>{dictionary.home.statusValue}</strong>
            </div>
          </aside>
        </section>

        <UploadValidator copy={dictionary.upload} />

        <section className="card-grid" aria-label={dictionary.home.eyebrow}>
          {dictionary.home.principles.map((principle) => (
            <FoundationCard
              description={principle.description}
              key={principle.title}
              title={principle.title}
            />
          ))}
        </section>

        <section className="content-section" id="design-system">
          <SectionHeading
            description={design.description}
            eyebrow={design.eyebrow}
            title={design.title}
          />
          <div className="feature-grid">
            {design.items.map((item) => (
              <FoundationCard
                description={item.description}
                key={item.title}
                title={item.title}
              />
            ))}
          </div>
        </section>

        <section className="split-section" id="accessibility">
          <SectionHeading
            description={accessibility.description}
            eyebrow={accessibility.eyebrow}
            title={accessibility.title}
          />
          <ul className="check-list">
            {accessibility.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="content-section content-section--last" id="readiness">
          <SectionHeading
            description={readiness.description}
            eyebrow={readiness.eyebrow}
            title={readiness.title}
          />
          <div className="feature-grid">
            {readiness.items.map((item) => (
              <FoundationCard
                description={item.description}
                key={item.title}
                title={item.title}
              />
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
