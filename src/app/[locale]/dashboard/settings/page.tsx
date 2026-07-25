import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";

type DashboardSettingsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// No account-settings management exists yet — this page is an honest "coming soon"
// placeholder, not fake data.
export default async function DashboardSettingsPage({ params }: DashboardSettingsPageProps) {
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
        description={copy.settingsDescription}
        eyebrow={dictionary.dashboard.overview.eyebrow}
        title={nav.settings}
      />
      <DashboardPlaceholder
        badge={copy.comingSoonBadge}
        description={copy.settingsDescription}
        title={copy.settingsTitle}
      />
    </>
  );
}
