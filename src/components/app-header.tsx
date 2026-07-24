"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const isToolRoute = pathname.startsWith(`/${locale}/tools/`);
  const faqHref = isToolRoute ? `${pathname}#faq` : `/${locale}#faq`;
  const navigationItems = [
    { href: `/${locale}/about`, label: dictionary.pages.about.label },
    { href: faqHref, label: dictionary.pages.faq.label },
    { href: `/${locale}/contact`, label: dictionary.pages.contact.label },
  ];
  const toolItems = [
    {
      href: `/${locale}`,
      icon: "\uD83C\uDFA5",
      label: dictionary.navigation.videoCompressorTool,
    },
    {
      href: `/${locale}/tools/extract-audio`,
      icon: "\uD83C\uDFB5",
      label: dictionary.navigation.extractAudioTool,
    },
  ];

  useEffect(() => {
    if (!isToolsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        toolsMenuRef.current &&
        event.target instanceof Node &&
        !toolsMenuRef.current.contains(event.target)
      ) {
        setIsToolsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsToolsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isToolsOpen]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a
          className="brand"
          href={`/${locale}`}
          aria-label={dictionary.navigation.homeLabel}
        >
          <span className="brand__mark" aria-hidden="true">
            Q
          </span>
          <span className="brand__text">QAVELIX</span>
        </a>

        <nav
          id="primary-navigation"
          tabIndex={-1}
          className="primary-nav"
          data-navigation-origin="primary-navigation"
          aria-label={dictionary.navigation.primaryNavigationLabel}
        >
          <div className="tools-menu" ref={toolsMenuRef}>
            <button
              aria-expanded={isToolsOpen}
              aria-haspopup="menu"
              className="primary-nav__link tools-menu__button"
              onClick={() => setIsToolsOpen((current) => !current)}
              type="button"
            >
              <span>{dictionary.navigation.tools}</span>
              <span aria-hidden="true" className="tools-menu__chevron">
                {"\u25BE"}
              </span>
            </button>
            <div
              aria-hidden={!isToolsOpen}
              className={`tools-menu__panel${isToolsOpen ? " tools-menu__panel--open" : ""}`}
              role="menu"
            >
              <p className="tools-menu__category">
                {dictionary.navigation.toolsVideoCategory}
              </p>
              {toolItems.map((item) => (
                <a
                  className="tools-menu__item"
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsToolsOpen(false)}
                  role="menuitem"
                >
                  <span aria-hidden="true" className="tools-menu__icon">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
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
          />
        </div>
      </div>
    </header>
  );
}
