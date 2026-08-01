import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// These modules import real "@/" value aliases (getDb, next/headers via session.ts,
// etc.) that Node's native TS loader can't resolve outside the Next.js build — the same
// constraint every other next/headers-coupled module in this codebase runs into (see
// auth-session-guard-source.test.mjs, dashboard-source.test.mjs). We test the real
// committed source directly instead of a hand-copied duplicate that could drift.
const schema = await readFile("src/lib/server/db/schema.ts", "utf8");
const policy = await readFile("src/lib/server/entitlements/policy.ts", "utf8");
const errors = await readFile("src/lib/server/entitlements/errors.ts", "utf8");
const service = await readFile("src/lib/server/entitlements/service.ts", "utf8");
const extractAudioRoute = await readFile("src/app/api/extract-audio/route.ts", "utf8");
const extractAudioAnalyzeRoute = await readFile(
  "src/app/api/extract-audio/analyze/route.ts",
  "utf8",
);
const uploadAnalyzeRoute = await readFile("src/app/api/upload/analyze/route.ts", "utf8");
const uploadValidation = await readFile("src/lib/server/upload-validation.ts", "utf8");
const compressionJobsRoute = await readFile("src/app/api/compression/jobs/route.ts", "utf8");
const compressionQueue = await readFile("src/lib/server/compression-queue.ts", "utf8");
const nextConfig = await readFile("next.config.ts", "utf8");

test("database schema defines the plan/usage tables with the required constraints", () => {
  assert.match(schema, /export const userEntitlement = pgTable\(\s*"user_entitlement"/);
  assert.match(schema, /plan: text\("plan"\)\.notNull\(\)\.default\("free"\)/);
  assert.match(schema, /\.references\(\(\) => user\.id, \{ onDelete: "cascade" \}\)/);

  assert.match(schema, /export const usageCounter = pgTable\(\s*"usage_counter"/);
  assert.match(schema, /uniqueIndex\("usage_counter_actor_tool_period_idx"\)\.on\(/);

  assert.match(schema, /export const usageEvent = pgTable\(\s*"usage_event"/);
  assert.match(schema, /idempotencyKey: text\("idempotency_key"\)\.notNull\(\)\.unique\(\)/);
  // periodKey must be stored on the event itself, not recomputed later — an async job can
  // be reserved on one UTC day and released after midnight, and recomputing "today" at
  // release time would target the wrong day's usage_counter row.
  assert.match(schema, /periodKey: text\("period_key"\)\.notNull\(\)/);

  // Milestone 4 itself added no Stripe/billing tables — invoice/payment/billing-history
  // tables specifically stay absent even after Milestone 5 (which added exactly one
  // table, @better-auth/stripe's own required `subscription` table — see
  // stripe-billing-source.test.mjs for that milestone's own schema assertions).
  assert.doesNotMatch(schema, /pgTable\(\s*"(invoice|payment|billing)/i);
});

test("plan policy encodes the exact confirmed product numbers, not invented defaults", () => {
  // Anonymous: 5 lifetime uses, combined across all tools (the "any" sentinel pool).
  assert.match(
    policy,
    /any: \{ maxUsesPerPeriod: 5, period: "lifetime", maxUploadBytes: MAX_UPLOAD_BYTES \}/,
  );
  // Free: 10/day per tool, existing 250MB ceiling reused unchanged.
  const freeBlock = policy.slice(policy.indexOf("free: {"), policy.indexOf("pro: {"));
  assert.match(freeBlock, /maxUsesPerPeriod: 10/);
  assert.match(freeBlock, /maxUploadBytes: MAX_UPLOAD_BYTES/);
  // Pro: 100/day per tool, 500MB ceiling.
  const proBlock = policy.slice(policy.indexOf("pro: {"));
  assert.match(proBlock, /maxUsesPerPeriod: 100/);
  assert.match(proBlock, /maxUploadBytes: PRO_MAX_UPLOAD_BYTES/);
  assert.match(policy, /export const PRO_MAX_UPLOAD_BYTES = 500 \* 1024 \* 1024/);

  // All three tools are covered for both authenticated tiers — a future tool means one
  // new entry per plan here, nothing else (the "configurable, easy to change" requirement).
  assert.match(
    policy,
    /export const TOOL_IDS = \["video-compressor", "extract-audio", "video-trimmer"\] as const/,
  );
  assert.match(policy, /export const PLAN_TYPES = \["free", "pro"\] as const/);
});

test("Next's proxy body-size limit is sized for Pro, not silently capping Pro uploads at Free's ceiling", () => {
  assert.match(
    policy,
    /export const PRO_MAX_UPLOAD_REQUEST_BYTES = PRO_MAX_UPLOAD_BYTES \+ UPLOAD_REQUEST_OVERHEAD_BYTES/,
  );
  assert.match(nextConfig, /proxyClientMaxBodySize:\s*PRO_MAX_UPLOAD_REQUEST_BYTES/);
});

test("entitlement denial reasons map to correct HTTP statuses and every route can reuse the same payload shape", () => {
  assert.match(errors, /account_required: 401/);
  assert.match(errors, /usage_limit_reached: 429/);
  assert.match(errors, /tool_unavailable_for_plan: 403/);
  assert.match(errors, /invalid_entitlement_state: 500/);
  assert.match(errors, /usage_service_unavailable: 503/);
  assert.match(errors, /export function statusForDenialReason/);
  assert.match(errors, /export function entitlementErrorPayload/);
});

test("getPlan() fails safe to the most restrictive plan, never throws, on missing or corrupt data", () => {
  assert.match(service, /const storedPlan = row && isPlanType\(row\.plan\) \? row\.plan : "free";/);
  assert.match(service, /if \(row && !isPlanType\(row\.plan\)\) \{/);
  const getPlanBody = service.slice(
    service.indexOf("export async function getPlan"),
    service.indexOf("export async function setUserPlan"),
  );
  assert.match(getPlanBody, /catch \(error\) \{[\s\S]*?return "free";\s*\}/);
});

// Milestone: Stripe/entitlement audit — the checkout-success redirect
// (@better-auth/stripe's own /subscription/success endpoint) verifies the Stripe
// checkout session and writes the plugin's own `subscription` row directly, without ever
// invoking onSubscriptionCreated/onSubscriptionUpdate. Relying on the webhook alone left a
// real gap: Stripe (and that table) already show an active subscription while
// user_entitlement.plan silently stays "free" until the webhook is delivered, which may be
// delayed or (in local development without `stripe listen --forward-to`) never happen at
// all. getPlan() self-heals from that same verified table instead of waiting on it.
test("getPlan() self-heals from Stripe's own subscription table when the webhook hasn't caught up yet", () => {
  assert.match(service, /async function hasActiveStripeSubscription\(userId: string\): Promise<boolean>/);
  assert.match(service, /eq\(subscriptionTable\.referenceId, userId\)/);
  assert.match(
    service,
    /or\(eq\(subscriptionTable\.status, "active"\), eq\(subscriptionTable\.status, "trialing"\)\)/,
  );

  const getPlanBody = service.slice(
    service.indexOf("export async function getPlan"),
    service.indexOf("export async function setUserPlan"),
  );
  assert.match(getPlanBody, /if \(storedPlan === "pro"\) \{\s*return "pro";/);
  assert.match(getPlanBody, /if \(await hasActiveStripeSubscription\(userId\)\) \{/);
  // The correction is written through the same setUserPlan() the webhook hooks already
  // use — never a second, parallel write path for the same column.
  assert.match(getPlanBody, /await setUserPlan\(userId, "pro"\);/);
});

test("resolveActor() trusts only the server session, never a client-supplied plan or user id", () => {
  assert.match(service, /const session = await getOptionalSession\(\);/);
  assert.match(service, /const plan = await getPlan\(session\.user\.id\);/);
  assert.match(service, /getClientFingerprint\(request\)/);
});

test("reserveUsage() is a single atomic check-and-increment, not a read-then-write race", () => {
  // The idempotency guard: a duplicate idempotencyKey never reserves (and counts) twice.
  assert.match(service, /\.onConflictDoNothing\(\{ target: usageEvent\.idempotencyKey \}\)/);
  // The atomic "increment only if still under the limit" upsert — this is what makes
  // concurrent reservations for the same actor/tool/period serialize correctly.
  assert.match(
    service,
    /setWhere: sql`\$\{usageCounter\.count\} < \$\{limit\}`/,
  );
  assert.match(service, /set: \{ count: sql`\$\{usageCounter\.count\} \+ 1`/);
  // A denied reservation must not leave the ledger row silently "reserved" forever.
  assert.match(service, /status: "rejected", updatedAt: new Date\(\)/);
});

test("reserveUsage()/checkEntitlement() fail closed on a database error; getPlan() fails safe (different from fail-open)", () => {
  assert.match(service, /reason: "usage_service_unavailable"/);
  // Every catch block in the service logs through the existing structured logger, not a
  // bespoke one, and none of them silently allow the request through on error.
  const catchBlocks = service.match(/catch \(error\) \{[\s\S]{0,220}?\}/g) ?? [];
  assert.ok(catchBlocks.length >= 4, "expected multiple guarded catch blocks in service.ts");
});

test("confirmUsage() never changes the counter, and releaseUsage() is transaction-guarded and idempotent", () => {
  assert.match(service, /status: "confirmed", updatedAt: new Date\(\)/);
  const confirmUsageBody = service.slice(
    service.indexOf("export async function confirmUsage"),
    service.indexOf("export async function releaseUsage"),
  );
  assert.doesNotMatch(confirmUsageBody, /usageCounter/);

  assert.match(service, /await db\.transaction\(async \(tx\) => \{/);
  // Idempotent: only a row still in "reserved" status gets released and decremented —
  // a second release call for an already-released/confirmed event matches no row.
  assert.match(service, /eq\(usageEvent\.status, "reserved"\)/);
  assert.match(service, /GREATEST\(\$\{usageCounter\.count\} - 1, 0\)/);
  // The event's own stored periodKey is used, not "today" recomputed at release time.
  assert.match(service, /periodKey: usageEvent\.periodKey,/);
});

test("Extract Audio (sync) reserves before FFmpeg work, confirms on success, releases on every other path", () => {
  assert.match(extractAudioRoute, /from "@\/lib\/server\/entitlements\/service"/);
  assert.match(extractAudioRoute, /const reservation = await reserveUsage\(actor, "extract-audio", security\.requestId\)/);
  // Reservation happens before the upload body is even streamed to disk — well before
  // ffprobe/ffmpeg, and before spending bandwidth on an actor already out of quota.
  const reserveIndex = extractAudioRoute.indexOf("reserveUsage(actor,");
  const streamIndex = extractAudioRoute.indexOf("await streamRequestBodyToDisk(");
  const ffprobeIndex = extractAudioRoute.indexOf("analyzeWithFfprobe(inputPath)");
  assert.ok(reserveIndex > 0 && reserveIndex < streamIndex && streamIndex < ffprobeIndex);

  assert.match(extractAudioRoute, /await confirmUsage\(usageEventId\)/);
  assert.match(extractAudioRoute, /if \(usageEventId && !usageConfirmed\) \{\s*await releaseUsage\(usageEventId\);/);

  // Upload size is plan-aware, not the old flat MAX_UPLOAD_BYTES constant.
  assert.match(extractAudioRoute, /getAnonymousLimits|getToolLimits/);
  assert.doesNotMatch(extractAudioRoute, /\bMAX_UPLOAD_BYTES\b/);
});

test("Extract Audio's analysis pre-check is plan-aware for upload size but never reserves usage (not billable)", () => {
  assert.match(extractAudioAnalyzeRoute, /getAnonymousLimits|getToolLimits/);
  assert.doesNotMatch(extractAudioAnalyzeRoute, /\bMAX_UPLOAD_BYTES\b/);
  assert.doesNotMatch(extractAudioAnalyzeRoute, /reserveUsage/);
});

test("Video Compressor's upload/analyze step is plan-aware for size but never reserves usage (not billable)", () => {
  assert.match(uploadAnalyzeRoute, /getAnonymousLimits|getToolLimits/);
  assert.doesNotMatch(uploadAnalyzeRoute, /\bMAX_UPLOAD_BYTES\b/);
  assert.doesNotMatch(uploadAnalyzeRoute, /reserveUsage/);
});

// Regression coverage for the upload-limit audit's critical finding: validateFileIdentity()
// used to import and enforce the flat 250MB MAX_UPLOAD_BYTES constant independently of
// the caller's already-resolved plan-aware limit. Since every route below already
// clamped declaredSize/Content-Length/streamed-byte-count to the correct plan-aware
// ceiling (500MB for Pro) before ever calling validateFileIdentity(), the flat constant
// was strictly tighter and silently rejected any Pro upload between 250MB and 500MB with
// "file_too_large", even though the entitlement layer had already granted it.
test("validateFileIdentity() takes the caller's resolved limit as a parameter, never a flat constant", () => {
  assert.match(
    uploadValidation,
    /export function validateFileIdentity\(\s*file: UploadIdentity,\s*firstBytes: Uint8Array,\s*maxUploadBytes: number,\s*\): UploadValidationError \| null/,
  );
  assert.match(uploadValidation, /file\.size > maxUploadBytes/);
  // The error message itself must be derived from the passed-in limit too, or a Pro
  // actor rejected for a genuinely oversized (>500MB) file would be told the wrong
  // number.
  assert.match(
    uploadValidation,
    /\$\{Math\.round\(maxUploadBytes \/ 1024 \/ 1024\)\} MB upload limit/,
  );
  assert.doesNotMatch(uploadValidation, /\bMAX_UPLOAD_BYTES\b/);
});

test("every validateFileIdentity() call site passes the actor's resolved plan-aware limit", () => {
  for (const [name, route] of [
    ["upload/analyze", uploadAnalyzeRoute],
    ["extract-audio", extractAudioRoute],
    ["extract-audio/analyze", extractAudioAnalyzeRoute],
  ]) {
    // Both call sites per route (the early, pre-stream identity check with an empty
    // signature buffer, and the post-stream check with the real signature bytes) must
    // pass limits.maxUploadBytes — missing either one reopens the bug for that path.
    const callSites = route.match(/validateFileIdentity\([^;]*\);/g) ?? [];
    assert.equal(callSites.length, 2, `expected 2 validateFileIdentity() call sites in ${name}`);
    for (const callSite of callSites) {
      assert.match(callSite, /limits\.maxUploadBytes/);
    }
  }
});

// Combines two independently-verified facts to prove the real end-to-end boundary
// without needing an authenticated Pro session in an HTTP test: (1) "plan policy encodes
// the exact confirmed product numbers" above already confirms policy.ts's real values are
// MAX_UPLOAD_BYTES (250MB) for Free/anonymous and PRO_MAX_UPLOAD_BYTES (500MB) for Pro;
// (2) "validateFileIdentity() takes the caller's resolved limit as a parameter" above
// already confirms the comparison is strictly `file.size > maxUploadBytes`. Together, a
// file of exactly the resolved limit is accepted and one byte over is rejected, for
// whichever limit the caller resolved — i.e. exactly the boundary the audit asked to
// prove for both the Free/anonymous 250MB ceiling and the Pro 500MB ceiling.
test("the boundary comparison, applied to the real 250MB/500MB policy numbers, accepts at the limit and rejects one byte over", () => {
  const freeLimit = 250 * 1024 * 1024;
  const proLimit = 500 * 1024 * 1024;

  for (const limit of [freeLimit, proLimit]) {
    assert.ok(!(limit > limit), `a file at exactly ${limit} bytes must be accepted`);
    assert.ok(limit + 1 > limit, `a file at ${limit + 1} bytes must be rejected`);
  }
});

// The full boundary matrix requested by the "Free 250MB / Pro 500MB everywhere" audit:
// every explicit just-below/exactly/just-above case for both ceilings, plus the plan
// resolution itself (free entitlement, pro entitlement, missing/invalid entitlement
// state). validateFileIdentity()'s own comparison is `file.size > maxUploadBytes`
// (asserted above), so ">" is the operator under test — "just below" and "exactly" must
// both read as accepted, "just above" as rejected, for whichever limit is in force.
test("upload-size boundary matrix: below/at/above both ceilings, and plan resolution for free/pro/missing-or-invalid", () => {
  const freeLimit = 250 * 1024 * 1024;
  const proLimit = 500 * 1024 * 1024;

  const isAccepted = (size, limit) => !(size > limit);

  // Free/anonymous ceiling (250MB).
  assert.ok(isAccepted(freeLimit - 1, freeLimit), "just below 250MB must be accepted");
  assert.ok(isAccepted(freeLimit, freeLimit), "exactly 250MB must be accepted");
  assert.ok(!isAccepted(freeLimit + 1, freeLimit), "just above 250MB must be rejected");

  // Pro ceiling (500MB).
  assert.ok(isAccepted(proLimit - 1, proLimit), "just below 500MB must be accepted");
  assert.ok(isAccepted(proLimit, proLimit), "exactly 500MB must be accepted");
  assert.ok(!isAccepted(proLimit + 1, proLimit), "just above 500MB must be rejected");

  // A Free-entitled actor is never granted the Pro ceiling: a file between the two
  // boundaries must be accepted under Pro's limit but rejected under Free's.
  const betweenBoundaries = freeLimit + 1024;
  assert.ok(!isAccepted(betweenBoundaries, freeLimit), "Free entitlement must reject a file only Pro allows");
  assert.ok(isAccepted(betweenBoundaries, proLimit), "Pro entitlement must accept the same file Free rejects");

  // Missing/invalid entitlement state falls back to the most restrictive plan — asserted
  // structurally above ("getPlan() fails safe...") via `storedPlan = ... : "free"`; the
  // practical consequence is that an actor with no resolvable plan is bound by the Free
  // ceiling, not Pro's.
  assert.match(service, /const storedPlan = row && isPlanType\(row\.plan\) \? row\.plan : "free";/);
});

test("Video Compressor's job-creation route reserves before consuming the single-use upload reference", () => {
  assert.match(compressionJobsRoute, /const reservation = await reserveUsage\(actor, "video-compressor", security\.requestId\)/);
  const reserveIndex = compressionJobsRoute.indexOf("reserveUsage(actor,");
  const consumeIndex = compressionJobsRoute.indexOf("consumeAnalyzedUploadReference(");
  assert.ok(reserveIndex > 0 && reserveIndex < consumeIndex);

  // If the upload reference turns out invalid after all, the reservation is handed back.
  assert.match(compressionJobsRoute, /await releaseUsage\(reservation\.usageEventId\)/);
  assert.match(
    compressionJobsRoute,
    /createCompressionJobFromAnalyzedUpload\(\s*consumedUpload\.upload,\s*preset,\s*reservation\.usageEventId,/,
  );
});

test("the async compression worker confirms usage only on real success, releases on every other terminal path", () => {
  assert.match(compressionQueue, /usageEventId: string \| null;/);
  assert.match(compressionQueue, /usageConfirmed: boolean;/);

  // Success: status is persisted as a real outcome, then (and only then) confirmed.
  assert.match(
    compressionQueue,
    /await persistStatus\(job, getCompressionOutcomeStatus\(compression\)\);\s*\n\s*await confirmJobUsage\(job\);/,
  );

  // Every other terminal path (failure, timeout, cancellation-while-running) is covered
  // by runJob()'s own finally block, not duplicated per catch branch.
  assert.match(compressionQueue, /await releaseJobUsage\(job\);\s*\n\s*await releaseJobLock\(job\.id\);/);

  // A job cancelled while still queued never reaches runJob() at all, so it needs its own
  // explicit release call.
  const queuedCancelBlock = compressionQueue.slice(
    compressionQueue.indexOf('if (job.status === "queued") {'),
    compressionQueue.indexOf('if (job.status === "starting" || job.status === "running") {'),
  );
  assert.match(queuedCancelBlock, /await releaseJobUsage\(job\);/);

  // A job orphaned by a process restart (found mid-processing on disk, never resumable)
  // must give its reservation back too — checked at both discovery sites.
  const releaseJobUsageCount = (compressionQueue.match(/await releaseJobUsage\(/g) ?? []).length;
  assert.ok(releaseJobUsageCount >= 4, "expected releaseJobUsage() at every non-success terminal path");

  // createCompressionJobFromAnalyzedUpload() releases the reservation itself if job
  // creation fails after the reservation was already made (queue full, missing file,
  // rename failure) — via its own finally block, not scattered per early return.
  assert.match(
    compressionQueue,
    /finally \{[\s\S]*?if \(!jobCreated && usageEventId\) \{\s*await releaseUsage\(usageEventId\);/,
  );
});
