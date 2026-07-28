type EmailVerificationBannerProps = {
  message: string;
  actionLabel: string;
  locale: string;
};

// Shown on the Plan and Billing pages for a signed-in but unverified user — checkout and
// the billing portal are both already blocked server-side (auth.ts's
// subscription.requireEmailVerification / hooks.before); this is the explanatory UI for
// why, with a direct path to resolve it, rather than a bare rejected-request error being
// the first time a visitor learns about the requirement.
export function EmailVerificationBanner({ message, actionLabel, locale }: EmailVerificationBannerProps) {
  return (
    <div className="dashboard-verification-banner" role="status">
      <p>{message}</p>
      <a href={`/${locale}/verify-email`}>{actionLabel}</a>
    </div>
  );
}
