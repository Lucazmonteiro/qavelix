# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Status: shut down (2026-09-20).** The app runs in default-on maintenance mode
> (`src/lib/maintenance.ts`, gate in `src/proxy.ts`): every request returns 503, both FFmpeg
> queues reject/drop jobs, `getStripeClient()` returns null (so no Stripe plugin, checkout, or
> webhook) and `sendAuthEmail()` never calls Resend. Set `QAVELIX_MAINTENANCE=off` to run the app
> (the test helper does this automatically; pass `{ maintenance: true }` to `withNextServer` to
> test the shutdown itself). Sections below describe the app as built, not as currently served.

## What this is

QAVELIX is a Next.js (App Router, TypeScript) media-tools SaaS — currently a video compressor and an "Extract Audio" tool — being built in numbered phases/milestones (see `README.md` for Phases 1-9 and recent commits for Milestones 1-5). Milestones 4-5 added a full accounts/billing layer (Better Auth + Drizzle + Neon Postgres + Stripe) on top of the original anonymous-only tool. `docs/architecture/*.md` are point-in-time design docs — `platform-architecture.md` in particular reads as "nothing in this document has been implemented" but was written 2026-07-24, before Milestones 4-5 landed; treat it as historical rationale, not current status. Check `src/lib/server/entitlements/`, `src/lib/server/db/schema.ts`, and `src/lib/server/auth/auth.ts` for what's actually live.

## Commands

```bash
npm run dev              # start dev server (http://localhost:3000, redirects to /en)
npm run build             # production build
npm run start             # run a production build

npm run lint               # eslint .
npm run typecheck          # tsc --noEmit
npm run format              # prettier --write .
npm run format:check        # prettier --check .

npm run test                # unit + integration + e2e, in that order
npm run test:unit            # tests/unit/*.test.mjs — no server needed
npm run test:integration      # tests/integration/*.test.mjs — spins up a real Next server
npm run test:e2e               # tests/e2e/*.test.mjs — spins up a real Next server

node --test tests/unit/compression-policy.test.mjs   # run a single test file
node --test --test-name-pattern="<name>" tests/unit/compression-policy.test.mjs  # single test case

npm run db:generate         # drizzle-kit generate (new migration from schema.ts)
npm run db:migrate           # drizzle-kit migrate
npm run db:studio             # drizzle-kit studio
```

Tests use Node's built-in test runner (`node --test`), not Jest/Vitest — no test config file, assertions are `node:assert/strict`. Integration and e2e tests boot a real Next server via `tests/helpers/next-server.mjs` (`withNextServer()`): it uses `next start` if a production build (`.next/BUILD_ID`) exists, otherwise falls back to `next dev`, on a random free port. Run `npm run build` first if you want integration/e2e tests to exercise the production build rather than dev mode.

Some unit tests (suffixed `-source.test.mjs`, e.g. `entitlements-source.test.mjs`, `dashboard-source.test.mjs`, `auth-session-guard-source.test.mjs`) read committed source files as text and assert on patterns in them, rather than importing and executing the module. This exists because those modules import `next/headers` or other server-only APIs that Node's native TS loader can't resolve outside a Next.js build — assert against the real file, not a hand-duplicated copy that could drift.

CI (`.github/workflows/ci.yml`) runs lint → typecheck → build → test on every PR and push to `main`, Node 24.

## Architecture

### Locale routing

Everything user-facing lives under `src/app/[locale]/...` for `en` (default), `pt-BR`, `es` (`src/i18n/locales.ts`). `src/proxy.ts` (Next's middleware, exported as `proxy` per current Next convention rather than the older `middleware.ts`/`middleware` export) does two unrelated things: redirects the legacy Render host to the production host, and redirects any locale-less path to `/${defaultLocale}${path}`. It deliberately does **not** do auth-gating for guest-only pages (sign-in/sign-up/forgot-password) — that's handled per-page by `getOptionalSession()` (see comment in `proxy.ts` explaining why a cookie-presence fast path was removed: presence isn't validity, and getting it wrong created an unrecoverable redirect loop). Translated copy lives in `src/i18n/dictionaries.ts`; locale switches must preserve the current path (see `locale-switch-preservation-source.test.mjs`).

### Entitlements: the "no redesign per tool" system

This is the core abstraction to understand before touching any upload or processing route:

- **`src/lib/server/entitlements/policy.ts`** — pure data: `TOOL_POLICY` maps `(plan, toolId) -> { maxUsesPerPeriod, period, maxUploadBytes }` for `anonymous | free | pro` × `video-compressor | extract-audio`. Anonymous actors share one combined pool (`ANONYMOUS_POOL_TOOL_ID = "any"`, 5 lifetime uses total, not per tool) before an account becomes required. Changing a limit means editing this table, not any route.
- **`src/lib/server/entitlements/service.ts`** — the only code that reads/writes usage state. `resolveActor(request)` returns either an authenticated `{ type: "user", plan }` (session via `getOptionalSession()`) or `{ type: "anonymous", id: fingerprint }` (same SHA-256 IP fingerprint `security.ts` uses for rate limiting — no separate anonymous-identity mechanism). `checkEntitlement()` is a read-only preview; `reserveUsage(actor, toolId, idempotencyKey)` is the one function that mutates state and **must be called before any FFmpeg/processing work starts**. It's atomic (`INSERT ... ON CONFLICT ... WHERE count < limit`, not read-then-write) and idempotent (`usage_event.idempotency_key` is UNIQUE — pass the compression job id, or a per-request id for the synchronous Extract Audio flow, so retries replay the original outcome instead of double-reserving). Every reservation must eventually be resolved with `confirmUsage()` (work succeeded) or `releaseUsage()` (work failed/cancelled) — an unresolved reservation permanently burns a quota slot.
- `user_entitlement.plan` (`free | pro`) is the single source of truth every route reads. It is **not** the Stripe `subscription` table — that table is Better Auth's Stripe plugin's own view of billing state, kept in sync by the lifecycle hooks in `src/lib/server/auth/auth.ts` (`onSubscriptionCreated/Update/Deleted`), which call `setUserPlan()`. Only `active`/`trialing` Stripe statuses grant Pro; every other status reverts to Free immediately.
- `getPlan()` self-heals from that same Stripe `subscription` table when the stored plan is still "free": `@better-auth/stripe`'s own `/subscription/success` redirect endpoint (which every Checkout `success_url` passes through, before the visitor ever lands on `/dashboard/plan?checkout=success`) verifies the checkout session and writes that table directly — **without** calling `onSubscriptionCreated`/`onSubscriptionUpdate`. Relying on the webhook alone left a real gap: Stripe (and that table) already show an active subscription while `user_entitlement.plan` silently stayed "free" until the webhook was delivered, which can be delayed or (in local dev without `stripe listen --forward-to`) never happen at all. `getPlan()` checks for an active/trialing row itself and, when found, writes the correction through the same `setUserPlan()` the webhook hooks use — so every caller (dashboard, plan/usage pages, both processing routes) agrees without waiting on webhook timing. The webhook remains the only mechanism for changes that happen while nobody is on the page (a later renewal, cancellation, or failed payment) — see `docs/DEPLOYMENT.md`'s "Manual Stripe test-mode subscription testing" section for the local `stripe listen` setup needed to exercise those.
- The Plan page (`src/app/[locale]/dashboard/plan/page.tsx`) never shows a Pro success message from the `?checkout=success` query parameter alone — it always re-derives `isPro` from `getPlan()` and shows an "activating" state (`SubscriptionActivationStatus`, polling via `router.refresh()`) until that resolves to `"pro"`. The one-time celebratory welcome (`ProWelcomeModal`) is likewise gated on `isPro && checkout === "success"`, never on the query parameter by itself.
- `GET /api/entitlements/status?tool=<id>` (`src/app/api/entitlements/status/route.ts`) is a read-only wrapper around `resolveActor()`/`checkEntitlement()`, plus the Free/Pro comparison numbers for that tool — used by `useEntitlementGate()` (`src/lib/use-entitlement-gate.ts`) so `CompressionPanel`/`ExtractAudioTool` can show a locked, upgrade-prompted state once the backend confirms a daily limit is reached, reusing the shared `UpgradeModal` component. Purely informational: `reserveUsage()` at the actual job-creation/processing route is still the only thing that can grant or deny a request.
- Adding tool #3 means adding one `ToolId` and one entry per plan in `TOOL_POLICY` — no route or component changes.

### Auth & billing — fully optional, additive

`getDb()` (`src/lib/server/db/client.ts`) and `getAuth()` (`src/lib/server/auth/auth.ts`) are lazy singletons anchored on `globalThis` (survives `next dev` hot-reload, avoids reconnecting on every file save) that only construct on first real use — so the app builds and runs with zero DB/auth env vars configured; only `/api/auth/*` and DB-backed routes become unreachable. `src/env/server.ts` (Zod) enforces this: `DATABASE_URL`, `BETTER_AUTH_SECRET`, and all three `STRIPE_*` vars are optional at every stage, including production. The Stripe plugin itself is only added to Better Auth (`createStripePlugin()`) if `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRO_MONTHLY_PRICE_ID` are all set — otherwise `getAuth()` runs without it and there's no Upgrade/Billing Portal UI.

`src/lib/server/db/schema.ts` has two families of tables with different ownership rules:
- Better Auth's own tables (`user`, `session`, `account`, `verification`) and the Stripe plugin's `subscription` table — column shapes are dictated by those libraries' Drizzle adapter expectations exactly (see comments in schema.ts); don't change their shape without checking the corresponding library's schema.
- App-owned tables (`userEntitlement`, `usageCounter`, `usageEvent`, `auditLog`, `rateLimitBucket`, `compressionJob`) — free to evolve, but `usageCounter`'s unique index and `usageEvent.idempotencyKey`'s uniqueness are load-bearing for the atomicity/idempotency guarantees above; don't drop them.

Email delivery (`src/lib/server/email.ts`, wired into `auth.ts` via `deliverAuthEmail()`) sends real password-reset/verification email through Resend when `RESEND_API_KEY` and `EMAIL_FROM_ADDRESS` are both configured, and falls back to the original dev-only behavior (logging the link via `logSecurityEvent()`) otherwise or if the provider call fails — never a dead end. Same "both configured or fully absent" convention as billing.

### Media processing

- `src/lib/server/compression-queue.ts` — in-process single-worker FIFO queue (`queue: string[]`, `jobs: Map` for live process handles) for FFmpeg compression jobs. Job *state* is durable — `persistCompressionJob()`/`readPersistedCompressionJob()`/`loadPendingCompressionJobs()` read/write a Postgres `compression_job` table (one row per job, `data` holding the same shape the old local-JSON snapshot did) instead of local disk, so a job survives a process restart: a fresh process correctly detects and fails a job orphaned mid-run (see `findCompressionJob()`'s `isInterruptedProcessingStatus` check) rather than losing it silently. The job *lock* (`acquireJobLock`/`jobLockDirectory`) and the actual input/output *video files* are still local disk under `os.tmpdir()/qavelix-compression` — deliberately unchanged (see `docs/architecture/hosting-decision.md`: under the single-Render-instance decision, a lock directory wiped by a restart is a correct reset, not a durability gap, and object storage for the video files themselves was evaluated and deferred as unnecessary at single-instance scale). Executes FFmpeg via argument arrays with `shell: false` (never string concatenation — see `buildFfmpegCompressionArguments` in `src/lib/compression-policy.ts`), and issues HMAC-signed, TTL-limited download tokens. Job status transitions live in `compression-policy.ts` (`CompressionJobStatus`) and are tool-agnostic by design. Every job resolves its entitlement reservation exactly once via `confirmUsage()`/`releaseUsage()` on every terminal path (success, failure, timeout, cancellation, orphaned-on-restart) — when adding a new terminal state, make sure it releases or confirms, or quota silently leaks.
- `src/lib/server/extract-audio.ts` is synchronous (one request, one response, no queue/polling) — a different `processing_kind` than compression, both documented in `docs/architecture/platform-architecture.md`'s tool-registry concept.
- `src/lib/server/ffprobe.ts` extracts metadata (duration, codecs, resolution, etc.) pre-processing; client-side pre-checks (`compression-precheck.ts`, `upload-validator.tsx`) are UX-only — the server-side check in the route handler is the actual security/size boundary, never trust the client one.

### Security layer (`src/lib/server/security.ts`, `origin.ts`)

Every state-changing API route should `await enforceApiSecurity(request, { route, limit, windowMs, requireSameOrigin })` (async — it may hit the database), which does IP-fingerprint-keyed rate limiting and, when `requireSameOrigin` is set, same-origin validation (`validateSameOriginRequest` in `origin.ts` — checks `Origin`/`Referer` against the request's own host plus `X-Forwarded-Host`/`-Proto`, i.e. a from-scratch CSRF check, not a library). `checkRateLimit()` is durable (Postgres `rate_limit_bucket`, a single atomic fixed-window upsert — survives a process restart) when `DATABASE_URL` is configured, and falls back to the original in-memory `Map` otherwise, so a deployment with no database configured at all keeps working exactly as before. `logSecurityEvent()` emits structured JSON to console with a level and request ID — there is no external log sink yet; `auditLog` in the DB schema exists but has no writer wired up. `assertValidJobId`/`assertValidSignedValue` validate UUIDs/tokens before any DB or filesystem lookup.

### Security headers & CSP

`next.config.ts` sets a strict CSP and full security header set (HSTS, X-Frame-Options DENY, COOP/CORP same-origin, Permissions-Policy denying camera/mic/geo/payment) on every route via `headers()`, plus `output: "standalone"` and `proxyClientMaxBodySize` sized to `PRO_MAX_UPLOAD_REQUEST_BYTES` — the *largest* plan's upload ceiling, not the default/anonymous one, because Next's proxy body-size limit is infrastructure-level and would otherwise reject Pro-tier uploads between the Free and Pro caps before they ever reach a route handler. If you raise `PRO_MAX_UPLOAD_BYTES` in `entitlements/policy.ts`, this limit moves with it automatically — don't hardcode a separate number in `next.config.ts`.

### Path aliases

`@/*` maps to `src/*` (tsconfig.json) and is used everywhere **except** `entitlements/policy.ts`'s own import of `upload-policy.ts`, which uses a relative import specifically because `next.config.ts` imports `policy.ts` directly and Next's config transpiler doesn't apply path-alias resolution — an aliased import there breaks `next build` while still working everywhere else that file is imported.

### Deployment

**Resolved decision** (`docs/architecture/hosting-decision.md`, 2026-07-26): production is a single persistent Render container running `Dockerfile`'s standalone build — web pages, API routes, and FFmpeg/FFprobe execution all in one process. Vercel is **not** used for production; `vercel.json` stays in the repo but is inert. `src/proxy.ts`'s redirect from `qavelix.onrender.com` to `qavelix.com` is correct as-is under this decision (Render *is* production, not a legacy artifact). `platform-architecture.md`/`infrastructure-compatibility.md`'s original Vercel-web/Render-worker split design was evaluated and **not adopted** — both files carry a top-of-file pointer to the decision doc; their per-component technical verdicts (e.g. "Vercel serverless is incompatible with the in-memory job queue") remain accurate and are exactly why Render was chosen instead, they just no longer describe a split that's being built. Revisit trigger (traffic/scale threshold where this should be reconsidered) is documented in the decision doc, not repeated here.
