import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { requireSession } from "@/lib/server/auth/session";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Protects every route under /dashboard/*. requireSession() redirects to the localized
// sign-in page (with a safe callback back to /dashboard) when there is no session — this
// runs server-side before any dashboard content renders, so there is no flash of
// protected content and no client-side redirect.
export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  await requireSession(locale, "/dashboard");

  const dictionary = getDictionary(locale);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <DashboardShell dictionary={dictionary} locale={locale}>
        {children}
      </DashboardShell>
    </AppShell>
  );
}
