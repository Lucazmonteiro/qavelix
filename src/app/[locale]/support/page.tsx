import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { FoundationCard } from "@/components/foundation-card";
import { SupportCheckoutForm } from "@/components/support-checkout-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";

// Decorative only (aria-hidden in the page itself) — not localized text, so it lives
// here rather than in the dictionary, same convention as the emoji icons already used
// for tool entries in app-header.tsx.
const SUPPORT_HELP_ICONS = ["🛠️", "🖥️", "🔒", "🌐"];

type SupportPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: SupportPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return buildSeoMetadata({
    title: dictionary.support.metadataTitle,
    description: dictionary.support.metadataDescription,
    locale,
    pathname: "/support",
  });
}

// Institutional page for visitors who voluntarily want to support QAVELIX — see
// support-checkout-form.tsx for the Stripe one-time-payment flow itself. This page is
// purely mission/trust content plus the amount picker; the actual Checkout Session is
// created server-side in /api/support/checkout, never here.
export default async function SupportPage({ params }: SupportPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const copy = dictionary.support;

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <main className="page-shell content-page" id="main-content">
        <section className="content-page__hero">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>
            <span aria-hidden="true" className="support-hero__mark">
              {"♥"}
            </span>
            {copy.title}
          </h1>
          <p>{copy.intro}</p>
        </section>

        <div className="content-page__sections">
          <section className="content-page__section" aria-labelledby="support-story-title">
            <p className="eyebrow">{copy.story.eyebrow}</p>
            <h2 id="support-story-title">{copy.story.title}</h2>
            {copy.story.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>

          <section className="content-page__section" aria-labelledby="support-helps-title">
            <p className="eyebrow">{copy.helps.eyebrow}</p>
            <h2 id="support-helps-title">{copy.helps.title}</h2>
            <p>{copy.helps.description}</p>
            <div className="card-grid support-helps-grid">
              {copy.helps.cards.map((card, index) => (
                <FoundationCard
                  description={card.description}
                  icon={SUPPORT_HELP_ICONS[index]}
                  key={card.title}
                  title={card.title}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="support-transparency-title" className="support-notice">
            <p className="support-notice__title" id="support-transparency-title">
              {copy.transparency.title}
            </p>
            <ul>
              {copy.transparency.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="foundation-card support-form-card">
            <SupportCheckoutForm dictionary={dictionary} locale={locale} />
          </section>
        </div>

        <p className="support-closing">{copy.closingMessage}</p>
      </main>
    </AppShell>
  );
}
