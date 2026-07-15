export const locales = ["en", "pt-BR", "es"] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (Brasil)",
  es: "Español",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
