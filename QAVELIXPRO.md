# QAVELIXPRO.md — Operational Memory

**This document is the project's persistent operational memory.** It is meant to be read
together with `CLAUDE.md` at the start of every future work session:

> "Claude, read CLAUDE.md and QAVELIXPRO.md"

`CLAUDE.md` explains *how the code is built* (conventions, module responsibilities, "why"
comments). This document explains *where the project currently stands* — what's live,
what's decided, what's deferred, what's broken, and what to do next. Where the two
overlap, `CLAUDE.md` is the deeper technical reference; this document is the status
snapshot and the roadmap.

**Last verified against:** commit `5068daf` (`Merge branch 'qavelix-pro'` into `main`),
repository state as of 2026-07-28. Every claim below was checked directly against source
files, schema, docs, and git history at that commit — nothing here is inferred or
carried over from prior planning documents without being cross-checked against the actual
code. Where a planning document's numbers turned out to differ from what actually
shipped, both are stated explicitly (see "Documentation Drift" under Known Issues).

**Maintenance rule:** update this document at the end of every milestone/session that
changes production behavior, limits, environment variables, or the roadmap. Prefer
editing the relevant section in place over appending a changelog — this file should
always read as "current truth," not a diary. If you're unsure whether a change is
significant enough to warrant an update, it probably is.

---

## Project Overview

**QAVELIX** is a Next.js (App Router, TypeScript) media-tools SaaS. It ships free,
browser-first video utilities backed by server-side FFmpeg processing, with an optional
account/subscription layer ("QAVELIX PRO") layered on top without changing how the free
product works.

- **What it is today:** two live tools — an **Online Video Compressor** (queued,
  FFmpeg-based, three quality presets) and **Extract Audio** (synchronous, video → MP3).
  Both are usable with zero account (anonymous, fingerprint-limited) or with a free/paid
  account for higher limits.
- **Objective:** be a fast, private, no-login-required media tool with a legitimate
  upgrade path — never a bait-and-switch where the free tier is crippled to force
  sign-up. The guardrail stated explicitly in `docs/architecture/growth-strategy.md` and
  still honored by the shipped entitlements design: *an upgrade prompt may gate the next
  task or a higher limit, but must never gate the result of the task the user already
  started.*
- **Target audience:** individuals and small teams needing quick video compression /
  audio extraction without installing software or creating an account for a one-off
  task — global audience, localized into English (default), Brazilian Portuguese, and
  European Spanish.
- **Business model:** freemium subscription. Anonymous visitors get a small combined
  lifetime pool; free accounts get a daily per-tool allowance; **QAVELIX PRO**
  (**US$9.99/month**, per the live Stripe price configured in `docs/DEPLOYMENT.md`'s
  launch checklist — see "Documentation Drift" below for how this differs from an
  earlier $39/year proposal that was never implemented) raises both the daily allowance
  and the upload size ceiling. No ads, no credits system, no teams/business tier exist
  yet.
- **Current maturity:** feature-complete through "Milestone 6" (production durability)
  in a local development environment. Accounts, billing, entitlements, durable job/rate
  state, and security hardening are all implemented and covered by automated tests.
  **Not yet verified against a real deployed Render production instance** — every
  end-to-end verification on record (see `docs/architecture/hosting-decision.md`'s
  execution log) was run against local dev as the "closest available proxy," because no
  real Render staging environment was reachable from the environment that did that work.
  Treat production readiness as "code-complete, deployment-unverified" until someone runs
  the real drill described in `docs/DEPLOYMENT.md`.

---

## Current Production Status

| Aspect | Status |
|---|---|
| **Production URL** | `https://qavelix.com` (canonical). `qavelix.onrender.com` 308-redirects to it (`src/proxy.ts`). |
| **Deployment platform** | Render — single persistent container, `Dockerfile`'s standalone Next.js build (`node:24-alpine` + FFmpeg baked in). **Resolved decision**, not a live option among several — see `docs/architecture/hosting-decision.md`. Vercel is NOT used for production; `vercel.json` stays in the repo but is inert. |
| **Database** | Neon Postgres via Drizzle ORM (`@neondatabase/serverless`). Fully optional at the code level — the app boots and the anonymous-only tools work with zero `DATABASE_URL`. Required for auth, billing, durable rate limiting, and durable compression-job state. |
| **Authentication** | Better Auth (`better-auth` 1.6.25), email+password only, no OAuth provider configured. Optional (gated on `DATABASE_URL` + `BETTER_AUTH_SECRET`). |
| **Email verification** | Real delivery via Resend when `RESEND_API_KEY` + `EMAIL_FROM_ADDRESS` are both set; otherwise falls back to logging the link server-side (dev-safe, never a dead end). |
| **Stripe** | `@better-auth/stripe` plugin, gated on all three of `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRO_MONTHLY_PRICE_ID` being set. One recurring Pro plan. A separate one-time "Support QAVELIX" contribution checkout also exists (`mode: "payment"`, unrelated to the subscription). |
| **Webhook** | `/api/auth/stripe/webhook` (mounted by the Stripe plugin). Production endpoint must subscribe to exactly `customer.subscription.created/updated/deleted` — **must NOT include `checkout.session.completed`** (see `docs/DEPLOYMENT.md` for why; a third-party plugin limitation, not fixable in this codebase). |
| **Dashboard** | Implemented: `/dashboard`, `/dashboard/plan`, `/dashboard/usage`, `/dashboard/billing`, `/dashboard/settings`, all locale-prefixed and session-gated via `requireSession()`. |
| **Compression** | Live. Queued, single in-process FFmpeg worker, three presets (Smaller/Balanced/High Quality), durable job state in Postgres (`compression_job` table), signed HMAC download tokens, 30-minute download TTL. |
| **Extract Audio** | Live. Synchronous (one request/response, no polling), silence detection before extraction, MP3 output. |
| **Internationalization** | `en` (default), `pt-BR`, `es`. Locale-prefixed routing (`/en`, `/pt-BR`, `/es`) enforced by `src/proxy.ts`. |
| **Upload limits** | Anonymous & Free: 250MB (`MAX_UPLOAD_BYTES`). Pro: 500MB (`PRO_MAX_UPLOAD_BYTES`). Both tools share the same ceiling per plan. |
| **Current production branch** | `main`. `qavelix-pro` (the accounts/billing/durability feature branch) was merged into `main` at commit `5068daf`. |
| **Current deployment state** | Code-complete for Milestones 1–6; **actual live Render deployment/verification has not been performed from this environment** — see Project Overview above and `docs/architecture/hosting-decision.md`'s execution log. |
| **Production environment** | Governed entirely by which env vars are set (see "Environment Variables" below) — there is no separate feature-flag mechanism. Test-mode vs. live-mode Stripe, email-on vs. email-off, billing-on vs. billing-off are all pure consequences of which variables are present. |

---

## Architecture

This section is a condensed map — `CLAUDE.md`'s "Architecture" section has the full
reasoning behind each decision; read that for "why," this for "what exists and where."

**Frontend**
- Next.js App Router, all user-facing routes under `src/app/[locale]/...`.
- Locale switch preserves the current path (`src/i18n/locale-context.tsx`,
  `src/i18n/dictionaries.ts` for copy).
- Client components: `compression-panel.tsx`, `extract-audio-tool.tsx`,
  `upload-validator.tsx` (client-side pre-checks only, never the security boundary),
  `upgrade-modal.tsx`, `plan-comparison-modal.tsx`, dashboard forms under
  `src/components/dashboard/`, auth forms under `src/components/auth/`.

**Backend / API** (`src/app/api/`)
- `POST /api/upload/analyze` — streams upload to disk, validates, runs FFprobe, issues a
  short-lived analyzed-upload reference.
- `POST /api/compression/jobs`, `GET/DELETE /api/compression/jobs/[id]`,
  `GET /api/compression/jobs/[id]/download` — compression job lifecycle.
- `POST /api/extract-audio`, `POST /api/extract-audio/analyze` — synchronous audio
  extraction.
- `GET /api/entitlements/status`, `GET /api/entitlements/plan` — read-only entitlement
  info for the client gate (`use-entitlement-gate.ts`).
- `ALL /api/auth/[...all]` — Better Auth's own catch-all (session, sign-in/up,
  verification, Stripe checkout/portal/webhook when configured).
- `GET /api/verify-email` — proxy in front of Better Auth's own verify endpoint, fixing a
  session-mismatch bug (see Authentication below).
- `GET/PATCH /api/billing/address` — Stripe customer address read/write.
- `POST /api/support/checkout` — one-time "Support QAVELIX" Stripe Checkout session.

**Authentication** — Better Auth + Drizzle adapter, see Authentication section below.

**Billing** — `@better-auth/stripe` plugin + `src/lib/server/billing.ts` (display-only
helpers: live price lookup, billing address, active-subscription detail). Stripe's own
`subscription` table is a mirror, never the source of truth.

**Database** — Neon Postgres, Drizzle ORM. `src/lib/server/db/schema.ts` has two families:
Better-Auth-owned tables (`user`, `session`, `account`, `verification`, and the Stripe
plugin's `subscription`) whose shape is dictated by those libraries, and app-owned tables
(`userEntitlement`, `usageCounter`, `usageEvent`, `auditLog`, `rateLimitBucket`,
`compressionJob`) that are free to evolve except for two load-bearing constraints:
`usageCounter`'s unique index and `usageEvent.idempotencyKey`'s uniqueness.

**Media processing**
- `src/lib/server/compression-queue.ts` — single in-process FIFO worker, durable job
  *state* (Postgres), local-disk job *lock* and video files (deliberate, per the hosting
  decision).
- `src/lib/server/extract-audio.ts` — synchronous, no queue.
- `src/lib/server/ffprobe.ts` — shared metadata extraction.
- `src/lib/compression-policy.ts` — pure functions: presets, FFmpeg argument building,
  job status state machine. Environment-agnostic, reusable if execution ever moves off
  this instance.

**Storage** — local temp disk (`os.tmpdir()/qavelix-compression`,
`os.tmpdir()/qavelix-extract-audio`, `os.tmpdir()/qavelix-upload-analysis`). No object
storage exists or is configured (deliberately deferred — see Known Issues/Roadmap).

**Queue** — in-process `queue: string[]` + `Map`, dispatch order is in-memory (does not
survive a restart, though job *state* does — an interrupted job is detected and cleanly
failed, not silently lost). Not horizontally scalable across multiple instances.

**Entitlements** — `src/lib/server/entitlements/policy.ts` (pure data:
`(plan, toolId) -> limits`) + `service.ts` (the only read/write path: `resolveActor()`,
`checkEntitlement()`, `reserveUsage()`, `confirmUsage()`, `releaseUsage()`). See
`CLAUDE.md` for the full atomicity/idempotency design — it's the most carefully-built
subsystem in the codebase and should not be casually modified.

**Localization** — `src/i18n/locales.ts` (locale list), `src/i18n/dictionaries.ts`
(copy), `src/proxy.ts` (routing).

**Security** — `src/lib/server/security.ts` (rate limiting, request-size preflight,
structured logging, UUID/token validation), `src/lib/server/origin.ts` (from-scratch
same-origin/CSRF check), `next.config.ts` (CSP + full security header set).

**Folder organization / important files** — see `CLAUDE.md`'s "Architecture" section;
not duplicated here to avoid the two documents drifting apart on file paths.

---

## Current Features

### Completed
- Locale routing for `en` (default), `pt-BR`, `es`, with path-preserving locale switch.
- Online Video Compressor: upload validation, FFprobe analysis, three presets, queued
  FFmpeg execution with progress reporting, cancellation, signed time-limited downloads,
  crash-safe durable job state.
- Extract Audio: synchronous video → MP3, silence detection (rejects silent audio),
  streamed upload/response, no queue/polling.
- Anonymous/Free/Pro entitlements system: atomic, idempotent usage reservation; combined
  anonymous lifetime pool; per-tool daily pools for authenticated plans.
- Better Auth email/password accounts: sign-up, sign-in, forgot/reset password, email
  verification (with session-mismatch fix), guest-only page gating.
- Stripe billing: Checkout, Billing Portal, webhook-driven plan sync, self-healing plan
  read (`getPlan()`) that doesn't depend on webhook timing, one-time support/contribution
  checkout separate from the subscription.
- Dashboard: plan comparison + upgrade/manage actions, usage view, billing (address,
  portal button), account settings (profile, password, language, sign-out).
- Security layer: durable-when-configured rate limiting, same-origin/CSRF enforcement on
  every state-changing route, structured security event logging, strict CSP + full
  security header set, request-size preflight before multipart parsing.
- SEO: per-locale metadata (canonical, alternates, OG/Twitter), sitemap, robots policy,
  localized About/Contact/FAQ/Privacy/Terms/Cookie pages.
- Automated tests: unit (Node's built-in runner, source-pattern tests for
  server-only modules), integration (real Next server + real Postgres for
  entitlements/Stripe/rate-limit durability), e2e (rendered pages, assets, metadata).
- CI: GitHub Actions — lint → typecheck → build → (migrate if `DATABASE_URL` set) → test,
  on every PR and push to `main`.

### Partially implemented
- **Durable job/rate-limit state**: implemented for a *single* Render instance (crash/
  restart-safe); explicitly not horizontally scalable across multiple instances (the
  in-memory dispatch queue and job lock remain per-process).
- **Audit logging**: `auditLog` table exists in the schema and is migrated, but **no
  writer is wired up anywhere** — `logSecurityEvent()` still only reaches
  console/structured logs, never this table.
- **Billing address**: read/write against Stripe's own Customer object works, but there
  is no QAVELIX-side copy or validation beyond what the form/Stripe itself enforce.

### Disabled (by absent configuration, not by code removal)
- Stripe checkout/Billing Portal/webhook — inert until all three `STRIPE_*` vars are set.
- Real transactional email — falls back to server-side link logging until
  `RESEND_API_KEY` + `EMAIL_FROM_ADDRESS` are both set.
- `/api/auth/*` entirely, plus every DB-backed route (durable rate limiting, job
  durability, entitlements persistence) — inert until `DATABASE_URL` +
  `BETTER_AUTH_SECRET` are set.

### Pending (designed or proposed, not built)
- Object storage for uploads/outputs (deliberately deferred — see Known Issues).
- Worker/dispatch separation for horizontal scale (deliberately deferred).
- Admin panel (`/admin` — designed in `platform-architecture.md`, never built).
- A DB-driven `tools`/`entitlements`-as-rows model (the actual implementation uses a
  TypeScript constant table, `TOOL_POLICY`, instead — see Known Issues:
  "`platform-architecture.md` is historical").
- Analytics/events tracking table.
- Next tool(s): Video Trimmer, Audio Converter (both recommended next in
  `QAVELIX_CAPACITY_REPORT.md`); Video-to-GIF and generic image tools are explicitly
  deferred as higher-risk/lower-priority.
- Referral program, business/team accounts, API monetization, variable-cost credit
  system — all explicitly deferred in `docs/architecture/growth-strategy.md` pending an
  existing Pro subscriber base.
- Persistent job history as a named Pro benefit, and a live "X/Y used today" usage
  indicator on the tool pages themselves (see UX Improvements Backlog).

---

## Stripe Status

- **Live configuration**: gated on `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRO_MONTHLY_PRICE_ID` all being set (env-validated as all-or-nothing in
  `src/env/server.ts`). No code flag distinguishes test vs. live — it's purely which key
  prefix (`sk_test_...` vs `sk_live_...`) is configured. `src/env/server.ts` refuses to
  boot a genuine public production deployment with a `sk_test_...` key.
- **Product/Price**: one recurring plan, named `"pro"` internally
  (`env.STRIPE_PRO_MONTHLY_PRICE_ID`). Per `docs/DEPLOYMENT.md`'s live-launch checklist,
  the price to create in Stripe is **US$9.99/month**. The app never hardcodes this number
  — `getProMonthlyPriceDisplay()` reads it live from Stripe on every dashboard render, so
  it can never silently drift from what Stripe actually charges.
- **Webhook**: `/api/auth/stripe/webhook`, mounted automatically by the plugin. Must be
  subscribed to exactly `customer.subscription.created` / `updated` / `deleted` in
  production — **not** `checkout.session.completed` (would throw for the separate
  one-time support-checkout flow, which has no `subscription` field; see
  `docs/DEPLOYMENT.md` for the full explanation — this is a third-party plugin
  limitation, worked around via Dashboard configuration, not a code change).
- **Customer Portal**: Stripe-hosted, reachable via `/dashboard/billing` or the Plan
  page's "Manage subscription" button. Must have cancellation, payment-method update, and
  invoice history enabled in the Stripe Dashboard (Live mode) before go-live — not
  something this codebase configures.
- **Subscription lifecycle**: `onSubscriptionCreated`/`onSubscriptionUpdate` sync
  `user_entitlement.plan` from Stripe's status on every event (only `active`/`trialing`
  grant Pro — every other status, including `past_due`, reverts to Free immediately).
  `onSubscriptionDeleted` always reverts to Free. `onSubscriptionCancel` (pending-cancel)
  deliberately does **not** revoke access yet — the user already paid for the current
  period.
- **Self-healing plan read**: `getPlan()` checks Stripe's own `subscription` table
  directly whenever the stored plan is still `"free"`, closing the race where
  `@better-auth/stripe`'s own `/subscription/success` redirect has already verified an
  active subscription but the webhook hasn't arrived yet (or, in local dev without
  `stripe listen`, never arrives). This means every plan-reading caller (dashboard,
  compression route, extract-audio route) agrees immediately after checkout, without
  waiting on webhook delivery — but the webhook is still the *only* mechanism for changes
  that happen while nobody's looking at the app (a later renewal, cancellation, failed
  payment).
- **Email verification requirement**: checkout and the Billing Portal both require a
  verified email (`subscription.requireEmailVerification: true` for checkout, a custom
  `hooks.before` gate for the portal, since the plugin has no built-in equivalent for
  that endpoint). Sign-in and every other route stay ungated.
- **Current limitations**: no live-mode smoke test has been run from this environment
  (requires a real Stripe Dashboard, real domain, real card) — the full ordered checklist
  for that is in `docs/DEPLOYMENT.md`'s "Final launch checklist" section and has not yet
  been executed against production. Test-mode behavior has been verified locally via
  `stripe listen`.

---

## Authentication

- **Library**: Better Auth 1.6.25 (`betterAuth` from `better-auth/minimal`), Drizzle
  adapter pointed at the app's own Postgres schema. Email+password only — no OAuth
  provider is wired up (checked explicitly in `hasPasswordCredential()` so a future OAuth
  addition doesn't silently break the password-change UI's assumption).
- **Session flow**: `getOptionalSession()` (server-side, wraps
  `getAuth().api.getSession()`) is the single way any page/route reads session state.
  `requireSession(locale, callbackPath)` redirects to a locale-prefixed sign-in page with
  a sanitized callback when there's no session. `sanitizeCallbackPath()` is a strict
  allowlist regex (only the dashboard, the two tool pages, and `/verify-email`) — not a
  blocklist — specifically because the callback value can arrive from an
  attacker-controlled query string.
- **Verification flow**: sign-up sends a verification email automatically
  (`sendOnSignUp: true`). Email-verification tokens are stateless signed JWTs (not a DB
  row) in this Better Auth version; password-reset tokens do use the `verification`
  table, keyed `reset-password:{token}`.
- **Proxy verification route** (`/api/verify-email`): exists specifically to fix a
  session-mismatch bug in Better Auth's own default verification link, which redirects
  with no signal about *which* account was verified. This route performs the real
  signature/expiry check via `getAuth().api.verifyEmail()` (never reimplemented), then
  separately decodes (never re-verifies) the same token to compare its email against the
  current session, so the UI can show "verified" vs. "verified, but you're signed in as a
  different account" correctly. The comparison never gates anything security-sensitive —
  the DB write already happened via Better Auth's own check.
- **Security**: `proxy.ts` deliberately does **not** do cookie-presence-based
  guest-page gating (removed after it created an unrecoverable redirect loop for a
  visitor with a stale-but-present cookie) — `getOptionalSession()` on each of the three
  guest-only pages (sign-in/sign-up/forgot-password) is the only check, and it's already
  correct and server-side.
- **Current behavior**: sign-in and every tool/dashboard route (except checkout/billing
  portal) work for an unverified account. Only Stripe checkout and the Billing Portal
  require a verified email.

---

## Processing System

**Video Compressor** (queued)
- Upload → `POST /api/upload/analyze` (validate, FFprobe, issue reference) →
  `POST /api/compression/jobs` (consume reference, reserve entitlement, queue) → client
  polls `GET /api/compression/jobs/[id]` → `GET .../download` once terminal.
- Presets: **Smaller File** (CRF 31, 96kbps audio, `veryfast`), **Balanced** (CRF 26,
  160kbps, `veryfast`), **High Quality** (CRF 20, 256kbps, `fast`) — see
  `src/lib/compression-policy.ts` for exact bitrate-ratio/ceiling math.
- Output is always bounded to Full HD (1920×1080 landscape / 1080×1920 portrait) even
  for presets that claim to "preserve resolution" — a quality/capacity safety cap, not a
  bug.
- Single active FFmpeg job at a time (`activeJobId`), max 10 queued, max 50 retained
  terminal jobs in memory. 12-minute FFmpeg timeout.
- Entitlement reserved before the job is created (not after); confirmed on real success,
  released on every other terminal path (failure, timeout, cancellation, orphaned job
  detected after a restart).

**Extract Audio** (synchronous)
- One request, one streamed response — no job, no polling, no queue.
- Validates upload → FFprobe → rejects if no audio track → runs silence detection
  (rejects if effectively silent) → extracts MP3 (`libmp3lame`, 192kbps) → verifies output
  → streams back.
- Entitlement reserved before accepting the upload body, confirmed only after the MP3 is
  verified, released on every failure path.
- 8-minute FFmpeg timeout (shorter than compression's 12 minutes — lighter workload).

**Upload flow / validation**
- Client-side pre-checks (`compression-precheck.ts`, `upload-validator.tsx`) are UX-only.
- Server-side: extension check, MIME check, binary signature check, streamed-size
  verification against a declared size header, all before FFprobe runs. This is the real
  security boundary — never trust the client-side result.

**Limits** — see `TOOL_POLICY` in `src/lib/server/entitlements/policy.ts` (the single
source of truth, described fully in the "Entitlements" architecture section above and in
`CLAUDE.md`):

| Plan | Scope | Daily/lifetime limit | Upload ceiling |
|---|---|---|---|
| Anonymous | combined across both tools | 5 uses, lifetime | 250MB |
| Free | per tool | 10/day | 250MB |
| Pro | per tool | 100/day | 500MB |

**Processor** — `child_process.spawn("ffmpeg"/"ffprobe", args, { shell: false })` always
— argument arrays, never string concatenation, everywhere in the codebase.

**Entitlements integration** — both routes call `resolveActor()` →
`reserveUsage()` before any FFmpeg/FFprobe work starts, and resolve that reservation via
`confirmUsage()`/`releaseUsage()` on every terminal path. This is the one invariant most
worth protecting when touching either route (see "Rules That Must Never Be Broken").

---

## Environment Variables

All variables are optional at the code level, including in production — the app is
designed to boot and serve the anonymous-only core product with zero configuration
beyond `NEXT_PUBLIC_APP_URL`. No secret values are reproduced here — see `.env.example`
for the placeholder file, and never commit real values to any tracked file.

| Variable | Purpose | Required? | Production usage |
|---|---|---|---|
| `NODE_ENV` | Standard Node environment flag | Implicit (defaults to `development`) | Controls CSP strictness (`unsafe-eval` allowed only in dev) and several env-validation branches |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin — metadata, canonical links, language alternates, sitemap, Better Auth `baseURL`, verification link building | **Required** once `NODE_ENV=production` | Must be HTTPS (localhost allowed only for local production verification) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Public contact address shown on legal/contact pages, used as email reply-to | Required for public production deployments | Must currently be `qavelixhq@gmail.com` per project convention |
| `DATABASE_URL` | Neon Postgres connection string (Drizzle) | Optional; required once auth/billing/durable rate-limit/job-state are exposed | Never point CI's test value at production; app requires a real Neon endpoint, not a generic Postgres container |
| `BETTER_AUTH_SECRET` | Signs Better Auth sessions | Optional, same gating as `DATABASE_URL` | 32+ characters, generate once, never reuse a dev/test value in production |
| `RESEND_API_KEY` | Real transactional email delivery | Optional; both this and `EMAIL_FROM_ADDRESS` required together before exposing auth to real users | Domain must be DKIM/SPF verified in Resend first |
| `EMAIL_FROM_ADDRESS` | Verified sender address for auth emails | Optional, paired with `RESEND_API_KEY` | e.g. `"QAVELIX <noreply@qavelix.com>"` |
| `STRIPE_SECRET_KEY` | Stripe API secret key | Optional; all three `STRIPE_*` vars required together or none | `sk_test_...` in test mode, `sk_live_...` only once genuinely live |
| `STRIPE_WEBHOOK_SECRET` | Verifies webhook signatures at `/api/auth/stripe/webhook` | Optional, paired with the above | Different value for `stripe listen` (local) vs. the Dashboard-configured production endpoint |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | The recurring Pro price to sell | Optional, paired with the above | Test-mode and live-mode prices are separate objects — never reuse an ID across modes |

Validation rules enforced by `src/env/server.ts` (fails boot with a clear message, never
silently half-configures):
- `NEXT_PUBLIC_APP_URL` must be HTTPS in production unless targeting localhost.
- `NEXT_PUBLIC_SUPPORT_EMAIL` required for any real (non-localhost) production origin.
- All three `STRIPE_*` vars must be set together or all left unset — partial
  configuration fails boot.
- A real (non-localhost) production deployment must never use a `sk_test_...` key —
  fails boot if it does.

---

## Deployment Process

Full detail lives in `docs/DEPLOYMENT.md` — this is the summary to follow, not a
replacement for reading it before an actual deploy.

1. **Git**: work happens on feature branches, merged into `main` (see recent history:
   `qavelix-pro` was merged via a merge commit, not squashed or rebased). `main` is the
   branch Render should auto-deploy from, gated on CI passing.
2. **CI** (`.github/workflows/ci.yml`): on every PR and push to `main` — install → lint →
   typecheck → build → (`db:migrate` only if `DATABASE_URL` secret is set) → test. Uses
   Node 24. `entitlements-db.test.mjs` / `stripe-billing-db.test.mjs` skip gracefully
   (never fail) without DB/Stripe test-mode secrets configured — enabling them requires a
   dedicated CI/test Neon branch and Stripe test-mode keys as repo secrets, never
   production values.
3. **Render**: create the service from the repo using `Dockerfile`. Set every environment
   variable from the table above that this deployment needs (see "Environment
   Variables"). Connect the production domain, configure Cloudflare DNS to point at it.
4. **Verification** (after every deploy): security headers present
   (`curl -I https://qavelix.com/en`), `robots.txt`/`sitemap.xml` correct, cross-origin
   requests to state-changing routes rejected with 403, `/favicon.svg` and
   `/site.webmanifest` reachable.
5. **Stripe live-mode switch**: a fully separate, ordered checklist in
   `docs/DEPLOYMENT.md` under "Final launch checklist" — creating the live product/price,
   the live webhook endpoint (exact 3 events, never `checkout.session.completed`),
   Customer Portal configuration, entering live keys in Render, then a real small-charge
   smoke test immediately followed by refund/cancellation verification. Do not perform any
   step there until `npm run lint && npm run typecheck && npm run build && npm run test`
   all pass.
6. **Rollback**: reverting the three `STRIPE_*` variables to test-mode values (or unset)
   takes billing back to test-mode/disabled instantly, no redeploy needed — mode is
   controlled purely by env vars. Disable (don't delete) a misconfigured live webhook
   endpoint in the Stripe Dashboard to stop retry-backoff noise. Test-mode and live-mode
   Stripe objects are always separate; nothing needs migrating either direction.

---

## Rules That Must Never Be Broken

1. **Never break production.** Render serves real (eventually paying) users off `main` —
   treat every merge to `main` as a deploy candidate.
2. **Never bypass entitlements.** `reserveUsage()` must be called before any
   FFmpeg/FFprobe work starts, on every processing route, and every reservation must be
   resolved via `confirmUsage()` or `releaseUsage()` on every terminal path — an
   unresolved reservation permanently burns a quota slot.
3. **Never change upload limits or plan limits by editing anything other than
   `TOOL_POLICY` in `src/lib/server/entitlements/policy.ts`.** That table is the single
   source of truth by design — duplicating a number anywhere else reintroduces the exact
   problem this system was built to eliminate.
4. **Never remove security validation.** Same-origin/CSRF enforcement
   (`requireSameOrigin`), rate limiting, request-size preflight, UUID/token validation,
   and the CSP/security-header set in `next.config.ts` are all load-bearing, not
   incidental.
5. **Never change billing logic without verification.** Any change touching
   `auth.ts`'s Stripe plugin config, `entitlements/service.ts`'s `getPlan()`/
   `setUserPlan()`, or the webhook lifecycle hooks must be re-verified against real
   Stripe test-mode events (`stripe listen`) before merging — this logic silently
   determines who gets charged and who gets access.
6. **Never bypass or weaken the idempotency/atomicity guarantees** in
   `usageCounter`'s unique index or `usageEvent.idempotencyKey`'s uniqueness — these are
   what prevent a retried request from double-reserving or double-counting usage.
7. **Never remove existing translations**, and never ship copy in one locale without
   its `en`/`pt-BR`/`es` equivalents — the dictionary structure in
   `src/i18n/dictionaries.ts` assumes all three are always present.
8. **Never deploy without running `npm run lint && npm run typecheck && npm run build &&
   npm run test`** locally or in CI first.
9. **Never modify the authentication flow blindly.** `session.ts`'s
   `sanitizeCallbackPath()` allowlist, `proxy.ts`'s deliberate absence of cookie-presence
   gating, and `/api/verify-email`'s session-mismatch fix all encode a specific past bug
   or attack surface — read the comments in those files before changing them, not just
   the code.
10. **Never break the Stripe webhook.** In particular, never subscribe the production
    endpoint to `checkout.session.completed` — see the Stripe Status section above.
11. **Never remove existing tests** without understanding why they exist — several encode
    a specific historical bug (see `verify-email-session-mismatch.test.mjs`,
    `locale-switch-preservation-source.test.mjs`).
12. **Always preserve backward compatibility whenever possible** — this app has real
    anonymous users today with in-flight usage counters and, once billing is live, real
    paying subscribers; a breaking schema or API change needs a migration path, not just
    a rewrite.
13. **Never spawn FFmpeg/FFprobe via shell string concatenation.** Always argument
    arrays with `shell: false` — this is a deliberate command-injection defense already
    in place everywhere; don't reintroduce a shell.
14. **Never hardcode `PRO_MAX_UPLOAD_REQUEST_BYTES`-equivalent numbers in
    `next.config.ts`.** It must keep deriving from `entitlements/policy.ts` so a plan
    limit change can't silently desync from the infrastructure-level body-size cap.

---

## Development Workflow

For every future work session on this project:

1. Read `CLAUDE.md` (how the code is built).
2. Read this document, `QAVELIXPRO.md` (where the project currently stands).
3. Identify the current milestone/task from the roadmap below and recent git history
   (`git log --oneline -20`) — don't assume; confirm against actual commits.
4. Plan the change before touching code — for anything non-trivial, use a plan and get
   alignment before implementing (see the project's own `CLAUDE.md`-equivalent guidance
   for the assistant: plan mode for non-trivial implementation work).
5. Implement the change, following the existing patterns in the touched module (this
   codebase is unusually well-commented on *why* — read the surrounding comments before
   assuming a pattern is incidental).
6. Run validation: `npm run lint && npm run typecheck && npm run build`.
7. Run tests: `npm run test` (or the single relevant file/test-name-pattern during
   iteration — see `CLAUDE.md`'s Commands section for the exact invocation).
8. Review the diff for scope creep — this project's own convention (see `CLAUDE.md`) is
   no unrequested refactors, no speculative abstractions, no unused-var backward-compat
   shims.
9. Only then continue to the next task. Never jump randomly between features — finish or
   explicitly park one change before starting another, and update this document if the
   change affects anything documented above.

---

## Current Known Issues

**Documentation drift — planning docs vs. shipped numbers.** Several `docs/architecture/*`
files were written as *proposals* before implementation, and were not all revisited
afterward:
- `docs/architecture/growth-strategy.md` proposed Free-tier limits of 3 compressions/day
  and 5 extractions/day, a $39/year price, and a 500MB→1GB/20-per-day Pro tier. **What
  actually shipped** (`TOOL_POLICY` in `policy.ts`) is 10/day per tool for Free (both
  tools, not split), 100/day per tool for Pro, 500MB Pro ceiling, and a $9.99/**month**
  price (per `docs/DEPLOYMENT.md`'s launch checklist). The growth-strategy document
  itself flags this drift in its own "Note (current status)" — worth knowing so nobody
  treats that document as current pricing/limits truth.
- `docs/architecture/platform-architecture.md` describes a fully DB-driven
  `tools`/`entitlements`-as-rows model with an admin panel, analytics events table, and a
  Vercel/Render tier split. **None of that was implemented** — the actual implementation
  achieves the same "no redesign per tool" goal via a TypeScript constant table
  (`TOOL_POLICY`) instead of database rows, and the Vercel/Render split was explicitly
  superseded by `hosting-decision.md`. The file carries its own top-of-file pointer to
  this, but it's easy to open the wrong document first.

**Deployment verification gap.** Every Milestone 6 durability claim (crash-recovery,
rate-limit restart survival, email fallback correctness) was verified against a local
dev environment standing in for production, per `hosting-decision.md`'s execution log —
because no real Render staging instance was reachable at the time. The real drill
(genuine TLS, genuine DNS, a genuine process kill of a deployed instance) is still
outstanding.

**Two pre-existing content-copy issues**, per `hosting-decision.md`'s execution log
(documented there since "Phase 2" of that milestone, not independently re-verified while
writing this document): stale copy on `/en/about`, and a stale "back to compressor" link
somewhere in the Extract Audio flow. Re-check current state before assuming these are
still open — they may have been fixed in a commit after the log entry was written.

**One timing-marginal test**: `tests/integration/compression-download.test.mjs`
occasionally flakes because a very short synthetic test video can finish encoding faster
than the test's polling interval observes an intermediate status. Documented as
pre-existing and unrelated to the Milestone 6 persistence change (reproduced both before
and after). Not a production bug — a test-timing artifact.

**No audit log writer.** `auditLog` is fully migrated schema with zero writes — if a
future feature depends on querying historical security events, it isn't there yet; only
console/structured logs exist today.

**Single-instance ceiling, named and accepted, not accidental.** In-process job dispatch
queue and job lock do not survive/share across multiple instances; local temp disk is
the only storage for in-flight video files. Fine at current traffic per
`hosting-decision.md`'s explicit revisit trigger (see Roadmap); would need Phase 7/8 work
(object storage, worker split) before scaling beyond one instance.

**IP-fingerprint-based anonymous attribution is inherently imprecise** — shared
IPs/NAT/CGNAT/VPN exit nodes mean the anonymous pool isn't truly per-visitor, both
under- and over-counting individual users. Named explicitly in
`docs/architecture/business-review.md`; no different mechanism has been proposed to
replace it (anonymous usage tracking without an account has no better honest option).

**Repository hygiene**: the repo root has several artifacts that aren't part of the
running app — `PROMPTS/*.docx` (phase prompt history), `QAVELIX_*.md` research/capacity
reports, two UTF-16 `.patch` files (`QAVELIX_EMERGENCY_PRE_FIX_DIFF.patch`,
`QAVELIX_FULL_STABILITY_PRE_FIX.patch` — historical pre-fix diffs), a `.tmp/` directory
of dev-server log/pid files, loose test videos (`corrupted-video.mp4`, `test-small.mp4`)
outside `test-media/`, and a near-empty stray file named `tatus` (likely a truncated
`git status` redirect). None of these affect the running app, but they're worth a
deliberate cleanup pass rather than accumulating further.

---

## Current Roadmap

**Immediate**
1. Run the real Render production deployment/verification drill from
   `docs/DEPLOYMENT.md` (genuine TLS, DNS, `RESEND_API_KEY`, and an actual process kill
   of the deployed instance) — the one verification step every other Milestone 6 claim is
   still waiting on.
2. Execute the Stripe test→live switch checklist in `docs/DEPLOYMENT.md`, in order,
   including the real-payment smoke test and immediate refund/cancellation verification.
3. Re-verify (or fix) the two documented content-copy issues and the timing-marginal
   test under "Current Known Issues" above.

**Short-term**
4. Decide whether to wire a writer for `auditLog` (schema already exists) before it's
   needed for a support/compliance investigation, rather than after.
5. Add basic operational telemetry (job count, queue depth, average duration, failure
   rate, disk usage) — `QAVELIX_CAPACITY_REPORT.md`'s own recommended first step before
   building anything else, not yet done.
6. Reconcile `growth-strategy.md`'s stated numbers with the shipped `TOOL_POLICY` values
   (or explicitly mark the whole document historical) to stop the drift from confusing a
   future reader.

**Medium-term**
7. Video Trimmer (highest-ranked next tool per both `QAVELIX_CAPACITY_REPORT.md` and
   `QAVELIX_NEXT_TOOL_RESEARCH.md` — reuses the existing upload/FFmpeg/download
   pipeline almost entirely).
8. Audio Converter (low infra cost, high pipeline reuse).
9. Persistent job history + live "X/Y used today" usage indicator, per
   `growth-strategy.md`'s Usage Indicators section — the most-cited missing UX piece.

**Long-term (revisit only when the named trigger is hit)**
10. Object storage + worker/dispatch separation — **explicitly deferred**, not forgotten.
    Revisit trigger (`hosting-decision.md`): compression-job volume or concurrent load
    approaching the ceilings in `QAVELIX_CAPACITY_REPORT.md` (temp-disk exhaustion around
    5-10 concurrent max-size uploads; FFmpeg worker becoming the bottleneck before a third
    processing-heavy tool exists).
11. Admin panel, analytics events table — build only once real product questions exist
    that the current tables can't answer, per `platform-architecture.md`'s own
    reasoning.
12. Referral program, business/team accounts, API monetization, variable-cost credit
    system — all explicitly deferred pending an existing Pro subscriber base
    (`growth-strategy.md`).
13. Video-to-GIF, generic image tools — deferred as higher infra risk / lower
    differentiation per `QAVELIX_CAPACITY_REPORT.md`'s tool evaluation; revisit once
    telemetry from #5 proves headroom.

---

## Technical Debt

- In-memory compression dispatch queue and job lock: single-instance only, by design —
  documented, not accidental, but still debt against any future horizontal-scale need.
- Local temp disk as the only storage for in-flight video/audio files — same trade-off.
- No audit log writer despite a fully migrated `auditLog` table.
- `growth-strategy.md` and `platform-architecture.md` describing a different system than
  what shipped (see Known Issues) — will keep confusing readers until explicitly marked
  historical or reconciled.
- IP-fingerprint anonymous attribution — a known-imperfect mechanism with no better
  alternative currently designed.
- Repository root clutter (see Known Issues) — not harmful, but worth a deliberate
  cleanup rather than continued accumulation.
- `vercel.json` remains in the repo despite Vercel not being the deployment target —
  harmless per `hosting-decision.md`, but a source of confusion for anyone who reads it
  before `docs/DEPLOYMENT.md`.
- One timing-marginal integration test (`compression-download.test.mjs`) — not a
  correctness bug, but a source of CI flakiness worth tightening eventually.

---

## UX Improvements Backlog

From `docs/architecture/growth-strategy.md` (product-level, not yet built):

- **Live "X/Y used today" usage indicator** on the tool page itself, updated after each
  job, visible to both Free and Pro — cited as the most legible "why upgrade" signal and
  the easiest of the proposed benefits to build (only needs today's `usage_counter` row,
  not persistent history).
- **Persistent job history** as an explicit, named Pro-only benefit (not something Free
  quietly gains as a side effect of building the counter above).
- **Upgrade prompt at the moment of a real limit hit**, inline in the existing
  error-display pattern (`compression-panel.tsx`'s `copy.errors.*`) rather than a
  separate pricing-page visit — partially realized today via `useEntitlementGate()`'s
  automatic `UpgradeModal` on `usage_limit_reached`/`account_required`, worth confirming
  this still matches the specific messaging growth-strategy.md envisioned.
- **PWA/installable shortcut** — named as the most realistic near-term retention lever
  for anonymous, no-login users (bookmarkable tool URLs already work; no install
  manifest/service-worker flow exists yet beyond the basic `site.webmanifest`).

---

## Testing Checklist

Use `npm run test` (unit → integration → e2e) as the baseline gate before any merge.
This checklist is what to verify *manually* beyond automated coverage, especially after
touching auth/billing/entitlements:

**Authentication**
- [ ] Sign up, sign in, sign out all work in each locale.
- [ ] Forgot password → reset password completes end-to-end.
- [ ] Guest-only pages (sign-in/sign-up/forgot-password) redirect a signed-in visitor;
      a visitor with a stale/revoked cookie is not stuck in a redirect loop.
- [ ] `callbackURL` round-trips correctly through sign-in back to the originating page.

**Verification**
- [ ] Verification email link correctly verifies the account it was sent to.
- [ ] Clicking a verification link while signed in as a *different* account shows the
      "different account" message, not a false "verified" for the wrong session.
- [ ] Re-clicking an already-used verification link is a harmless no-op.

**Stripe / Billing**
- [ ] Checkout with a test card completes and `/dashboard/plan` shows Pro immediately
      after redirect (self-heal path), even before the webhook arrives.
- [ ] Plan survives a full sign-out/sign-in cycle.
- [ ] Billing Portal cancellation reverts to Free once the period actually ends (not
      immediately at cancel-request time).
- [ ] A simulated failed renewal (`past_due`) reverts to Free.
- [ ] Billing address read/write round-trips through Stripe's Customer object correctly.
- [ ] Checkout/Billing Portal both refuse an unverified email with a clear message.

**Dashboard**
- [ ] Plan, Usage, Billing, Settings pages all load for both Free and Pro accounts.
- [ ] Numbers shown (limits, price) always match `TOOL_POLICY`/live Stripe price — never
      a stale hardcoded value.

**Compression**
- [ ] All three presets produce valid, playable output.
- [ ] Cancel works at each stage (queued, running).
- [ ] Download works, respects the 30-minute TTL, and rejects a tampered token/signature.
- [ ] A killed/restarted server correctly fails an in-flight job rather than losing it
      silently, and releases its entitlement reservation.

**Extract Audio**
- [ ] Silent video is rejected with the correct error, not a false-positive success.
- [ ] Video with no audio track is rejected clearly.
- [ ] Output MP3 is verified (non-empty, has a decodable audio codec) before being
      returned.

**Translations**
- [ ] Every user-facing string exists in all three locales — no fallback-to-English gaps.
- [ ] Locale switch preserves the current path, including on dashboard/tool pages.

**Responsive**
- [ ] Header/footer, tool panels, and dashboard all usable at mobile width.

**Accessibility**
- [ ] Skip link, semantic landmarks, keyboard focus states, and reduced-motion handling
      still work after any layout change.

**Security**
- [ ] Cross-origin POST to any state-changing route (`compression/jobs`,
      `extract-audio`, billing address) is rejected with 403.
- [ ] Rate limits trigger correctly and recover after the window resets.
- [ ] Security headers (CSP, HSTS, X-Frame-Options, COOP/CORP, Permissions-Policy) are
      present on every route, including API routes.
- [ ] Invalid job IDs/download tokens are rejected before any filesystem/DB lookup.

---

## Launch Checklist

Before considering production genuinely stable (condensing `docs/DEPLOYMENT.md`'s
several checklists into one pass):

- [ ] `npm run lint && npm run typecheck && npm run build && npm run test` all pass.
- [ ] Render service deployed from `Dockerfile`, correct domain connected, Cloudflare DNS
      pointed at it, valid TLS certificate confirmed.
- [ ] All required env vars set for this deployment's feature set (see Environment
      Variables table) — confirm the app actually boots without an env-validation error.
- [ ] Security headers verified live (`curl -I https://qavelix.com/en`).
- [ ] `robots.txt`, `sitemap.xml`, favicon, web manifest all reachable and correct.
- [ ] Cross-origin requests to state-changing API routes verified rejected in production,
      not just in tests.
- [ ] Resend domain (DKIM/SPF, DMARC) verified; a real password-reset/verification email
      confirmed to land in an inbox, not just return a successful API call.
- [ ] Stripe live-mode product/price/webhook/Customer Portal all configured per the
      ordered checklist in `docs/DEPLOYMENT.md`, including the real-payment smoke test
      immediately followed by refund/cancellation verification.
- [ ] A genuine process restart of the deployed instance confirmed to correctly fail (not
      silently lose) an in-flight compression job.
- [ ] The two documented content-copy issues (Known Issues) re-checked and either fixed
      or confirmed still acceptable to ship with.

---

## Session Continuation Instructions

Every future Claude Code session on this project should begin:

1. **Read `CLAUDE.md`** — how the code is built, module responsibilities, and the "why"
   behind non-obvious patterns.
2. **Read `QAVELIXPRO.md`** (this document) — where the project currently stands: what's
   live, what's decided, what's deferred, what's broken, what's next.
3. **Understand the current state** by cross-checking this document's claims against
   recent `git log` output and the actual source — this document is refreshed at the end
   of sessions, not continuously, so a few commits' worth of drift is possible and should
   be reconciled before relying on it for anything high-stakes.
4. **Continue exactly where previous work stopped** — use the Roadmap's "Immediate" and
   "Short-term" sections as the default next steps unless the user directs otherwise.
5. **Never restart already-completed work.** Milestones 1–6 are done; don't re-propose
   the entitlements model, the Vercel/Render split (already resolved — see
   `hosting-decision.md`), or the auth/billing layer as if they don't exist.
6. **Never remove working functionality** without understanding why it exists first —
   this codebase's comments consistently explain a specific past bug or deliberate
   trade-off; read them before assuming something is dead code or an oversight.
7. **Never refactor without a concrete reason tied to the current task.** No speculative
   abstractions, no unrequested cleanups riding along with a bug fix.
8. **Protect production stability above everything else** — this is a real, soon-to-be
   (or already) billing product with real anonymous and authenticated users; treat every
   change to entitlements, billing, or security code with the caution that implies.
9. **Update this document** at the end of the session if anything above has changed:
   a new milestone shipped, a limit/price changed, a known issue was fixed, or the
   roadmap moved. Keep it reading as current truth, not a running diary.
