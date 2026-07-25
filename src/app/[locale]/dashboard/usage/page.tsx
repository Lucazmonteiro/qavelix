import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { requireSession } from "@/lib/server/auth/session";
import { TOOL_IDS } from "@/lib/server/entitlements/policy";
import { checkEntitlement, getPlan } from "@/lib/server/entitlements/service";

type DashboardUsagePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Real, server-computed usage per tool — checkEntitlement() is read-only (no reservation
// made just by viewing this page). usage_service_unavailable renders an honest "data
// unavailable" state rather than a fabricated number.
export default async function DashboardUsagePage({ params }: DashboardUsagePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireSession(locale, "/dashboard");
  const dictionary = getDictionary(locale);
  const copy = dictionary.dashboard.usage;

  const plan = await getPlan(session.user.id);
  const actor = { type: "user" as const, id: session.user.id, plan };
  const rows = await Promise.all(
    TOOL_IDS.map(async (toolId) => ({ toolId, check: await checkEntitlement(actor, toolId) })),
  );

  return (
    <>
      <DashboardHeader description={copy.description} eyebrow={copy.eyebrow} title={copy.title} />
      <div className="foundation-card">
        <h2 className="dashboard-card__title">{copy.title}</h2>
        <dl>
          {rows.map(({ toolId, check }) => {
            const used = check.allowed
              ? check.limit - check.remaining
              : check.reason === "usage_limit_reached"
                ? check.limit
                : null;
            const label =
              check.period === "day" ? copy.usedOfLimitDayLabel : copy.usedOfLimitLifetimeLabel;

            return (
              <div className="dashboard-summary-row" key={toolId}>
                <dt>{copy.toolLabels[toolId]}</dt>
                <dd>
                  {used === null ? (
                    copy.unavailableMessage
                  ) : (
                    <>
                      {label
                        .replace("{used}", String(used))
                        .replace("{limit}", String(check.limit))}{" "}
                      {used >= check.limit ? (
                        <span className="dashboard-status dashboard-status--neutral">
                          {copy.limitReachedLabel}
                        </span>
                      ) : null}
                    </>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </>
  );
}
