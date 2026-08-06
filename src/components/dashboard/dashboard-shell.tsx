import type { ReactNode } from "react";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import type { PlanType } from "@/lib/server/entitlements/policy";

type Dictionary = ReturnType<typeof getDictionary>;

type DashboardShellProps = {
  locale: Locale;
  dictionary: Dictionary;
  plan: PlanType;
  children: ReactNode;
};

// Server Component by default — only DashboardNav needs to be a client component
// (usePathname() for active-link state). Everything else here, including every page's
// own content, renders on the server. `plan` is resolved once by dashboard/layout.tsx
// (the same requireSession()-gated boundary every dashboard route already sits behind)
// and threaded down as a prop, rather than DashboardNav fetching it client-side — this
// keeps the Billing tab's visibility server-rendered from the first paint, with no flash
// of a link a Free user shouldn't see.
export function DashboardShell({ locale, dictionary, plan, children }: DashboardShellProps) {
  return (
    <main className="page-shell dashboard-shell" id="main-content">
      <DashboardNav dictionary={dictionary} locale={locale} plan={plan} />
      <div className="dashboard-content">{children}</div>
    </main>
  );
}
