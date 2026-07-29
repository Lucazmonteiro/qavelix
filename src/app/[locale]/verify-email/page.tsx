import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { buildSeoMetadata } from "@/lib/metadata";

type VerifyEmailPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    result?: string;
    match?: string;
    code?: string;
    email?: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// See sign-in/page.tsx's generateMetadata comment: fixes the same wrong-canonical
// defect for this route. No dedicated "description" field exists for this section, so
// pendingMessage (the same copy already shown on the page's default state) doubles as
// the meta description — it's an accurate, generic summary of what the page is for.
export async function generateMetadata({ params }: VerifyEmailPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return {
    ...buildSeoMetadata({
      title: `${dictionary.auth.verifyEmail.title} | QAVELIX`,
      description: dictionary.auth.verifyEmail.pendingMessage,
      locale,
      pathname: "/verify-email",
    }),
    robots: { index: false, follow: true },
  };
}

const RESULT_VALUES = new Set(["success", "error"]);
const MATCH_VALUES = new Set(["same", "different", "none"]);

export default async function VerifyEmailPage({ params, searchParams }: VerifyEmailPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const { result, match, code, email } = await searchParams;

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <VerifyEmailStatus
        errorCode={code ?? null}
        // Only ever built by src/app/api/verify-email/route.ts's own validated redirect —
        // still narrowed against a fixed set here rather than trusted as an arbitrary
        // string, the same defense-in-depth posture as sanitizeCallbackPath.
        match={match && MATCH_VALUES.has(match) ? (match as "same" | "different" | "none") : null}
        maskedEmail={email ?? null}
        result={result && RESULT_VALUES.has(result) ? (result as "success" | "error") : null}
      />
    </AppShell>
  );
}
