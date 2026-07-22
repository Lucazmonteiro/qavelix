import type { Locale } from "@/i18n/locales";
import { env } from "@/env/server";

export const siteConfig: {
  name: string;
  description: string;
  defaultLocale: Locale;
  supportEmail: string | null;
  url: string;
} = {
  name: "QAVELIX",
  description:
    "A secure, localized video compression workflow with temporary processing and protected downloads.",
  defaultLocale: "en",
  supportEmail: env.NEXT_PUBLIC_SUPPORT_EMAIL ?? null,
  url: env.NEXT_PUBLIC_APP_URL,
};
