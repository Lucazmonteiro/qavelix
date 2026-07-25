import type { ReactNode } from "react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

type Dictionary = ReturnType<typeof getDictionary>;

type DashboardShellProps = {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
};

// Server Component by default — only DashboardNav needs to be a client component
// (usePathname() for active-link state). Everything else here, including every page's
// own content, renders on the server.
export function DashboardShell({ locale, dictionary, children }: DashboardShellProps) {
  return (
    <main className="page-shell dashboard-shell" id="main-content">
      <DashboardNav dictionary={dictionary} locale={locale} />
      <div className="dashboard-content">{children}</div>
    </main>
  );
}
