import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

type VerifyEmailPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <VerifyEmailStatus />
    </AppShell>
  );
}
