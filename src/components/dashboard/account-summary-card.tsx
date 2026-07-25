import type { getDictionary } from "@/i18n/dictionaries";

type Dictionary = ReturnType<typeof getDictionary>;

type AccountSummaryCardProps = {
  dictionary: Dictionary;
  email: string;
  emailVerified: boolean;
};

// Membership is rendered only as the neutral "Free account" placeholder text from the
// dictionary — there is no subscription/plan data model yet, and this milestone
// explicitly does not create one. Real plan status is a later milestone's concern; this
// card just needs a place for it to eventually go.
export function AccountSummaryCard({ dictionary, email, emailVerified }: AccountSummaryCardProps) {
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
            <span className="dashboard-status dashboard-status--neutral">
              {copy.freeAccountLabel}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
