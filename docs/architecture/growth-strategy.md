# QAVELIX Growth Strategy

Date: 2026-07-24

Scope: an improved monetization plan, built on top of [platform-architecture.md](./platform-architecture.md)'s entitlements/usage-counter mechanism. This document specifies *product* behavior (pricing, messaging, triggers); the architecture document specifies the *mechanism* underneath it. Kept deliberately separate so this stays a growth document, not an infrastructure one.

## Baseline recap

`QAVELIX_CAPACITY_REPORT.md` already modeled break-even at $29/$39/$49-per-year Pro pricing against an assumed $25/month Render baseline: 11, 8, and 7 subscribers respectively. `QAVELIX_STRATEGIC_RESEARCH.md` already sketched a Free/Pro/Credits/API/Teams revenue shape. Neither is re-derived here — this document starts from those numbers and fills in what's missing from both: **a concrete, usage-triggered upgrade moment**, which neither prior document specifies.

## Annual pricing

**Recommendation: a single Pro price point, $39/year, not a three-tier spread.** The capacity report's $29-49 range is a reasonable planning band, but shipping three simultaneous price points before a single paying customer exists adds decision fatigue for the buyer and pricing-page complexity for no evidence-backed reason. $39/year sits at the break-even midpoint (8 subscribers) and is easy to reason about ("$3.25/month, billed yearly") without implying a "cheap tier vs. premium tier" choice that doesn't yet correspond to any actual feature difference. Revisit as a real range once there's usage data to segment against, not before.

## Free plan

Concrete limits, expressed as `entitlements` rows (see platform-architecture.md) rather than prose:

- Video Compressor: 250MB max upload (unchanged from today), 3 jobs/day per anonymous fingerprint.
- Extract Audio: same 250MB cap, 5 jobs/day (lighter server cost than compression, per `QAVELIX_CAPACITY_REPORT.md`'s own cost comparison, justifies a higher free allowance).
- No batch operations, standard queue priority.

These match the capacity report's existing recommendations closely on purpose — they were already reasonable; the gap wasn't the numbers, it was that nothing enforced them.

## Pro plan

- Larger files (recommend 1GB, a meaningful step up rather than a token increase), higher daily caps (20/day rather than "unlimited," per the capacity report's own fair-use reasoning — see business-review.md's subscription-risk section on why literal unlimited access to a CPU-bound service is a real cost exposure, not just a marketing word), priority queue position via `entitlements.queue_priority`, and — once accounts exist — a job history the Free tier structurally doesn't have (see Usage Indicators below for why this specific benefit is the easiest one to build and the most legible to a buyer).

## Onboarding & upgrade flow

**The upgrade prompt belongs at the moment a real limit is hit, not on a pricing page nobody visits.** Neither prior research document specifies this trigger concretely; this is the highest-leverage gap to close. Concretely: when a Free-tier job creation request is rejected because `usage_counters` has hit `entitlements.max_jobs_per_day`, the response the client already has to handle (an error state) carries the upgrade message inline — "You've used 3/3 free compressions today. Upgrade for 20/day and larger files." This is not a new UI surface; it reuses the exact error-display pattern `compression-panel.tsx` already has for every other rejected-request case (`copy.errors.*`), just with a CTA attached to this specific one.

## Usage indicators

**This section has a real constraint that must be named up front: there is no persistent job history today, and Free tier should stay that way.** Jobs expire and their temp files are deleted per `DOWNLOAD_TTL_MS`; nothing about a completed job is meant to outlive that window for an anonymous user. A "3/3 used today" indicator doesn't require job history, though — it only requires reading today's `usage_counters` row for the current fingerprint, which is cheap and doesn't imply building persistent history for Free users. **Persistent job history should be an explicit, named Pro benefit** (a real answer to "why pay"), not something Free quietly gains as a side effect of building the counter. Show the live "X/Y used today" count on the tool page itself, updated after each job, for both Free and Pro — visible quota is a retention mechanic on its own (per `QAVELIX_STRATEGIC_RESEARCH.md`'s own note that repetition and workflow integration matter more to revenue than raw traffic).

## Retention

With no accounts today, retention has to work for anonymous, no-login users first — bookmarkable tool URLs (already true — `/en`, `/en/tools/extract-audio`) and, per the strategic research document's own suggestion, a PWA/installable shortcut are the realistic near-term retention levers, not email re-engagement, which requires an account that most users won't have. Once accounts exist, the obvious addition is a "your tools" dashboard — but that's a Pro-account feature (job history, saved presets), not a Free-tier retention mechanic, consistent with the guardrail below.

## Referrals

Deferred until accounts exist — a referral program needs something to attribute a referral *to* (an account), which today's architecture doesn't have. Once it does, the natural mechanic is "extra Pro days for both parties on a successful referral" rather than a cash payout, matching the low price point and avoiding payout/fraud infrastructure that isn't worth building at this scale yet.

## Future credit system

Per `QAVELIX_STRATEGIC_RESEARCH.md`'s own note, credits are the right model for genuinely variable-cost operations (background removal, OCR, upscaling) where a flat "20/day" allowance either overcharges light users or undercharges heavy ones — not for the current tools, where server cost per job is roughly uniform. Recommendation: don't introduce credits until a variable-cost tool actually ships; a flat daily allowance is simpler and correct for everything in the current and near-term roadmap (Video Compressor, Extract Audio, Video Trimmer, Audio Converter — all roughly-uniform-cost per the capacity report's own tool evaluation).

## API monetization

Deferred, correctly, per the strategic research document's own sequencing — an API product needs API keys, per-key rate limiting, and usage-based billing, none of which exist yet and none of which should be built before there's a Pro subscriber base validating the core product first. When it is built, it reuses the same `entitlements`/`usage_counters` mechanism with `plan_tier = 'api'` rather than inventing a parallel limits system — this is the concrete payoff of the entitlements model extending cleanly to a monetization shape nobody has designed yet.

## Business accounts

Deferred for the same reason — teams, seats, and SSO are real features but presuppose individual accounts already working well, which they don't yet, because they don't exist. When it's time, `users` gains an `organization_id` and `subscriptions` moves from being one-user-one-subscription to organization-owned — a schema extension, not a redesign, of the tables in platform-architecture.md.

## The one guardrail that governs all of the above

`QAVELIX_STRATEGIC_RESEARCH.md`'s positioning line — *"no account for basic tasks... process locally whenever possible"* — is not just marketing copy, it's a constraint every recommendation above has to respect: **an upgrade prompt may gate the *next* task or a *higher limit*, but must never gate the result of the task the user already started.** A Free user who uploads a video and waits for a compression job must always get that result. The upgrade moment is "you're out of quota for *today*," never "pay to see what you just processed." Every usage-indicator, upgrade-flow, and Pro-benefit recommendation in this document was checked against that rule.
