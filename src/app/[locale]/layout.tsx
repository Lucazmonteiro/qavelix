import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import type { ReactNode } from "react";

import { env } from "@/env/server";
import { isLocale, locales } from "@/i18n/locales";
import { buildLocalizedAlternates } from "@/lib/metadata";
import { themeScript } from "@/components/theme-script";
import "@/styles/globals.css";

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  applicationName: "QAVELIX",
  alternates: buildLocalizedAlternates(),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Script
          id="qavelix-theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {children}
      </body>
    </html>
  );
}
