"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

type ThemeToggleProps = {
  label: string;
  lightLabel: string;
  darkLabel: string;
  systemLabel: string;
};

const modes: ThemeMode[] = ["light", "dark", "system"];

function resolveTheme(mode: ThemeMode) {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return mode;
}

export function ThemeToggle({
  label,
  lightLabel,
  darkLabel,
  systemLabel,
}: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    const storedMode = window.localStorage.getItem("qavelix-theme-mode");

    if (storedMode === "light" || storedMode === "dark" || storedMode === "system") {
      return storedMode;
    }

    return "system";
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolvedTheme = resolveTheme(mode);
      document.documentElement.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme = resolvedTheme;
      window.localStorage.setItem("qavelix-theme-mode", mode);
      window.localStorage.setItem("qavelix-theme", resolvedTheme);
    };

    applyTheme();
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [mode]);

  const labels: Record<ThemeMode, string> = {
    light: lightLabel,
    dark: darkLabel,
    system: systemLabel,
  };

  return (
    <div className="theme-toggle" aria-label={label} role="group">
      {modes.map((themeMode) => (
        <button
          aria-pressed={mode === themeMode}
          className="theme-toggle__button"
          key={themeMode}
          onClick={() => setMode(themeMode)}
          type="button"
        >
          {labels[themeMode]}
        </button>
      ))}
    </div>
  );
}
