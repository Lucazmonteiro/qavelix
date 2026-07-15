"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeToggleProps = {
  label: string;
  lightLabel: string;
  darkLabel: string;
};

const modes: ThemeMode[] = ["light", "dark"];

export function ThemeToggle({ label, lightLabel, darkLabel }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("dark");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedTheme = window.localStorage.getItem("qavelix-theme");

      if (storedTheme === "light" || storedTheme === "dark") {
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

    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
    window.localStorage.setItem("qavelix-theme", mode);
  }, [mode, mounted]);

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
