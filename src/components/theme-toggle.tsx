"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeToggleProps = {
  label: string;
  lightLabel: string;
  darkLabel: string;
};

const modes: ThemeMode[] = ["light", "dark"];
const storageKey = "qavelix-theme";

function getStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(storageKey);

    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
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

export function ThemeToggle({ label, lightLabel, darkLabel }: ThemeToggleProps) {
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
    <div className="theme-toggle" aria-label={label} role="group">
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
