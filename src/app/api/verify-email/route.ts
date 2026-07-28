import { isAPIError } from "better-auth/api";

import { env } from "@/env/server";
import { getAuth } from "@/lib/server/auth/auth";
import { getOptionalSession, sanitizeCallbackPath } from "@/lib/server/auth/session";
import { enforceApiSecurity, logSecurityEvent } from "@/lib/server/security";

export const runtime = "nodejs";

// The actual emailed link (built in src/lib/server/auth/auth.ts's sendVerificationEmail
// callback) points here instead of directly at Better Auth's own GET /api/auth/verify-email
// redirect endpoint. That endpoint's own JSON response never includes the verified user
// (by design — it always returns `user: null` for a plain, non-change-email verification),
// so there was no server-derived way to know which account had just been verified versus
// whichever account happens to be signed in in the clicking browser — the exact session-
// mismatch bug this route exists to close. See VerifyEmailStatus for the UI this feeds.
//
// Fix shape: perform the real, signature-and-expiry-checked verification via
// getAuth().api.verifyEmail() (never re-implemented here), then decode — never
// re-verify — the SAME token's payload purely to read its `email` claim for comparison.
// That's safe because the comparison never gates anything security-sensitive: the
// database write already happened via Better Auth's own authoritative check above; this
// only decides which *message* to show. The outcome (never the raw email or token) is
// carried through a validated, allowlisted relative redirect as a small enum so the
// client page never has to (and never does) infer identity from its own current session
// alone.
function decodeJwtEmail(token: string): string | null {
  try {
    const payloadSegment = token.split(".")[1];

    if (!payloadSegment) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));

    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

// Shown only in the "signed in as a different account" case, and only ever built from
// the server-decoded token email above — never from client input. Keeps enough of the
// address to be recognizable without displaying it in full over an unauthenticated
// redirect chain.
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");

  if (!domain || !local) {
    return "";
  }

  const visibleLength = Math.min(2, local.length);
  const visible = local.slice(0, visibleLength);
  const maskedLength = Math.max(local.length - visibleLength, 3);

  return `${visible}${"•".repeat(maskedLength)}@${domain}`;
}

function redirectTo(path: string, params: Record<string, string>) {
  const target = new URL(path, env.NEXT_PUBLIC_APP_URL);

  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }

  return Response.redirect(target, 302);
}

export async function GET(request: Request) {
  const security = await enforceApiSecurity(request, {
    route: "verify-email-callback",
    limit: 20,
    windowMs: 60_000,
  });

  if (!security.ok) {
    return security.response;
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  // Self-generated (see buildVerificationLink in auth.ts), but still round-tripped
  // through the same allowlist every other callback path uses — defense in depth, not
  // because this value is attacker-controlled in the normal flow.
  const callbackPath = sanitizeCallbackPath(url.searchParams.get("callbackURL")) ?? "/en/verify-email";

  if (!token) {
    return redirectTo(callbackPath, { result: "error", code: "INVALID_TOKEN" });
  }

  try {
    await getAuth().api.verifyEmail({ query: { token }, headers: request.headers });
  } catch (error) {
    const code = isAPIError(error) && typeof error.body?.code === "string" ? error.body.code : "INVALID_TOKEN";

    // Never log the token itself — only the non-sensitive outcome code.
    logSecurityEvent("info", "verify_email_callback_failed", { code });

    return redirectTo(callbackPath, { result: "error", code });
  }

  const verifiedEmail = decodeJwtEmail(token);
  const session = await getOptionalSession();

  if (!session || !verifiedEmail) {
    return redirectTo(callbackPath, { result: "success", match: "none" });
  }

  if (session.user.email.toLowerCase() === verifiedEmail.toLowerCase()) {
    return redirectTo(callbackPath, { result: "success", match: "same" });
  }

  const masked = maskEmail(verifiedEmail);

  return redirectTo(callbackPath, {
    result: "success",
    match: "different",
    ...(masked ? { email: masked } : {}),
  });
}
