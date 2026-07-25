import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { getOptionalSession } from "@/lib/server/auth/session";

type SignInPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  // Authoritative, server-rendered guest-only check — no flash of the sign-in form
  // before redirecting an already-authenticated visitor away.
  const session = await getOptionalSession();

  if (session) {
    redirect(`/${locale}`);
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <SignInForm />
    </AppShell>
  );
}
