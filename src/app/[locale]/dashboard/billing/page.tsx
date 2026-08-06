import type { Route } from "next";
import { notFound, redirect } from "next/navigation";

import { BillingAddressForm } from "@/components/dashboard/billing-address-form";
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { EmailVerificationBanner } from "@/components/dashboard/email-verification-banner";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { requireSession } from "@/lib/server/auth/session";
import { isBillingConfigured } from "@/lib/server/billing";
import { getPlan } from "@/lib/server/entitlements/service";

type DashboardBillingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Milestone 5: real Stripe Billing Portal access when configured (every account gets a
// Stripe customer at sign-up via createCustomerOnSignUp, so this works for Free and Pro
// users alike — a Free user just sees an empty history until they subscribe). Falls back
// to Milestone 4's honest "coming soon" placeholder when Stripe isn't configured.
export default async function DashboardBillingPage({ params }: DashboardBillingPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireSession(locale, "/dashboard/billing");

  // Billing only means anything for a Pro subscriber — a Free account has no invoice
  // history, portal access, or billing address to manage. Redirects straight back to the
  // Plan page (the actual upgrade entry point) before any billing content renders, same
  // "gate before render, not after" posture as requireSession() itself, so a Free actor
  // hitting this URL directly (bookmark, typed URL, stale link) never sees so much as a
  // flash of billing UI. Independent of isBillingConfigured() below — this is a plan
  // check, not a Stripe-configuration check, and applies whether or not Stripe is set up.
  const plan = await getPlan(session.user.id);

  if (plan !== "pro") {
    redirect(`/${locale}/dashboard/plan` as Route);
  }

  const dictionary = getDictionary(locale);
  const nav = dictionary.dashboard.nav;
  const placeholderCopy = dictionary.dashboard.placeholder;
  const planCopy = dictionary.dashboard.plan;
  const billingCopy = dictionary.dashboard.billing;
  const billingConfigured = isBillingConfigured();

  if (!billingConfigured) {
    return (
      <>
        <DashboardHeader
          description={placeholderCopy.billingDescription}
          eyebrow={dictionary.dashboard.overview.eyebrow}
          title={nav.billing}
        />
        <DashboardPlaceholder
          badge={placeholderCopy.comingSoonBadge}
          description={placeholderCopy.billingDescription}
          title={placeholderCopy.billingTitle}
        />
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        description={billingCopy.description}
        eyebrow={dictionary.dashboard.overview.eyebrow}
        title={nav.billing}
      />
      {!session.user.emailVerified ? (
        <EmailVerificationBanner
          actionLabel={planCopy.verificationBannerActionLabel}
          locale={locale}
          message={planCopy.verificationBannerMessage}
        />
      ) : null}
      <div className="foundation-card">
        <h2 className="dashboard-card__title">{nav.billing}</h2>
        <BillingPortalButton
          emailVerificationRequiredMessage={planCopy.emailVerificationRequiredMessage}
          errorMessage={planCopy.portalErrorMessage}
          label={planCopy.manageBillingLabel}
          pendingLabel={planCopy.portalPendingLabel}
          returnPath="/dashboard/billing"
        />
      </div>
      <div className="foundation-card">
        <BillingAddressForm dictionary={dictionary} locale={locale} />
      </div>
    </>
  );
}
