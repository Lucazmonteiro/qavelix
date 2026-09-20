> **⚠ SHUT DOWN (2026-09-20).** QAVELIX is offline. `src/proxy.ts` answers every request
> with HTTP 503 (default-on maintenance mode, `src/lib/maintenance.ts`); the compression and
> video-trimmer queues reject jobs, the Stripe client and Resend are disabled, and Stripe
> billing/webhook endpoints are not registered. To revive the app, set
> `QAVELIX_MAINTENANCE=off`, re-provision the services below, and re-enter credentials — none
> are stored in this repository. Everything below describes the *pre-shutdown* setup.

# QAVELIX Deployment

This guide covers the production deployment path for the current QAVELIX phases.

## Production target

**Render — a single persistent container runs the entire app**: web pages, API routes,
and FFmpeg/FFprobe execution, all in one process. This is a resolved decision, not one of
two options — see
[`docs/architecture/hosting-decision.md`](./architecture/hosting-decision.md) for the
full reasoning and what it means for the rest of the durability work in progress.
Vercel is not used for production; `vercel.json` remains in the repository but does not
represent a deployment target.

- Frontend, API routes, and media execution: Render, using `Dockerfile`'s standalone
  build (FFmpeg baked into the image).
- DNS and edge protection: Cloudflare.
- CI/CD verification: GitHub Actions.
- Job state and rate-limit state are durable (Postgres `compression_job` /
  `rate_limit_bucket`, Milestone 6 Phases 5–6) — a job or rate-limit window survives a
  process restart. See "Worker deployment guide" below for what's still local-disk
  (the video files themselves and the FFmpeg worker lock) and why that's fine under a
  single-instance target.

## Required environment variables

Set these variables in Render for the production service (see "Render configuration" below).

```bash
NEXT_PUBLIC_APP_URL=https://qavelix.com
NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail.com
```

Rules:

- `NEXT_PUBLIC_APP_URL` is required when `NODE_ENV=production`.
- `NEXT_PUBLIC_SUPPORT_EMAIL` is required for public production deployments and must currently be `qavelixhq@gmail.com`.
- Production public URLs must use HTTPS.
- `http://localhost` and `http://127.0.0.1` are allowed only for local production verification.
- The value must be the canonical public origin with no trailing slash.

The app URL is used for metadata, canonical links, language alternates, `sitemap.xml`, and `robots.txt`. The support email is rendered on public contact, privacy, and terms pages as the official MVP contact channel.

### Transactional email (required before exposing auth to real users)

```bash
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS="QAVELIX <noreply@qavelix.com>"
```

Both are optional at the code level (`src/env/server.ts`) — without them, password reset
and email verification fall back to logging the link via the structured logger instead of
sending a real email, matching this project's original dev-only behavior. Set both before
the sign-up/sign-in flows are exposed to real users: without them, a user who forgets
their password has no way to recover their account.

Steps, using [Resend](https://resend.com):

1. Add and verify the sending domain (`qavelix.com`) in the Resend dashboard — this
   configures the required DKIM and SPF DNS records; add a DMARC record separately if the
   domain doesn't already have one. Skipping this step causes real deliverability
   problems (spam-folder landing) even though the API call itself succeeds.
2. Create an API key and set `RESEND_API_KEY`.
3. Set `EMAIL_FROM_ADDRESS` to a verified sender on that domain, e.g.
   `"QAVELIX <noreply@qavelix.com>"`.
4. Verify delivery end-to-end through the real Forgot Password and Sign Up UI, not just a
   successful API response — check that the email actually lands in an inbox.

Stripe Checkout and the Billing Portal both require a verified email (`auth.ts`'s
`subscription.requireEmailVerification` and a matching `hooks.before` check — sign-in and
every other route stay ungated). A user who never receives a verification email because
Resend isn't configured yet can sign in and use both tools normally, but cannot subscribe
or manage billing — another reason to complete this section before enabling Stripe.

## Vercel configuration (not used for production)

`vercel.json` is not the production deployment path — see "Production target" above.
Kept in the repository for optional preview/staging use only, not documented further
here.

The project is configured in `vercel.json`:

- Framework: Next.js.
- Install command: `npm ci`.
- Build command: `npm run build`.
- Development command: `npm run dev`.
- Region: `iad1`.
- Explicit cache headers for `/favicon.svg`, `/site.webmanifest`, `/robots.txt`, and `/sitemap.xml`.

Recommended Vercel project settings:

- Node.js version: 24.x.
- Build command: keep `npm run build`.
- Install command: keep `npm ci`.
- Output directory: leave empty and let Vercel detect Next.js.
- Environment variables: set `NEXT_PUBLIC_APP_URL` to the final HTTPS production origin and `NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail.com`.

## Render configuration (production)

Set these environment variables manually in the Render service dashboard before the public production deploy. This list predates Milestones 4–5 (accounts/billing) and previously only covered the anonymous-only core product — it must include the full set below, not just the app-URL/support-email pair, or auth, database-backed rate limiting/job durability, transactional email, and Stripe billing all stay unreachable in production despite the code supporting them:

```bash
# Core (required)
NEXT_PUBLIC_APP_URL=https://qavelix.com
NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail.com

# Database + auth (required once accounts/billing are exposed to real users — see
# src/env/server.ts; the app still boots without these, but /api/auth/* and every
# DB-backed route, including durable rate limiting and compression job durability,
# stay unreachable without them)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
BETTER_AUTH_SECRET=

# Transactional email (required before exposing sign-up/sign-in to real users — see
# "Transactional email" above for the Resend/DNS setup steps)
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS="QAVELIX <noreply@qavelix.com>"

# Stripe billing (required only once Pro checkout/billing portal are enabled — omit all
# three to keep billing off, matching src/lib/server/auth/auth.ts's createStripePlugin())
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
```

Do not create separate departmental contact variables or aliases for the current MVP. The public contact page, privacy requests, security reports, legal notices, and accessibility feedback all use `qavelixhq@gmail.com`.

## Cloudflare DNS

Use Cloudflare as DNS for the production domain.

Recommended records:

| Type       | Name      | Target                                        |
| ---------- | --------- | ---------------------------------------------- |
| CNAME      | `www`     | Render-assigned canonical host                 |
| A or CNAME | apex/root | Configure through Render's custom domain setup |

Recommended Cloudflare settings:

- SSL/TLS mode: Full (strict).
- Always Use HTTPS: enabled.
- Automatic HTTPS Rewrites: enabled.
- HSTS: only enable after verifying the production domain and Render certificate.
- Cache level: Standard.
- Do not cache API routes.
- Do not modify CSP headers at Cloudflare unless the same policy is mirrored from `next.config.ts`.

## Security headers

Production security headers are configured in `next.config.ts`.

Production CSP must not include `'unsafe-eval'`. It includes `upgrade-insecure-requests`.

Development CSP may include `'unsafe-eval'` only to support React development mode.

Verify production headers after deployment:

```bash
curl -I https://qavelix.com/en
```

Check for:

- `Content-Security-Policy`
- `Strict-Transport-Security`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`
- `Permissions-Policy`

## Static assets, SEO, and metadata

Verify after deployment:

```bash
curl -I https://qavelix.com/favicon.svg
curl -I https://qavelix.com/site.webmanifest
curl https://qavelix.com/robots.txt
curl https://qavelix.com/sitemap.xml
curl https://qavelix.com/en
```

Expected:

- Favicon is reachable.
- Web manifest is reachable.
- `robots.txt` disallows `/api/` and points to the production sitemap.
- `sitemap.xml` includes all supported locales and legal/content pages.
- Localized pages include canonical, alternate language, Open Graph, and Twitter metadata.

## API routes

Verify API routes after deployment without uploading production customer data:

```bash
curl -i -X POST https://qavelix.com/api/upload/analyze
curl -i -X POST https://qavelix.com/api/compression/jobs
```

Expected:

- Same-origin protection rejects cross-origin state-changing requests.
- Missing multipart uploads return validation errors only for same-origin requests.
- API responses include `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

## Worker deployment guide (reference only — not the current plan)

**Not adopted for now** — see
[`docs/architecture/hosting-decision.md`](./architecture/hosting-decision.md), which
chose a single Render instance over this split-worker architecture. Kept here as
reference for the "Revisit trigger" condition in that document, describing what to build
*if* this decision is later revisited, not a near-term plan.

The current implementation keeps compression execution in the Next.js server runtime; job dispatch order (`queue: string[]`, which job runs next) is still in-memory, but job *state* is durable (Postgres, Milestone 6 Phase 6) — a crash or restart no longer loses a job, it's recovered or cleanly failed. That's suitable for local verification and a single runtime instance, but it is not horizontally durable — multiple instances still can't safely share the in-memory dispatch queue, which is exactly what the full worker split below would fix.

If a dedicated worker architecture is later needed:

1. Move job state from process memory to durable storage.
2. Move uploaded source and compressed output files from local temporary files to private object storage.
3. Run FFmpeg and FFprobe in a worker runtime that explicitly supports those binaries.
4. Have the web app enqueue jobs and poll durable job state instead of owning the compression process.
5. Keep signed download URLs short-lived and scoped to completed outputs.
6. Keep cleanup as an explicit worker task for source files, output files, expired jobs, deleted jobs, and failed jobs.

Recommended production worker targets:

- Container worker on a platform with persistent FFmpeg/FFprobe support.
- Private object storage for inputs and outputs.
- Managed queue for compression jobs.
- Durable database or key-value store for job state.

Do not run multi-instance production compression with the current in-memory queue because job state and output paths are instance-local.

## CI/CD

GitHub Actions runs on pushes to `main` and pull requests:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm run db:migrate   # only when DATABASE_URL is configured, see below
npm run test
```

Render should deploy only commits that pass CI (configure auto-deploy from the branch CI protects, or gate deploys manually until that's set up).

### CI database coverage (optional, recommended before enabling billing in production)

`tests/integration/entitlements-db.test.mjs` and `tests/integration/stripe-billing-db.test.mjs`
exercise the atomic-upsert, idempotency, and plan-sync logic that the entitlements and
Stripe billing systems depend on, directly against a real Postgres database. Each test
file skips gracefully (never fails) when its required variables are unset, so CI passes
either way — but without them, this logic has no CI coverage and a regression is only
caught after it reaches a real user.

To enable this coverage, set these as GitHub Actions repository secrets:

- `DATABASE_URL` — a dedicated CI/test Neon branch connection string. **Never point this
  at the production database**: the test suite inserts and deletes rows as part of
  running. The app's database driver (`@neondatabase/serverless` /
  `drizzle-orm/neon-serverless`, see `src/lib/server/db/client.ts`) requires a real Neon
  endpoint — a generic Postgres service container does not work as a substitute.
- `BETTER_AUTH_SECRET` — any string of 32+ characters; only signs sessions against the
  CI/test database above.
- `STRIPE_SECRET_KEY` — a Stripe **test-mode** secret key (`sk_test_...`) only. The test
  file itself refuses to run against a key that isn't test-mode, as a safety net.
- `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID` — the matching test-mode values.

When `DATABASE_URL` is set, CI also runs `npm run db:migrate` against it before the test
step, so the schema in `src/lib/server/db/schema.ts` stays current on that branch
automatically — no manual migration step is required after adding the secret.

### Manual Stripe test-mode subscription testing (local development)

A real Stripe Checkout completion always writes the verified subscription state to two
places on two different timelines: immediately, via `@better-auth/stripe`'s own
`/subscription/success` redirect (which the browser passes through right after Checkout,
before landing back on `/dashboard/plan?checkout=success`); and asynchronously, via
Stripe's webhook (`customer.subscription.created`/`updated`, delivered to
`/api/auth/stripe/webhook`), which is what actually calls this app's own
`onSubscriptionCreated`/`onSubscriptionUpdate` hooks in `src/lib/server/auth/auth.ts`.
`getPlan()` (`src/lib/server/entitlements/service.ts`) self-heals from the first source the
moment either one has written an active/trialing row, so Pro shows up correctly even if
the webhook is slow — but the webhook is still the only mechanism for changes that happen
while nobody is looking at the app (a later renewal, a cancellation, a failed payment), so
it must be reachable to test those paths, and to verify `onSubscriptionCreated`/
`onSubscriptionUpdate`/`onSubscriptionDeleted` themselves actually fire (not just that the
end state looks right).

Locally, Stripe cannot reach `http://localhost:3000` directly, so forward events with the
[Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe login                 # one-time, opens a browser to link your Stripe test account
stripe listen --forward-to localhost:3000/api/auth/stripe/webhook
```

`stripe listen` prints a webhook signing secret (`whsec_...`) to the terminal — copy that
exact value into `STRIPE_WEBHOOK_SECRET` in `.env.local` (it's different from, and only
valid alongside, the CLI session that printed it; a Dashboard-configured production
endpoint has its own separate signing secret). Restart `npm run dev` after changing it.
With `stripe listen` running in one terminal and the dev server in another:

1. Sign in, go to `/dashboard/plan`, click the upgrade button, and complete Checkout with
   [a Stripe test card](https://docs.stripe.com/testing#cards) (e.g. `4242 4242 4242 4242`,
   any future expiry, any CVC).
2. Confirm the terminal running `stripe listen` logs the forwarded events
   (`checkout.session.completed`, `customer.subscription.created`, ...).
3. Confirm the Plan/Dashboard/Usage pages show Pro, survive a refresh, and survive
   signing out and back in.
4. To test cancellation/payment-failure behavior: use the Billing Portal
   (`/dashboard/billing` or the Plan page's "Manage subscription" button) to cancel, or
   use `stripe trigger customer.subscription.updated` / the Stripe Dashboard's test-mode
   controls to simulate a failed renewal, then confirm the plan reverts to Free.

Never commit the values `stripe listen`/`stripe login` print, and never commit a real
`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` — `.env.local` is already git-ignored; keep it
that way.

### Required: production webhook event subscription must exclude `checkout.session.completed`

**This is a required manual configuration step, not optional.** When configuring the
production webhook endpoint in the Stripe Dashboard (Developers → Webhooks → the endpoint
pointing at `https://qavelix.com/api/auth/stripe/webhook`), subscribe it to exactly:

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Do not subscribe `checkout.session.completed`.** `@better-auth/stripe`'s webhook handler
(`onCheckoutSessionCompleted`, inside `node_modules/@better-auth/stripe`) only skips
`mode: "setup"` sessions — for any other session type it unconditionally calls
`client.subscriptions.retrieve(checkoutSession.subscription)`, which throws when the
session has no `subscription` field. The one-time "Support QAVELIX" contribution checkout
(`src/app/api/support/checkout/route.ts`) creates its sessions with `mode: "payment"`,
which has no `subscription` field by design — a `checkout.session.completed` event for a
contribution would make this shared endpoint throw and return a non-2xx response to
Stripe, which Stripe then retries on its own schedule (up to several days), producing
persistent failed-webhook noise in the Stripe Dashboard for an endpoint this app doesn't
actually need that event type for: this app's own plan-sync hooks
(`onSubscriptionCreated`/`onSubscriptionUpdate`/`onSubscriptionDeleted` in
`src/lib/server/auth/auth.ts`) are driven entirely by the three `customer.subscription.*`
events above, not by `checkout.session.completed`.

This is a third-party-plugin limitation (confirmed by reading its source, not modified
here) — the correct fix is this endpoint configuration, not a code change to the plugin.
The "Support QAVELIX" flow doesn't depend on this webhook either way: its own success page
verifies payment directly via `stripeClient.checkout.sessions.retrieve(session_id)`, never
via a webhook.

Locally, `stripe listen` (used above) forwards every event type by default regardless of
this guidance — if you test a contribution checkout while `stripe listen` is running,
expect a harmless `checkout.session.completed` failure logged in that terminal (`stripe
listen`'s local forwarding failures don't trigger Stripe's real retry/alerting behavior
the way a Dashboard-configured production endpoint's failures do). Add
`--events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted`
to the `stripe listen` command above if you want local testing to exactly mirror the
recommended production subscription list.

## Final launch checklist — switching Stripe from test to live mode

This is the complete, ordered sequence for taking QAVELIX PRO's billing from Stripe test
mode to real, live payments. Test-mode behavior (documented above) is unaffected until the
live variables below are actually set — switching to live mode is controlled entirely by
which values are in the environment, never a separate code flag. Do not perform any step
here until all automated test-mode validation (`npm run lint && npm run typecheck &&
npm run build && npm run test`) passes.

**1. Confirm every non-Stripe variable is already set correctly:**

- `NEXT_PUBLIC_APP_URL` — the final HTTPS production origin (e.g. `https://qavelix.com`).
- `NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail.com`.
- `DATABASE_URL` — the production Neon connection string (never the CI/test branch).
- `BETTER_AUTH_SECRET` — a real 32+ character secret, generated once and never reused
  from a dev/test value (see "Render configuration" above for the generation command).
- `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` — after completing the domain verification
  steps under "Transactional email" above. Billing depends on this indirectly: checkout
  and the billing portal both require a verified email (`auth.ts`'s
  `subscription.requireEmailVerification` and its matching `hooks.before` check), so a
  user who never receives a verification email cannot subscribe either.

**2. Create the live QAVELIX PRO product and price in the Stripe Dashboard** (switch the
Dashboard's mode toggle to **Live**, not Test, before doing this):

1. Products → Add product. Name: `QAVELIX PRO` (or whatever you want customers to see on
   their invoice/statement — the app itself never displays a product name, only the price).
2. Add a recurring price: **US$9.99**, billing period **Monthly**, currency **USD**.
3. Save, then copy the **Price ID** (`price_...`) from the price row (not the product
   page's own `prod_...` ID — the app only ever uses the Price ID; nothing in this
   codebase reads a product ID from configuration, so there is nothing else to copy here
   for that ID, though you may still want to note the product ID for your own Dashboard
   reference).
4. This Price ID is the value for `STRIPE_PRO_MONTHLY_PRICE_ID` in Render (live mode) —
   see step 5 below for exactly where to enter it.

**3. Create the live webhook endpoint:**

1. Stripe Dashboard (Live mode) → Developers → Webhooks → Add endpoint.
2. Endpoint URL: `https://qavelix.com/api/auth/stripe/webhook` (the same path the
   plugin's own webhook route mounts at — see "Manual Stripe test-mode subscription
   testing" above for how this route is dispatched).
3. Select these events **exactly** (see "Required: production webhook event subscription
   must exclude `checkout.session.completed`" above for why no other events, and
   specifically not that one, are needed or safe to add):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save, then reveal and copy the endpoint's **Signing secret** (`whsec_...`) — this is a
   different value from any `stripe listen` secret used locally; it is unique to this one
   Dashboard-configured endpoint.

**4. Configure the Stripe Customer Portal** (Dashboard → Settings → Billing → Customer
portal, in Live mode):

- **Payment methods**: enable "Allow customers to update payment methods."
- **Cancellation**: enable "Allow customers to cancel subscriptions" (the app's own
  Billing Portal button relies on this being turned on — with it off, a customer who
  clicks "Manage subscription" would reach a portal with no way to actually cancel).
- **Invoice history**: enable "Allow customers to view their billing history."
- **Branding**: set the business name/logo/icon/colors customers should see on the
  portal itself (Stripe-hosted, not a QAVELIX page — see `src/components/dashboard/
  billing-portal-button.tsx`).
- **Business information / support**: set the same public support contact
  (`qavelixhq@gmail.com`) Stripe should show customers on the portal and on invoices.
- Return URL is set by the app itself on every portal request (`/dashboard/plan` or
  `/dashboard/billing`, whichever the customer opened it from) — nothing to configure
  in the Dashboard for this.

**5. Enter the live values in Render** (service dashboard → Environment):

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...       # from step 3, the live endpoint's own secret
STRIPE_PRO_MONTHLY_PRICE_ID=price_... # from step 2
```

Never paste these into chat, a commit, or any file tracked by git — `.env.local` is
already git-ignored; keep it that way, and enter the live values directly into Render's
environment variable UI. Setting only one or two of the three above (never all three,
never none) is caught at boot by `src/env/server.ts`'s own validation with a clear error
naming exactly which variable is missing — the deployment will fail to start rather than
silently run with billing half-configured.

**6. Deploy** — trigger the Render deploy (or let it auto-deploy from the push that
already happened before this checklist, per this project's normal flow) after the env
vars above are saved.

**7. Post-deployment verification** (in this order):

1. Confirm the service boots without an env-validation error (Render logs).
2. Sign in as a real (your own) account, verify its email if not already verified.
3. Confirm `/dashboard/plan` shows the real US$9.99/month price (read live from Stripe
   via `getProMonthlyPriceDisplay()` — never a hardcoded number; if this shows nothing,
   the live price lookup itself is failing, which means something above was missed).
4. In the Stripe Dashboard (Live mode) → Developers → Webhooks → the new endpoint, confirm
   its status shows as enabled with no failed delivery attempts yet.

**8. A small real-payment smoke test** (uses a real card and a real, small charge —
confirm you're prepared to immediately refund it in step 9):

1. From a real account with a verified email, click "Upgrade to Pro" and complete
   Checkout with a real card.
2. Confirm the Stripe Dashboard (Live mode) shows the new Checkout Session and the new
   `customer.subscription.created` webhook delivery succeeding (200 response).
3. Confirm `/dashboard/plan` reflects Pro immediately after the redirect back
   (`getPlan()`'s self-heal from the `subscription` table, per `docs/architecture` — same
   mechanism already proven in test mode), and confirm it still shows Pro after a full
   sign-out/sign-in cycle.
4. Confirm the two paid tools (Video Compressor, Extract Audio) reflect Pro-tier limits
   for that account.

**9. Refund/cancellation verification** (immediately after step 8, using the same test
subscription — do not leave a real subscription running purely from this smoke test):

1. In the Stripe Dashboard, refund the smoke-test charge from step 8 (Payments → the
   charge → Refund). A refund does not by itself cancel the subscription — do that
   separately.
2. Use the app's own Billing Portal (`/dashboard/billing` → "Manage subscription") to
   cancel the subscription, exactly as a real customer would.
3. Confirm the Stripe Dashboard shows the subscription as canceled and the
   `customer.subscription.deleted` (or `updated` with a canceled status) webhook
   delivered successfully.
4. Confirm `/dashboard/plan` reverts to Free once the cancellation takes effect (matching
   this project's existing "only active/trialing grants Pro" rule — see auth.ts's
   `syncPlanFromSubscription`).

**10. Rollback procedure**, if anything above fails or behaves unexpectedly:

1. In Render, revert `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and
   `STRIPE_PRO_MONTHLY_PRICE_ID` back to their previous test-mode values (or unset all
   three to disable billing entirely) — this alone takes the deployment back to
   test-mode/no-billing behavior with no code change or redeploy needed, since mode is
   controlled purely by these variables.
2. In the Stripe Dashboard (Live mode), disable (do not delete) the live webhook endpoint
   from step 3 if it is delivering to a misconfigured target, to stop Stripe's retry
   backoff from accumulating failed-delivery noise.
3. Test-mode and live-mode Stripe customers/subscriptions are always completely separate
   objects in Stripe's own systems — nothing from the test-mode smoke testing done during
   development ever needs migrating, and nothing done in live mode ever affects test-mode
   data. No production database write happens as part of this rollback; `user_entitlement
   .plan` for any affected account simply reflects whatever the next webhook/self-heal
   check finds once the correct (test or live) variables are back in place.
4. If a real customer was already charged before a rollback becomes necessary, issue a
   refund from the Stripe Dashboard as in step 9 — the app itself has no separate refund
   mechanism; Stripe is the single source of truth for that action.

## Manual deployment checklist

Before the first production deployment:

1. Create the Render service from the repository, using `Dockerfile`.
2. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS production origin.
3. Set `NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail.com`.
4. Set `DATABASE_URL` and `BETTER_AUTH_SECRET` (required for accounts/billing — see "Render configuration" above).
5. Set `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS`, after completing the Resend domain verification steps under "Transactional email" above.
6. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRO_MONTHLY_PRICE_ID` if Pro checkout/billing is enabled for this deployment.
7. Connect the production domain in Render.
8. Configure Cloudflare DNS to point to Render.
9. Verify Render has issued a valid certificate (or Cloudflare's, per the SSL/TLS mode above).
10. Run the post-deployment checks in this document.
11. Confirm `sitemap.xml`, `robots.txt`, metadata, favicon, and manifest use the production origin.
