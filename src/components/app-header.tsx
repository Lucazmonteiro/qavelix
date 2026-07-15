import type { Locale } from "@/i18n/locales";

import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import type { getDictionary } from "@/i18n/dictionaries";

type Dictionary = ReturnType<typeof getDictionary>;

type AppHeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function AppHeader({ locale, dictionary }: AppHeaderProps) {
  const navigationItems = [
    { href: `/${locale}#product`, label: dictionary.navigation.product },
    { href: `/${locale}#upload-validation`, label: dictionary.navigation.upload },
    { href: `/${locale}#compression`, label: dictionary.navigation.compression },
    { href: `/${locale}#design-system`, label: dictionary.navigation.design },
    { href: `/${locale}#accessibility`, label: dictionary.navigation.accessibility },
    { href: `/${locale}#readiness`, label: dictionary.navigation.readiness },
  ];

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="brand" href={`/${locale}`} aria-label="QAVELIX home">
          <span className="brand__mark" aria-hidden="true">
            Q
          </span>
          <span className="brand__text">QAVELIX</span>
        </a>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigationItems.map((item) => (
            <a className="primary-nav__link" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <LanguageSelector
            currentLocale={locale}
            label={dictionary.navigation.languageLabel}
          />
          <ThemeToggle
            darkLabel={dictionary.navigation.darkTheme}
            label={dictionary.navigation.themeLabel}
            lightLabel={dictionary.navigation.lightTheme}
            systemLabel={dictionary.navigation.systemTheme}
          />
        </div>
      </div>
    </header>
  );
}
