import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { getOptionalSession, sanitizeCallbackPath } from "@/lib/server/auth/session";

type SignUpPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    callbackURL?: string | string[];
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function SignUpPage({ params, searchParams }: SignUpPageProps) {
  const { locale } = await params;
  const { callbackURL: rawCallbackURL } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const callbackURL = sanitizeCallbackPath(
    Array.isArray(rawCallbackURL) ? rawCallbackURL[0] : rawCallbackURL,
  );

  const session = await getOptionalSession();

  if (session) {
    redirect((callbackURL ?? `/${locale}`) as Route);
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <SignUpForm callbackURL={callbackURL} />
    </AppShell>
  );
}
