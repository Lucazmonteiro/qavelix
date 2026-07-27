import { eq } from "drizzle-orm";

import { siteConfig } from "@/config/site";
import { isLocale } from "@/i18n/locales";
import { isValidContributionCents } from "@/lib/contribution-amounts";
import { getOptionalSession } from "@/lib/server/auth/session";
import { getDb } from "@/lib/server/db/client";
import { user as userTable } from "@/lib/server/db/schema";
import { enforceApiSecurity, logSecurityEvent, securityJson } from "@/lib/server/security";
import { getStripeClient } from "@/lib/server/stripe-client";

export const runtime = "nodejs";

// This app has exactly one configured Stripe price today (the Pro monthly subscription),
// and nothing in this codebase reads or stores a per-account "default currency" from
// Stripe — reusing that same currency here (rather than trusting a client-supplied one)
// is the safe, minimal choice; broadening to multiple currencies would need an explicit
// audit of what the connected Stripe account actually supports.
const CONTRIBUTION_CURRENCY = "usd";

function jsonError(message: string, status: number, requestId?: string, code?: string) {
  return securityJson({ ok: false, error: { code, message } }, { status, requestId });
}

export async function POST(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "support.checkout",
    limit: 10,
    windowMs: 60_000,
    requireSameOrigin: true,
  });

  if (!security.ok) {
    return security.response;
  }

  const stripeClient = getStripeClient();

  if (!stripeClient) {
    return jsonError("Support isn't available right now.", 503, security.requestId, "not_configured");
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonError("A valid contribution amount is required.", 400, security.requestId, "invalid_request");
  }

  const body = payload as { amount?: unknown; locale?: unknown };
  const amount = body.amount;
  const locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : null;

  if (!locale) {
    return jsonError("A valid locale is required.", 400, security.requestId, "invalid_locale");
  }

  // Integer minor-units only — never a float, never a string the client formatted
  // itself. Bounds are enforced here (via the same shared constants the client-side
  // picker uses, never duplicated as separate numbers) regardless of what the client's
  // own UI already restricted the input to.
  if (typeof amount !== "number" || !isValidContributionCents(amount)) {
    return jsonError("A valid contribution amount is required.", 400, security.requestId, "invalid_amount");
  }

  // Contributions never require an account, but a signed-in contributor's payment is
  // associated with their existing Stripe Customer when one already exists — never
  // created just for this, and never required.
  const session = await getOptionalSession();
  let stripeCustomerId: string | undefined;

  if (session) {
    const db = getDb();
    const [row] = await db
      .select({ stripeCustomerId: userTable.stripeCustomerId })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    stripeCustomerId = row?.stripeCustomerId ?? undefined;
  }

  try {
    const checkoutSession = await stripeClient.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: CONTRIBUTION_CURRENCY,
              unit_amount: amount,
              product_data: {
                name: "QAVELIX Support Contribution",
                description: "Voluntary contribution supporting QAVELIX development and infrastructure.",
              },
            },
            quantity: 1,
          },
        ],
        customer: stripeCustomerId,
        success_url: `${siteConfig.url}/${locale}/support/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteConfig.url}/${locale}/support/cancelled`,
        // Distinguishes this from a Pro subscription payment at a glance in the Stripe
        // Dashboard, and lets the success page confirm it's verifying the right kind of
        // session — never used to grant any entitlement.
        metadata: {
          type: "qavelix_contribution",
        },
      },
      {
        // Prevents a retried/duplicated client request (e.g. a double click, or a retry
        // after a network blip) from creating two separate Checkout Sessions for the
        // same attempt.
        idempotencyKey: `qavelix-contribution-${security.requestId}`,
      },
    );

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a Checkout Session URL.");
    }

    logSecurityEvent("info", "support_checkout_created", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      amount,
      authenticated: Boolean(session),
    });

    return securityJson(
      { ok: true, url: checkoutSession.url },
      { status: 200, requestId: security.requestId },
    );
  } catch (error) {
    logSecurityEvent("error", "support_checkout_failed", {
      requestId: security.requestId,
      fingerprint: security.fingerprint,
      message: error instanceof Error ? error.message : "unknown",
    });

    return jsonError("Could not start checkout. Try again.", 502, security.requestId, "checkout_failed");
  }
}
