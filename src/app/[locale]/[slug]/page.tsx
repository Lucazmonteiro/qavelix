import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import {
  contentPageSlugs,
  isContentPageSlug,
  type ContentPageSlug,
} from "@/config/content-pages";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";

type ContentPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

function getPageCopy(locale: string, slug: string) {
  if (!isLocale(locale) || !isContentPageSlug(slug)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return {
    dictionary,
    page: dictionary.pages[slug],
    locale,
    slug,
  };
}

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    contentPageSlugs.map((slug) => ({
      locale,
      slug,
    })),
  );
}

export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const pageContext = getPageCopy(locale, slug);

  return buildSeoMetadata({
    title: pageContext.page.metadata.title,
    description: pageContext.page.metadata.description,
    locale: pageContext.locale,
    pathname: `/${pageContext.slug}`,
  });
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { locale, slug } = await params;
  const {
    dictionary,
    page,
    locale: validLocale,
  } = getPageCopy(locale, slug) as ReturnType<typeof getPageCopy> & {
    slug: ContentPageSlug;
  };
  const faqJsonLd =
    slug === "faq"
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.sections.map((section) => ({
            "@type": "Question",
            name: section.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: section.body.join(" "),
            },
          })),
        }
      : null;

  return (
    <AppShell dictionary={dictionary} locale={validLocale}>
      <main className="page-shell content-page" id="main-content">
        {faqJsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
        ) : null}

        <section className="content-page__hero">
          <p className="eyebrow">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </section>

        <div className="content-page__sections">
          {page.sections.map((section) => (
            <section className="content-page__section" key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
