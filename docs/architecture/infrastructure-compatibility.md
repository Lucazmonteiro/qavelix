# QAVELIX Infrastructure Compatibility Review

Date: 2026-07-24

Scope: whether [platform-architecture.md](./platform-architecture.md)'s recommended design is compatible with the current QAVELIX stack — Next.js, the FFmpeg pipeline, Render, Cloudflare, and the current upload/queue/storage implementations. This document only issues verdicts; it doesn't propose new design (that's the previous document's job).

## Purpose & method

Every component below gets one of two verdicts:

- **Keep as-is** — compatible with the target architecture without modification.
- **Must change** — incompatible, with the specific reason and what replaces it.

The goal is an honest split, not a recommendation to replace everything. Several components below genuinely need no change.

---

## Next.js (App Router / Turbopack)

**Verdict: split — web/API surface keeps as-is; the compression execution path must change.**

Next.js's routing, server-side rendering, static generation (`generateStaticParams` for the locale/content pages), and validation-only API responsibilities (`/api/upload/analyze`'s streaming-to-disk-then-validate logic) are all compatible with Vercel deployment exactly as configured today — `next.config.ts`'s `output: "standalone"` setting is actually irrelevant to Vercel (that setting is for the Docker/container path) and can stay for the worker-tier build without conflict.

The compression execution path specifically — `compression-queue.ts`'s in-memory `Map`/`queue: string[]`, `child_process.spawn` FFmpeg invocation held open across the life of a job, and the module-level `activeJobId` singleton — is **incompatible with Vercel serverless functions** as a hosting target for that logic, stated plainly, not softened. Serverless functions are stateless between invocations (nothing guarantees the same warm instance handles the next poll request) and time-limited (Vercel's default execution limits are well under the 12-minute FFmpeg timeout the current code already allows for). A spawned FFmpeg process and an in-memory job queue cannot survive being hosted this way. This is the direct, concrete reason the worker tier must be a persistent container, not a serverless function — not a preference, a hard constraint of the current code's structure.

## FFmpeg/FFprobe pipeline

**Verdict: keep as-is, relocate to the worker tier.**

`buildFfmpegCompressionArguments`, `createCompressionEncodingPlan`, and the CRF/bitrate/preset logic in `compression-policy.ts` are pure, environment-agnostic functions — none of this needs to change regardless of where the process spawning happens. `spawn("ffmpeg", args, { shell: false })` in `compression-queue.ts` needs an environment where the `ffmpeg`/`ffprobe` binaries are actually installed and where a spawned child process can run for minutes — the current `Dockerfile` already does exactly this (`RUN apk add --no-cache ffmpeg` on a `node:24-alpine` image). That Dockerfile is not obsolete under this architecture — it becomes the worker tier's build, not the whole application's build.

## Render

**Verdict: keep, repurposed as the worker tier.**

Render doesn't need to be replaced — it needs its role in the architecture named explicitly, which it currently isn't (see [business-review.md](./business-review.md)'s finding on the Render/Vercel contradiction). Render Standard already runs a persistent container capable of hosting long-lived FFmpeg processes and a stateful queue; under this architecture, it becomes exactly that, and only that — the web tier moves to Vercel, Render stops serving pages entirely. The `proxy.ts` redirect currently sending traffic away from `qavelix.onrender.com` toward `qavelix.com` should be revisited once Render's role is formalized as an internal worker (likely reachable only from the Vercel web tier, not from public traffic at all) rather than a legacy domain being redirected away from.

## Cloudflare

**Verdict: no change needed.**

Cloudflare's current role — DNS and edge security headers only, explicitly told in `docs/DEPLOYMENT.md` not to cache API routes — doesn't change under this architecture. Cloudflare doesn't need to know that job execution moved to a separate worker tier; it's still just fronting the same public domain pointed at Vercel. This is the one deliberate "no change" verdict in this review, included so the document doesn't read as recommending disruption everywhere it touches.

## Current upload flow

**Verdict: must change — storage backend only, not the validation logic.**

`/api/upload/analyze`'s validation sequence (extension check, MIME check, binary signature check, streamed-to-disk size verification, FFprobe metadata extraction) is sound and tool-agnostic already — none of that logic needs to change. What must change is *where* the streamed file lands: today it's `os.tmpdir()/qavelix-upload-analysis` on the same instance that will later run FFmpeg. Once the web tier (receiving the upload) and the worker tier (running FFmpeg) are different processes on different hosts, the upload target becomes object storage, and the "analyzed upload reference" (`analyzed-upload-registry.ts`) becomes a pointer to an object-storage key instead of a local path.

## Current queue architecture

**Verdict: must change**, per the Next.js verdict above — in-memory `Map` and local JSON snapshot replaced by the durable `jobs` table and managed queue described in [platform-architecture.md](./platform-architecture.md). The job status state machine itself (`CompressionJobStatus` and its transition rules in `compression-policy.ts`) is correct and reusable without modification — only the storage/dispatch layer underneath it changes.

## Current storage strategy

**Verdict: must change** — local temp files become object storage, per the Storage Strategy section of [platform-architecture.md](./platform-architecture.md). The signed-download-URL pattern built on top of that storage (`DOWNLOAD_TTL_MS`, HMAC-signed tokens) is explicitly **kept, not redesigned** — presigned object-storage URLs are a drop-in replacement for the same download UX, so users see no difference.

---

## Summary verdict table

| Component | Verdict | Reason |
|---|---|---|
| Next.js — web/API surface | Keep as-is | Stateless, time-bounded requests; Vercel-compatible already |
| Next.js — compression execution path | Must change | In-memory `Map`/spawned process incompatible with serverless functions |
| FFmpeg/FFprobe pipeline (logic) | Keep as-is | Pure functions, environment-agnostic |
| FFmpeg/FFprobe pipeline (execution) | Relocate | Needs a persistent process host — the worker tier |
| Render | Keep, repurpose | Becomes the dedicated worker tier, not the whole app host |
| Cloudflare | No change | DNS/edge headers only; role is unaffected by the split |
| Upload flow (validation logic) | Keep as-is | Extension/MIME/signature/FFprobe checks are sound and tool-agnostic |
| Upload flow (storage target) | Must change | Local disk → object storage, once web/worker tiers split |
| Queue architecture (state machine) | Keep as-is | `CompressionJobStatus` model is correct and reusable |
| Queue architecture (storage/dispatch) | Must change | In-memory `Map` → durable `jobs` table + managed queue |
| Storage strategy (signed-URL pattern) | Keep as-is | Presigned object-storage URLs are a drop-in replacement |
| Storage strategy (file location) | Must change | Local temp files → object storage |
