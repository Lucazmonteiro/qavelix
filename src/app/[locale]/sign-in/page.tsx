import type { Metadata, Route } from "next";
import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";
import { getOptionalSession, sanitizeCallbackPath } from "@/lib/server/auth/session";

type SignInPageProps = {
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

// Fixes an SEO defect: without its own metadata, this route inherited the locale
// layout's default alternates (the homepage's canonical/hreflang), so every locale's
// sign-in page falsely declared itself a duplicate of the English homepage. noindex is
// deliberate too — a utility/auth page has no search-intent value of its own — but it
// still gets a real, correct, self-referencing canonical rather than relying on an
// accidental one.
export async function generateMetadata({ params }: SignInPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return {
    ...buildSeoMetadata({
      title: `${dictionary.auth.signIn.title} | QAVELIX`,
      description: dictionary.auth.signIn.description,
      locale,
      pathname: "/sign-in",
    }),
    robots: { index: false, follow: true },
  };
}

export default async function SignInPage({ params, searchParams }: SignInPageProps) {
  const { locale } = await params;
  const { callbackURL: rawCallbackURL } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  // Untrusted input: this query param is fully attacker-controllable, so it's validated
  // against a strict allowlist (only an internal /dashboard path) before it's ever used
  // as a redirect target or handed to the client form.
  const callbackURL = sanitizeCallbackPath(
    Array.isArray(rawCallbackURL) ? rawCallbackURL[0] : rawCallbackURL,
  );

  // Authoritative, server-rendered guest-only check — no flash of the sign-in form
  // before redirecting an already-authenticated visitor away.
  const session = await getOptionalSession();

  if (session) {
    redirect((callbackURL ?? `/${locale}`) as Route);
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <SignInForm callbackURL={callbackURL} />
    </AppShell>
  );
}
