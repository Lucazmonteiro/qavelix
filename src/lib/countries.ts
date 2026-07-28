// A curated, practical set of ISO 3166-1 alpha-2 country codes for the billing-address
// form's country selector — not the full ~195-country ISO list, but broad enough for
// genuine international use. Display names are generated at render time via the
// platform's own Intl.DisplayNames API (localized automatically per the visitor's
// locale) rather than a hand-translated name list maintained here.
export const countryCodes = [
  "BR",
  "US",
  "PT",
  "ES",
  "MX",
  "AR",
  "CL",
  "CO",
  "PE",
  "UY",
  "CA",
  "GB",
  "IE",
  "FR",
  "DE",
  "IT",
  "NL",
  "BE",
  "CH",
  "AT",
  "SE",
  "NO",
  "DK",
  "FI",
  "PL",
  "AU",
  "NZ",
  "JP",
  "IN",
  "ZA",
] as const;

export type CountryCode = (typeof countryCodes)[number];

export function isCountryCode(value: string): value is CountryCode {
  return (countryCodes as readonly string[]).includes(value);
}

export function getCountryDisplayName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
