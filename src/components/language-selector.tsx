import type { Locale } from "@/i18n/locales";
import { localeLabels, locales } from "@/i18n/locales";

type LanguageSelectorProps = {
  currentLocale: Locale;
  label: string;
};

export function LanguageSelector({ currentLocale, label }: LanguageSelectorProps) {
  return (
    <nav aria-label={label} className="language-selector">
      {locales.map((locale) => (
        <a
          aria-current={locale === currentLocale ? "page" : undefined}
          className="language-selector__link"
          href={`/${locale}`}
          key={locale}
        >
          {localeLabels[locale]}
        </a>
      ))}
    </nav>
  );
}
