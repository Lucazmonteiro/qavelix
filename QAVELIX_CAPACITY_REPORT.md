# QAVELIX Capacity, Cost and Monetization Report

Date: 2026-07-23

Scope: capacity planning for the current QAVELIX production architecture. This is an analysis report only. No application code was modified.

> **Update note (post-Milestone: plan-based upload limits):** every disk/RAM/network burst-capacity figure in this report — including the worst-case multi-upload calculations below — was modeled against a flat 250MB upload ceiling for every actor. That ceiling now applies only to Free and anonymous actors; QAVELIX PRO's real ceiling is 500MB (`PRO_MAX_UPLOAD_BYTES` in `src/lib/server/entitlements/policy.ts`, doubling both the per-upload disk/network footprint and, potentially, FFmpeg processing time for Pro-tier jobs). This report's specific byte totals below are historical and were not recalculated for the new ceiling — treat them as the pre-Pro baseline, and revalidate the burst-capacity and FFmpeg-timeout assumptions (`ffmpegTimeoutMs` in `compression-queue.ts`/`extract-audio.ts`) against real 500MB-class jobs before relying on them for production capacity planning.

## Executive Summary

QAVELIX currently runs a conservative single-worker video compression architecture on Render Standard: 1 vCPU, 2 GB RAM, Docker, Next.js, FFmpeg, Cloudflare, and temporary local disk. The implementation is intentionally safer than it is scalable: uploads are streamed to disk, compression jobs are queued, and only one FFmpeg job runs at a time.

That design is appropriate for an early production MVP. It protects a 2 GB container from CPU and memory collapse, but it also means throughput is limited by one serial FFmpeg worker.

Best current-infrastructure roadmap for one developer, one low-spec notebook, Render Standard, 40 days, and limited budget:

1. Stabilize and measure the current Video Compressor for 7 days: collect job duration, input size, output size, failure rate, queue depth, and disk usage.
2. Add **Extract Audio** as the next paid/SEO tool because it reuses the current upload/FFmpeg/download pipeline, is lighter than full compression, and can reach revenue quickly.
3. Add **Audio Converter/Compressor** after Extract Audio because it has low infrastructure cost and expands the platform into "media optimization" without heavy video CPU.
4. Defer **Video to GIF** until paid limits and infrastructure scaling are in place.
5. Defer generic image tools unless they are implemented fully browser-side and bundled into a broader utility suite.

If I were CTO, I would not launch another CPU-heavy video operation before adding operational telemetry and Pro/fair-use limits. The current Render Standard plan is enough for early traffic, but not enough for unbounded video workloads.

## Inspected Files

Application and infrastructure files inspected:

- `src/lib/upload-policy.ts`
- `src/app/api/upload/analyze/route.ts`
- `src/lib/server/analyzed-upload-registry.ts`
- `src/lib/server/ffprobe.ts`
- `src/lib/compression-policy.ts`
- `src/lib/server/compression-queue.ts`
- `src/app/api/compression/jobs/route.ts`
- `src/app/api/compression/jobs/[id]/route.ts`
- `src/app/api/compression/jobs/[id]/download/route.ts`
- `src/lib/server/security.ts`
- `next.config.ts`
- `Dockerfile`
- `package.json`
- `src/components/compression-panel.tsx` was inspected through targeted search for frontend API flow and cleanup behavior.

External reference:

- Render pricing page checked on 2026-07-23: Standard is listed at about **$25/month** with **2 GB RAM**. Source: https://render.com/pricing

## Current Architecture

### High-Level Flow

1. User selects a video in the browser.
2. Browser sends raw upload bytes to `POST /api/upload/analyze`.
3. Server streams the request body to local disk under `os.tmpdir()/qavelix-upload-analysis`.
4. Server validates file name, extension, MIME type, declared size, actual streamed size, and first bytes/signature.
5. Server runs `ffprobe` with a 20-second timeout to extract media metadata.
6. Server creates an opaque analyzed-upload reference with a 15-minute TTL.
7. Browser submits `POST /api/compression/jobs` with the upload reference and preset.
8. Server consumes the reference, moves the uploaded file into `os.tmpdir()/qavelix-compression`, creates a job record, persists metadata, and queues the job.
9. A single in-process worker runs FFmpeg.
10. Browser polls `GET /api/compression/jobs/{id}`.
11. When complete, server prepares a signed download URL.
12. Browser downloads from `GET /api/compression/jobs/{id}/download`.
13. Input files are deleted after successful compression; output files expire after 30 minutes or are deleted by user action.

### Upload Flow

Verified facts from code:

- Upload limit: `MAX_UPLOAD_BYTES = 250 * 1024 * 1024`.
- Request overhead limit: `MAX_UPLOAD_REQUEST_BYTES = MAX_UPLOAD_BYTES + 2 MB`.
- Next config sets `experimental.proxyClientMaxBodySize` to the shared upload request limit.
- Supported upload MIME types: MP4, QuickTime/MOV, WebM, AVI, MPEG.
- Supported extensions: `.mp4`, `.m4v`, `.mov`, `.webm`, `.avi`, `.mpg`, `.mpeg`.
- Upload body is streamed to disk, not buffered as a multipart body.
- Upload analysis rate limit: 10 requests/minute/fingerprint.
- Same-origin is required for upload analysis.

Capacity implication:

The upload path is memory-safe for 250 MB files because it streams to disk. The bottlenecks are network ingress, temporary disk, and FFprobe concurrency, not Node heap.

### Processing Flow

Verified facts from code:

- Compression jobs are represented by an in-memory `Map` plus persisted JSON metadata under `os.tmpdir()/qavelix-compression/jobs`.
- Queue max depth: `maxQueuedJobs = 10`.
- Only one active job exists at a time: `activeJobId`.
- FFmpeg timeout: 12 minutes.
- FFmpeg encoder threads: 2.
- x264 lookahead threads: 1.
- Retained job count in memory is pruned after 50 jobs.
- Presets:
  - Smaller File: CRF 31, audio 96 kbps, `veryfast`, source bitrate ratio 0.45, max video bitrate 2200 kbps.
  - Balanced: CRF 26, audio 160 kbps, `veryfast`, preserves original resolution unless bounded to Full HD safety caps, source bitrate ratio 0.7, max video bitrate 6500 kbps.
  - High Quality: CRF 20, audio 256 kbps, `fast`, source bitrate ratio 0.92, max video bitrate 14000 kbps.
- Output is MP4/H.264/AAC with `+faststart`.

Important nuance:

Although preset objects say Balanced and High Quality preserve resolution, the encoding plan still applies global Full HD bounding via `getBoundedOutputDimensions()`. This is a product/quality note, not a capacity issue. Capacity-wise, bounding very large video to Full HD protects CPU and output size.

### Temporary Files

Verified facts from code:

- Upload temp directory: `os.tmpdir()/qavelix-upload-analysis`.
- Upload records directory: `os.tmpdir()/qavelix-upload-analysis/records`.
- Consumed records directory: `os.tmpdir()/qavelix-upload-analysis/records/consumed`.
- Compression temp directory: `os.tmpdir()/qavelix-compression`.
- Compression job metadata directory: `os.tmpdir()/qavelix-compression/jobs`.
- Compression lock directory: `os.tmpdir()/qavelix-compression/locks`.

Temporary file lifecycle:

- Raw upload remains in upload-analysis storage until consumed, deleted, or expired.
- Analyzed upload references expire after 15 minutes.
- On compression job creation, the uploaded input is moved to compression storage.
- On successful compression, input file is deleted after output verification.
- Output file remains available for 30 minutes.
- Failed/cancelled/deleted/expired jobs clean input/output files.

### Download Flow

Verified facts from code:

- Download TTL: `DOWNLOAD_TTL_MS = 30 * 60 * 1000`.
- Download URL includes token and HMAC signature.
- Download route validates UUID, token, signature, expiration, and job state.
- Download response streams via `createReadStream`; it does not buffer the full file.
- Download response uses `Cache-Control: private, no-store`.
- Download rate limit: 60 requests/minute/fingerprint.

Capacity implication:

Download is memory-safe but consumes outbound bandwidth and keeps output files on disk until expiration.

### Cleanup Flow

Verified facts from code:

- Invalid upload temp files are deleted in route `finally`.
- Expired analyzed uploads are cleaned when creating a new analyzed upload record.
- Consumed upload records are moved to `records/consumed`.
- Compression input files are deleted after successful output verification.
- Compression output files are deleted on 30-minute expiration or explicit delete.
- Failed/cancelled jobs call cleanup for input and output.

Risk:

Cleanup is mostly event-driven and in-process. If the container crashes, persisted job metadata helps detect interrupted jobs, but local temp files may remain until later requests trigger cleanup or the container filesystem resets. There is no external persistent queue or centralized scheduled cleanup service.

## Resource Usage Estimates

Assumptions:

- Render Standard: 1 vCPU, 2 GB RAM.
- Upload limit: 250 MB.
- One active FFmpeg compression at a time.
- Queue up to 10 jobs.
- Typical videos range from 50 MB to 250 MB.
- Output size can range from 5% to 100%+ of input depending on preset/content.
- Download TTL is 30 minutes.
- These are planning estimates, not benchmark measurements.

### One User

| Resource | Upload only | Active compression | Download |
|---|---:|---:|---:|
| CPU | Low to Medium during FFprobe | High, often near 100% of 1 vCPU | Low |
| RAM | 150-350 MB Node/container overhead plus stream buffers | 500 MB-1.2 GB combined Node + FFmpeg, content-dependent | 150-350 MB plus stream buffers |
| Disk temp | Up to 250 MB upload | Input up to 250 MB plus growing output, usually 20-250 MB | Output retained up to 30 min |
| Network | Up to 250 MB ingress | Minimal external network | Output egress, often 20-250 MB |
| User experience | Good | Depends on FFmpeg duration | Good if output exists |

### Five Simultaneous Users

| Resource | Estimate |
|---|---|
| CPU | Upload validation/FFprobe can overlap; one FFmpeg job saturates CPU. Remaining jobs wait. |
| RAM | Usually 600 MB-1.5 GB if uploads stream correctly; danger rises if multiple FFprobe processes overlap. |
| Disk temp | Worst case 5 x 250 MB uploads = 1.25 GB, plus one active compression input/output = 250-500 MB, plus completed outputs. Practical burst requirement: 2-3 GB. |
| Network | Up to 1.25 GB ingress during burst, plus downloads later. |
| Expected bottleneck | CPU for compression and disk temp if users upload max-size files before jobs complete. |

### Ten Simultaneous Users

| Resource | Estimate |
|---|---|
| CPU | One active compression. Other users queue. FFprobe bursts can cause latency spikes. |
| RAM | 1.0-2.0 GB risk zone depending on FFprobe concurrency, Next overhead, and OS cache. |
| Disk temp | Worst case 10 x 250 MB uploads = 2.5 GB, plus active input/output 250-500 MB, plus output retention. Practical burst requirement: 4-6 GB. |
| Network | Up to 2.5 GB ingress in a short window, plus output egress. |
| Expected bottleneck | Queue wait time, temp disk, CPU saturation, and user patience. |

## Production Limits

### Maximum Simultaneous Compressions

Verified current behavior:

- The code allows **1 active compression at a time**.
- Queue capacity is **10 pending jobs**.

Recommended operational limit on Render Standard:

- **1 active compression** is correct.
- Do not increase to 2 active FFmpeg processes on 1 vCPU/2 GB RAM unless benchmarks prove stable.

### Safe Concurrent Uploads

Technical upper bound from rate limits:

- Upload analysis allows 10/minute/fingerprint, but this is not a global capacity limit.

Safe operational estimate:

- 1-3 concurrent max-size uploads: safe.
- 5 concurrent max-size uploads: acceptable only if temp disk has several GB free and FFprobe does not spike.
- 10 concurrent max-size uploads: risky on Render Standard because temp storage can grow quickly and queue wait becomes poor.

Recommended product limit:

- Free users: throttle to 1 active upload/job per user/session.
- Pro users: allow 2 active uploads but still only one active compression globally until infrastructure scales.

### Maximum Daily Jobs

Theoretical based on compression duration:

- If average compression takes 2 minutes: 720 jobs/day.
- If average compression takes 5 minutes: 288 jobs/day.
- If average compression takes 8 minutes: 180 jobs/day.
- If average compression hits the 12-minute timeout: 120 jobs/day.

Safe planning estimate for current MVP:

- 50-150 completed compression jobs/day is comfortable.
- 150-300 jobs/day is possible but queue waits and support complaints likely rise.
- 300+ jobs/day requires monitoring, scaling, or a worker architecture.

### Expected Bottlenecks

1. CPU: FFmpeg saturates 1 vCPU.
2. Queue depth: max 10 queued jobs, one active worker.
3. Temp disk: local filesystem must hold uploaded, queued, active, and completed output files.
4. Container lifecycle: local temp files vanish on redeploy/restart; jobs are not durable across instance replacement.
5. Memory: not upload buffering, but FFmpeg/FFprobe/container overhead during bursts.
6. Network egress: repeated downloads of large outputs.
7. User patience: serial processing causes wait time under load.

## Render Standard Analysis

Current plan: Render Standard, 1 vCPU, 2 GB RAM.

Current monthly base cost estimate:

- Render Standard web service: about **$25/month** based on Render public pricing page checked 2026-07-23.
- Cloudflare: likely low/no incremental cost at current stage, assuming standard CDN/DNS usage.
- Google Search Console: no direct cost.
- Domain: separate annual cost, not included.

### Is Render Standard Sufficient?

Yes, for early MVP traffic if all of the following remain true:

- One active compression worker.
- Upload limit remains 250 MB.
- No "unlimited" free usage.
- No high-volume batch processing.
- No long video/GIF exports.
- No persistent storage expectations.
- Users tolerate queueing.

### When Render Standard Becomes a Bottleneck

Upgrade or re-architect when any of these are true:

- Average queue wait exceeds 2-3 minutes during normal traffic.
- More than 10 queued jobs appears regularly.
- Completed jobs exceed 150-300/day.
- CPU stays near 100% for hours.
- Temp disk approaches available limits during bursts.
- Users begin paying for Pro and expect faster priority processing.
- Support tickets mention stuck, slow, or expired jobs.

### Upgrade Trigger

The first real upgrade should not necessarily be a larger web instance. The better production architecture is:

1. Keep Next.js web app thin.
2. Add a dedicated worker service for FFmpeg.
3. Add a durable queue.
4. Add object storage for input/output temp files.

Only scaling the web service vertically helps temporarily. It does not solve job durability or storage lifecycle.

## Financial Analysis

### Cost Per Video

Base service cost:

- $25/month.
- $25/month / 30 days = about $0.83/day.

Cost per compression depends on monthly volume:

| Monthly compressions | Approx platform cost/video |
|---:|---:|
| 100 | $0.250 |
| 500 | $0.050 |
| 1,000 | $0.025 |
| 3,000 | $0.008 |
| 5,000 | $0.005 |

This excludes:

- developer time;
- domain cost;
- support;
- failed jobs;
- monitoring/log retention;
- future storage services;
- payment processing fees;
- opportunity cost of queue delays.

### Cost Per 1,000 Compressions

If the only paid infrastructure is Render Standard at $25/month:

- 1,000 compressions/month: about **$25 per 1,000**.
- 3,000 compressions/month: about **$8.33 per 1,000**.
- 5,000 compressions/month: about **$5 per 1,000**.

Reality check:

The current 1-worker architecture may not provide good UX at 3,000-5,000 monthly video compressions if traffic is bursty. Cost looks cheap, but capacity and latency become the limiting factors.

### Break-Even Estimates

Assume annual Pro price:

- Low: $29/year.
- Mid: $39/year.
- High: $49/year.

Ignoring payment fees:

| Annual price | Subscribers needed to cover $25/month |
|---:|---:|
| $29/year | 11 subscribers |
| $39/year | 8 subscribers |
| $49/year | 7 subscribers |

With payment fees, support, and safety margin:

- Realistic minimum: 15-25 annual Pro subscribers.
- Comfortable: 50+ annual Pro subscribers.

### Monthly Cost Scenarios

| Scenario | Traffic | Infra | Estimated monthly cost | Notes |
|---|---|---|---:|---|
| MVP quiet | 100-500 jobs/month | Render Standard only | $25 | Fine |
| MVP active | 500-2,000 jobs/month | Render Standard only | $25 | OK if traffic is spread out |
| Queue pressure | 2,000-5,000 jobs/month | Larger instance or worker | $50-$150+ | Needed if bursty |
| Pro workload | Paid users expect speed | worker + queue + object storage | $100-$300+ | More reliable architecture |
| Growth | multi-tool media suite | worker pool + object storage + monitoring | $300+ | Requires FinOps controls |

## Monetization Analysis

### Recommended Free Limits

For current Video Compressor:

- 3 compressions/day per fingerprint/session.
- 250 MB max upload.
- One active job per user/session.
- Standard queue only.
- 30-minute download window.
- No batch compression.

### Fair-Use Policy

Recommended language:

- QAVELIX Pro includes generous annual usage for normal personal and small-business workflows.
- Automated scraping, resale, bulk server-to-server processing, and abuse are prohibited.
- QAVELIX may throttle or pause accounts that create abnormal load or degrade service for others.
- "Unlimited" must always mean fair-use unlimited, not mathematically unlimited CPU.

### Annual Pro Limits

Recommended first Pro plan:

- 1,000-2,000 video jobs/year included.
- Higher daily limit: 20 jobs/day.
- Larger future file cap only after infrastructure upgrade.
- Priority queue after worker architecture exists.
- Batch operations only for lightweight/browser-side tools.
- Longer download retention only when object storage exists.

### Is Unlimited Usage Financially Safe?

No, not for server-side video compression on Render Standard.

Unlimited annual usage is economically safe only for:

- fully browser-side image resize/compression;
- browser-side image-to-PDF;
- browser-side PDF split/merge within memory limits;
- lightweight metadata stripping.

Unlimited is not safe for:

- video compression;
- video to GIF;
- long audio/video conversions;
- any operation requiring server FFmpeg for large files.

## Future Tool Infrastructure Evaluation

Scores are relative to current Render Standard and existing codebase.

| Tool | CPU impact | RAM impact | Infra cost | Dev complexity | Architecture compatibility | Reuse % | Risk |
|---|---|---|---|---:|---|---:|---|
| Video Trimmer | Low-Medium if stream copy; High if re-encode | Low-Medium | Low-Medium | 5/10 | Very high | 75% | Medium |
| Audio Converter | Low-Medium | Low | Low | 4/10 | High | 65% | Low-Medium |
| Extract Audio | Low | Low | Low | 3/10 | Very high | 70% | Low |
| Video to GIF | High | Medium-High | Medium-High | 6/10 | High | 65% | High |
| Image Compressor | Low if browser-side | Low | Very Low | 4/10 | Medium | 25% | Medium |
| Image Resizer | Very Low | Low | Very Low | 2/10 | Medium | 20% | Low |
| HEIC to JPG | Low-Medium browser-side | Medium browser-side | Low | 5/10 | Medium | 25% | Medium |

### Tool Notes

#### Video Trimmer

- Best if implemented as lossless/keyframe cut first.
- Reuses upload, validation, FFprobe, temp files, download, cleanup, route security.
- Exact frame cuts require re-encode and become more CPU-heavy.
- Current infrastructure can support it if usage limits mirror compression.

#### Audio Converter

- Uses FFmpeg but audio is much cheaper than video.
- Good candidate for low-cost Pro limits and batch conversion.
- Can share temp-file and download system.

#### Extract Audio

- Best low-risk next tool for current infra.
- Often can run as stream copy or simple transcode.
- Lower CPU than video compression and easier UX.
- Strong fit with current video upload pipeline.

#### Video to GIF

- Attractive SEO, but dangerous for infra.
- GIF generation is CPU-heavy and outputs can be large.
- Should be gated behind strict duration/resolution/free limits.

#### Image Compressor

- Should be browser-side only.
- High SEO but low differentiation and low willingness to pay.
- Good as later traffic funnel, not next monetization tool.

#### Image Resizer

- Extremely cheap and fast to build.
- Also extremely commoditized and often built into user devices/tools.
- Best bundled with image compressor/converter later.

#### HEIC to JPG

- Useful but episodic.
- Browser-side WASM adds complexity.
- Monetization likely weaker than media tools.

## Infrastructure-Only Ranking: Best to Worst

This ranking considers ROI, infrastructure, development speed, maintainability, profitability, and time to first revenue. It does not rank only by SEO.

1. **Extract Audio**
   - Best immediate ROI for current infra.
   - Low CPU, high reuse, fast MVP, good utility.
2. **Audio Converter**
   - Low infrastructure cost and good monetization via batch/larger files.
3. **Video Trimmer**
   - Strongest strategic video extension, but more UX/edge-case complexity than Extract Audio.
4. **Image Resizer**
   - Very easy and cheap, but weak monetization.
5. **Image Compressor**
   - Good traffic funnel if browser-side, but crowded and low willingness to pay.
6. **HEIC to JPG**
   - Useful but low retention and moderate WASM complexity.
7. **Video to GIF**
   - High SEO potential but worst current-infra risk among listed tools due to CPU/output size.

Note: This infrastructure-only ranking differs from the strategic SEO report. If the goal is "fastest safe revenue on current infrastructure," Extract Audio wins. If the goal is "best strategic next product for video positioning," Video Trimmer remains very strong.

## 40-Day CTO Roadmap

Constraints:

- One developer.
- Low-spec notebook.
- Render Standard.
- Limited budget.
- Existing Video Compressor live.

### Days 1-5: Instrument and Baseline

- Add operational dashboard manually from logs: job count, queue depth, average duration, failures, average input/output size.
- Measure disk temp growth under test uploads.
- Benchmark 50 MB, 100 MB, 250 MB files on Render.
- Define free and Pro limits before adding new workloads.

No new feature should be built before this baseline exists.

### Days 6-15: Monetization Foundation

- Add pricing/limits copy and fair-use terms.
- Decide paid model.
- Add lightweight account/paywall only if technically ready; otherwise launch limits first.
- Prepare conversion funnel: compressor success screen should mention upcoming Pro/media tools.

### Days 16-28: Build Extract Audio MVP

- Reuse upload analyze flow.
- Create `extract audio` job type.
- Use FFmpeg to output MP3 or M4A.
- Reuse signed download and cleanup.
- Free limit: 5 extracts/day, 250 MB max.
- Pro benefit: batch/larger/faster later.

### Days 29-35: Launch Audio Converter MVP or Upgrade Extract Audio

Choice A if Extract Audio performs well:

- Add MP3/M4A/WAV output choices.

Choice B if video audience asks for editing:

- Prototype Video Trimmer with lossless stream-copy only.

### Days 36-40: SEO and Conversion Polish

- Publish dedicated landing pages.
- Add structured data.
- Add internal links from Video Compressor.
- Submit pages in Google Search Console.
- Monitor first impressions and queries.

## Upgrade Roadmap

### Stay on Render Standard while:

- Average active queue is 0-2.
- Jobs/day below about 100-150.
- No paid users expect priority.
- Disk usage stays controlled.
- Failure rate is low.

### Upgrade architecture when:

- Queue depth regularly hits 5+.
- Job wait exceeds 3 minutes.
- Paid users exceed 25-50 active annual subscribers.
- Daily jobs exceed 150-300.
- Multiple tools share FFmpeg workload.

Recommended future architecture:

- Web service: Next.js only.
- Worker service: FFmpeg jobs.
- Queue: Redis/BullMQ or managed queue.
- Storage: S3/R2-compatible object storage.
- Cleanup: scheduled worker.
- Observability: structured metrics and alerts.

## Final Recommendation

For current infrastructure only, build next:

1. **Extract Audio**
2. **Audio Converter**
3. **Video Trimmer**

Do not build Video to GIF next on Render Standard unless strict duration/resolution limits are accepted from day one.

Do not sell unlimited server-side video processing.

The financially safest path is:

- keep Video Compressor as core SEO/media anchor;
- add Extract Audio as the fastest low-cost adjacent tool;
- add Audio Converter for repeatable utility demand;
- add Video Trimmer after operational telemetry proves headroom.

## Confirmation

This report was created without modifying application code, routing, Docker, compression logic, FFmpeg settings, APIs, UI, or tests.

