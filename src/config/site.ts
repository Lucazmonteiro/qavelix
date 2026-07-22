import type { Locale } from "@/i18n/locales";
import { env } from "@/env/server";

export const siteConfig: {
  name: string;
  description: string;
  defaultLocale: Locale;
  googleSiteVerification: string;
  supportEmail: string | null;
  url: string;
} = {
  name: "QAVELIX",
  description:
    "A secure, localized video compression workflow with temporary processing and protected downloads.",
  defaultLocale: "en",
  googleSiteVerification: "mwcIi8xSvEKz7P_4baNDZxKBlFP2ZwGM1T7fNjtq45U",
  supportEmail: env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null,
  url: env.NEXT_PUBLIC_APP_URL,
};
