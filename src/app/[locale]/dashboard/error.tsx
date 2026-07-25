"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Next.js's built-in error-boundary convention (must be a client component). Logs only
// the error's digest (Next's own opaque correlation reference for server-side error
// tracking) — never error.message or error.stack, which could echo request/session data
// back into console output.
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const pathname = usePathname();
  const maybeLocale = pathname.split("/")[1] ?? "";
  const locale = isLocale(maybeLocale) ? maybeLocale : "en";
  const dictionary = getDictionary(locale);
  const copy = dictionary.dashboard.error;

  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        event: "dashboard_render_error",
        digest: error.digest ?? null,
        at: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <div className="dashboard-error" role="alert">
      <h2>{copy.title}</h2>
      <p>{copy.description}</p>
      <button className="button button--primary" onClick={reset} type="button">
        {copy.retryLabel}
      </button>
    </div>
  );
}
