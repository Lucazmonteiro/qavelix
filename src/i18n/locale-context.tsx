"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, type Locale } from "@/i18n/locales";

type Dictionary = ReturnType<typeof getDictionary>;

type LocaleContextValue = {
  dictionary: Dictionary;
  locale: Locale;
  switchLocale: (locale: Locale) => void;
};

type LocaleProviderProps = {
  children: ReactNode;
  initialLocale: Locale;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function replaceLocaleInPath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split("/");
  const currentLocale = segments[1];

  if (typeof currentLocale === "string" && isLocale(currentLocale)) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }

  return `/${nextLocale}${pathname === "/" ? "" : pathname}`;
}

export function isLocalizedHomePath(pathname: string) {
  const [, localeSegment, ...rest] = pathname.split("/");

  return (
    typeof localeSegment === "string" && isLocale(localeSegment) && rest.length === 0
  );
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocale] = useState(initialLocale);
  const lastWorkflowScrollRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    let topScrollResetId: number | null = null;

    function handleScroll() {
      if (topScrollResetId !== null) {
        window.clearTimeout(topScrollResetId);
        topScrollResetId = null;
      }

      if (window.scrollY === 0) {
        topScrollResetId = window.setTimeout(() => {
          lastWorkflowScrollRef.current = {
            x: window.scrollX,
            y: window.scrollY,
          };
          topScrollResetId = null;
        }, 300);
        return;
      }

      lastWorkflowScrollRef.current = {
        x: window.scrollX,
        y: window.scrollY,
      };
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (topScrollResetId !== null) {
        window.clearTimeout(topScrollResetId);
      }
    };
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    function switchLocale(nextLocale: Locale) {
      if (nextLocale === locale) {
        return;
      }

      const currentScroll = { x: window.scrollX, y: window.scrollY };
      const preservedScroll =
        currentScroll.y === 0 && lastWorkflowScrollRef.current.y > 0
          ? lastWorkflowScrollRef.current
          : currentScroll;
      const nextPath = replaceLocaleInPath(window.location.pathname, nextLocale);
      const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`;

      setLocale(nextLocale);
      window.history.pushState(null, "", nextUrl);

      function restoreScrollPosition() {
        window.scrollTo(preservedScroll.x, preservedScroll.y);
      }

      window.requestAnimationFrame(() => {
        restoreScrollPosition();
        window.setTimeout(restoreScrollPosition, 0);
        window.setTimeout(restoreScrollPosition, 120);
      });
    }

    return {
      dictionary: getDictionary(locale),
      locale,
      switchLocale,
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleState() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocaleState must be used within LocaleProvider.");
  }

  return context;
}
