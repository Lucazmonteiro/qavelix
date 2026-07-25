import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { getOptionalSession } from "@/lib/server/auth/session";

type SignUpPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SignUpPage({ params }: SignUpPageProps) {
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
      <SignUpForm />
    </AppShell>
  );
}
