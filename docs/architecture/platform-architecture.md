# QAVELIX Platform Architecture

Date: 2026-07-24

Scope: the target architecture for subscriptions, authentication, usage limits, processing queues, payments, accounts, analytics, admin tooling, and — critically — a design that lets every future tool inherit Free/Pro limits without touching the subscription system. This is a design document only. **Nothing in this document has been implemented.** No database, auth library, or payment SDK has been added to the codebase. See [business-review.md](./business-review.md) for why this is needed and [infrastructure-compatibility.md](./infrastructure-compatibility.md) for what in the current stack does or doesn't survive the transition.

---

## Design constraints

Two hard constraints shape every decision below:

1. **Dozens of future tools must inherit Free/Pro limits, upload limits, usage counters, queue behavior, and subscription status without any code change to the subscription system itself.** Today, adding a tool means writing new limit constants into new files (`upload-policy.ts`-style, `compression-queue.ts`-style) by hand. That pattern does not scale past a handful of tools and must not be repeated.
2. **The deployment model is currently self-contradictory** — `docs/DEPLOYMENT.md` names Vercel as production while `Dockerfile` builds a persistent container server and `QAVELIX_CAPACITY_REPORT.md` prices everything against Render. This architecture cannot be built on top of an unresolved fork, so the next section resolves it.

---

## Deployment model decision

**Recommendation: split the application in two, along the line that already exists implicitly in the codebase.**

- **Web/API tier → Vercel**, as `docs/DEPLOYMENT.md` already states. Routing, page rendering, request validation, auth, and any endpoint that doesn't itself run FFmpeg or hold long-lived in-process state is a good fit for stateless serverless functions.
- **Media processing tier → a persistent container worker** (Render, Fly.io, or equivalent — Render is the pre-existing choice, so it's the path of least migration effort). FFmpeg/FFprobe execution, the job queue, and temp-file handling move here.

This is not a new idea introduced by this document — it's the literal recommendation already sitting, unactioned, in `docs/DEPLOYMENT.md`'s own "Worker deployment guide" section: *"Move job state from process memory to durable storage... Run FFmpeg and FFprobe in a worker runtime that explicitly supports those binaries... Have the web app enqueue jobs and poll durable job state instead of owning the compression process."* This document formalizes that plan and makes it the one deployment story, replacing the Render-cost-modeled-but-Vercel-documented ambiguity described in the business review.

The two tiers communicate through the durable queue and database described below — the web tier never spawns FFmpeg directly again.

---

## Tool registry

A `tools` table (or equivalent config, see [Database](#database)) is the single source of truth for what tools exist:

```
tools
  id              text primary key   -- "video-compress", "extract-audio", "image-resize", ...
  category        text               -- "video" | "audio" | "image" | "pdf" | "text"
  processing_kind text               -- "queued-ffmpeg" | "sync-lightweight" | "browser-only"
  enabled         boolean
```

`processing_kind` matters because it determines whether a tool needs the durable queue at all — Extract Audio today is already synchronous (one request, one response, no polling), while Video Compressor is queued. A future browser-only tool (e.g., an image resizer that never touches the server) may need `tools` registry rows purely for entitlement/analytics purposes, with no processing-tier involvement at all. The registry doesn't force every tool into the same execution shape — it just gives every tool a stable identity that the entitlements, usage-counter, and analytics layers below can all key off of.

---

## Entitlements model

This is the mechanism that satisfies the "no redesign per tool" constraint. Limits become data rows, not code:

```
entitlements
  tool_id           text references tools(id)
  plan_tier         text                -- "free" | "pro" | "business"
  max_upload_bytes  bigint
  max_jobs_per_day  int
  max_concurrent    int
  queue_priority    int                 -- higher = served first
  primary key (tool_id, plan_tier)
```

**Concrete before/after, using code that exists today:**

- *Before:* `MAX_UPLOAD_BYTES = 250 * 1024 * 1024` is a single constant in `src/lib/upload-policy.ts`, shared by every tool and every user, with no way to differentiate Free from Pro without an `if` branch per call site.
- *After:* every upload-accepting route looks up `entitlements` by `(tool_id, plan_tier)` at request time. Adding tool #6 means inserting rows into `entitlements`, not editing `upload-policy.ts`. Changing Pro's file-size cap from 500MB to 1GB is a data update, not a deploy.

The lookup is cheap and cacheable (entitlements change rarely — cache with a short TTL or invalidate on admin write) so it doesn't become a latency problem on every request.

---

## Auth & accounts

There is no auth today, so this is greenfield, not a migration. Recommendation: **email + magic link, no passwords**, using a library that supports serverless deployment cleanly (Auth.js/NextAuth or a comparably lightweight provider) — not because OAuth or passwords are wrong, but because magic-link is the lowest-friction option that doesn't force a password-reset support burden onto a one-person team, and it matches the "no account for basic tasks" positioning: an account is only ever required to unlock Pro, never to use a free tool once.

```
users
  id            uuid primary key
  email         text unique
  plan_tier     text default 'free'
  created_at    timestamptz
```

Anonymous usage (today's entire user base) continues to work exactly as it does now — the fingerprint-based counter below applies to anyone without a session, account or not.

---

## Subscriptions & payments

**Recommendation: Stripe**, for the reasons that matter for a solo-maintained SaaS — it owns tax/VAT compliance, dunning, and webhook-driven subscription lifecycle handling, all of which are expensive to build correctly in-house and cheap to get from a payment provider.

```
subscriptions
  id                 uuid primary key
  user_id            uuid references users(id)
  stripe_customer_id text
  plan_tier          text
  status             text        -- "active" | "past_due" | "canceled"
  current_period_end timestamptz
```

A single webhook endpoint (`/api/webhooks/stripe`) updates `subscriptions.status` and `users.plan_tier` on Stripe events. `plan_tier` on `users` is the value every entitlements lookup reads — subscription state and the "what can this user do right now" state are deliberately kept as two tables so a lapsed/past-due subscription can downgrade `plan_tier` without deleting billing history.

---

## Usage limits & daily counters

Two counters exist side by side, resolved through account linking:

```
usage_counters
  key        text    -- fingerprint hash (anonymous) or user_id (authenticated)
  tool_id    text references tools(id)
  day        date
  job_count  int
  primary key (key, tool_id, day)
```

**Anonymous:** the `key` is `getClientFingerprint()`'s existing hash from `src/lib/server/security.ts` — the exact same hash already computed for rate limiting, just persisted per-day instead of held in an in-memory sliding-window `Map`. No new fingerprinting mechanism is introduced; the existing one is extended with durable storage.

**Authenticated:** the `key` becomes the account's `user_id` the moment a session exists, and — this is the detail that matters — **the fingerprint-keyed row for that session is not simply discarded**. On signup/login, the current day's fingerprint-keyed count for that tool is folded into the new user-keyed count (a one-time reconciliation, not an ongoing dual-count), so a user can't reset their daily counter by creating an account mid-session. Without this step, account creation becomes a quota-bypass technique.

Every processing route checks `usage_counters` against `entitlements.max_jobs_per_day` before creating a job — this is a **server-side** check, unlike the compressor's new UX-only size-prediction pre-check, because a usage limit is a real security/billing boundary, not a friendly suggestion.

---

## Processing queues

The in-memory `Map` + local-JSON-snapshot design in `compression-queue.ts` is replaced by a durable queue on the worker tier:

```
jobs
  id            uuid primary key
  tool_id       text references tools(id)
  user_key      text              -- fingerprint or user_id, same resolution as usage_counters
  status        text              -- queued | starting | running | completed | failed | ...
  priority      int               -- from entitlements.queue_priority at creation time
  input_ref     text              -- object storage key, not a local path
  output_ref    text
  created_at    timestamptz
  ...
```

A managed queue (Redis-backed BullMQ, or a cloud provider's managed queue) replaces the in-process `queue: string[]` array. The worker tier's dispatcher pulls the highest-priority ready job — this is the mechanism that actually delivers "Pro users skip the line," which the current single-FIFO-array design has no way to express. Job status transitions and progress percentage keep the exact same state machine already defined in `compression-policy.ts` (`CompressionJobStatus` and friends) — that state machine is sound and tool-agnostic already; only its storage backend changes.

---

## Upload limits

Every upload-accepting route resolves its limit from `entitlements` instead of a hardcoded constant, following the same before/after pattern described above. Client-side pre-validation (the existing pattern in `upload-validator.tsx`/`compression-panel.tsx`) stays exactly as it is today for UX — instant feedback before a byte is uploaded — with the server-side entitlement check as the actual boundary, mirroring the discipline already established by this session's compressor pre-check (client suggests, server enforces).

---

## Storage strategy

Local temp files (`os.tmpdir()/qavelix-compression`, `os.tmpdir()/qavelix-extract-audio`, etc.) move to object storage (S3-compatible — R2, S3, or equivalent) once the worker tier is separate from the web tier, because a serverless web tier and a container worker do not share a filesystem. The existing signed-download-URL pattern (`DOWNLOAD_TTL_MS`, HMAC-signed tokens in `compression-policy.ts`/`compression-queue.ts`) is **kept, not redesigned** — presigned object-storage URLs are a drop-in conceptual replacement for "stream this local file with a signed token," so the download UX and its expiry semantics don't change, only what's behind the URL.

---

## Database

Postgres (managed — Neon, Supabase, or Vercel Postgres all fit the Vercel-web-tier decision above). Conceptual schema, consolidating the tables introduced throughout this document:

```
users, subscriptions            -- accounts & billing
tools, entitlements             -- what exists, what each plan can do with it
usage_counters                  -- daily consumption, anonymous + authenticated
jobs                            -- durable processing queue state
```

This is deliberately five small, normalized tables, not a sprawling schema — every table maps directly to a concept already present in the codebase today (job status, upload limits, rate-limit fingerprints), just moved from scattered constants and in-memory state into one durable, queryable place.

---

## Analytics

Analytics reads from the same tables rather than a separate tracking pipeline: `jobs` gives per-tool volume and success/failure rates for free; `usage_counters` gives daily active usage per tool without any additional instrumentation; `subscriptions` gives conversion and churn directly. A dedicated event-tracking table (`events: user_key, tool_id, event_type, at`) is worth adding only once product questions arise that the above three tables can't answer (e.g., funnel drop-off before a job is ever created) — not on day one, to avoid building analytics infrastructure ahead of having analytics questions.

---

## Admin panel

Scope stays deliberately minimal: a single auth-gated route group (`/admin`, role-checked against `users.role` or a hardcoded allowlist for the first version) that reads and writes `entitlements` and `tools`, and provides read-only views over `jobs` and `subscriptions` for support purposes. This is not a separate application — it's a few Next.js pages behind an auth check, reusing the same database and the same deployment as the rest of the web tier. Building it as a standalone app would be exactly the kind of unnecessary infrastructure this architecture is trying to avoid elsewhere.

---

## Future-tool integration / inheritance model

**Worked example: adding tool #6.**

Say tool #6 is a browser-side image compressor with no server-side processing at all (per the growth-strategy document's recommendation that image tools should be browser-only). Here is everything required to give it Free/Pro limits, usage tracking, and subscription awareness:

1. Insert one row into `tools`: `('image-compress', 'image', 'browser-only', true)`.
2. Insert two rows into `entitlements`: one for `('image-compress', 'free')`, one for `('image-compress', 'pro')`, setting whatever limits make sense (e.g., `max_jobs_per_day` if you want to cap even a browser-only tool's usage for abuse-prevention reasons).
3. The tool's own UI calls the same entitlement-lookup and usage-counter endpoints every other tool already calls — no new backend code, because the endpoints are tool-agnostic; they take `tool_id` as a parameter, they don't have per-tool logic branches.
4. Nothing about `users`, `subscriptions`, auth, or the payment integration changes at all.

Now say tool #7 is a CPU-heavy video-to-GIF converter that *does* need the FFmpeg worker queue. Steps 1-2 are identical. Step 3 becomes: the tool's job-creation route calls the same `jobs` insert + entitlement check every processing route already calls, with `tool_id = 'video-to-gif'`. The worker dispatcher doesn't need to know GIF conversion exists as a special case — it already dispatches by `tool_id` and `priority`, generically.

This is the entire point of the entitlements model: **the subscription system has no per-tool code in it anywhere.** It has generic lookups keyed by `tool_id`. A new tool is a data insert, not a code change — which is the literal requirement this document was asked to satisfy.
