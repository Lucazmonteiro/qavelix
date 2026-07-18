export const themeScript = `
(() => {
  const storageKey = "qavelix-theme";
  const themes = ["light", "dark"];

  function isTheme(value) {
    return themes.includes(value);
  }

  function getStoredTheme() {
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      return isTheme(storedTheme) ? storedTheme : null;
    } catch {
      return null;
    }
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      return;
    }
  }

  function syncButtons(theme) {
    document.querySelectorAll("[data-theme-option]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        button.getAttribute("data-theme-option") === theme ? "true" : "false",
      );
    });
  }

  function applyTheme(theme, persist, syncControls) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (persist) {
      persistTheme(theme);
    }
    if (syncControls) {
      syncButtons(theme);
    }
  }

  try {
    applyTheme(getStoredTheme() ?? "dark", false, true);
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-theme-option]")
      : null;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const theme = target.getAttribute("data-theme-option");

    if (isTheme(theme)) {
      applyTheme(theme, true, true);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyTheme(
        getStoredTheme() ?? document.documentElement.dataset.theme ?? "dark",
        false,
        true,
      );
    }, { once: true });
  } else {
    applyTheme(
      getStoredTheme() ?? document.documentElement.dataset.theme ?? "dark",
      false,
      true,
    );
  }
})();
`;
