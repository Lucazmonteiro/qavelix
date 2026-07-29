import { createHash, randomUUID } from "node:crypto";

import { eq, lt, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { env } from "@/env/server";
import { resolveTrustedClientIdentity } from "@/lib/server/client-ip";
import { getDb } from "@/lib/server/db/client";
import { rateLimitBucket } from "@/lib/server/db/schema";
import { validateSameOriginRequest } from "@/lib/server/origin";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type SecurityLogLevel = "info" | "warn" | "error";

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[a-zA-Z0-9_-]{32,256}$/;

function getHeaderValue(request: Request, headerName: string) {
  return request.headers.get(headerName) ?? "";
}

// The leftmost X-Forwarded-For entry is attacker-controlled input, not a
// network-verified fact — see resolveTrustedClientIdentity() (client-ip.ts) for the full
// trust-boundary reasoning behind reading it from the right instead, skipping only
// Cloudflare's own published ranges and standard private/reserved ranges. Never trusts
// a client-supplied header value simply because it exists. Neither cf-connecting-ip nor
// x-real-ip is read here: trusting either directly would require the same "did this
// really come through Cloudflare" check this function already performs via
// X-Forwarded-For, and neither header is ever set/overwritten by this app's actual proxy
// chain (Cloudflare, Render) — so any value present is indistinguishable from
// attacker-injected input, not a second trustworthy signal.
export function getClientFingerprint(request: Request) {
  const ipAddress = resolveTrustedClientIdentity(getHeaderValue(request, "x-forwarded-for"));

  return createHash("sha256").update(ipAddress).digest("base64url");
}

export function validateSameOrigin(request: Request) {
  return validateSameOriginRequest(request);
}

function checkRateLimitInMemory({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  if (rateLimitBuckets.size > 10_000) {
    for (const [bucketKey, bucket] of rateLimitBuckets.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitBuckets.delete(bucketKey);
      }
    }
  }

  const existingBucket = rateLimitBuckets.get(key);

  if (!existingBucket || existingBucket.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (existingBucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existingBucket.resetAt,
    };
  }

  existingBucket.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, limit - existingBucket.count),
    resetAt: existingBucket.resetAt,
  };
}

// Durable counterpart to checkRateLimitInMemory() above: a single atomic upsert against
// rate_limit_bucket, reproducing the exact same fixed-window semantics (new window once
// the old one expires; deny without incrementing once at the limit) so swapping backends
// never changes observable behavior at any call site. Used whenever DATABASE_URL is
// configured, so rate-limit state survives a process restart — the actual point of this
// phase.
async function checkRateLimitDurable({
  key,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const now = new Date();
  const windowResetAt = new Date(now.getTime() + windowMs);

  try {
    const db = getDb();

    // Opportunistic cleanup, mirroring checkRateLimitInMemory()'s own prune-on-write
    // behavior — bounds table growth without a scheduled job.
    if (Math.random() < 0.01) {
      await db.delete(rateLimitBucket).where(lt(rateLimitBucket.resetAt, now));
    }

    const [row] = await db
      .insert(rateLimitBucket)
      .values({ key, count: 1, resetAt: windowResetAt })
      .onConflictDoUpdate({
        target: rateLimitBucket.key,
        set: {
          count: sql`case when ${rateLimitBucket.resetAt} <= now() then 1 else ${rateLimitBucket.count} + 1 end`,
          resetAt: sql`case when ${rateLimitBucket.resetAt} <= now() then ${windowResetAt} else ${rateLimitBucket.resetAt} end`,
          updatedAt: now,
        },
        // Same atomic "only proceed if still allowed" guard usage_counter's upsert
        // already uses in entitlements/service.ts — either the window has expired
        // (always allow, start fresh) or there's still room under the limit. If neither
        // holds, the row is left untouched and RETURNING yields nothing, which is how
        // the deny branch below is detected — never a read-then-write race.
        setWhere: sql`${rateLimitBucket.resetAt} <= now() OR ${rateLimitBucket.count} < ${limit}`,
      })
      .returning({ count: rateLimitBucket.count, resetAt: rateLimitBucket.resetAt });

    if (!row) {
      const [existing] = await db
        .select({ resetAt: rateLimitBucket.resetAt })
        .from(rateLimitBucket)
        .where(eq(rateLimitBucket.key, key))
        .limit(1);

      return {
        allowed: false,
        remaining: 0,
        resetAt: existing?.resetAt.getTime() ?? windowResetAt.getTime(),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - row.count),
      resetAt: row.resetAt.getTime(),
    };
  } catch (error) {
    // Fails closed — the same convention entitlements/service.ts uses for exactly this
    // class of problem: a transient DB outage must not silently disable abuse
    // protection app-wide.
    logSecurityEvent("error", "rate_limit_check_failed", {
      key,
      message: error instanceof Error ? error.message : "unknown",
    });

    return { allowed: false, remaining: 0, resetAt: windowResetAt.getTime() };
  }
}

// Durable when DATABASE_URL is configured; falls back to the original in-memory Map
// otherwise, so a deployment with no database configured at all — the anonymous-only
// core product this app started as — keeps working exactly as before. Same "optional
// everywhere" branching already used by getStripeClient()/email.ts.
export function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  if (!env.DATABASE_URL) {
    return Promise.resolve(checkRateLimitInMemory(options));
  }

  return checkRateLimitDurable(options);
}

export function securityJson(
  body: unknown,
  init: ResponseInit & {
    requestId?: string;
  } = {},
) {
  const headers = new Headers(init.headers);

  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");

  if (init.requestId) {
    headers.set("X-Request-Id", init.requestId);
  }

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

export function methodNotAllowed(requestId: string) {
  return securityJson(
    { ok: false, error: { message: "Method not allowed." } },
    {
      status: 405,
      requestId,
      headers: {
        Allow: "GET, POST, DELETE",
      },
    },
  );
}

export function createRequestId() {
  return randomUUID();
}

export function assertValidJobId(id: string) {
  return uuidPattern.test(id);
}

export function assertValidSignedValue(value: string) {
  return tokenPattern.test(value);
}

export function logSecurityEvent(
  level: SecurityLogLevel,
  event: string,
  details: Record<string, string | number | boolean | null>,
) {
  const payload = JSON.stringify({
    level,
    event,
    at: new Date().toISOString(),
    ...details,
  });

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export async function enforceApiSecurity(
  request: Request,
  options: {
    route: string;
    limit: number;
    windowMs: number;
    requireSameOrigin?: boolean;
  },
) {
  const requestId = createRequestId();
  const fingerprint = getClientFingerprint(request);
  const rateLimit = await checkRateLimit({
    key: `${options.route}:${fingerprint}`,
    limit: options.limit,
    windowMs: options.windowMs,
  });

  if (!rateLimit.allowed) {
    logSecurityEvent("warn", "rate_limit_exceeded", {
      requestId,
      route: options.route,
      fingerprint,
      resetAt: rateLimit.resetAt,
    });

    return {
      ok: false,
      requestId,
      response: securityJson(
        { ok: false, error: { message: "Too many requests. Try again later." } },
        {
          status: 429,
          requestId,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
        },
      ),
    } as const;
  }

  if (options.requireSameOrigin && !validateSameOrigin(request)) {
    logSecurityEvent("warn", "csrf_rejected", {
      requestId,
      route: options.route,
      fingerprint,
    });

    return {
      ok: false,
      requestId,
      response: securityJson(
        { ok: false, error: { message: "Request origin is not allowed." } },
        {
          status: 403,
          requestId,
        },
      ),
    } as const;
  }

  return {
    ok: true,
    requestId,
    fingerprint,
  } as const;
}

export function rejectOversizedRequest(
  request: Request,
  maxBytes: number,
  requestId: string,
) {
  const contentLength = request.headers.get("content-length");

  if (!contentLength) {
    return null;
  }

  const parsedLength = Number(contentLength);

  if (!Number.isFinite(parsedLength) || parsedLength < 0) {
    return securityJson(
      { ok: false, error: { message: "Invalid content length." } },
      { status: 400, requestId },
    );
  }

  if (parsedLength > maxBytes) {
    return securityJson(
      { ok: false, error: { message: "Request body is too large." } },
      { status: 413, requestId },
    );
  }

  return null;
}
