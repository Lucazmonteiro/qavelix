"use client";

import { usePathname } from "next/navigation";

import { replaceLocaleInPath } from "@/i18n/locale-context";
import { localeLabels, locales, type Locale } from "@/i18n/locales";

type LanguageSettingsLinksProps = {
  currentLocale: Locale;
};

// Plain, real navigation links — the settings page is an ordinary server-rendered
// dashboard page, not the homepage/tool-page client-state fast path LanguageSelector
// intercepts in the header, so no click interception is needed here: following the link
// naturally lands on the equivalent settings page in the new locale, via the same
// replaceLocaleInPath() segment-swap the header's language selector is built on.
export function LanguageSettingsLinks({ currentLocale }: LanguageSettingsLinksProps) {
  const pathname = usePathname();

  return (
    <ul className="settings-language-list">
      {locales.map((locale) => (
        <li key={locale}>
          <a
            aria-current={locale === currentLocale ? "page" : undefined}
            className="settings-language-list__link"
            href={replaceLocaleInPath(pathname, locale)}
          >
            {localeLabels[locale]}
          </a>
        </li>
      ))}
    </ul>
  );
}
