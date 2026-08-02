import type { NextConfig } from "next";

import { PRO_MAX_UPLOAD_REQUEST_BYTES } from "./src/lib/server/entitlements/policy";

const isDevelopment = process.env.NODE_ENV === "development";
// Google AdSense (src/components/ads/, layout.tsx's adsbygoogle.js loader) needs more than
// just a script-src exception: the SDK loads the loader from googlesyndication.com,
// creatives render inside nested googlesyndication.com/doubleclick.net iframes (blocked
// outright by the previous frame-src 'none'), each ad issues its own image/beacon
// requests, and Google occasionally serves the loader itself from googletagservices.com.
// Every origin below is Google's own ad-serving infrastructure, never a third party, and
// this app makes no other use of iframes/cross-origin fetches — adding these does not
// broaden the CSP for anything else on the site.
const adsenseScriptOrigins = [
  "https://pagead2.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://www.googletagservices.com",
];
const adsenseFrameOrigins = [
  "https://googleads.g.doubleclick.net",
  "https://tpc.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  // ad traffic quality / "sodar" (Google's invalid-traffic and viewability measurement
  // for AdSense) runs its own check inside a nested iframe from this host, separate from
  // the ad creative's own googlesyndication.com/doubleclick.net iframe above.
  "https://*.adtrafficquality.google",
];
const adsenseConnectOrigins = [
  "https://pagead2.googlesyndication.com",
  "https://*.googlesyndication.com",
  "https://*.google.com",
  // Same ad traffic quality service as above — it also opens its own XHR/fetch
  // (getconfig/sodar) independent of the iframe it renders in.
  "https://*.adtrafficquality.google",
];
const adsenseImageOrigins = ["https://*.googlesyndication.com", "https://*.doubleclick.net"];
const scriptSource = [
  "script-src 'self' 'unsafe-inline'",
  isDevelopment ? "'unsafe-eval'" : null,
  ...adsenseScriptOrigins,
]
  .filter(Boolean)
  .join(" ");
const upgradeInsecureRequests = isDevelopment ? [] : ["upgrade-insecure-requests"];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      scriptSource,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${adsenseImageOrigins.join(" ")}`,
      "media-src 'self' blob:",
      "font-src 'self'",
      `connect-src 'self' ${adsenseConnectOrigins.join(" ")}`,
      `frame-src ${adsenseFrameOrigins.join(" ")}`,
      // Explicit, not relying on the worker-src -> child-src fallback: child-src is
      // 'none' above (this app iframes nothing), and without its own directive worker-src
      // would silently inherit that 'none' too, blocking any blob:-sourced Worker. Not
      // implicated in the compression-download investigation (that flow is a same-origin
      // fetch + <a download>, not a Worker), but a real gap worth closing on its own —
      // 'self' blob: matches the same-origin/blob: allowance already granted to
      // img-src/media-src for this exact class of local-file handling.
      "worker-src 'self' blob:",
      "child-src 'none'",
      "manifest-src 'self'",
      ...upgradeInsecureRequests,
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Download-Options",
    value: "noopen",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const publicMetadataCacheHeaders = [
  ...securityHeaders,
  {
    key: "Cache-Control",
    value: "public, max-age=3600, stale-while-revalidate=86400",
  },
];

const faviconCacheHeaders = [
  ...securityHeaders,
  {
    key: "Cache-Control",
    value: "public, max-age=86400, stale-while-revalidate=604800",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    // Sized for the largest plan (Pro), not just the Free/anonymous default — see the
    // comment on PRO_MAX_UPLOAD_REQUEST_BYTES.
    proxyClientMaxBodySize: PRO_MAX_UPLOAD_REQUEST_BYTES,
  },
  async headers() {
    return [
      {
        source: "/favicon.svg",
        headers: faviconCacheHeaders,
      },
      {
        source: "/site.webmanifest",
        headers: publicMetadataCacheHeaders,
      },
      {
        source: "/robots.txt",
        headers: publicMetadataCacheHeaders,
      },
      {
        source: "/sitemap.xml",
        headers: publicMetadataCacheHeaders,
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
