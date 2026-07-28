"use client";

import { usePathname } from "next/navigation";

import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";

// Next.js's built-in loading-UI convention — automatically shown while a dashboard
// route's Server Component data (the session read) is in flight. A client component so
// it can derive the locale from the URL itself (loading.tsx doesn't receive the same
// params prop page.tsx/layout.tsx do); mirrors how src/i18n/locale-context.tsx already
// resolves locale from the pathname client-side.
export default function DashboardLoading() {
  const pathname = usePathname();
  const maybeLocale = pathname.split("/")[1] ?? "";
  const locale = isLocale(maybeLocale) ? maybeLocale : "en";
  const dictionary = getDictionary(locale);

  return (
    <div className="dashboard-loading" role="status">
      <span aria-hidden="true" className="validation-loader" />
      <p>{dictionary.dashboard.loading}</p>
    </div>
  );
}
