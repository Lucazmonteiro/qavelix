import { NextResponse, type NextRequest } from "next/server";

import { siteConfig } from "@/config/site";
import { isLocale } from "@/i18n/locales";

const PUBLIC_FILE = /\.(.*)$/;
const PRODUCTION_HOST = "qavelix.com";
const RENDER_HOST = "qavelix.onrender.com";

// Guest-only redirects for sign-in/sign-up/forgot-password are handled entirely by
// getOptionalSession() (src/lib/server/auth/session.ts) on each of those 3 pages, not
// here. An earlier version of this file added a cheap cookie-*presence* check at this
// layer as a "fast path" — but presence isn't validity: a session revoked from another
// device/tab (or any other client/server desync) leaves the cookie physically present
// while the server-side session is gone. Because that check ran before the accurate
// page-level one, it could permanently redirect a visitor with a stale cookie away from
// all 3 guest-only pages — a dead end with no in-app recovery, since there'd be no way
// back to sign-in. Removed rather than patched: getOptionalSession() is already correct,
// already server-side (so there's no client-visible flash either way), and is the only
// check that actually needs to exist.

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
