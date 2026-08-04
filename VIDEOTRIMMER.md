# VIDEOTRIMMER.md — Video Trimmer Specification

**Status: pre-implementation specification. No Video Trimmer code, route, component, dictionary
entry, or test exists anywhere in this repository yet** — confirmed by a repo-wide grep across
`src/`, `docs/`, and every root `.md` file (every `trim`/`cut`/`clip` hit is either
JavaScript's `.trim()` string method, CSS `clip`/`clip-path`, or a planning-document mention;
see "Research provenance" below). This document is the official requirements source for
Video Trimmer. **Do not begin implementation from this document without a separate, explicit
go-ahead** — per the project's own "specify first, implement after" convention (the same one
`docs/tools/extract-audio/`'s now-abandoned stub folder tried and failed to follow through on;
see "Why this document, not another `docs/tools/video-trimmer/` stub folder" below).

This document is modeled on `QAVELIXPRO.md`'s density and citation style: every claim about
existing architecture is checked against the actual source file, not inferred. Where a number
or decision is a **proposal** rather than a confirmed fact, it is marked explicitly — this
spec does not invent product decisions (pricing, limits) unilaterally; it presents the
research and a recommendation, and leaves the final call as an open item (see "Open Decisions
Before Implementation Starts").

**Last verified against:** repository state as of 2026-08-01 (post `main` commit `773ca27`
and subsequent CI fixes). Cross-checked directly against `src/lib/server/entitlements/policy.ts`,
`src/components/compression-panel.tsx`, `src/components/extract-audio-tool.tsx`,
`src/app/[locale]/tools/extract-audio/page.tsx`, `src/lib/server/compression-queue.ts`,
`src/lib/server/extract-audio.ts`, `src/lib/server/security.ts`, `src/i18n/dictionaries.ts`,
`src/app/sitemap.ts`, and the existing test suite.

---

## Why this document, not another `docs/tools/video-trimmer/` stub folder

`docs/tools/extract-audio/` (`PRD.md`, `README.md`, `ROADMAP.md`, `SEO.md`, `TESTS.md`,
`DECISIONS.md`, `TODO.md`) is the prior attempt at "specify before implementing" for a QAVELIX
tool. Every one of those files is still `TBD` in every section except `DECISIONS.md` — Extract
Audio was built directly, and the stub folder was never filled in. Splitting a spec across
seven near-empty files didn't produce a usable spec; it produced seven files nobody finished.
This document follows the pattern that *did* work for this project: one dense, comprehensive,
continuously-accurate file — the same shape as `QAVELIXPRO.md` itself, which is the actual
functioning "source of truth" document this codebase has. `VIDEOTRIMMER.md` lives at the repo
root for the same reason `QAVELIXPRO.md` does: it is the single authoritative reference for
this tool, not a planning artifact expected to go stale in a subfolder.

---

## Product Objective

Let a QAVELIX user shorten a video to a specific time range — trim off dead air at the start,
cut a highlight clip, or remove an unwanted ending — without installing an editor, without an
account (for casual use), and without leaving the QAVELIX brand experience they already know
from Video Compressor and Extract Audio.

**Non-goals for v1** (explicitly out of scope, per the research documents' own MVP guidance —
see "Strategic Rationale"): full timeline editing, multiple simultaneous cuts, subtitles, AI
features, cloud storage integration, social-media downloader features, permanent project
saving, GPU-only processing paths. These may become future roadmap items (see "Future
Roadmap") but must not be treated as MVP requirements.

## Target Users

Creators, marketers, teachers, freelancers, small businesses, and support teams who need to
remove dead time or extract a clip from a video quickly, without learning a full editor —
identical audience framing to `QAVELIX_NEXT_TOOL_RESEARCH.md`'s Video Trimmer section, and
consistent with QAVELIX's existing anonymous-first, no-login-required audience for Video
Compressor and Extract Audio.

---

## Strategic Rationale (research provenance)

Video Trimmer is not a novel idea introduced by this document — it is the **highest-ranked
next tool** across every prior planning document in this repository, and this section exists
so that ranking is traceable to its actual source rather than asserted.

- **`QAVELIX_NEXT_TOOL_RESEARCH.md`** ranks it **#1 of 10 candidates** (weighted score 7.75,
  ahead of Audio Converter at 7.25 and Video to GIF at 7.15):
  > "Build **QAVELIX Video Trimmer and Lossless Cutter** next. It is the strongest balance of
  > SEO demand, willingness to pay, infrastructure safety, implementation fit, and brand
  > continuity. Unlike another generic image tool, it compounds QAVELIX's existing
  > video-compression positioning and can reuse the current upload, validation, FFmpeg,
  > temporary-file, download, security, localization, and deployment foundations."

  Scores from that document: SEO traffic potential 8/10, monetization potential 7/10,
  retention potential 6/10, **strategic fit with QAVELIX: 10/10**. Dev difficulty: "5/10 for
  MVP, 7/10 if frame-accurate preview and robust export controls are included." MVP time
  estimate: "2 to 4 weeks using existing compressor architecture."

- **`QAVELIX_CAPACITY_REPORT.md`** ranks it **#3 by infrastructure-readiness** (behind Extract
  Audio and Audio Converter, both lower-complexity), with an explicit reconciliation between
  the two ranking lenses:
  > "This infrastructure-only ranking differs from the strategic SEO report. If the goal is
  > 'fastest safe revenue on current infrastructure,' Extract Audio wins. If the goal is 'best
  > strategic next product for video positioning,' Video Trimmer remains very strong."

  Its final recommendation gates Trimmer behind operational telemetry: "add Video Trimmer
  after operational telemetry proves headroom" — telemetry that, per `QAVELIXPRO.md`'s Roadmap
  item 5, has **not yet been built** ("Add basic operational telemetry ... not yet done").
  This is a real, unresolved precondition — see "Open Decisions Before Implementation Starts."

- **`QAVELIX_STRATEGIC_RESEARCH.md`** (a third, independent research document, referenced by
  both `QAVELIXPRO.md` and `docs/architecture/growth-strategy.md`) ranks it **#8 of 34 tools**
  overall, with **P0 priority** and a "1 week" dev estimate — the most aggressive of the three
  estimates, worth reconciling against the other two before committing to a timeline.

- **`QAVELIXPRO.md`** (this repo's own status document) lists it as Roadmap item 7,
  medium-term: "Video Trimmer (highest-ranked next tool per both `QAVELIX_CAPACITY_REPORT.md`
  and `QAVELIX_NEXT_TOOL_RESEARCH.md` — reuses the existing upload/FFmpeg/download pipeline
  almost entirely)."

**Known documentation-drift precedent** (directly relevant to this spec): `growth-strategy.md`
proposed Free-tier limits and a Pro price that were never what actually shipped — `TOOL_POLICY`
shipped with different numbers, and `growth-strategy.md` now carries its own "Note (current
status)" flagging the drift. This spec deliberately does not repeat that mistake: every limit
proposed below is checked against `TOOL_POLICY` as it exists today, not against the older
research documents' numbers, and is marked as a proposal pending confirmation, not a fact.

---

## Design Consistency (non-negotiable)

Video Trimmer must be indistinguishable, on sight and in interaction, from Video Compressor
and Extract Audio. Someone opening QAVELIX for the first time on Video Trimmer's launch day
must not be able to tell it was added later. Concretely, this means:

- **Same color palette, typography, spacing** — the existing CSS custom-property system in
  `src/styles/globals.css` (`--accent`, `--foreground`, `--muted`, `--surface`,
  `--border`, etc., both light and dark theme blocks). No new palette, no new font stack.
- **Same cards** — reuse `.preset-card` for trim-mode/quality selection, `.stat-grid` for
  numeric summaries, `.upload-limit-comparison` for the Free/Pro row comparison.
- **Same buttons** — `.button`, `.button--primary`, `.button--secondary`. No new button
  variant introduced for this tool.
- **Same upload area** — `.upload-dropzone` (and its `--active`, `--validating`, `--blocked`
  modifiers), driven by the exact same client-side pre-check + server-side validation
  pipeline described under "Supported Inputs."
- **Same progress interface** — `.progress-block` (native `<progress>` element, styled),
  same polling cadence convention as Compressor if the job is async (see "Processing
  Architecture").
- **Same dashboard layout** — a Video Trimmer entry in `src/components/dashboard/tool-quick-links.tsx`'s
  `tools` array (see "Localization & Cross-Linking Integration Points"), styled with the
  existing `.foundation-card.dashboard-tool-card` pattern — no new dashboard card component.
- **Same mobile behavior / responsive breakpoints** — the existing `@media (max-width: 980px)`
  and `@media (max-width: 640px)` breakpoints in `globals.css`. No new breakpoint.
- **Same accessibility level** — skip link, semantic landmarks, `aria-live` status regions
  (`aria-live="polite"` on the status aside, matching both existing tools), keyboard focus
  states, `prefers-reduced-motion` handling — all inherited for free by reusing the existing
  component shells and CSS classes rather than writing new ones.
- **Same design language for errors, empty states, loading states** — `.compression-status__error`,
  `.compression-status__notice`, `.compression-status__success`,
  `.compression-status__validation` (with its `--complete` modifier), `.entitlement-lock-notice`.

**Rule**: if a reusable component or CSS class already covers a need, use it. Do not create a
parallel component or class for something Video Trimmer could express with the existing
vocabulary. The one exception that is *expected* to be genuinely new UI is the trim-range
selection control itself (see "Trim Configuration") — there is no existing precedent for a
start/end time input in this codebase, and it must be designed to visually belong inside the
existing `.preset-card`/`.compression-panel__main` layout, not as a foreign-looking widget.

---

## Feature Overview

Video Trimmer lets a user upload a video, select a **Start Time** and an **End Time**, and
receive a shorter version of the video containing only that range. That is the entire v1
feature surface. No multi-clip selection, no re-ordering, no merging.

---

## Supported Inputs

**Reuse the exact same upload system Video Compressor uses — introduce no new upload
behavior.** Concretely:

- Client-side pre-check: the same pattern `compression-panel.tsx` uses (drag/drop +
  file-picker onto `.upload-dropzone`, immediate client-side extension/size sanity check via
  a Trimmer-specific pre-check module mirroring `src/lib/compression-precheck.ts`'s shape —
  UX-only, never the security boundary).
- Server-side validation: `POST /api/upload/analyze` (unchanged, existing route) — streams
  the upload to disk, runs `validateFileIdentity()` (extension + MIME + binary-signature
  check via `src/lib/server/upload-validation.ts`), runs `analyzeWithFfprobe()`
  (`src/lib/server/ffprobe.ts`), and issues a short-lived, single-use `uploadReference` via
  `src/lib/server/analyzed-upload-registry.ts` (15-minute TTL, rename-based single-use
  guarantee, SHA-256-hashed token compared with `timingSafeEqual`).
- **Every video format already accepted by QAVELIX is accepted by Video Trimmer, with no
  additions or exceptions**: `.mp4`, `.m4v`, `.mov`, `.webm`, `.avi`, `.mpg`, `.mpeg` (per
  `acceptedExtensions`/`acceptedMimeTypes` in `src/lib/upload-policy.ts`). Video Trimmer must
  not introduce a narrower or wider format allowlist than the existing tools — a different
  accepted-format set per tool would break the "everything reuses the same upload pipeline"
  guarantee this document requires.
- A Video Trimmer job is created from the same `uploadReference` mechanism Video Compressor
  uses today (`consumeAnalyzedUploadReference` in `analyzed-upload-registry.ts`) — not a new
  upload path.

---

## Free / Pro Entitlements

**Reuse the existing entitlement mechanism (`TOOL_POLICY`, `resolveActor()`,
`reserveUsage()`/`confirmUsage()`/`releaseUsage()`) exactly. No new entitlement system, no
new billing/Stripe integration.**

### Mechanical integration (confirmed, not proposed)

Adding Video Trimmer as a gated tool requires exactly these changes to
`src/lib/server/entitlements/policy.ts` — nothing else in the entitlements layer needs to
change, per that file's own top comment ("Adding a future tool means adding one entry per plan
here, nothing else"):

1. Add `"video-trimmer"` to the `TOOL_IDS` array.
2. Add a `"video-trimmer"` entry under `TOOL_POLICY.free`.
3. Add a `"video-trimmer"` entry under `TOOL_POLICY.pro`.
4. **No change needed under `TOOL_POLICY.anonymous`** — the anonymous tier already pools all
   tools under the single `ANONYMOUS_POOL_TOOL_ID` (`"any"`) key; Video Trimmer automatically
   shares the same 5-lifetime-use combined pool anonymous visitors already have for Compressor
   and Extract Audio.
5. **No Stripe-side changes of any kind** — Stripe only knows about the Free/Pro plan
   distinction (`user_entitlement.plan`), never individual tools. Per-tool gating is entirely
   a `TOOL_POLICY` lookup keyed on the already-resolved plan.

### Proposed limits (open decision — see below)

`TOOL_POLICY` today is fully symmetric across both existing tools:

| Plan | Scope | Uses | Period | Upload ceiling |
|---|---|---|---|---|
| Anonymous | pooled across all tools | 5 | lifetime | 250MB (`MAX_UPLOAD_BYTES`) |
| Free | per tool | 10 | day | 250MB (`MAX_UPLOAD_BYTES`) |
| Pro | per tool | 100 | day | 500MB (`PRO_MAX_UPLOAD_BYTES`) |

**Two options for Video Trimmer, both grounded in real sources, presented here rather than
decided unilaterally:**

- **Option A — mirror the existing symmetric policy exactly** (10/day Free, 100/day Pro, same
  250MB/500MB upload ceilings). This is what `QAVELIX_CAPACITY_REPORT.md` recommends
  ("Current infrastructure can support it if usage limits mirror compression") and what keeps
  the product simplest to explain and the entitlements table free of tool-specific special
  cases. **Recommended default**, both for simplicity and because it avoids repeating the
  exact `growth-strategy.md` mistake already documented in `QAVELIXPRO.md` (proposing
  bespoke numbers that then drift from what ships).
- **Option B — a lower, trim-specific Free allowance**, per `QAVELIX_NEXT_TOOL_RESEARCH.md`'s
  explicit suggestion: "3 exports/day, files up to 250 MB, clips up to 10 minutes," with Pro
  getting "larger files, more daily exports, batch trim, no queue throttling, saved presets,
  higher priority processing." The rationale for going lower than Compressor/Extract Audio's
  10/day would be that a trim job's cost is far more variable (a lossless stream-copy of a
  30-second clip is nearly free; a full re-encode of a 500MB source is not) — capacity
  planning is harder without real usage telemetry.

**This document does not pick between A and B.** Recommendation: ship with **Option A** (zero
new special-casing, matches the existing product's "flat daily allowance, no credits" design
principle from `growth-strategy.md`) unless the person approving implementation has a specific
reason to diverge, in which case Option B's numbers are the documented fallback. Either way,
the *only* file that changes to enact the decision is `TOOL_POLICY` in `policy.ts` — per
`QAVELIXPRO.md` Rule #3 ("Never change upload limits or plan limits by editing anything other
than `TOOL_POLICY`"), this document does not propose changing limits anywhere else.

A **clip-duration cap** (Option B's "clips up to 10 minutes") is a genuinely new kind of limit
this codebase doesn't have today — neither tool currently caps output *duration*, only upload
*size*. If adopted, it needs its own field on the trim-specific request validation (not a
`TOOL_POLICY` field, since `ToolLimits` today only expresses `maxUsesPerPeriod`/`maxUploadBytes`)
and its own explicit validation rule (see "Validation").

---

## Processing Architecture

**Reuse the existing processing pipeline wherever it fits — do not invent a third
architecture.** QAVELIX has exactly two processing shapes today, and Video Trimmer must adopt
one of them, not a new third shape:

| | Video Compressor | Extract Audio | Video Trimmer (proposed) |
|---|---|---|---|
| Model | Async job, queued | Sync, one request/response | **Async job, queued** (recommended) |
| Worker | Single in-process FFmpeg worker (`compression-queue.ts`) | None — inline in the request handler | Reuse the compression worker's queue shape |
| Client interaction | Create job → poll `GET .../[id]` every 1s → `GET .../download` | Upload → blocks until MP3 streams back | Create job → poll → download |
| Timeout | 12 min | 8 min | Proposed: 12 min (same order of magnitude; see FFmpeg Strategy for why a trim can still be expensive) |

**Recommendation: model Video Trimmer as an async, queued job, structurally identical to
Video Compressor's `CompressionJob`/`compression-queue.ts`, not as a synchronous request like
Extract Audio.** Reasoning: even though a *fast* (stream-copy) trim can complete in
well under a second, an *accurate* (re-encoded) trim of a large source can take as long as a
full compression job — the same reasoning that makes Compressor async (avoid holding an HTTP
request open for a CPU-bound multi-minute FFmpeg run) applies to trimming whenever re-encoding
is involved. A synchronous route would need a different code path for "fast" vs. "accurate"
mode, which is exactly the kind of special-casing this document is trying to avoid. Reusing
the async job model uniformly, and only varying the *encoding strategy* (see "FFmpeg
Strategy") between fast/accurate, keeps one processing shape instead of two.

**Concretely, reuse (not duplicate):**
- The single in-process FIFO worker pattern (`queue: string[]`, `Map`, `activeJobId`,
  `processNextJob()`) — a Video Trimmer job type extending the same job model, or (simpler,
  less code) the *same* `compression-queue.ts` worker extended to accept a trim job alongside
  compression jobs, discriminated by a `kind` field. This is an implementation-time decision,
  not something this spec resolves — see "Open Decisions."
- **Job model**: the same fields `CompressionJob`/`CompressionJobSnapshot` already have
  (`id, status, originalName, inputSize, outputSize, progress, createdAt, startedAt,
  completedAt, expiresAt, downloadUrl, error, actorType, actorId, usageEventId,
  usageConfirmed`), plus trim-specific fields (`startSeconds`, `endSeconds`,
  `trimMode: "fast" | "accurate"`).
- **Job status state machine** — the same `CompressionJobStatus` values
  (`queued | starting | running | completed | optimized | compression_ineffective | failed |
  cancelled | expired | deleted`) apply directly; `optimized`/`compression_ineffective` may
  not be meaningful for a trim (there's no "did it get smaller" question the same way) and
  should likely just collapse to `completed` — a naming/semantics decision for
  implementation, not this document.
- **History** — "job history" is not currently implemented as a persistent, user-facing
  feature for *either* existing tool (`QAVELIXPRO.md`'s UX Improvements Backlog explicitly
  lists "Persistent job history" as a not-yet-built, Pro-only-candidate feature). Video
  Trimmer should not invent tool-specific history; if/when persistent history ships, it
  should ship for all three tools together, not as a Trimmer-only feature.
- **Downloads** — the exact same HMAC-signed, TTL-limited, ownership-checked download
  mechanism (`createDownloadSignature`/`constantTimeEqual`/`isJobOwnedByActor`, 30-minute
  TTL via `DOWNLOAD_TTL_MS`). No new signing mechanism.
- **Cleanup / temporary files** — the same `os.tmpdir()`-based working-directory convention
  (e.g. `os.tmpdir()/qavelix-video-trimmer`, mirroring `qavelix-compression` and
  `qavelix-extract-audio`), the same lock-file/`acquireJobLock` pattern, the same
  expiration-triggered cleanup (`scheduleExpiration`/`cleanupJobFiles`).
- **Progress tracking** — the same `-progress pipe:1` stdout parsing
  (`out_time_ms=`) Compressor already uses to report percentage progress, when re-encoding.
  A fast stream-copy trim completes too quickly for meaningful progress reporting and should
  just jump straight to 100%/`completed`.
- **Error handling** — the same terminal-path discipline: every reservation resolved via
  `confirmUsage()` (real success only) or `releaseUsage()` (every other terminal path,
  including orphan-recovery after a server restart, matching `loadPendingCompressionJobs()`'s
  existing interrupted-job detection).

---

## User Flow

```
Landing page (tool page, or homepage entry point via header "Tools" menu)
  ↓
Upload  (drag/drop or file picker onto .upload-dropzone — same component shell as Compressor)
  ↓
Validation  (client pre-check → POST /api/upload/analyze → server validation + FFprobe)
  ↓
Video Information display  (filename, duration, resolution, format, size — from FFprobe)
  ↓
Trim configuration  (Start Time / End Time inputs, live duration + remaining-duration preview)
  ↓
[optional] Trim mode selection  (Fast vs. Accurate — if both modes ship in v1; see FFmpeg Strategy)
  ↓
Start trim  (POST creates a queued job, consumes the uploadReference, reserves entitlement usage)
  ↓
Processing / Progress  (poll GET .../[id] every ~1s; .progress-block shown while active)
  ↓
Completion  (status becomes a terminal success state; download link + trimmed-file summary shown)
  ↓
Download  (GET .../download — signed token + ownership-checked, 30-minute TTL, same as Compressor)
  ↓
History  (not built for any tool today — out of scope for Trimmer v1; see Processing Architecture)
```

Failure branches (validation rejection, entitlement denial, FFmpeg failure, timeout,
cancellation) exit this flow back to the upload/configuration step with an inline error — see
"Error Handling."

---

## UI Requirements

Every section below reuses an existing class/component from Video Compressor or Extract Audio
unless explicitly marked **(new)**.

- **Hero** — same `hero-section hero-section--tool` shell Extract Audio's page uses
  (`src/app/[locale]/tools/video-trimmer/page.tsx`, wrapped in `<AppShell>`), with an
  `eyebrow` + `<h1 className="sr-only">` (visually-hidden H1, matching both existing tool
  pages — the visible heading treatment lives in the tool component itself, not the page
  shell) + `hero-section__description`.
- **Tool description** — short paragraph, same typographic treatment as Extract Audio's
  hero description copy.
- **Upload area** — `.upload-dropzone` with its existing modifiers (`--active`,
  `--validating`, `--blocked`), identical icon/title/description/browse-button structure to
  both existing tools (new icon glyph only — e.g. a scissors emoji, matching the
  emoji-icon convention already used for Compressor 🎥 and Extract Audio 🎵).
- **Configuration card** — a `.preset-card`-styled container hosting the **(new)** trim-range
  control (see "Trim Configuration") — visually consistent with the existing preset-selection
  cards even though its *content* (two time inputs instead of a preset choice) is new.
- **Video information** — reuse the `.upload-result.upload-result--workflow` `<dl>` pattern
  Compressor already uses to show filename/size/duration/resolution/codec/bitrate/frame rate,
  populated the same way (from the `POST /api/upload/analyze` FFprobe response).
- **Processing status / sidebar** — `<aside className="compression-status">` (or a
  Trimmer-specific class following the exact same pattern, e.g. `compression-status
  video-trimmer-status`, mirroring `compression-status extract-audio-status`), containing:
  - `.upload-limit-comparison` Free/Pro row comparison (identical pattern to both tools).
  - Job/video stats `<dl>`.
  - `.progress-block` while a job is active.
  - `.compression-status__notice` / `__success` / `__error` for terminal states.
  - `.compression-status__actions` for Start / Cancel / Download / Trim Another buttons.
- **Download section** — same download-button pattern as Compressor (signed URL,
  `.button.button--primary`), not Extract Audio's inline blob-download (since Trimmer is
  proposed as async/job-based, matching Compressor's download flow, not Extract Audio's).
- **History integration** — none in v1 (see "Processing Architecture" — no tool has this yet).
- **Empty state** — the untouched `.upload-dropzone` before any file is selected, identical
  to both existing tools.
- **Loading states** — `.validation-loader` (during upload validation) and
  `.compression-status__validation` (during FFprobe analysis / job processing), same as both
  existing tools.
- **Error states** — `.compression-status__error`, `.entitlement-lock-notice` (plan-gated
  blocking), `.compression-status__warning` (non-fatal warnings, e.g. "your selected range is
  very short, output may be trivially small" — a Trimmer-specific warning worth adding using
  the *existing* warning-block class, not a new one).

---

## Trim Configuration

This is the one genuinely new piece of UI in this tool — there is no existing precedent for a
time-range input in this codebase. It must still visually and behaviorally belong inside the
existing design system (see "Design Consistency").

**Fields:**
- **Start Time**
- **End Time**

**Preferred input format**: `HH:MM:SS` (or `MM:SS` for sub-hour clips, matching how
`formatBytes`-style existing helpers in this codebase already favor a single
human-readable-first formatting function over raw numeric fields) with a paired numeric
seconds representation for validation math. FFprobe already returns `durationSeconds` as a
plain number (`src/lib/server/ffprobe.ts`), so the underlying validation and API contract
should be in seconds, with the `HH:MM:SS` presentation as a display-layer concern only —
consistent with how `formatBytes()` in `src/lib/upload-policy.ts` separates the byte-count
source of truth from its human-readable rendering.

**Displayed alongside the inputs:**
- **Duration display** — the *source* video's total duration (from FFprobe), always visible
  as context for choosing a valid range.
- **Remaining duration preview** — a live-computed `End − Start` value, updated on every
  input change, so the user sees the resulting clip length before submitting.

**Validation rules** (client-side UX pre-check *and* server-side authoritative check — the
client check is never the security boundary, exactly matching this codebase's existing
"client pre-checks are UX-only" convention for uploads):
- `Start >= 0`.
- `End <= sourceDurationSeconds` (from FFprobe).
- `Start < End` (strict — a zero-length or inverted range is rejected, not silently clamped).
- `End − Start > 0` (implied by the above, stated separately because it's the user-facing
  "your clip must be longer than zero seconds" message).
- No negative values, no non-numeric input accepted past the input's own constraint.
- Invalid/malformed timestamp strings (e.g. `"1:2:3:4"`, empty string, non-numeric) rejected
  with a clear inline message before submission is even attempted.
- If a clip-duration cap is adopted (see "Free / Pro Entitlements," Option B), `End − Start`
  must also be checked against that cap, with a distinct error message from the generic
  invalid-range message.

**Error messages** (proposed, to be added to the tool's dictionary namespace — see
"Localization"): invalid range (start ≥ end), out-of-bounds end time, malformed timestamp,
clip-duration cap exceeded (if adopted), no file selected.

---

## Video Information

Reuse the exact same metadata display Video Compressor's `.upload-result.upload-result--workflow`
block already shows, sourced from the same `analyzeWithFfprobe()` fields
(`src/lib/server/ffprobe.ts`):

- Filename
- Duration (`durationSeconds`)
- Resolution (`width` × `height`)
- Format (`formatName`)
- File size (`formatBytes(inputSize)`)
- (Available but currently only shown by Compressor, worth including here too for parity:
  video codec, audio codec, bitrate, frame rate.)

No new metadata-extraction code — `analyzeWithFfprobe()` already returns everything this
section needs.

---

## Validation

Full list, consolidating upload-level and trim-specific rules (upload-level rules are
identical to Compressor/Extract Audio, restated here for completeness rather than
re-specified):

**Upload-level** (reused, unchanged):
- Extension allowlist (`.mp4 .m4v .mov .webm .avi .mpg .mpeg`).
- MIME-type allowlist.
- Binary-signature (magic-byte) verification per format.
- Empty-file rejection.
- Declared-size vs. actual-streamed-size cross-check (truncated/oversized upload detection).
- Plan-resolved upload-size ceiling (never a hardcoded constant — always the actor's real
  `maxUploadBytes` from `TOOL_POLICY`).
- Corrupted/unparseable media rejected by FFprobe failing to produce valid stream data.

**Trim-specific** (new, see "Trim Configuration" for full detail):
- `Start < End`.
- `End <= sourceDuration`.
- No negative values.
- `Duration (End − Start) > 0`.
- Invalid/malformed timestamp input rejected before submission.
- (If adopted) clip-duration cap exceeded.

---

## FFmpeg Strategy (document only — do not implement)

This is the highest-risk, most-discussed-in-research part of this tool, and the part this
document treats most carefully as "document the trade-off, don't decide it."

### Two modes, both grounded in `QAVELIX_NEXT_TOOL_RESEARCH.md`'s proposed baseline

**Fast trim (stream copy, no re-encode):**
```
ffmpeg -ss <start> -to <end> -i <input> -c copy -avoid_negative_ts make_zero <output>
```
- Advantage: near-instant, negligible CPU cost, no quality loss (bit-identical to the source
  within the copied range).
- Trade-off: `-c copy` cannot cut on an arbitrary frame — it can only cut cleanly at a
  **keyframe** boundary. Depending on where keyframes fall in the source (GOP structure
  varies by encoder/source), the actual output start point may be up to several seconds off
  from the user's requested `Start Time`. This is the single biggest UX risk this document
  identifies — see "Open Decisions."
- `-ss` placement matters: placing `-ss` *before* `-i` (input seeking) is fast but seeks to
  the nearest preceding keyframe; placing it *after* `-i` (output seeking) is frame-accurate
  but requires decoding from the start of the file, which defeats the point of a "fast" mode
  if combined with `-c copy`. The two are not freely interchangeable — this needs explicit
  benchmarking during implementation, not assumed from the research doc's baseline command
  alone.

**Accurate trim (re-encode):**
```
ffmpeg -ss <start> -to <end> -i <input> -c:v libx264 -c:a aac <output>
```
- Advantage: exact frame-accurate cut at the user's requested timestamps, every time.
- Trade-off: full re-encode — same CPU/time cost class as a Video Compressor job (same order
  of magnitude timeout, per "Processing Architecture"), and re-introduces a (small,
  controllable) quality/generation loss the fast mode avoids entirely.
- This mode should reuse `buildFfmpegCompressionArguments`'s existing encoding-parameter
  conventions (`libx264`, `-preset`, CRF, `-pix_fmt yuv420p`, `aac` audio, `-movflags
  +faststart`, `shell: false` argument-array spawning) rather than inventing a new encoding
  parameter set from scratch — the only difference from a compression job is the addition of
  `-ss`/`-to` and (likely) *not* reducing quality/bitrate the way a compression preset does,
  since the point of a trim is "same quality, shorter duration," not "smaller file."

### Keyframes

The keyframe-boundary problem above is real and unavoidable with stream-copy trimming. Two
honest UX options exist, neither implemented by this document:
1. **"Fast" mode with honest messaging** — tell the user up front that fast trims snap to the
   nearest keyframe and may be off by up to N seconds, and offer "Accurate" as an explicit
   alternative for when exact timing matters.
2. **Default to accurate, offer fast as an opt-in "quick trim"** — inverts the framing so the
   default behavior always matches what the user asked for, at the cost of always paying
   re-encode time even for large, simple trims.

`QAVELIX_NEXT_TOOL_RESEARCH.md` explicitly lists this exact question among its unresolved
validation questions: *"What UX should be used when exact frame cuts require re-encoding but
faster lossless cuts are keyframe-bound?"* and *"Will users accept 'lossless when possible'
messaging, or do they expect exact frame precision every time?"* — this document does not
answer these; they are explicit open decisions (see below).

### Performance

- Fast mode: effectively free — bounded by disk I/O, not CPU. Should not meaningfully affect
  the single-worker queue's throughput even under concurrent load.
- Accurate mode: same cost profile as a Video Compressor job — should share the same queue,
  same worker, same 10-job queue cap, same timeout order of magnitude (proposed 12 minutes,
  matching Compressor rather than Extract Audio's shorter 8 minutes, since a full-source
  re-encode is the worst case this tool can produce).

### Expected behavior / advantages / trade-offs — summary table

| | Fast (stream copy) | Accurate (re-encode) |
|---|---|---|
| Speed | Near-instant | Same order as a compression job |
| Precision | Snapped to nearest keyframe | Exact, frame-accurate |
| Quality | Bit-identical to source | Re-encoded (controllable, near-lossless if tuned) |
| CPU cost | Negligible | Same class as Video Compressor |
| Queue impact | Minimal | Same as a compression job |
| Recommended default | **Open decision** — see above | **Open decision** — see above |

### Future improvements (not v1)

Frame-accurate *preview* before committing to a trim (would need browser-side seeking against
the uploaded file, not currently built for any tool), smarter keyframe-aware UI (e.g. snapping
the Start/End inputs visually to the nearest keyframe so "fast" mode's actual behavior matches
what the UI shows), and the roadmap items listed under "Future Roadmap" below.

---

## Error Handling

Every processing route in this codebase maps entitlement denials through a single shared
mapping (`src/lib/server/entitlements/errors.ts`) — Video Trimmer must reuse this mapping
exactly, not invent parallel error codes for the same underlying reasons:

| `EntitlementDenialReason` | HTTP status | Message (shared, not tool-specific) |
|---|---|---|
| `account_required` | 401 | "Create a free account to keep using this tool." |
| `usage_limit_reached` | 429 | "You have reached today's usage limit for this tool." |
| `tool_unavailable_for_plan` | 403 | "This tool is not available on your current plan." |
| `invalid_entitlement_state` | 500 | "Your account state could not be verified. Try again shortly." |
| `usage_service_unavailable` | 503 | "The usage service is temporarily unavailable. Try again shortly." |

**Every possible error this tool must handle, reusing existing categories where they already
exist and adding only genuinely new ones:**

- **Upload failures** — reused verbatim from the existing upload pipeline: `missing_file`,
  `invalid_extension`, `invalid_mime`, `invalid_signature`, `empty_file`, `file_too_large`,
  `invalid_size`, `truncated_upload`, `malformed_reference`, `invalid_reference`,
  `expired_reference`, `consumed_reference`, `metadata_mismatch` (all existing error codes
  from `analyzed-upload-registry.ts`/upload-validation.ts — see "Supported Inputs").
- **FFmpeg failures** — reused generic failure path (`status: "failed"`, `error` message set
  on the job), same as Compressor.
- **Invalid timestamps** — **(new)** the trim-specific validation errors listed under "Trim
  Configuration" (invalid range, out-of-bounds, malformed timestamp, duration-cap exceeded).
- **Timeouts** — reused: FFmpeg process killed (SIGTERM → SIGKILL after 5s) after the
  proposed 12-minute ceiling, job marked `failed`.
- **Cancelled jobs** — reused: `DELETE .../[id]` while queued/starting/running, same
  ownership-checked cancellation path as Compressor.
- **Corrupted media** — reused: FFprobe failure / no parseable video stream rejected before
  any FFmpeg trim work starts.
- **Unexpected server errors** — reused: generic `failed` status with a logged
  `logSecurityEvent("error", ...)` entry, never an unhandled exception reaching the client as
  a non-JSON response (the exact class of bug fixed in this repo's own CI history — see
  `git log` for "guarantee JSON error responses" — Video Trimmer's routes must follow the
  same "wrap the whole handler body in try/catch, always return `securityJson()`" pattern
  from day one, not retrofit it after a CI failure like the existing routes needed to).

---

## SEO

Modeled directly on Extract Audio's page — the only existing precedent for a "second tool"
page in this codebase.

- **URL**: `/tools/video-trimmer` (locale-prefixed: `/en/tools/video-trimmer`,
  `/pt-BR/tools/video-trimmer`, `/es/tools/video-trimmer`) — matches Extract Audio's
  `/tools/extract-audio` pattern exactly. File location:
  `src/app/[locale]/tools/video-trimmer/page.tsx`.
- **Title / Meta Description**: sourced from the tool's own dictionary entry
  (`dictionary.tools.videoTrimmer.title` / `.subtitle`), not a separate metadata namespace —
  matching Extract Audio's `generateMetadata()`, which reuses `dictionary.tools.extractAudio.title`/
  `.subtitle` directly rather than maintaining a parallel SEO-copy object.
- **Open Graph / Twitter Card / Canonical**: all produced automatically by the existing
  `buildSeoMetadata()` helper (`src/lib/metadata.ts`) when called with `{ title, description,
  locale, pathname: "/tools/video-trimmer" }` — no new metadata-building code needed. This
  includes canonical URL (via `buildLocalizedUrl`), hreflang alternates for all three locales
  (via `buildLocalizedAlternates`), OG type/locale/alternateLocale/siteName, and Twitter
  `summary` card.
- **Structured Data / Schema.org**: **this is a genuine gap in the existing precedent, not
  something to blindly copy.** Extract Audio's page currently ships **no JSON-LD at all**,
  despite having FAQ content (`dictionary.tools.extractAudio.faqItems`) rendered only as a
  visual accordion — the FAQPage/Question schema pattern that exists elsewhere in this
  codebase (`src/app/[locale]/[slug]/page.tsx`, used only for the static `/faq` content page)
  has never been applied to a tool page. **Recommendation**: Video Trimmer should be the tool
  that closes this gap — add `FAQPage` JSON-LD to its own page using the exact same pattern
  already proven on `/faq`, and consider a `WebApplication` JSON-LD block matching the
  homepage's existing (currently Compressor-only, hardcoded, not dictionary-driven) pattern —
  but do not silently expand scope to also add this to Extract Audio's existing page as a
  side effect; that would be an unrelated change riding along with this one.
- **Keywords**: derive from the actual product name/action, not a stuffed list — "video
  trimmer", "trim video online", "cut video online" (localized equivalents for pt-BR/es to be
  written by whoever owns copy, not invented in this spec).
- **Internal linking**: the header "Tools" dropdown (`app-header.tsx`'s `toolItems` array —
  see "Localization & Cross-Linking Integration Points") and the dashboard's tool-quick-links
  grid (`tool-quick-links.tsx`) are the two existing internal-link surfaces; both need a
  Video Trimmer entry for link parity with the other two tools. No footer change is needed —
  the footer has no per-tool links today for either existing tool.
- **Localized metadata**: full title/description/OG/Twitter/canonical/hreflang trio for all
  three locales — enforced structurally by `getDictionary(locale)` returning one complete
  literal object per locale (no partial/fallback-to-English mechanism exists in this
  codebase's i18n system, so all three locale entries must ship together, never partially).
- **Sitemap**: append `"tools/video-trimmer"` to the `toolPageSlugs` const array in
  `src/app/sitemap.ts` (currently `["tools/extract-audio"]`, with an explicit comment there
  noting Video Compressor is intentionally excluded because it *is* the homepage). Gets the
  same `changeFrequency: "weekly"`, `priority: 0.8` treatment as Extract Audio.

---

## Localization

Must support English (default), Brazilian Portuguese, European Spanish — the three locales
this codebase supports today (`src/i18n/locales.ts`), reusing the existing localization
architecture exactly (no new i18n mechanism, no partial-translation fallback).

**Confirmed product name per locale** (resolves Open Decision #7 below — no longer open):

| Locale | `dictionary.tools.videoTrimmer.title` | `dictionary.navigation.videoTrimmerTool` |
|---|---|---|
| `en` | Video Trimmer | Video Trimmer |
| `pt-BR` | Cortar Vídeo | Cortar Vídeo |
| `es` | Cortar Video | Cortar Video |

These are the exact strings for every user-facing occurrence of the product name — the page
`<title>` (via `generateMetadata`'s `title` field, itself sourced from
`dictionary.tools.videoTrimmer.title`), the header "Tools" dropdown entry, the dashboard
quick-links card label, and the tool-id-keyed usage/plan display label
(`dictionary.dashboard.usage.toolLabels["video-trimmer"]`). The `subtitle`/`description`/
`eyebrow` fields and all other copy remain free text for whoever writes full localized copy —
only the product name itself is fixed by this table.

**New dictionary namespace required**: `dictionary.tools.videoTrimmer`, sibling to the
existing `dictionary.tools.extractAudio`, matching that section's type shape field-for-field
(confirmed shape, `src/i18n/dictionaries.ts`):

```ts
tools: {
  videoTrimmer: {
    eyebrow: string;
    title: string;
    subtitle: string;
    description: string;
    uploadTitle: string;
    uploadDescription: string;
    privacyMessage: string;
    chooseFile: string;
    chooseAnotherFile: string;
    statusTitle: string;
    statusWaiting: string;
    statusReady: string;
    statusInvalid: string;
    statusValidating: string;
    statusUploading: string;
    statusAnalyzing: string;
    statusProcessing: string;
    statusPreparing: string;
    statusCompleted: string;
    statusFailed: string;
    // ... plus trim-specific fields with no Extract Audio equivalent:
    startTimeLabel: string;
    endTimeLabel: string;
    durationLabel: string;
    remainingDurationLabel: string;
    trimButton: string;
    downloadButton: string;
    downloadStartedMessage: string;
    cancelButton: string;
    deleteButton: string;
    infoTitle: string;
    infoItems: string[];
    faqTitle: string;
    faqItems: Array<{ question: string; answer: string }>;
    validation: {
      multipleFiles: string;
      emptyFile: string;
      fileTooSmall: string;
      fileTooLarge: string;
      invalidExtension: string;
      invalidMime: string;
      invalidRange: string;       // new
      rangeOutOfBounds: string;   // new
      malformedTimestamp: string; // new
      clipTooLong: string;        // new, only if a duration cap is adopted
    };
    errors: {
      // same shape as Extract Audio's errors block, plus trim-specific error keys
      missingFile: string;
      // ...
    };
  };
};
```

**Other files that need a sibling entry added, not a new mechanism**:
- `Dictionary.navigation.videoTrimmerTool: string` (header Tools dropdown label — sibling to
  `videoCompressorTool`/`extractAudioTool`).
- `Dictionary.dashboard.overview.tools.videoTrimmerLabel` /
  `.videoTrimmerDescription` (dashboard quick-links card copy).
- `Dictionary.dashboard.usage.toolLabels["video-trimmer"]` (usage/plan page's tool-id-keyed
  display label — this is a `Record<ToolId, string>`, so TypeScript will refuse to compile
  once `"video-trimmer"` is added to `ToolId` until this key exists in all three locale
  entries — a useful, existing compile-time safety net, not something this tool needs to add).

All of the above must be written for `en`, `pt-BR`, and `es` together — this codebase has no
partial-translation or English-fallback mechanism (per `QAVELIXPRO.md` Rule #7: "Never ship
copy in one locale without its `en`/`pt-BR`/`es` equivalents").

---

## Localization & Cross-Linking Integration Points

Exact registration points a full Video Trimmer implementation touches, beyond the
dictionary itself — listed here as a checklist, not narrative:

1. `src/lib/server/entitlements/policy.ts` — `TOOL_IDS`, `TOOL_POLICY.free`, `TOOL_POLICY.pro`.
2. `src/i18n/dictionaries.ts` — `tools.videoTrimmer`, `navigation.videoTrimmerTool`,
   `dashboard.overview.tools.videoTrimmerLabel`/`Description`,
   `dashboard.usage.toolLabels["video-trimmer"]` (×3 locales each).
3. `src/components/app-header.tsx` — new entry in the `toolItems` array (href, icon, label).
4. `src/components/dashboard/tool-quick-links.tsx` — new entry in the `tools` array.
5. `src/app/sitemap.ts` — `"tools/video-trimmer"` appended to `toolPageSlugs`.
6. `src/app/[locale]/tools/video-trimmer/page.tsx` — new page file (new).
7. `src/components/video-trimmer-tool.tsx` (or similar name, following
   `extract-audio-tool.tsx`'s naming convention) — new component (new).
8. `src/lib/server/video-trimmer.ts` or an extension of `compression-queue.ts` — new server
   processing module (new; see "Processing Architecture" for the reuse-vs-extend decision).
9. `src/app/api/video-trimmer/jobs/route.ts` + `[id]/route.ts` + `[id]/download/route.ts` (or
   equivalent, mirroring the compression API shape exactly) — new API routes (new).

Items 1–5 are pure additions to existing shared registries — no existing behavior changes.
Items 6–9 are new files following existing file patterns exactly.

---

## Security

**Reuse every protection already implemented — introduce no new security mechanism, and no
weaker version of an existing one.**

- **Input validation**: identical to the upload pipeline (see "Supported Inputs" /
  "Validation"), plus the new trim-range validation (server-side authoritative, client-side
  UX-only — never trust the client range).
- **File validation**: extension + MIME + binary-signature checks, unchanged, reused.
- **Ownership validation**: every job-scoped route (status/cancel/download) must funnel
  through an `isJobOwnedByActor`-equivalent check before returning or acting on anything —
  this is **Security Correction #4** in this codebase's own terms (the compression-job IDOR
  fix: `src/lib/server/compression-queue.ts`, `isJobOwnedByActor()`, applied at the route
  layer in `src/app/api/compression/jobs/[id]/route.ts` and the download route). An
  unauthorized job must return the **identical** generic 404 a nonexistent job returns —
  never a distinguishable "wrong owner" response. Video Trimmer's job routes must reproduce
  this pattern exactly, including its own dedicated authorization test suite (see "Testing
  Plan" — `compression-authorization.test.mjs` has no Extract Audio equivalent today; Video
  Trimmer should not repeat that gap).
- **Authentication behavior**:
  - **Anonymous users**: fully supported, via `resolveActor(request)` (no session →
    `{ type: "anonymous", id: <fingerprint> }`), pooled against the shared `"any"` anonymous
    bucket — no anonymous-specific code path needed in the route itself, this is handled
    entirely by the existing `resolveActor()`/`TOOL_POLICY` machinery.
  - **Authenticated (Free) users**: `resolveActor()` resolves `{ type: "user", id, plan:
    "free" }` via `getOptionalSession()` + `getPlan()`.
  - **Pro users**: same resolution path, `plan: "pro"`, `getPlan()`'s existing self-heal
    logic against Stripe's subscription table applies unchanged — no Trimmer-specific
    billing code.
- **Download authorization**: reuse the exact three-layer check Compressor's download route
  uses — (1) format validation (`assertValidJobId`/`assertValidSignedValue`), (2) HMAC
  signature + 30-minute TTL check (`constantTimeEqual`/`timingSafeEqual`), (3) ownership check
  (`isJobOwnedByActor`). All three required; any failure returns the same generic 404.
- **Rate limits**: every Trimmer API route must call `enforceApiSecurity(request, { route,
  limit, windowMs, requireSameOrigin })` — the same function every existing state-changing
  route calls, with route-specific `limit`/`windowMs` values chosen the way Compressor's are
  (e.g. job-status polling gets a higher limit than job creation, matching
  `compression.status: 120/60s` vs. the creation route's tighter limit). `requireSameOrigin:
  true` on every state-changing route (create/cancel), same CSRF protection as Compressor.
- **Temporary file cleanup**: reuse the exact lock/expiration/cleanup pattern
  (`acquireJobLock`, `scheduleExpiration`, `cleanupJobFiles`) — no new cleanup mechanism.
- **No path traversal**: reuse `sanitizeExtension()`/UUID-based file naming already used for
  compression job input/output paths — trimmed output files must be named the same
  UUID-derived way, never derived from user-controlled filename input.
- **No IDOR**: covered above under "Ownership validation" — this is the single most
  security-critical piece of this entire spec to get right on day one, per this codebase's
  own git history (Security Correction #4 was a *fix* to an already-shipped IDOR bug in
  Compressor's job routes — Video Trimmer must not repeat that history by shipping the same
  class of bug and needing its own "Correction #6" later).
- **Command injection**: `child_process.spawn("ffmpeg", args, { shell: false })` — argument
  arrays, never string concatenation, everywhere. This applies with extra weight to Video
  Trimmer specifically, since `-ss`/`-to` timestamp values are user-controlled input flowing
  directly into an FFmpeg argument list — validate and coerce to a safe numeric/string
  representation server-side before ever placing them in the argument array (the existing
  trim-range validation rules already require this; this note just makes the security
  motivation for that validation explicit).

---

## Performance

- **Reuse asynchronous processing** — see "Processing Architecture." No synchronous
  long-running request for the re-encode (accurate) path.
- **Reuse the existing single-worker queue** — no new worker infrastructure, no new
  concurrency model. Same `maxQueuedJobs` ceiling (10) applies, shared across whichever tools
  use the same queue.
- **Minimize memory usage** — reuse the existing streamed-to-disk upload pattern (never
  buffer a full video in memory), same as both existing tools' upload handling.
- **Avoid unnecessary re-encoding** — this is the entire point of offering a "fast"
  stream-copy mode (see "FFmpeg Strategy"). A trim that doesn't need frame-exact precision
  should never pay a full re-encode's CPU cost if the fast path is available and its
  keyframe-snapping trade-off is acceptable to the user.
- **Concurrency ceiling**: `docs/architecture/hosting-decision.md`'s revisit trigger (quoted
  in `QAVELIXPRO.md`) — "compression-job volume or concurrent load approaching the ceilings in
  `QAVELIX_CAPACITY_REPORT.md` (temp-disk exhaustion around 5-10 concurrent max-size uploads;
  FFmpeg worker becoming the bottleneck before a third processing-heavy tool exists)" —
  directly names a third processing-heavy tool as the trigger to revisit the single-instance
  architecture. Video Trimmer, if it shares Compressor's worker/queue, **is** that third
  tool. This should be treated as a real capacity-planning input, not a footnote — see "Open
  Decisions."

---

## Testing Plan

Modeled on the exact existing test coverage shape for Video Compressor and Extract Audio —
same layers, same file-naming convention, no new testing framework or pattern.

**Unit tests** (`tests/unit/`, Node's built-in test runner, source-pattern convention for
files importing real `"@/"` aliases):
- `video-trimmer-tool-source.test.mjs` — mirrors `extract-audio-tool-source.test.mjs`'s
  pattern (reads the real `.tsx` component as text, asserts regex patterns against it —
  necessary because these components import server-only-resolvable aliases Node's native TS
  loader can't handle outside the Next build).
- A trim-range validation logic unit test (pure function, if extracted the way
  `compression-precheck.ts` is pure and directly importable) — the one part of this feature
  that *can* be tested as plain imported functions rather than source-pattern matching.
- Entitlements-policy test coverage extension: confirm `TOOL_IDS`/`TOOL_POLICY` include
  `"video-trimmer"` with the agreed numbers (mirrors the existing
  `tests/unit/*entitlements*`/`*policy*` coverage pattern for the other two tools).

**Integration tests** (`tests/integration/`, real Next server + real FFmpeg via
`withNextServer()`):
- `video-trimmer.test.mjs` (or split, mirroring Compressor's file organization) — job
  create → poll → download, modeled on `compression-download.test.mjs`'s shape (real fixture
  video via `execFile("ffmpeg", ...)`, real HTTP requests, real assertions on status/headers).
- **`video-trimmer-authorization.test.mjs`** — modeled directly on
  `compression-authorization.test.mjs` (398 lines, the existing Security Correction #4
  regression suite): every actor-pair combination (anonymous vs. anonymous, authenticated vs.
  authenticated, anonymous vs. authenticated, post-logout revocation, invalid session cookie).
  **This is explicitly called out because Extract Audio shipped without an equivalent file**
  (confirmed by grep — no ownership/IDOR test exists for Extract Audio today) — Video Trimmer
  must not repeat that gap, especially since it's proposed as a job-based (poll/cancel/download)
  tool like Compressor, not a fire-and-forget synchronous one like Extract Audio.
- A trim-specific edge-case file (mirroring `avi-mime.test.mjs`'s format-specific shape, or
  `extract-audio-4k.test.mjs`'s large-file shape) — e.g. trimming a range near the very start
  or very end of a source, a range covering the entire video, a keyframe-boundary edge case
  for fast mode specifically.
- Skip-gracefully guard when `DATABASE_URL` isn't configured, matching every existing
  `*-db.test.mjs`-style file's established convention (`loadDatabaseUrl()` +
  `{ skip: "DATABASE_URL is not configured" }`) — see this repo's own recent CI history for
  why this matters: multiple existing integration test files had to be retrofitted with this
  guard after shipping without it; Video Trimmer's tests should ship with it from day one.

**End-to-end tests** (`tests/e2e/`):
- A rendered-page test for `/{locale}/tools/video-trimmer`, modeled on
  `tests/e2e/rendering.test.mjs`'s shape (fetch real HTML via `withNextServer()` +
  `fetchText`, assert on rendered markup and any JSON-LD present). **Note**: Extract Audio has
  no e2e page test today either (confirmed by grep) — Video Trimmer should not inherit that
  gap, since this document is explicitly trying to raise the bar relative to what shipped for
  the second tool, not just match it.

**Performance tests**: not a distinct existing test layer in this codebase today — if added,
should measure fast-mode trim latency (expected near-instant) vs. accurate-mode trim latency
(expected comparable to a compression job of similar source size) as a concrete regression
guard against the fast path accidentally regressing into always re-encoding.

**Regression tests**: the authorization suite above *is* the regression-test category for
this tool, following this codebase's own convention that ownership/IDOR fixes get named,
numbered "Security Correction" regression coverage (`QAVELIXPRO.md` Rule #11 explicitly
protects existing tests that "encode a specific historical bug" from casual removal — Video
Trimmer's authorization suite should be written with that same permanence in mind from the
start).

**Security tests**: covered by the authorization suite plus the existing shared
`enforceApiSecurity`/rate-limit/CSRF test coverage, which is route-agnostic and automatically
applies once Trimmer's routes call the same shared function.

**Accessibility tests**: no dedicated automated a11y test layer exists in this codebase today
for either existing tool (manual checklist only, per `QAVELIXPRO.md`'s Testing Checklist) —
Video Trimmer should be verified against that same manual checklist (skip link, landmarks,
keyboard focus, reduced-motion), not held to a different/higher automated bar than its
siblings without a broader decision to add automated a11y testing project-wide.

---

## Future Roadmap (explicitly deferred — do not build in v1)

Per `QAVELIX_NEXT_TOOL_RESEARCH.md`'s own "first implementation should avoid" list, plus
naturally-following extensions:

- Frame preview (would require browser-side or server-side thumbnail/seek generation not
  currently built for any tool).
- Timeline slider / drag handles for visual range selection (v1 uses plain time-input
  fields, per "Trim Configuration" — a slider is a pure UI enhancement on top of the same
  underlying start/end-seconds data model, safe to add later without an API change).
- Multiple cuts in a single job (v1 is exactly one contiguous range).
- Merge after trimming (a fundamentally different feature — combining outputs — out of scope).
- Smart trimming (e.g. silence-aware or scene-detection-assisted range suggestions).
- Batch trimming (multiple source files in one job — `QAVELIX_NEXT_TOOL_RESEARCH.md` lists
  this as a Pro-tier candidate benefit, not an MVP requirement).
- Preview thumbnails (frame-accurate scrubbing preview before committing to a trim).
- Precise trimming mode / Fast trimming mode as a persisted user *preference* (v1 treats this
  as a per-job choice at most, not a saved setting — see "FFmpeg Strategy" open decision).

---

## Open Decisions Before Implementation Starts

Explicit, unresolved questions this document deliberately does not answer — implementation
should not begin until these have real answers, per this document's own "specify first"
mandate:

1. **Free/Pro limits**: Option A (mirror existing 10/day Free, 100/day Pro, same upload
   ceilings) vs. Option B (lower trim-specific limits + a new clip-duration cap) — see "Free
   / Pro Entitlements."
2. **Fast vs. Accurate default**: which mode is the default, and how is the keyframe-snapping
   trade-off of fast mode communicated to the user — see "FFmpeg Strategy."
3. **Job model implementation**: extend `compression-queue.ts`'s existing worker to handle a
   discriminated `kind: "compress" | "trim"` job, or build a fully separate
   `video-trimmer-queue.ts` module that happens to share the same *patterns* but not the same
   *code*. This is a real architectural fork with different maintenance trade-offs, not
   resolved by this document.
4. **Capacity/telemetry precondition**: `QAVELIX_CAPACITY_REPORT.md`'s own recommendation
   gates Video Trimmer behind "operational telemetry proves headroom" — that telemetry
   (`QAVELIXPRO.md` Roadmap item 5) has not been built yet. Decide whether Trimmer proceeds
   without it, or whether the telemetry work becomes a hard prerequisite.
5. **`optimized`/`compression_ineffective` status semantics for a trim job** — these two
   `CompressionJobStatus` values encode "did compression actually shrink the file," a
   question that doesn't map cleanly onto trimming. Decide whether to collapse both into a
   single `completed` status for trim jobs, or find a trim-appropriate equivalent (e.g. "was
   the output meaningfully shorter than the input").
6. **FAQPage JSON-LD scope**: this document recommends Video Trimmer be the first tool page
   to ship structured FAQ data (closing an existing gap on Extract Audio's page too) — confirm
   this is in scope for the Video Trimmer launch, or explicitly deferred to a separate,
   dedicated SEO pass across all tool pages.
7. ~~**Naming**~~ — **Resolved.** Product name per locale: `en` "Video Trimmer", `pt-BR`
   "Cortar Vídeo", `es` "Cortar Video" (see "Localization" above). Tool id (`video-trimmer`)
   and URL (`/tools/video-trimmer`) stay kebab-case English regardless of locale, matching
   the existing `video-compressor`/`extract-audio` convention (locale only changes the
   URL *prefix*, never the tool-id segment itself).

---

## Implementation Phase

**Do not start implementation from this document alone.** Once the open decisions above are
resolved, implementation should follow the same phased structure
`docs/tools/extract-audio/ROADMAP.md` outlined (even though that specific file was never
carried through) — research/spec (this document) → architecture review against the resolved
open decisions → MVP implementation → testing/stabilization → SEO/localization →
production launch → metrics/monetization validation. This document constitutes the completed
first phase only.

---

## References

- `QAVELIXPRO.md` — this repo's operational-memory document; source of the roadmap ranking,
  the `TOOL_POLICY` numbers, and the documentation-drift precedent this spec deliberately
  avoids repeating.
- `CLAUDE.md` — architecture/convention reference; every "reuse X" instruction in this
  document is grounded in the module responsibilities `CLAUDE.md` documents.
- `QAVELIX_NEXT_TOOL_RESEARCH.md` — primary product-research source for Video Trimmer
  specifically (target users, competitors, suggested limits, FFmpeg baseline, open validation
  questions).
- `QAVELIX_CAPACITY_REPORT.md` — infrastructure-readiness ranking and the capacity/telemetry
  precondition.
- `QAVELIX_STRATEGIC_RESEARCH.md` — third independent ranking/prioritization source (P0,
  1-week estimate — flagged as needing reconciliation with the other two estimates).
- `docs/architecture/growth-strategy.md` — pricing-model philosophy (flat daily allowance,
  no credits) and the explicit documentation-drift warning this spec follows.
- `docs/architecture/hosting-decision.md` — single-instance capacity ceiling and its revisit
  trigger, directly relevant to whether Video Trimmer can safely share Compressor's worker.
- `docs/tools/extract-audio/` — the prior (incomplete) attempt at a per-tool planning folder;
  read as a cautionary precedent, not a template to repeat.
- Source files cited throughout: `src/lib/server/entitlements/policy.ts`,
  `src/lib/server/entitlements/service.ts`, `src/lib/server/entitlements/errors.ts`,
  `src/lib/server/security.ts`, `src/lib/server/origin.ts`,
  `src/lib/server/compression-queue.ts`, `src/lib/compression-policy.ts`,
  `src/lib/server/extract-audio.ts`, `src/lib/server/ffprobe.ts`,
  `src/lib/server/upload-validation.ts`, `src/lib/server/analyzed-upload-registry.ts`,
  `src/lib/upload-policy.ts`, `src/lib/use-entitlement-gate.ts`,
  `src/components/compression-panel.tsx`, `src/components/extract-audio-tool.tsx`,
  `src/app/[locale]/tools/extract-audio/page.tsx`, `src/app/sitemap.ts`,
  `src/components/app-header.tsx`, `src/components/dashboard/tool-quick-links.tsx`,
  `src/i18n/dictionaries.ts`, `src/i18n/locales.ts`, `src/lib/metadata.ts`,
  `src/styles/globals.css`.
