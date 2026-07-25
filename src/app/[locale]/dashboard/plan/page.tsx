import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { PlanActions } from "@/components/dashboard/plan-actions";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { requireSession } from "@/lib/server/auth/session";
import {
  getActiveSubscriptionDetail,
  getProMonthlyPriceDisplay,
  isBillingConfigured,
} from "@/lib/server/billing";
import { getToolLimits, TOOL_IDS } from "@/lib/server/entitlements/policy";
import { getPlan } from "@/lib/server/entitlements/service";
import { formatBytes } from "@/lib/upload-policy";

type DashboardPlanPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    checkout?: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function formatDate(locale: string, date: Date) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
}

// Real plan + per-tool limits, sourced from the same TOOL_POLICY the API routes enforce
// — nothing here is a separate copy of the numbers. When Stripe isn't configured
// (STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET/STRIPE_PRO_MONTHLY_PRICE_ID unset), this falls
// back to Milestone 4's honest non-functional "coming soon" placeholder — no checkout
// button is ever shown pointing at a route that doesn't actually exist.
export default async function DashboardPlanPage({ params, searchParams }: DashboardPlanPageProps) {
  const { locale } = await params;
  const { checkout } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireSession(locale, "/dashboard");
  const dictionary = getDictionary(locale);
  const copy = dictionary.dashboard.plan;
  const toolLabels = dictionary.dashboard.usage.toolLabels;

  const plan = await getPlan(session.user.id);
  const planName = plan === "pro" ? copy.proPlanName : copy.freePlanName;
  const billingConfigured = isBillingConfigured();

  const [priceDisplay, subscriptionDetail] = billingConfigured
    ? await Promise.all([
        getProMonthlyPriceDisplay(locale),
        plan === "pro" ? getActiveSubscriptionDetail() : Promise.resolve(null),
      ])
    : [null, null];

  return (
    <>
      <DashboardHeader description={copy.description} eyebrow={copy.eyebrow} title={copy.title} />
      {checkout === "success" ? (
        <p className="form-status__success" role="status">
          {copy.checkoutSuccessMessage}
        </p>
      ) : null}
      {checkout === "cancelled" ? (
        <p className="form-status__error" role="status">
          {copy.checkoutCancelledMessage}
        </p>
      ) : null}
      <div className="foundation-card">
        <h2 className="dashboard-card__title">{copy.title}</h2>
        <dl>
          <div className="dashboard-summary-row">
            <dt>{copy.currentPlanLabel}</dt>
            <dd>
              <span className="dashboard-status dashboard-status--positive">{planName}</span>
            </dd>
          </div>
          {plan === "free" && priceDisplay ? (
            <div className="dashboard-summary-row">
              <dt>{copy.proPlanName}</dt>
              <dd>{copy.priceLabel.replace("{price}", priceDisplay)}</dd>
            </div>
          ) : null}
          {subscriptionDetail?.periodEnd ? (
            <div className="dashboard-summary-row">
              <dt>{copy.billingStatusLabel}</dt>
              <dd>
                {(subscriptionDetail.cancelAtPeriodEnd ? copy.cancelsOnLabel : copy.renewsOnLabel).replace(
                  "{date}",
                  formatDate(locale, subscriptionDetail.periodEnd),
                )}
              </dd>
            </div>
          ) : null}
          {TOOL_IDS.map((toolId) => {
            const limits = getToolLimits(plan, toolId);

            return (
              <div className="dashboard-summary-row" key={toolId}>
                <dt>{toolLabels[toolId]}</dt>
                <dd>
                  {copy.dailyLimitLabel.replace("{limit}", String(limits.maxUsesPerPeriod))}
                  {" · "}
                  {copy.uploadLimitLabel.replace("{maxSize}", formatBytes(limits.maxUploadBytes))}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
      {billingConfigured ? (
        <div className="foundation-card">
          <PlanActions plan={plan} />
        </div>
      ) : (
        <DashboardPlaceholder
          badge={copy.upgradeBadge}
          description={copy.upgradeDescription}
          title={copy.upgradeTitle}
        />
      )}
    </>
  );
}
