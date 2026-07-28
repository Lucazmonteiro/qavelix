import { getOptionalSession } from "@/lib/server/auth/session";
import {
  getStripeBillingAddress,
  isBillingConfigured,
  updateStripeBillingAddress,
  type BillingAddress,
} from "@/lib/server/billing";
import { enforceApiSecurity, logSecurityEvent, securityJson } from "@/lib/server/security";

export const runtime = "nodejs";

const MAX_FIELD_LENGTH = 200;
// ISO 3166-1 alpha-2 — matches Stripe's own `country` field expectation exactly.
const COUNTRY_PATTERN = /^[A-Z]{2}$/;

function jsonError(message: string, status: number, requestId?: string, code?: string) {
  return securityJson({ ok: false, error: { code, message } }, { status, requestId });
}

function readTrimmedString(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

// Server-side validation is intentionally lenient about format (real-world addresses
// vary too much by country to validate strictly), but strict about presence, length, and
// the country code shape Stripe itself requires — never trusting the client beyond that.
function parseBillingAddressPayload(payload: unknown): BillingAddress | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const body = payload as Record<string, unknown>;
  const line1 = readTrimmedString(body.line1);
  const line2 = readTrimmedString(body.line2);
  const city = readTrimmedString(body.city);
  const state = readTrimmedString(body.state);
  const postalCode = readTrimmedString(body.postalCode);
  const country = readTrimmedString(body.country)?.toUpperCase() ?? null;

  if (!line1 || line1.length > MAX_FIELD_LENGTH) {
    return null;
  }

  if (line2 && line2.length > MAX_FIELD_LENGTH) {
    return null;
  }

  if (!city || city.length > MAX_FIELD_LENGTH) {
    return null;
  }

  if (state && state.length > MAX_FIELD_LENGTH) {
    return null;
  }

  if (!postalCode || postalCode.length > 20) {
    return null;
  }

  if (!country || !COUNTRY_PATTERN.test(country)) {
    return null;
  }

  return {
    line1,
    line2: line2 || undefined,
    city,
    state: state || undefined,
    postalCode,
    country,
  };
}

// Read-only: the current confirmed address on file, sourced live from Stripe every time
// (never cached/duplicated locally) — used by the billing-address form to pre-fill on
// load.
export async function GET(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "billing.address.get",
    limit: 20,
    windowMs: 60_000,
  });

  if (!security.ok) {
    return security.response;
  }

  const session = await getOptionalSession();

  if (!session) {
    return jsonError("Sign in to manage your billing address.", 401, security.requestId, "unauthenticated");
  }

  if (!isBillingConfigured()) {
    return jsonError("Billing is not configured.", 503, security.requestId, "billing_not_configured");
  }

  const address = await getStripeBillingAddress(session.user.id);

  return securityJson({ ok: true, address }, { status: 200, requestId: security.requestId });
}

export async function POST(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "billing.address.update",
    limit: 10,
    windowMs: 60_000,
    requireSameOrigin: true,
  });

  if (!security.ok) {
    return security.response;
  }

  const session = await getOptionalSession();

  if (!session) {
    return jsonError("Sign in to manage your billing address.", 401, security.requestId, "unauthenticated");
  }

  if (!isBillingConfigured()) {
    return jsonError("Billing is not configured.", 503, security.requestId, "billing_not_configured");
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("A valid billing address is required.", 400, security.requestId, "invalid_request");
  }

  const address = parseBillingAddressPayload(payload);

  if (!address) {
    return jsonError("A valid billing address is required.", 400, security.requestId, "invalid_address");
  }

  const result = await updateStripeBillingAddress(session.user.id, address);

  if (!result.ok) {
    logSecurityEvent("warn", "billing_address_update_rejected", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      reason: result.reason,
    });

    const status = result.reason === "no_customer" ? 404 : 502;
    return jsonError("Could not update your billing address. Try again.", status, security.requestId, result.reason);
  }

  logSecurityEvent("info", "billing_address_updated", {
    requestId: security.requestId,
    fingerprint: security.fingerprint,
  });

  return securityJson(
    { ok: true, address: result.address },
    { status: 200, requestId: security.requestId },
  );
}
