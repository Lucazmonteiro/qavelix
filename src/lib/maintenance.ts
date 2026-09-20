// QAVELIX is shut down. Every server-side entry point that could spend money or compute
// (routes via src/proxy.ts, both FFmpeg queues, the Stripe client, outbound email)
// consults this one switch.
//
// Maintenance is the DEFAULT: it is on unless QAVELIX_MAINTENANCE is explicitly "off".
// A missing or misconfigured env var therefore fails closed (offline), never open.
// To bring the app back for local development or tests, set QAVELIX_MAINTENANCE=off
// (tests/helpers/next-server.mjs does this for the test server).
//
// Deliberately dependency-free (no env/server.ts, no DB, no Stripe) so it is safe to
// import from proxy.ts and from anywhere else without side effects.
export function isMaintenanceMode(): boolean {
  return process.env["QAVELIX_MAINTENANCE"] !== "off";
}

export const MAINTENANCE_RETRY_AFTER_SECONDS = 86_400;

const MAINTENANCE_TITLE = "Service Temporarily Unavailable";
const MAINTENANCE_MESSAGE =
  "QAVELIX is currently under maintenance. Please check back later.";

export function buildMaintenanceHtml(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>${MAINTENANCE_TITLE}</title></head><body><h1>${MAINTENANCE_TITLE}</h1><p>${MAINTENANCE_MESSAGE}</p></body></html>`;
}

// Returns a plain 503 for every request: an unstyled HTML notice for page requests and a
// small JSON body for /api/* (so API clients and webhook senders get a machine-readable
// answer). Never touches the database, FFmpeg, Stripe, or any route handler.
export function buildMaintenanceResponse(pathname: string): Response {
  const headers = {
    "Cache-Control": "no-store",
    "Retry-After": String(MAINTENANCE_RETRY_AFTER_SECONDS),
  };

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "service_unavailable", message: MAINTENANCE_MESSAGE } }),
      { status: 503, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  return new Response(buildMaintenanceHtml(), {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}
