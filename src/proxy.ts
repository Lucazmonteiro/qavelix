import { NextResponse, type NextRequest } from "next/server";

import { siteConfig } from "@/config/site";
import { isLocale } from "@/i18n/locales";

const PUBLIC_FILE = /\.(.*)$/;
const PRODUCTION_HOST = "qavelix.com";
const RENDER_HOST = "qavelix.onrender.com";

export function proxy(request: NextRequest) {
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";

  if (host.split(":")[0] === RENDER_HOST) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.protocol = "https:";
    redirectUrl.hostname = PRODUCTION_HOST;
    redirectUrl.port = "";

    return NextResponse.redirect(redirectUrl, 308);
  }

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
