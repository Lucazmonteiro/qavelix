import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { PlanActions } from "@/components/dashboard/plan-actions";
import { ProWelcomeModal } from "@/components/dashboard/pro-welcome-modal";
import { SubscriptionActivationStatus } from "@/components/dashboard/subscription-activation-status";
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
//
// `checkout=success` never grants or displays Pro by itself — getPlan() (which this page
// calls, same as every other entitlement-aware route) is the one thing that decides
// whether the user is Pro, and it self-heals from Stripe's own verified subscription
// state (see entitlements/service.ts) rather than trusting this query parameter. While
// that hasn't resolved to "pro" yet, this page shows an honest "activating" state instead
// of a false success message.
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
  const isPro = plan === "pro";
  const planName = isPro ? copy.proPlanName : copy.freePlanName;
  const billingConfigured = isBillingConfigured();
  const isCheckoutSuccess = checkout === "success";
  const isActivating = isCheckoutSuccess && !isPro;

  const [priceDisplay, subscriptionDetail] = billingConfigured
    ? await Promise.all([
        getProMonthlyPriceDisplay(locale),
        isPro ? getActiveSubscriptionDetail() : Promise.resolve(null),
      ])
    : [null, null];

  const proBenefits = TOOL_IDS.map((toolId) => {
    const limits = getToolLimits("pro", toolId);

    return `${toolLabels[toolId]}: ${copy.dailyLimitLabel.replace(
      "{limit}",
      String(limits.maxUsesPerPeriod),
    )}, ${copy.uploadLimitLabel.replace("{maxSize}", formatBytes(limits.maxUploadBytes))}`;
  });

  return (
    <>
      <DashboardHeader description={copy.description} eyebrow={copy.eyebrow} title={copy.title} />

      {billingConfigured && !session.user.emailVerified ? (
        <EmailVerificationBanner
          actionLabel={copy.verificationBannerActionLabel}
          locale={locale}
          message={copy.verificationBannerMessage}
        />
      ) : null}

      {isCheckoutSuccess && isActivating ? (
        <SubscriptionActivationStatus
          isPro={isPro}
          pendingMessage={copy.activationPendingMessage}
          pendingTitle={copy.activationPendingTitle}
          refreshLabel={copy.refreshStatusLabel}
          stillPendingMessage={copy.activationStillPendingMessage}
        />
      ) : null}

      {isCheckoutSuccess && isPro ? (
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
        <h2 className="dashboard-card__title">{copy.currentPlanLabel}</h2>
        <dl>
          <div className="dashboard-summary-row">
            <dt>{copy.currentPlanLabel}</dt>
            <dd>
              <span className="dashboard-status dashboard-status--positive">{planName}</span>
            </dd>
          </div>
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
        </dl>
      </div>

      <div className="plan-comparison">
        <article
          className={`plan-comparison__tier${!isPro ? " plan-comparison__tier--current" : ""}`}
        >
          <header className="plan-comparison__tier-header">
            <h2>{copy.freePlanName}</h2>
            {!isPro ? (
              <span className="dashboard-status dashboard-status--positive">
                {copy.currentPlanBadge}
              </span>
            ) : null}
          </header>
          <ul className="plan-comparison__features">
            {TOOL_IDS.map((toolId) => {
              const limits = getToolLimits("free", toolId);

              return (
                <li key={toolId}>
                  <p className="plan-comparison__tool-name">{toolLabels[toolId]}</p>
                  <p>{copy.dailyLimitLabel.replace("{limit}", String(limits.maxUsesPerPeriod))}</p>
                  <p>{copy.uploadLimitLabel.replace("{maxSize}", formatBytes(limits.maxUploadBytes))}</p>
                </li>
              );
            })}
          </ul>
        </article>

        <article
          className={`plan-comparison__tier plan-comparison__tier--pro${
            isPro ? " plan-comparison__tier--current" : ""
          }`}
        >
          <header className="plan-comparison__tier-header">
            <h2>{copy.proPlanName}</h2>
            {isPro ? (
              <span className="dashboard-status dashboard-status--positive">
                {copy.proActiveBadge}
              </span>
            ) : priceDisplay ? (
              <span className="plan-comparison__price">
                {copy.priceLabel.replace("{price}", priceDisplay)}
              </span>
            ) : null}
          </header>
          <ul className="plan-comparison__features">
            {TOOL_IDS.map((toolId) => {
              const limits = getToolLimits("pro", toolId);

              return (
                <li key={toolId}>
                  <p className="plan-comparison__tool-name">{toolLabels[toolId]}</p>
                  <p>{copy.dailyLimitLabel.replace("{limit}", String(limits.maxUsesPerPeriod))}</p>
                  <p>{copy.uploadLimitLabel.replace("{maxSize}", formatBytes(limits.maxUploadBytes))}</p>
                </li>
              );
            })}
          </ul>
          {billingConfigured ? (
            <PlanActions plan={plan} />
          ) : (
            <DashboardPlaceholder
              badge={copy.upgradeBadge}
              description={copy.upgradeDescription}
              title={copy.upgradeTitle}
            />
          )}
        </article>
      </div>

      <ProWelcomeModal
        benefits={proBenefits}
        copy={copy.welcome}
        locale={locale}
        shouldOffer={isCheckoutSuccess && isPro}
      />
    </>
  );
}
