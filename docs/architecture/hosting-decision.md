# QAVELIX Hosting Decision

Date: 2026-07-26

Status: **Decided.**

Scope: resolves the Vercel/Render fork identified in
[business-review.md](./business-review.md) ("the deployment model is currently
self-contradictory"), designed around in
[platform-architecture.md](./platform-architecture.md) (the Vercel-web / Render-worker
split), and verdicted component-by-component in
[infrastructure-compatibility.md](./infrastructure-compatibility.md). This document is
Milestone 6 ("Production Durability") Phase 4 — it issues one decision, not another
design.

## Decision

**Production runs as a single persistent container on Render.** That one instance serves
every web page and API route *and* executes FFmpeg/FFprobe in-process — exactly what
`Dockerfile` already builds today (`node:24-alpine` with `ffmpeg` installed, running
`next start` in standalone mode). **Vercel is not used for production.** `vercel.json`
stays in the repository (harmless, not deleted — outside this decision's scope) but does
not represent the deployment target; treat it as inert until/unless this decision is
revisited.

This is **Option A** from the Milestone 6 plan, chosen over Option B (Vercel web tier +
a dedicated Render worker tier, object storage, managed queue — the full split
`platform-architecture.md` originally designed).

## Why

- QAVELIX is solo-maintained, pre-launch/early-traffic. Option B's full split (object
  storage, a managed queue, a second deployable worker service) is real infrastructure
  work sized for a scale the product doesn't have yet — `business-review.md` already
  named this exact risk under "hidden infrastructure costs."
- Option A is the smallest lift that still fixes the actual problem Phase 4 exists to
  solve: today's ambiguity, not today's scale. A single, clearly-declared host removes
  the contradiction between `DEPLOYMENT.md` (said Vercel) and the `Dockerfile`/
  `QAVELIX_CAPACITY_REPORT.md` (priced Render) without requiring new infrastructure to be
  built first.
- Single-instance is accepted here as a **named, bounded constraint**, not an accident.
  `infrastructure-compatibility.md`'s verdict still holds and isn't overturned by this
  decision: Vercel serverless functions are incompatible with the current in-memory job
  queue and long-running FFmpeg processes. Choosing Render sidesteps that incompatibility
  entirely rather than requiring Phases 5–8 to build around it.
- The durability work in Phases 5–6 (moving job state and rate-limit state to Postgres)
  still happens under Option A — it's what makes a *restart* of this one instance
  crash-safe. What Option A defers is horizontal scale-out (multiple instances sharing
  state), not durability itself.

## What this means for the rest of Milestone 6

- **Phase 5 (durable rate limiting)** and **Phase 6 (durable job state)**: proceed as
  planned, targeting Postgres-backed state read/written by this one process. No
  cross-instance sharing requirement — simpler than the original Option-B-shaped design
  anticipated.
- **Phase 7 (object storage)**: becomes optional / lower priority. A single instance can
  keep using local temp disk under `os.tmpdir()` safely; object storage would still
  reduce the disk-exhaustion risk `business-review.md` flagged, but it's no longer a hard
  requirement (Option B needed it because a stateless web tier and a separate worker
  don't share a filesystem — that constraint doesn't apply here).
- **Phase 8 (worker/dispatch separation)**: skipped. There is no separate worker tier
  under Option A.

## Reconciliation checks

- **`src/proxy.ts`'s Render→qavelix.com redirect**: verified consistent with this
  decision, no code change needed. It redirects visitors on the default
  `qavelix.onrender.com` host to the canonical `qavelix.com` domain — exactly correct
  behavior when Render *is* production, not a legacy artifact to remove.
- **`next.config.ts`'s `output: "standalone"` and `Dockerfile`**: already exactly the
  Option A build target; no change needed.
- **`docs/DEPLOYMENT.md`**: updated alongside this document to state Render as the single
  production target and stop presenting Vercel as one.

## Revisit trigger

Revisit this decision — not before — if real compression-job volume or concurrent-user
load approaches the ceilings `QAVELIX_CAPACITY_REPORT.md` already estimated for a single
Render Standard instance (temp-disk exhaustion around 5–10 concurrent max-size uploads;
the FFmpeg worker becoming the bottleneck before disk or bandwidth once a third
processing-heavy tool exists). At that point, Phases 7–8 (object storage, worker split)
become the next milestone, not a redo of this one — the Postgres-backed job/rate-limit
state built in Phases 5–6 carries forward unchanged.

## Execution log

- **2026-07-26 — Phase 6 (durable job state) complete.** `compression-queue.ts`'s
  persistence layer now reads/writes a Postgres `compression_job` table instead of local
  JSON files; verified end-to-end (real FFmpeg runs, signed downloads, and a direct
  crash-recovery proof against the live app: a job orphaned mid-run is correctly marked
  failed and its entitlement reservation released by a process that never created it).
  Local temp disk (`os.tmpdir()/qavelix-compression`) is still used for the actual
  video files and the FFmpeg worker lock — unchanged, per the Phase 7 deferral below.
- **2026-07-26 — Phase 7 (object storage) formally confirmed deferred, not skipped by
  oversight.** Re-verified at execution time: no object-storage credentials (S3/R2/etc.)
  are available in this environment to configure even if it were built, and no partial
  object-storage code exists anywhere in `src/` — confirming the codebase is still
  consistent with the "local disk is fine under Option A" reasoning above. No code
  changed for this phase.
- **2026-07-26 — Phase 8 (worker/dispatch separation) formally confirmed skipped**, per
  the "no separate worker tier under Option A" reasoning above — re-verified still true
  after Phase 6 (compression execution still happens in-process on the same Render
  instance that now durably persists job state to Postgres). No code changed for this
  phase.
- **2026-07-26 — Phase 9 (production durability verification drill) complete, against the
  local dev environment** — no real Render staging deployment is accessible from this
  environment, so this drill ran against the same real dev database and dev server used
  to verify every prior phase, as the closest available proxy. Results: (1) compression
  crash-recovery — proven directly in Phase 6's execution log above; (2) password
  reset/verification email — proven in Phase 3 (real sign-up + reset flow against the live
  server; dev-safe fallback confirmed correct with no `RESEND_API_KEY` configured); (3)
  full test suite — unit 179/179, DB-backed integration tests (entitlements, Stripe
  billing, rate-limit durability) 12/12, full integration suite 45/48 and e2e 5/6 with the
  only failures being two pre-existing, unrelated content-copy staleness issues already
  documented since Phase 2 (`/en/about` copy, a stale "back to compressor" link) plus one
  pre-existing timing-marginal test in `compression-download.test.mjs` (a 1-second
  synthetic video occasionally encodes faster than the test's 500ms poll interval can
  observe an intermediate status — reproduced both before and after Phase 6's persistence
  change, confirmed unrelated to it); (4) `DEPLOYMENT.md`'s manual checklist — all security
  headers present, `robots.txt`/`sitemap.xml` correct, cross-origin requests to
  state-changing API routes correctly rejected with 403; (5) rate-limit restart survival —
  proven in Phase 5's execution and its dedicated integration test. **Still required before
  actual production launch, outside what this environment can perform:** running this same
  drill against a real deployed Render instance (real TLS certificate, real
  `qavelix.com` DNS, real `RESEND_API_KEY`/domain-verified sending, and a genuine process
  kill of that deployed instance) — see `DEPLOYMENT.md`'s "Manual deployment checklist."
