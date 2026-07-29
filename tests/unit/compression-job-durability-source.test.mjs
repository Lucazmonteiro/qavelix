import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// compression-queue.ts can't be imported directly here — it transitively pulls in real
// "@/" value aliases (getDb) that Node's native TS loader can't resolve outside the
// Next.js build, the same constraint every other DB-touching module in this codebase runs
// into (see entitlements-source.test.mjs). Real end-to-end correctness (a full upload →
// compress → download → cleanup cycle, and multi-preset sequences) is already covered
// against the real dev database by tests/integration/compression-download.test.mjs,
// which now runs through this exact persistence layer.
const schema = await readFile("src/lib/server/db/schema.ts", "utf8");
const compressionQueue = await readFile("src/lib/server/compression-queue.ts", "utf8");

test("compression_job holds the identical serialized shape the old JSON file did, with status surfaced as its own column", () => {
  assert.match(schema, /export const compressionJob = pgTable\(\s*"compression_job"/);
  assert.match(schema, /id: text\("id"\)\.primaryKey\(\)/);
  assert.match(schema, /status: text\("status"\)\.notNull\(\)/);
  assert.match(schema, /data: jsonb\("data"\)\.notNull\(\)/);
});

test("no local-disk JSON file remains the source of truth for job state", () => {
  assert.doesNotMatch(compressionQueue, /jobMetadataDirectory/);
  assert.doesNotMatch(compressionQueue, /jobMetadataPath/);
  assert.doesNotMatch(compressionQueue, /readdir\(/);
  assert.doesNotMatch(compressionQueue, /JSON\.parse/);
  // The job lock mechanism is deliberately untouched (see hosting-decision.md — under a
  // single Render instance, a lock directory wiped by a restart is exactly the correct
  // reset behavior, not a durability gap) — it's a different concern from job *state*.
  assert.match(compressionQueue, /jobLockDirectory/);
  assert.match(compressionQueue, /jobLockPath/);
});

test("persistCompressionJob() is a single atomic upsert against the real database, not a read-then-write", () => {
  const persistFn = compressionQueue.slice(
    compressionQueue.indexOf("async function persistCompressionJob"),
    compressionQueue.indexOf("async function acquireJobLock"),
  );

  assert.match(persistFn, /const data = serializableJob\(job\)/);
  assert.match(persistFn, /\.insert\(compressionJobTable\)/);
  assert.match(persistFn, /\.onConflictDoUpdate\(\{\s*target: compressionJobTable\.id,/);
  assert.match(persistFn, /set: \{ status: job\.status, data, updatedAt: new Date\(\) \}/);
});

test("readPersistedCompressionJob() and loadPendingCompressionJobs() read from the database and fail safe on error", () => {
  const readFn = compressionQueue.slice(
    compressionQueue.indexOf("async function readPersistedCompressionJob"),
    compressionQueue.indexOf("async function findCompressionJob"),
  );

  assert.match(readFn, /\.from\(compressionJobTable\)/);
  assert.match(readFn, /\.where\(eq\(compressionJobTable\.id, id\)\)/);
  assert.match(readFn, /catch \{\s*return null;\s*\}/);

  const loadFn = compressionQueue.slice(
    compressionQueue.indexOf("async function loadPendingCompressionJobs"),
    compressionQueue.indexOf("function enqueueJob"),
  );

  assert.match(loadFn, /db\.select\(\{ id: compressionJobTable\.id \}\)\.from\(compressionJobTable\)/);
  assert.match(loadFn, /catch \{\s*return \[\];\s*\}/);
});

test("every terminal-state orphan-recovery path is unchanged: interrupted jobs still fail and release their entitlement reservation", () => {
  // findCompressionJob()'s and loadPendingCompressionJobs()'s reconciliation logic (which
  // functions in-memory job state stale/interrupted/pending detection) is untouched by
  // this phase — only the I/O primitives underneath them changed. Guards against the
  // persistence swap having silently altered this control flow.
  assert.match(compressionQueue, /await persistStatus\(persistedJob, "failed", "Compression interrupted\."\)/);
  assert.match(compressionQueue, /await releaseJobUsage\(persistedJob\)/);
  assert.match(compressionQueue, /await persistStatus\(job, "failed", "Compression interrupted\."\)/);
  assert.match(compressionQueue, /await releaseJobUsage\(job\)/);
});

// Regression coverage for a reported "Download could not be started" investigation: the
// live download pipeline (job creation → completion → GET .../download) was proven
// working end-to-end by tests/integration/compression-download.test.mjs (real HTTP,
// real FFmpeg, real file bytes) — no defect was found there. This test instead locks
// down the authorization/expiry logic itself at the source level, since exercising real
// TTL expiry (30 minutes) or a genuine cross-actor token swap is impractical to run as a
// fast integration test but the logic must not silently regress.
test("download authorization is a single, once-assigned, constant-time-compared signed token — never re-derived per request and never fingerprint/session based", () => {
  // Token + signature are generated exactly once, at the moment a job first reaches a
  // terminal completed state — never regenerated on later reads, so an already-issued
  // download URL can't be silently invalidated by a subsequent status poll.
  assert.match(
    compressionQueue,
    /const token = randomBytes\(32\)\.toString\("base64url"\);/,
  );
  assert.match(
    compressionQueue,
    /job\.downloadToken = token;\s*\n\s*job\.downloadSignature = createDownloadSignature\(job\.id, token, expiresAt\);/,
  );

  // readCompressionDownload() must compare the caller-supplied token/signature against
  // the exact values stored on the job (constant-time, to avoid a timing side-channel),
  // not recompute or trust anything the client sends beyond that.
  assert.match(
    compressionQueue,
    /!constantTimeEqual\(token, job\.downloadToken\) \|\|\s*\n\s*!constantTimeEqual\(signature, job\.downloadSignature\)/,
  );
  assert.match(
    compressionQueue,
    /function constantTimeEqual\(left: string, right: string\) \{/,
  );
  assert.match(compressionQueue, /timingSafeEqual\(leftBuffer, rightBuffer\)/);
});

test("an expired or missing download fails closed: expiry is checked before the file is ever opened, and a missing output file never crashes the route", () => {
  assert.match(
    compressionQueue,
    /if \(new Date\(job\.expiresAt\)\.getTime\(\) <= Date\.now\(\)\) \{\s*\n\s*await expireCompressionJob\(id\);\s*\n\s*return null;/,
  );
  // A deleted/missing output file must resolve to null (→ 404 at the route), not throw
  // and crash the request — open() failing is caught explicitly.
  assert.match(
    compressionQueue,
    /try \{\s*\n\s*outputFile = await open\(job\.outputPath, "r"\);\s*\n\s*outputStats = await outputFile\.stat\(\);\s*\n\s*\} catch \{\s*\n\s*return null;/,
  );
  // A malformed/incomplete job (no expiresAt, no token, no signature, or a
  // non-downloadable status) is rejected before either the expiry or file check runs.
  // Security Correction #4: a job belonging to a different actor is rejected in this
  // same early check, indistinguishable from any other reason a download is refused.
  assert.match(
    compressionQueue,
    /!job \|\|\s*\n\s*!isJobOwnedByActor\(job, actor\) \|\|\s*\n\s*!isDownloadableCompressionStatus\(job\.status\) \|\|\s*\n\s*!job\.expiresAt \|\|\s*\n\s*!job\.downloadToken \|\|\s*\n\s*!job\.downloadSignature/,
  );
});
