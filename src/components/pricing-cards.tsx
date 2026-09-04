"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import { SectionHeading } from "@/components/section-heading";
import { replaceLocaleInPath, useLocaleState } from "@/i18n/locale-context";
import { startProUpgradeCheckout } from "@/lib/auth-client";
import { useResolvedPlan } from "@/lib/use-resolved-plan";

// Anonymous has no account to attach a Stripe subscription to, so both of its cards route
// to sign-up (real upgrade happens post-account-creation from the Plan page, same as every
// other anonymous Pro-upsell entry point in this app — PlanComparisonModal.
// A signed-in Free actor's Pro card is the one case that triggers real checkout in place.
// Defaulting unresolved (`null`) to "anonymous" avoids a layout-shifting flash once the
// real plan arrives — anonymous is also the only state safe to render before the actor's
// real plan is confirmed, since it's the least-privileged one.
export function PricingCards() {
  const { dictionary, locale } = useLocaleState();
  const pathname = usePathname();
  const resolvedPlan = useResolvedPlan();
  const effectivePlan = resolvedPlan ?? "anonymous";
  const pricing = dictionary.home.pricing;
  const copy = dictionary.upgradeModal;
  const [isCheckoutPending, setIsCheckoutPending] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const callbackURL = encodeURIComponent(replaceLocaleInPath(pathname, locale));
  const signUpHref = `/${locale}/sign-up?callbackURL=${callbackURL}`;
  // Carries the anonymous visitor's purchase intent through account creation and email
  // verification (see sign-up/page.tsx, sign-up-form.tsx, verify-email-status.tsx) so
  // Case B of the verify-email flow can auto-start Stripe checkout the moment the new
  // account is confirmed, instead of dropping the visitor back on a generic "verified"
  // page and losing the conversion moment.
  const anonymousProHref = `${signUpHref}&intent=checkout_pro`;

  async function handleUpgradeClick() {
    setCheckoutError(null);
    setIsCheckoutPending(true);

    const { error } = await startProUpgradeCheckout(locale, pathname);

    if (error) {
      setCheckoutError(
        error.code === "EMAIL_VERIFICATION_REQUIRED"
          ? copy.emailVerificationRequiredMessage
          : copy.checkoutErrorMessage,
      );
      setIsCheckoutPending(false);
    }
  }

  return (
    <section className="content-section" id="pricing">
      <SectionHeading
        description={pricing.description}
        eyebrow={pricing.eyebrow}
        title={pricing.title}
      />
      <div className="pricing-grid">
        {pricing.plans.map((plan) => {
          const isProCard = plan.highlight;
          const isCurrentCard =
            (effectivePlan === "free" && !isProCard) || (effectivePlan === "pro" && isProCard);
          // A Pro actor's Free card has no self-serve action this app supports
          // (downgrade/cancellation only happens through the billing portal) — omitting
          // the button entirely rather than inventing unrequested copy for it.
          const hasNoAction = effectivePlan === "pro" && !isProCard;

          return (
            <article
              className={`pricing-card${plan.highlight ? " pricing-card--highlight" : ""}`}
              key={plan.name}
            >
              {plan.badge ? <p className="pricing-card__badge">{plan.badge}</p> : null}
              <h3>{plan.name}</h3>
              <p className="pricing-card__price">
                <span className="pricing-card__amount">{plan.price}</span>
                {plan.cadence ? (
                  <span className="pricing-card__cadence">{plan.cadence}</span>
                ) : null}
              </p>
              <ul className="check-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              {isCurrentCard ? (
                <button className="button button--secondary" disabled type="button">
                  {pricing.currentPlan}
                </button>
              ) : hasNoAction ? null : effectivePlan === "free" && isProCard ? (
                <button
                  className={`button ${plan.highlight ? "button--primary" : "button--secondary"}`}
                  disabled={isCheckoutPending}
                  onClick={() => void handleUpgradeClick()}
                  type="button"
                >
                  {isCheckoutPending ? copy.checkoutPendingLabel : plan.cta}
                </button>
              ) : (
                <a
                  className={`button ${plan.highlight ? "button--primary" : "button--secondary"}`}
                  href={isProCard ? anonymousProHref : signUpHref}
                >
                  {isProCard ? pricing.getPro : plan.cta}
                </a>
              )}

              {isProCard && checkoutError ? (
                <p className="form-status__error" role="alert">
                  {checkoutError}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <p className="pricing-note">{pricing.note}</p>
    </section>
  );
}
