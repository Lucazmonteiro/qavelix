const themeScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("qavelix-theme");
    const storedMode = window.localStorage.getItem("qavelix-theme-mode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedMode === "system" || !storedTheme ? prefersDark ? "dark" : "light" : storedTheme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
