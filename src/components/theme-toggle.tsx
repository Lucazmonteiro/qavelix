"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeToggleProps = {
  label: string;
  lightLabel: string;
  darkLabel: string;
  // Compact header widget by default; the settings-page control reuses this exact
  // component (same data-theme-option mechanism, same persistence) with a layout suited
  // to a full settings row instead of a header slot.
  variant?: "compact" | "expanded";
};

const modes: ThemeMode[] = ["light", "dark"];
const storageKey = "qavelix-theme";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

function getStoredTheme() {
  try {
    return isThemeMode(window.localStorage.getItem(storageKey))
      ? (window.localStorage.getItem(storageKey) as ThemeMode)
      : null;
  } catch {
    return null;
  }
}

function persistTheme(theme: ThemeMode) {
  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    return;
  }
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function LightbulbIcon() {
  return (
    <svg aria-hidden="true" className="theme-toggle-icon__glyph" fill="none" viewBox="0 0 20 20">
      <path
        d="M10 2.5c-2.9 0-5.1 2.1-5.1 4.9 0 1.9 1 3.1 1.9 4 .7.7 1.2 1.4 1.3 2.3h3.8c.1-.9.6-1.6 1.3-2.3.9-.9 1.9-2.1 1.9-4 0-2.8-2.2-4.9-5.1-4.9Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
      <path
        d="M8.2 16.2h3.6M8.6 18h2.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="theme-toggle-icon__glyph" fill="none" viewBox="0 0 20 20">
      <path
        d="M17 11.5A7.5 7.5 0 0 1 8.5 3a7.5 7.5 0 1 0 8.5 8.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function ThemeToggle({
  label,
  lightLabel,
  darkLabel,
  variant = "compact",
}: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedTheme = getStoredTheme();

      if (storedTheme) {
        setMode(storedTheme);
      }

      setMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    applyTheme(mode);
    persistTheme(mode);
  }, [mode, mounted]);

  function selectTheme(theme: ThemeMode) {
    setMode(theme);
    applyTheme(theme);
    persistTheme(theme);
  }

  const labels: Record<ThemeMode, string> = {
    light: lightLabel,
    dark: darkLabel,
  };
  const nextMode: ThemeMode = mode === "light" ? "dark" : "light";

  return (
    <>
      <div
        className={`theme-toggle${variant === "expanded" ? " theme-toggle--expanded" : ""}`}
        aria-label={label}
        role="group"
      >
        {modes.map((themeMode) => (
          <button
            aria-pressed={mounted ? mode === themeMode : false}
            className="theme-toggle__button"
            data-theme-option={themeMode}
            key={themeMode}
            onClick={() => selectTheme(themeMode)}
            suppressHydrationWarning
            type="button"
          >
            {labels[themeMode]}
          </button>
        ))}
      </div>
      {variant === "compact" && (
        // Mobile-only collapse of the header's two-button toggle into a single icon
        // button — same selectTheme()/persistTheme() path as the buttons above, just a
        // more compact control at narrow widths. Hidden/shown purely via CSS (globals.css
        // @media max-width: 640px) to match the rest of the header's no-JS-breakpoints
        // reflow pattern, not a separate mobile component.
        <button
          aria-label={`${label}: ${labels[nextMode]}`}
          aria-pressed={mounted ? mode === "dark" : false}
          className="theme-toggle-icon"
          onClick={() => selectTheme(nextMode)}
          suppressHydrationWarning
          type="button"
        >
          {mode === "light" ? <MoonIcon /> : <LightbulbIcon />}
        </button>
      )}
    </>
  );
}
