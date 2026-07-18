"use client";

import type { ReactNode } from "react";

import { AppFooter } from "@/components/app-footer";
import { AppHeader } from "@/components/app-header";
import { NavigationControls } from "@/components/navigation-controls";
import type { getDictionary } from "@/i18n/dictionaries";
import { LocaleProvider, useLocaleState } from "@/i18n/locale-context";
import type { Locale } from "@/i18n/locales";

type Dictionary = ReturnType<typeof getDictionary>;

type AppShellProps = {
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
};

export function AppShell({ children, locale }: AppShellProps) {
  return (
    <LocaleProvider initialLocale={locale}>
      <AppShellContent>{children}</AppShellContent>
    </LocaleProvider>
  );
}

function AppShellContent({ children }: { children: ReactNode }) {
  const { dictionary, locale } = useLocaleState();

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
