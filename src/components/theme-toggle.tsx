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

  return (
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
  );
}
