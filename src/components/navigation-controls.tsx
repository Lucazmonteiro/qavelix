"use client";

import { useEffect, useState } from "react";

import { isLocale, type Locale } from "@/i18n/locales";

type NavigationControlsProps = {
  backLabel: string;
  backToTopLabel: string;
  locale: Locale;
};

const historyStorageKey = "qavelix-internal-history";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const topButtonScrollThreshold = 120;

type FloatingMode = "hidden" | "back" | "top";

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia(reducedMotionQuery).matches ? "auto" : "smooth";
}

function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function getFallbackPath(locale: Locale) {
  return `/${locale}`;
}

function getPathLocale(pathname: string): Locale | null {
  const localeSegment = pathname.split("/")[1];
  return typeof localeSegment === "string" && isLocale(localeSegment)
    ? localeSegment
    : null;
}

function isLocalizedHomePath(pathname: string) {
  const [, localeSegment, ...rest] = pathname.split("/");

  return (
    typeof localeSegment === "string" && isLocale(localeSegment) && rest.length === 0
  );
}

function isInternalLink(link: HTMLAnchorElement) {
  return Boolean(link.href) && link.origin === window.location.origin;
}

function readHistoryStack() {
  try {
    const rawStack = window.sessionStorage.getItem(historyStorageKey);

    if (!rawStack) {
      return [];
    }

    const parsedStack = JSON.parse(rawStack);

    if (!Array.isArray(parsedStack)) {
      return [];
    }

    return parsedStack.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

function writeHistoryStack(stack: string[]) {
  try {
    window.sessionStorage.setItem(historyStorageKey, JSON.stringify(stack));
  } catch {
    // Session storage can be unavailable in hardened browser contexts.
  }
}

function pushCurrentPageToHistory(destination: string) {
  const currentPath = getCurrentPath();

  if (destination === currentPath) {
    return;
  }

  const stack = readHistoryStack();
  const lastEntry = stack.at(-1);

  if (lastEntry !== currentPath) {
    stack.push(currentPath);
  }

  writeHistoryStack(stack.slice(-50));
}

function popInternalHistory() {
  const stack = readHistoryStack();

  if (stack.length === 0) {
    return null;
  }

  const previousPath = stack.pop() ?? null;
  writeHistoryStack(stack);

  return previousPath;
}

export function NavigationControls({
  backLabel,
  backToTopLabel,
  locale,
}: NavigationControlsProps) {
  const [isInternalPage, setIsInternalPage] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isEndVisible, setIsEndVisible] = useState(false);

  const mode: FloatingMode = isEndVisible && (isInternalPage || hasScrolled)
    ? "top"
    : isInternalPage
      ? "back"
      : hasScrolled
        ? "top"
        : "hidden";

  useEffect(() => {
    function updatePageState() {
      setIsInternalPage(!isLocalizedHomePath(window.location.pathname));
      setHasScrolled(window.scrollY > topButtonScrollThreshold);
    }

    updatePageState();
    window.addEventListener("popstate", updatePageState);
    window.addEventListener("scroll", updatePageState, { passive: true });

    return () => {
      window.removeEventListener("popstate", updatePageState);
      window.removeEventListener("scroll", updatePageState);
    };
  }, []);

  useEffect(() => {
    const sentinel = document.getElementById("page-end-sentinel");

    if (!sentinel || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsEndVisible(Boolean(entry?.isIntersecting));
      },
      {
        rootMargin: "0px 0px 220px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) {
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>("a[href]");

      if (!link || !isInternalLink(link)) {
        return;
      }

      if (
        link.target ||
        link.hasAttribute("download") ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const destinationUrl = new URL(link.href);
      const destination = `${destinationUrl.pathname}${destinationUrl.search}${destinationUrl.hash}`;

      pushCurrentPageToHistory(destination);
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  function handleBack() {
    const previousPath = popInternalHistory();

    if (previousPath) {
      window.history.back();
      return;
    }

    const activeLocale = getPathLocale(window.location.pathname) ?? locale;
    window.location.assign(getFallbackPath(activeLocale));
  }

  function handleBackToTop() {
    window.scrollTo({
      top: 0,
      behavior: getScrollBehavior(),
    });
  }

  if (mode === "hidden") {
    return null;
  }

  const isTopMode = mode === "top";
  const label = isTopMode ? backToTopLabel : backLabel;

  return (
    <div className="navigation-controls" aria-live="polite">
      <button
        aria-label={label}
        className="context-back-button"
        onClick={isTopMode ? handleBackToTop : handleBack}
        type="button"
      >
        <span aria-hidden="true" className="context-back-button__icon">
          {isTopMode ? "\u2191" : "\u2190"}
        </span>
        <span>{label}</span>
      </button>
    </div>
  );
}
