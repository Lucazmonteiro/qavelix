import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

type DashboardBillingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// No billing data model or payment provider exists yet, and this milestone explicitly
// does not create one — this page is an honest "coming soon" placeholder, not fake data.
export default async function DashboardBillingPage({ params }: DashboardBillingPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = getDictionary(locale);
  const nav = dictionary.dashboard.nav;
  const copy = dictionary.dashboard.placeholder;

  return (
    <>
      <DashboardHeader
        description={copy.billingDescription}
        eyebrow={dictionary.dashboard.overview.eyebrow}
        title={nav.billing}
      />
      <DashboardPlaceholder
        badge={copy.comingSoonBadge}
        description={copy.billingDescription}
        title={copy.billingTitle}
      />
    </>
  );
}
