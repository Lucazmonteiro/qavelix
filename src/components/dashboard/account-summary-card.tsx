import type { getDictionary } from "@/i18n/dictionaries";
import type { PlanType } from "@/lib/server/entitlements/policy";

type Dictionary = ReturnType<typeof getDictionary>;

type AccountSummaryCardProps = {
  dictionary: Dictionary;
  email: string;
  emailVerified: boolean;
  plan: PlanType;
};

export function AccountSummaryCard({
  dictionary,
  email,
  emailVerified,
  plan,
}: AccountSummaryCardProps) {
  const copy = dictionary.dashboard.overview.accountSummary;

  return (
    <div className="foundation-card">
      <h2 className="dashboard-card__title">{copy.title}</h2>
      <dl>
        <div className="dashboard-summary-row">
          <dt>{copy.emailLabel}</dt>
          <dd>
            {email}{" "}
            <span
              className={`dashboard-status ${
                emailVerified ? "dashboard-status--positive" : "dashboard-status--neutral"
              }`}
            >
              {emailVerified ? copy.verifiedLabel : copy.unverifiedLabel}
            </span>
          </dd>
        </div>
        <div className="dashboard-summary-row">
          <dt>{copy.membershipLabel}</dt>
          <dd>
            <span
              className={`dashboard-status ${
                plan === "pro" ? "dashboard-status--positive" : "dashboard-status--neutral"
              }`}
            >
              {plan === "pro" ? copy.proAccountLabel : copy.freeAccountLabel}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
