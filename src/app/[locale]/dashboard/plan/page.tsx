import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

type DashboardPlanPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// No plan/subscription data model exists yet, and this milestone explicitly does not
// create one — this page is an honest "coming soon" placeholder, not fake data.
export default async function DashboardPlanPage({ params }: DashboardPlanPageProps) {
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
        description={copy.planDescription}
        eyebrow={dictionary.dashboard.overview.eyebrow}
        title={nav.plan}
      />
      <DashboardPlaceholder
        badge={copy.comingSoonBadge}
        description={copy.planDescription}
        title={copy.planTitle}
      />
    </>
  );
}
