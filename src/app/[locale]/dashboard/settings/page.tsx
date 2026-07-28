import { notFound } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { LanguageSettingsLinks } from "@/components/dashboard/language-settings-links";
import { PasswordSettingsForm } from "@/components/dashboard/password-settings-form";
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { SettingsSignOutButton } from "@/components/dashboard/settings-sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { hasPasswordCredential, requireSession } from "@/lib/server/auth/session";

type DashboardSettingsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Real, functional account settings — replaces the previous "coming soon" placeholder.
// Scoped to exactly what the current architecture supports safely: name (a plain,
// unverified column) is editable; email is read-only (real email changes need
// verification, an explicit future milestone, so this never fakes it); appearance and
// language reuse the app's existing theme/locale mechanisms outright rather than
// reimplementing them; password change is Better Auth's own official flow, shown only
// when the account actually has a password to change. Account deletion is deliberately
// not included — it would need coordinated Stripe subscription cancellation, usage-data
// handling, and session/legal-retention decisions this milestone doesn't resolve, and a
// destructive action without that isn't safe to ship.
export default async function DashboardSettingsPage({ params }: DashboardSettingsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const session = await requireSession(locale, "/dashboard");
  const dictionary = getDictionary(locale);
  const copy = dictionary.dashboard.settings;
  const canChangePassword = await hasPasswordCredential(session.user.id);

  return (
    <>
      <DashboardHeader description={copy.description} eyebrow={copy.eyebrow} title={copy.title} />

      <div className="foundation-card">
        <ProfileSettingsForm
          dictionary={dictionary}
          email={session.user.email}
          initialName={session.user.name ?? ""}
        />
      </div>

      <div className="foundation-card">
        <h2 className="dashboard-card__title">{copy.appearance.title}</h2>
        <p className="settings-form__note">{copy.appearance.description}</p>
        <ThemeToggle
          darkLabel={dictionary.navigation.darkTheme}
          label={dictionary.navigation.themeLabel}
          lightLabel={dictionary.navigation.lightTheme}
          variant="expanded"
        />
      </div>

      <div className="foundation-card">
        <h2 className="dashboard-card__title">{copy.language.title}</h2>
        <p className="settings-form__note">{copy.language.description}</p>
        <LanguageSettingsLinks currentLocale={locale} />
      </div>

      {canChangePassword ? (
        <div className="foundation-card">
          <PasswordSettingsForm dictionary={dictionary} />
        </div>
      ) : (
        <div className="foundation-card">
          <h2 className="dashboard-card__title">{copy.security.title}</h2>
          <p className="settings-form__note">{copy.security.oauthOnlyNote}</p>
        </div>
      )}

      <div className="foundation-card">
        <h2 className="dashboard-card__title">{copy.account.title}</h2>
        <SettingsSignOutButton dictionary={dictionary} locale={locale} />
      </div>

      <div className="foundation-card">
        <h2 className="dashboard-card__title">{copy.billing.title}</h2>
        <p className="settings-form__note">{copy.billing.description}</p>
        <a className="button button--secondary" href={`/${locale}/dashboard/billing`}>
          {copy.billing.manageLabel}
        </a>
      </div>
    </>
  );
}
