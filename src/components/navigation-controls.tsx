"use client";

import { useEffect, useState } from "react";

type NavigationContext = {
  destination: string;
  originId: string;
};

type NavigationControlsProps = {
  backLabel: string;
  backToTopLabel: string;
};

const contextStorageKey = "qavelix-navigation-context";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function getScrollBehavior(): ScrollBehavior {
  return window.matchMedia(reducedMotionQuery).matches ? "auto" : "smooth";
}

function normalizeDestination(url: URL) {
  return `${url.pathname}${url.hash}`;
}

function getCurrentDestination() {
  return `${window.location.pathname}${window.location.hash}`;
}

function readNavigationContext() {
  try {
    const rawContext = window.sessionStorage.getItem(contextStorageKey);

    if (!rawContext) {
      return null;
    }

    const parsedContext = JSON.parse(rawContext) as Partial<NavigationContext>;

    if (
      typeof parsedContext.destination !== "string" ||
      typeof parsedContext.originId !== "string"
    ) {
      return null;
    }

    return parsedContext as NavigationContext;
  } catch {
    return null;
  }
}

function writeNavigationContext(context: NavigationContext) {
  try {
    window.sessionStorage.setItem(contextStorageKey, JSON.stringify(context));
  } catch {
    // Session storage can be unavailable in hardened browser contexts.
  }
}

function clearNavigationContext() {
  try {
    window.sessionStorage.removeItem(contextStorageKey);
  } catch {
    // Session storage can be unavailable in hardened browser contexts.
  }
}

function isInternalLink(link: HTMLAnchorElement) {
  return Boolean(link.href) && link.origin === window.location.origin;
}

function getNavigationOrigin(link: HTMLAnchorElement) {
  const originElement = link.closest<HTMLElement>("[data-navigation-origin]");

  return originElement?.dataset.navigationOrigin ?? null;
}

export function NavigationControls({
  backLabel,
  backToTopLabel,
}: NavigationControlsProps) {
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(
    null,
  );
  const [isEndVisible, setIsEndVisible] = useState(false);
  const showBackToTop = isEndVisible;
  const showContextBack = Boolean(navigationContext) && !showBackToTop;

  useEffect(() => {
    window.setTimeout(() => {
      const storedContext = readNavigationContext();

      if (storedContext?.destination === getCurrentDestination()) {
        setNavigationContext(storedContext);
      } else {
        clearNavigationContext();
      }
    }, 0);
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        "a[href]",
      );

      if (!link || !isInternalLink(link)) {
        return;
      }

      const originId = getNavigationOrigin(link);

      if (!originId) {
        return;
      }

      const destination = normalizeDestination(new URL(link.href));
      const nextContext = { destination, originId };

      writeNavigationContext(nextContext);
      window.setTimeout(() => {
        if (getCurrentDestination() === destination) {
          setNavigationContext(nextContext);
        }
      }, 0);
    }

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
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
        threshold: 0.15,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  function handleContextBack() {
    if (!navigationContext) {
      return;
    }

    const origin = document.getElementById(navigationContext.originId);

    if (!origin) {
      clearNavigationContext();
      setNavigationContext(null);
      return;
    }

    origin.scrollIntoView({
      behavior: getScrollBehavior(),
      block: "center",
    });

    origin.focus({ preventScroll: true });
    clearNavigationContext();
    setNavigationContext(null);
  }

  function handleBackToTop() {
    window.scrollTo({
      top: 0,
      behavior: getScrollBehavior(),
    });
  }

  return (
    <div className="navigation-controls" aria-live="polite">
      {showContextBack ? (
        <button
          aria-label={backLabel}
          className="context-back-button"
          onClick={handleContextBack}
          type="button"
        >
          <span aria-hidden="true" className="context-back-button__icon">
            ←
          </span>
          <span>{backLabel}</span>
        </button>
      ) : null}

      {showBackToTop ? (
        <button
          aria-label={backToTopLabel}
          className="context-back-button context-back-button--top"
          onClick={handleBackToTop}
          type="button"
        >
          <span aria-hidden="true" className="context-back-button__icon">
            ↑
          </span>
          <span>{backToTopLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
