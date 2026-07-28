# QAVELIX Business & Architecture Review

Date: 2026-07-24

Scope: a critical review of QAVELIX's implicit monetization and scaling direction. There is no separate business blueprint document — this review treats the project owner's own architecture request (subscriptions, usage limits, multi-tool scaling, payments) as the blueprint under evaluation, cross-checked against the actual codebase and the two prior research documents already in the repository root (`QAVELIX_CAPACITY_REPORT.md`, `QAVELIX_STRATEGIC_RESEARCH.md`).

This is the first of four architecture documents:

1. **business-review.md** (this document) — what's weak about the current direction, and why
2. [`platform-architecture.md`](./platform-architecture.md) — the target architecture that addresses these weaknesses
3. [`infrastructure-compatibility.md`](./infrastructure-compatibility.md) — whether the current stack can support it
4. [`growth-strategy.md`](./growth-strategy.md) — the monetization plan built on top of it

---

## Overview

QAVELIX today is two working tools (Video Compressor in production, Extract Audio validated locally) with zero accounts, zero payments, and zero persistent usage tracking — by explicit design (`README.md` lists payments, ads, and accounts as excluded from current phases). The request to design subscriptions and usage limits is therefore not a refinement of an existing system — it's a first system, being designed against a codebase that currently has no data layer at all. That gap is the source of most of the findings below: not because anything was built wrong, but because "Free vs Pro" language has been used in planning documents for months without anything in the code that could actually enforce it.

---

## Weaknesses

**"Free" and "Pro" exist only in prose today, not in code.** `QAVELIX_CAPACITY_REPORT.md` recommends "3 compressions/day per fingerprint/session" and specific Pro limits; `QAVELIX_STRATEGIC_RESEARCH.md` sketches a Free/Pro/Credits/API revenue model. Neither has a corresponding enforcement mechanism. The only real limits in the codebase are global, not tier-based: `MAX_UPLOAD_BYTES` (`src/lib/upload-policy.ts`) applies identically to every request, and `maxQueuedJobs = 10` (`src/lib/server/compression-queue.ts`) is a single constant, not a per-plan value. Any "Pro" claim made in marketing copy today would be unenforceable.

**The two existing research documents disagree with each other, and with the deployment docs, on the most basic infrastructure question.** `QAVELIX_CAPACITY_REPORT.md`'s entire cost model — the $25/month baseline, the break-even subscriber counts, the "jobs/day" ceilings — is computed against **Render Standard** (1 vCPU, 2GB RAM). `docs/DEPLOYMENT.md`, meanwhile, names **Vercel** as the production target and configures `vercel.json` accordingly. These are not compatible hosting models for the same workload (see [infrastructure-compatibility.md](./infrastructure-compatibility.md) for why), and nobody has reconciled them. Every dollar figure and capacity ceiling in the capacity report is only valid if Render is actually where compression jobs run — which the deployment docs say isn't the plan. **This is the single highest-leverage finding in this review**: no monetization math is trustworthy until this is resolved.

## Scalability problems

**The compression pipeline is architecturally single-tenant, dressed up as a queue.** `compression-queue.ts` holds exactly one `activeJobId` at a time — one FFmpeg process for the entire service, regardless of how many users are waiting. `maxQueuedJobs = 10` isn't a policy decision about fairness between Free and Pro users; it's a hard ceiling that, once hit, rejects every user identically. There is no notion of priority. A future "Pro users skip the line" feature cannot be bolted onto this — the queue itself has no concept of who's waiting or why.

**Job state lives in one process's memory, backed by a JSON file on the same disk.** `persistCompressionJob()` writes `os.tmpdir()/qavelix-compression/jobs/{id}.json` — this survives a crash of the *same* Node process, because `loadPendingCompressionJobs()` re-reads it on restart, but it does not survive a redeploy (temp directory gets wiped), a horizontal scale-out (a second instance has no idea the file exists), or a platform migration. Every job in flight during a deploy is silently lost today. That's an acceptable trade for an MVP with no paying customers; it is not acceptable for a service billing people monthly.

**Rate limiting has no durability either.** `checkRateLimit()` in `src/lib/server/security.ts` uses an in-memory `Map` (`rateLimitBuckets`) that resets on every restart. Combined with the single-instance job queue, the entire abuse-prevention and quota-tracking surface of the application currently resets to zero on every deploy — which, during active development, is often.

## Future bottlenecks

As tool count grows past two, three specific things break in order:

1. **The FFmpeg worker becomes the bottleneck first**, not disk or bandwidth — one active job means N tools sharing one queue slot. Extract Audio and Video Compressor already compete for the same worker; a third video-adjacent tool makes queue wait times the dominant complaint, not compression quality.
2. **Hardcoded per-tool constants multiply.** Today there are two: `MAX_UPLOAD_BYTES` (shared) and the compression-specific queue limits. Add ten more tools the same way — each with its own file-size cap, its own rate limit, its own "how many per day" constant sprinkled through its own route file — and every future pricing change becomes a multi-file, multi-tool code change instead of a data update. This is the concrete mechanism that "redesigning the subscription system for every new tool" would actually look like if the current pattern isn't replaced (see [platform-architecture.md](./platform-architecture.md)'s entitlements model).
3. **Temp disk becomes the growth ceiling on a single-instance host**, well before CPU does. `QAVELIX_CAPACITY_REPORT.md` already estimated 2-6GB of burst temp disk needed at 5-10 concurrent max-size uploads for one tool; every additional server-side processing tool adds to that same shared `os.tmpdir()`, on the same disk, with no tool-level isolation or quota.

## Hidden infrastructure costs

**The Render-vs-Vercel ambiguity hides two entirely different cost shapes, not just two prices.** Render Standard is a flat $25/month regardless of usage — cheap at low volume, wasteful at zero volume, but predictable. Vercel serverless function billing is usage-metered (invocation count × duration) — cheap at zero volume, but FFmpeg jobs running for minutes at a time on a metered-duration billing model can get expensive fast, and Vercel's function duration limits (see [infrastructure-compatibility.md](./infrastructure-compatibility.md)) mean long compressions may not even be able to run there at all without a separate worker. Whichever model is chosen, the other document's numbers become misleading noise sitting in the repo.

**Object storage and a real database are costs nobody has priced yet.** Every prior research document models compute cost; none prices Postgres hosting, S3-compatible storage for job inputs/outputs at scale, or the egress cost of serving compressed video downloads from object storage instead of the current same-instance local disk. These are not optional additions once accounts exist — they're required the moment job durability matters, which is the moment the first paying customer exists.

**FFmpeg licensing and codec compliance haven't been reviewed for a commercial (paid subscription) context.** The current use is a straightforward personal-use style transcoding tool; charging money for it is a different legal posture. This isn't flagged as urgent, but it's a real, currently-unpriced item that should be checked before the first Pro subscription is sold, not after.

## UX problems

**No login before results is a real strength that a naive monetization design would quietly break.** `QAVELIX_STRATEGIC_RESEARCH.md`'s own positioning line — "no account for basic tasks" — is correct and should stay true. The risk is specific: any usage-limit or upgrade-prompt implementation that requires knowing *who* the user is before letting them see a result would contradict this. The growth strategy document addresses this directly with a guardrail.

**Zero visibility into past usage, by design, today.** Compression outputs expire and are deleted after `DOWNLOAD_TTL_MS` (30 minutes); nothing about a completed job persists past that window. A returning user — free or, eventually, paid — has no way to see "you compressed 2 videos today" or "here's your history," because nothing stores that fact anywhere. This is fine for an anonymous-only free tool. It is a real product gap the moment "3 compressions/day" becomes an enforced Free-tier limit that a user might reasonably want to see a running count of.

**Client-side gating is currently the only enforcement layer for some limits, which is honest today but will be a liability tomorrow.** `upload-validator.tsx` and `compression-panel.tsx` reject oversized/invalid files client-side before ever hitting the server — good UX, but the server independently re-validates everything (`upload-policy.ts`'s server-side checks, signature verification, etc.), so there's no security gap today. The risk is forward-looking: once Free/Pro limits exist, every client-side check needs a server-side twin from day one, or Free users can trivially exceed Free limits by calling the API directly. The pre-check feature shipped alongside this review (see the engineering report) deliberately follows this same discipline — it's UX-only, with the existing server-side path already handling the case where it's bypassed — and that pattern should be the template for every future Free/Pro gate, not an exception.

## Subscription risks

**Without accounts, "Pro" can only mean "this device/browser," which is trivially defeated.** Any subscription model built before authentication exists would have to key Pro status to something like a signed cookie or local storage flag — both easily cleared, copied, or shared. This isn't a reason to delay monetization, but it is a reason the architecture (next document) treats accounts as a prerequisite for Pro enforcement, not an optional add-on.

**Fingerprint-based Free-tier limiting is the only usage-attribution mechanism that exists, and it's weaker than it looks.** `getClientFingerprint()` (`src/lib/server/security.ts`) hashes `x-forwarded-for`/`x-real-ip` into a stable key, currently used only for rate limiting. It is the natural seed for an anonymous Free-tier daily counter (see [platform-architecture.md](./platform-architecture.md)) — but IP-based fingerprinting conflates every user behind a shared IP (NAT, campus/office networks, mobile carrier CGNAT, VPN exit nodes), meaning legitimate users can hit a "daily limit" that's actually shared with strangers, while a single motivated abuser can rotate IPs to sidestep it entirely. This needs to be named explicitly rather than assumed to work like a per-user counter, because it isn't one.

**Refund/chargeback exposure is unpriced.** A subscription model selling "unlimited fair-use" access to a CPU-bound service (as both prior research docs recommend) needs a fair-use policy that's actually enforced by code, not just written in terms of service — otherwise the first heavy user who gets throttled and charges back becomes a real cost, not a hypothetical one.

## Abuse vectors

**Anonymous, unlimited-attempt access to a CPU-heavy endpoint is the biggest immediate risk, and it exists today, not just in a future paid version.** `compression/jobs` currently has no per-fingerprint daily cap on job *creation* (only a request-rate limit, which caps *how fast* requests arrive, not *how many* succeed per day) — see [platform-architecture.md](./platform-architecture.md) for the specific gap. A script that trickles requests just under the rate limit can currently run unlimited compressions per day, each consuming the one shared FFmpeg worker slot other real users are waiting on.

**Large-file repeated uploads are a disk-exhaustion vector, not just a bandwidth one.** Every upload up to `MAX_UPLOAD_BYTES` (250MB for Free/anonymous; 500MB for QAVELIX PRO, per `PRO_MAX_UPLOAD_BYTES` in `entitlements/policy.ts`, since this section was written before the Pro tier's plan-aware upload ceiling shipped) streams to local temp disk before validation completes. Enough concurrent large uploads from different fingerprints (each currently allowed 10/minute per `enforceApiSecurity`'s upload-analysis limit) can exhaust temp disk on a single small instance well before CPU becomes the bottleneck — `QAVELIX_CAPACITY_REPORT.md` already flagged this at 5-10 concurrent users (at the pre-Pro 250MB ceiling; see that report's own update note for why Pro's 500MB ceiling doubles this exposure and hasn't been revalidated); it's a real, present-day risk, not a scaling hypothetical.

**A "Pro" tier sold as materially faster or higher-limit, without server-side enforcement from day one, becomes a documented incentive to find the bypass.** This is the same point as the subscription-risk section above, restated as an abuse vector: the moment Pro exists and is worth something, every gap between client-side UX and server-side enforcement becomes something worth exploiting, not just a stray edge case.

## Architectural improvements

Each of these is addressed concretely in [platform-architecture.md](./platform-architecture.md):

- Replace hardcoded per-tool limit constants (`MAX_UPLOAD_BYTES`, `maxQueuedJobs`, and every future tool's equivalent) with a data-driven entitlements model keyed by `(tool, plan)`, so adding tool #6 never means touching the limits system.
- Resolve the Render/Vercel fork explicitly, formalizing what `docs/DEPLOYMENT.md`'s own "Worker deployment guide" section already gestures toward: a stateless web tier plus a separate persistent worker for FFmpeg.
- Move job state off local-disk JSON into a real database before the first Pro subscription is sold — not because the current approach is wrong for an MVP, but because it's the one piece of infrastructure that failing silently (a lost job during a deploy) turns into a support ticket the moment money is involved.
- Extend `getClientFingerprint()`'s existing hash, rather than inventing a new mechanism, as the seed for anonymous Free-tier counting — durable storage underneath the same hash, with an explicit hand-off to account-based counting at signup.
- Treat the client-side-only pattern used for the compressor's new size-prediction pre-check as the template for future Free/Pro UX gates: fast, friendly, client-side feedback, with the server as the actual source of truth underneath it.
