import { notFound } from "next/navigation";

import { AccountSummaryCard } from "@/components/dashboard/account-summary-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ToolQuickLinks } from "@/components/dashboard/tool-quick-links";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { requireSession } from "@/lib/server/auth/session";

type DashboardOverviewPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// The layout already gates this whole route segment, but this page independently reads
// its own session data (idiomatic Next.js — a page fetches what it needs to render,
// the same way every other page here independently calls getDictionary()) rather than
// relying on data implicitly passed down from the layout, which Next.js doesn't support
// for Server Components anyway.
export default async function DashboardOverviewPage({ params }: DashboardOverviewPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireSession(locale, "/dashboard");
  const dictionary = getDictionary(locale);
  const copy = dictionary.dashboard.overview;
  const displayName = session.user.name || copy.welcomeFallbackName;

  return (
    <>
      <DashboardHeader
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={`${copy.welcomeGreeting}, ${displayName}`}
      />
      <AccountSummaryCard
        dictionary={dictionary}
        email={session.user.email}
        emailVerified={session.user.emailVerified}
      />
      <ToolQuickLinks dictionary={dictionary} locale={locale} />
    </>
  );
}
