import type { ReactNode } from "react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { NavigationControls } from "@/components/navigation-controls";
import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";

type Dictionary = ReturnType<typeof getDictionary>;

type AppShellProps = {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
};

export function AppShell({ children, dictionary, locale }: AppShellProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        {dictionary.navigation.skipToContent}
      </a>
      <NavigationControls
        backLabel={dictionary.navigation.back}
        backToTopLabel={dictionary.navigation.backToTop}
      />
      <AppHeader dictionary={dictionary} locale={locale} />
      {children}
      <div className="page-end-sentinel" id="page-end-sentinel" aria-hidden="true" />
      <AppFooter dictionary={dictionary} locale={locale} />
    </>
  );
}
