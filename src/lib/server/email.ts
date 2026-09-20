import { Resend } from "resend";

import { env } from "@/env/server";
import { isMaintenanceMode } from "@/lib/maintenance";
import { logSecurityEvent } from "@/lib/server/security";

// Same globalThis-anchored singleton pattern as getDb()/getAuth()/getStripeClient() —
// `next dev`'s hot reload re-evaluates this module on file save, so a plain module-level
// variable would reconstruct the client on every reload.
type ResendGlobal = typeof globalThis & {
  __qavelixResend?: Resend;
};

const resendGlobal = globalThis as ResendGlobal;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }

  if (!resendGlobal.__qavelixResend) {
    resendGlobal.__qavelixResend = new Resend(env.RESEND_API_KEY);
  }

  return resendGlobal.__qavelixResend;
}

// Mirrors isBillingConfigured()'s convention: both the API key and the from address must
// be present together, or email sending is treated as fully absent — never a
// partially-configured state that only fails at send time.
export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM_ADDRESS);
}

export type AuthEmailKind = "reset-password" | "verify-email";

const subjectByKind: Record<AuthEmailKind, string> = {
  "reset-password": "Reset your QAVELIX password",
  "verify-email": "Verify your QAVELIX email address",
};

function buildEmailHtml(kind: AuthEmailKind, url: string): string {
  const message =
    kind === "reset-password"
      ? "Click the link below to reset your QAVELIX password. If you didn't request this, you can safely ignore this email."
      : "Click the link below to verify your QAVELIX email address.";

  return `<p>${message}</p><p><a href="${url}">${url}</a></p>`;
}

// Attempts real delivery through the configured provider. Returns false — never throws —
// whenever email isn't configured or the provider call fails, so callers (auth.ts) can
// fall back to the project's original dev-only stub instead of a flow silently dead-ending.
export async function sendAuthEmail(
  kind: AuthEmailKind,
  to: string,
  url: string,
): Promise<boolean> {
  // Shutdown: never call the provider. auth.ts's deliverAuthEmail() falls back to its
  // log-only path when this returns false.
  if (isMaintenanceMode()) {
    return false;
  }

  const resend = getResendClient();

  if (!resend || !env.EMAIL_FROM_ADDRESS) {
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM_ADDRESS,
      to,
      // Optional — NEXT_PUBLIC_SUPPORT_EMAIL is the project's one existing contact
      // channel (see docs/DEPLOYMENT.md), reused here rather than a second address, so a
      // reply to either auth email reaches the same inbox support already monitors.
      replyTo: env.NEXT_PUBLIC_SUPPORT_EMAIL,
      subject: subjectByKind[kind],
      html: buildEmailHtml(kind, url),
    });

    if (error) {
      logSecurityEvent("error", "auth_email_send_failed", { kind, message: error.message });
      return false;
    }

    // No url here, deliberately: once real delivery works, the reset/verification link is
    // a bearer credential and shouldn't also land in structured server logs.
    logSecurityEvent("info", "auth_email_sent", { kind, email: to });
    return true;
  } catch (error) {
    logSecurityEvent("error", "auth_email_send_failed", {
      kind,
      message: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }
}
