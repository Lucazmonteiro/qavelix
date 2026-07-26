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

Set these environment variables manually in the Render service dashboard before the public production deploy:

```bash
NEXT_PUBLIC_APP_URL=https://qavelix.com
NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail.com
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

## Manual deployment checklist

Before the first production deployment:

1. Create the Render service from the repository, using `Dockerfile`.
2. Set `NEXT_PUBLIC_APP_URL` to the final HTTPS production origin.
3. Set `NEXT_PUBLIC_SUPPORT_EMAIL=qavelixhq@gmail.com`.
4. Connect the production domain in Render.
5. Configure Cloudflare DNS to point to Render.
6. Verify Render has issued a valid certificate (or Cloudflare's, per the SSL/TLS mode above).
7. Run the post-deployment checks in this document.
8. Confirm `sitemap.xml`, `robots.txt`, metadata, favicon, and manifest use the production origin.
