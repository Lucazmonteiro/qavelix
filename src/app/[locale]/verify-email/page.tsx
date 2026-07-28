import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

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
