import type { Locale } from "@/i18n/locales";
import { localeLabels, locales } from "@/i18n/locales";

type LanguageSelectorProps = {
  currentLocale: Locale;
  label: string;
};

function FlagIcon({ locale }: { locale: Locale }) {
  if (locale === "pt-BR") {
    return (
      <svg
        aria-hidden="true"
        className="language-selector__flag-icon"
        focusable="false"
        viewBox="0 0 36 24"
      >
        <rect fill="#229E45" height="24" rx="3" width="36" />
        <path d="M18 4 31 12 18 20 5 12z" fill="#F8D117" />
        <circle cx="18" cy="12" fill="#2B4EA2" r="5.2" />
        <path
          d="M13.3 10.8c3.6-.7 6.5-.2 9.4 1.7"
          fill="none"
          stroke="#fff"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
    );
  }

  if (locale === "es") {
    return (
      <svg
        aria-hidden="true"
        className="language-selector__flag-icon"
        focusable="false"
        viewBox="0 0 36 24"
      >
        <rect fill="#AA151B" height="24" rx="3" width="36" />
        <rect fill="#F1BF00" height="12" width="36" y="6" />
        <rect fill="#C60B1E" height="24" rx="3" width="36" />
        <rect fill="#FFC400" height="12" width="36" y="6" />
        <rect fill="#AA151B" height="6" width="36" />
        <rect fill="#AA151B" height="6" width="36" y="18" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="language-selector__flag-icon"
      focusable="false"
      viewBox="0 0 36 24"
    >
      <rect fill="#012169" height="24" rx="3" width="36" />
      <path d="M0 0h4.2L36 20.4V24h-4.2L0 3.6z" fill="#fff" />
      <path d="M36 0h-4.2L0 20.4V24h4.2L36 3.6z" fill="#fff" />
      <path d="M0 0h2.4L36 21.6V24h-2.4L0 2.4z" fill="#C8102E" />
      <path d="M36 0h-2.4L0 21.6V24h2.4L36 2.4z" fill="#C8102E" />
      <path d="M15 0h6v24h-6z" fill="#fff" />
      <path d="M0 9h36v6H0z" fill="#fff" />
      <path d="M16.2 0h3.6v24h-3.6z" fill="#C8102E" />
      <path d="M0 10.2h36v3.6H0z" fill="#C8102E" />
    </svg>
  );
}

export function LanguageSelector({ currentLocale, label }: LanguageSelectorProps) {
  return (
    <nav aria-label={label} className="language-selector">
      {locales.map((locale) => (
        <a
          aria-current={locale === currentLocale ? "page" : undefined}
          aria-label={localeLabels[locale]}
          className="language-selector__link"
          href={`/${locale}`}
          key={locale}
          title={localeLabels[locale]}
        >
          <span aria-hidden="true" className="language-selector__flag">
            <FlagIcon locale={locale} />
          </span>
          <span className="sr-only">{localeLabels[locale]}</span>
        </a>
      ))}
    </nav>
  );
}
