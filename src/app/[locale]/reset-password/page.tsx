import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

type ResetPasswordPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

function normalizeToken(token: string | string[] | undefined): string | null {
  if (Array.isArray(token)) {
    return token[0] ?? null;
  }

  return token ?? null;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Not guest-only: resetting a password from a token link is a legitimate action
// regardless of whether the visitor also happens to have an active session in this
// browser (e.g. requested a reset, then separately signed back in in another tab).
export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale } = await params;
  const { token } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <ResetPasswordForm token={normalizeToken(token)} />
    </AppShell>
  );
}
