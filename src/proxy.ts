import { NextResponse, type NextRequest } from "next/server";

import { siteConfig } from "@/config/site";
import { isLocale } from "@/i18n/locales";

const PUBLIC_FILE = /\.(.*)$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const [, maybeLocale] = pathname.split("/");

  if (maybeLocale && isLocale(maybeLocale)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname =
    pathname === "/"
      ? `/${siteConfig.defaultLocale}`
      : `/${siteConfig.defaultLocale}${pathname}`;

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
