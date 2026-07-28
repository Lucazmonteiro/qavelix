import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { getOptionalSession } from "@/lib/server/auth/session";

type ForgotPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await getOptionalSession();

  if (session) {
    redirect(`/${locale}`);
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <ForgotPasswordForm />
    </AppShell>
  );
}
