function firstForwardedValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

function normalizedProtocol(value: string) {
  return value.replace(/:$/, "").toLowerCase();
}

function originFromProtocolAndHost(protocol: string, host: string) {
  if (!protocol || !host) {
    return null;
  }

  try {
    return new URL(`${normalizedProtocol(protocol)}://${host}`).origin;
  } catch {
    return null;
  }
}

function sourceOriginFromRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  try {
    if (origin) {
      return new URL(origin).origin;
    }

    if (referer) {
      return new URL(referer).origin;
    }
  } catch {
    return null;
  }

  return null;
}

export function getSameOriginCandidates(request: Request) {
  const requestUrl = new URL(request.url);
  const origins = new Set<string>([requestUrl.origin]);
  const requestProtocol = normalizedProtocol(requestUrl.protocol);
  const host = firstForwardedValue(request.headers.get("host"));
  const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
  const forwardedProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
  const effectiveProtocol = normalizedProtocol(forwardedProto || requestProtocol);

  for (const candidate of [
    originFromProtocolAndHost(requestProtocol, host),
    originFromProtocolAndHost(effectiveProtocol, host),
    originFromProtocolAndHost(effectiveProtocol, forwardedHost),
  ]) {
    if (candidate) {
      origins.add(candidate);
    }
  }

  return origins;
}

export function validateSameOriginRequest(request: Request) {
  const sourceOrigin = sourceOriginFromRequest(request);

  if (!sourceOrigin) {
    return false;
  }

  return getSameOriginCandidates(request).has(sourceOrigin);
}
