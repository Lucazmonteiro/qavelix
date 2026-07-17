import type { NextConfig } from "next";

import { MAX_UPLOAD_REQUEST_BYTES } from "./src/lib/upload-policy";

const isDevelopment = process.env.NODE_ENV === "development";
const scriptSource = isDevelopment
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";
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
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-src 'none'",
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
    proxyClientMaxBodySize: MAX_UPLOAD_REQUEST_BYTES,
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
