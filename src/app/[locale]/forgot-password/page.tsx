import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";
import { getOptionalSession } from "@/lib/server/auth/session";

type ForgotPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// See sign-in/page.tsx's generateMetadata comment: fixes the same wrong-canonical
// defect for this route.
export async function generateMetadata({ params }: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return {
    ...buildSeoMetadata({
      title: `${dictionary.auth.forgotPassword.title} | QAVELIX`,
      description: dictionary.auth.forgotPassword.description,
      locale,
      pathname: "/forgot-password",
    }),
    robots: { index: false, follow: true },
  };
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
