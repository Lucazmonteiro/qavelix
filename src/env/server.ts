import { z } from "zod";

const rawNodeEnv = process.env.NODE_ENV ?? "development";
const hasExplicitAppUrl = Boolean(process.env.NEXT_PUBLIC_APP_URL);
const localProductionHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

// CI (and some PaaS env-var UIs) can only express "this secret isn't configured" as an
// empty string, not as a genuinely absent variable — e.g. GitHub Actions' `${{ secrets.X
// }}` interpolates to "" when the secret was never set for that run. Zod's `.optional()`
// only treats `undefined` as absent, so an empty string still gets validated against the
// real schema (a URL shape, a 32-char minimum, a key-prefix regex) and fails every one of
// them, crashing every optional var at once instead of leaving them unset as intended.
// Normalizing "" to undefined here restores the actual "optional everywhere" behavior
// documented above for every field this reaches.
function emptyToUndefined(value: string | undefined): string | undefined {
  return value === "" ? undefined : value;
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_SUPPORT_EMAIL: z.email().optional(),
    NEXT_PUBLIC_APP_URL: z.url().superRefine((value, context) => {
      const url = new URL(value);

      if (rawNodeEnv !== "production") {
        return;
      }

      if (!hasExplicitAppUrl) {
        context.addIssue({
          code: "custom",
          message: "NEXT_PUBLIC_APP_URL is required in production.",
        });
        return;
      }

      if (url.protocol !== "https:" && !localProductionHosts.has(url.hostname)) {
        context.addIssue({
          code: "custom",
          message:
            "NEXT_PUBLIC_APP_URL must use HTTPS in production unless it targets localhost for local verification.",
        });
      }
    }),
    // Optional at every stage, including production: the SaaS foundation (Drizzle +
    // Better Auth) has no UI and nothing existing depends on it yet, so the shared env
    // module — imported by every page — must not fail production builds/boots over
    // vars only the not-yet-reachable /api/auth/* route needs. getDb()/getAuth()
    // (src/lib/server/db/client.ts, src/lib/server/auth/auth.ts) throw a clear error
    // themselves if something actually tries to use the database without one configured.
    DATABASE_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    // Same "optional everywhere" reasoning as above: Milestone 5's Stripe integration is
    // additive on top of the existing entitlement system, not a replacement for it. With
    // these unset, getAuth() simply omits the stripe() plugin (see auth.ts) and every
    // existing tool/dashboard/entitlement route keeps working exactly as in Milestone 4.
    //
    // The regex (not just startsWith) is deliberate: Stripe secret/webhook keys and price
    // IDs are always the prefix followed by a long alphanumeric id — real values are never
    // this short. This catches an obvious placeholder/typo ("sk_test_", "price_xxx") at
    // boot with a clear message, without ever calling Stripe itself (a real key/id can
    // still be entirely wrong — a value only Stripe itself can confirm, which is what the
    // manual launch checklist's reachability check in docs/DEPLOYMENT.md is for). Neither
    // `test`/`live` prefix is preferred over the other here: switching between Stripe test
    // and live mode is controlled entirely by which value is set, never by a separate flag.
    STRIPE_SECRET_KEY: z.string().regex(/^sk_(test|live)_[A-Za-z0-9]{16,}$/).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_[A-Za-z0-9]{16,}$/).optional(),
    STRIPE_PRO_MONTHLY_PRICE_ID: z.string().regex(/^price_[A-Za-z0-9]{16,}$/).optional(),
    // Milestone 6 Phase 3 — real transactional email for password reset and email
    // verification (src/lib/server/email.ts). Same "optional everywhere, including
    // production" convention as STRIPE_*: with either unset, auth.ts falls back to its
    // original dev-only behavior (logging the link) instead of failing to boot.
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    EMAIL_FROM_ADDRESS: z.string().optional(),
  })
  .superRefine((value, context) => {
    const appUrl = new URL(value.NEXT_PUBLIC_APP_URL);
    const isLocalAppUrl = localProductionHosts.has(appUrl.hostname);

    if (
      value.NODE_ENV === "production" &&
      hasExplicitAppUrl &&
      !isLocalAppUrl &&
      !value.NEXT_PUBLIC_SUPPORT_EMAIL
    ) {
      context.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPPORT_EMAIL"],
        message: "NEXT_PUBLIC_SUPPORT_EMAIL is required for public production deployments.",
      });
    }

    // Stripe: fail fast on a silently half-broken configuration rather than letting
    // createStripePlugin() (auth.ts) quietly disable billing over one missing var, which
    // could otherwise ship unnoticed since every other route keeps working either way.
    const stripeVars = {
      STRIPE_SECRET_KEY: value.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: value.STRIPE_WEBHOOK_SECRET,
      STRIPE_PRO_MONTHLY_PRICE_ID: value.STRIPE_PRO_MONTHLY_PRICE_ID,
    };
    const configuredStripeVars = Object.entries(stripeVars).filter(([, v]) => Boolean(v));

    if (configuredStripeVars.length > 0 && configuredStripeVars.length < 3) {
      const missing = Object.entries(stripeVars)
        .filter(([, v]) => !v)
        .map(([name]) => name);

      context.addIssue({
        code: "custom",
        path: ["STRIPE_SECRET_KEY"],
        message: `Stripe is only partially configured — ${missing.join(", ")} must be set too, or all three left unset to keep billing disabled.`,
      });
    }

    // A genuine public production deployment (real HTTPS origin, not the documented
    // localhost-under-NODE_ENV=production escape hatch used for local production
    // verification) must never run against Stripe test-mode keys — this is exactly the
    // "production deployment accidentally using placeholder/test values" case, caught the
    // same way the NEXT_PUBLIC_SUPPORT_EMAIL check above catches its own equivalent.
    if (
      value.NODE_ENV === "production" &&
      hasExplicitAppUrl &&
      !isLocalAppUrl &&
      value.STRIPE_SECRET_KEY?.startsWith("sk_test_")
    ) {
      context.addIssue({
        code: "custom",
        path: ["STRIPE_SECRET_KEY"],
        message:
          "STRIPE_SECRET_KEY is a test-mode key (sk_test_...) but this is a public production deployment — set the live secret key (sk_live_...) before going live.",
      });
    }
  });

const parsedEnv = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPPORT_EMAIL: emptyToUndefined(process.env.NEXT_PUBLIC_SUPPORT_EMAIL),
  NEXT_PUBLIC_APP_URL:
    emptyToUndefined(process.env.NEXT_PUBLIC_APP_URL) ??
    (rawNodeEnv === "production" ? undefined : "http://localhost:3000"),
  DATABASE_URL: emptyToUndefined(process.env.DATABASE_URL),
  BETTER_AUTH_SECRET: emptyToUndefined(process.env.BETTER_AUTH_SECRET),
  STRIPE_SECRET_KEY: emptyToUndefined(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: emptyToUndefined(process.env.STRIPE_WEBHOOK_SECRET),
  STRIPE_PRO_MONTHLY_PRICE_ID: emptyToUndefined(process.env.STRIPE_PRO_MONTHLY_PRICE_ID),
  RESEND_API_KEY: emptyToUndefined(process.env.RESEND_API_KEY),
  EMAIL_FROM_ADDRESS: emptyToUndefined(process.env.EMAIL_FROM_ADDRESS),
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment configuration: ${z.prettifyError(parsedEnv.error)}`,
  );
}

export const env = parsedEnv.data;
