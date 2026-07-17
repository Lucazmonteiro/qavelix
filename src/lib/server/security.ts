import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

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

type SecurityLogLevel = "info" | "warn" | "error";

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenPattern = /^[a-zA-Z0-9_-]{32,256}$/;

function getHeaderValue(request: Request, headerName: string) {
  return request.headers.get(headerName) ?? "";
}

export function getClientFingerprint(request: Request) {
  const forwardedFor = getHeaderValue(request, "x-forwarded-for").split(",")[0]?.trim();
  const realIp = getHeaderValue(request, "x-real-ip");
  const ipAddress = forwardedFor || realIp || "unknown";

  return createHash("sha256").update(ipAddress).digest("base64url");
}

export function validateSameOrigin(request: Request) {
  return validateSameOriginRequest(request);
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
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

export function enforceApiSecurity(
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
  const rateLimit = checkRateLimit({
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
