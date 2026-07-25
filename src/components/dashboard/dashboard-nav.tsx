"use client";

import { usePathname } from "next/navigation";

import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

type Dictionary = ReturnType<typeof getDictionary>;

type DashboardNavProps = {
  locale: Locale;
  dictionary: Dictionary;
};

// The only client piece of the dashboard shell — needs usePathname() for active-link
// state. No open/close toggle: like every other nav in this app, it reflows via CSS
// (sidebar list -> horizontal scrollable row) at narrow widths rather than collapsing
// behind a hamburger button.
export function DashboardNav({ locale, dictionary }: DashboardNavProps) {
  const pathname = usePathname();
  const copy = dictionary.dashboard.nav;

  const items = [
    { href: `/${locale}/dashboard`, label: copy.overview },
    { href: `/${locale}/dashboard/usage`, label: copy.usage },
    { href: `/${locale}/dashboard/plan`, label: copy.plan },
    { href: `/${locale}/dashboard/billing`, label: copy.billing },
    { href: `/${locale}/dashboard/settings`, label: copy.settings },
  ];

  return (
    <nav aria-label={copy.navLabel} className="dashboard-nav">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            className="dashboard-nav__link"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
