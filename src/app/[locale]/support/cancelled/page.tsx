import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

type SupportCancelledPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SupportCancelledPage({ params }: SupportCancelledPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const copy = dictionary.support.cancelled;

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <AuthFormShell description={copy.description} eyebrow={copy.eyebrow} title={copy.title}>
        <div className="upgrade-modal__actions">
          <a className="button button--primary" href={`/${locale}/support`}>
            {copy.tryAgainLabel}
          </a>
          <a className="button button--secondary" href={`/${locale}`}>
            {copy.returnHomeLabel}
          </a>
        </div>
      </AuthFormShell>
    </AppShell>
  );
}
