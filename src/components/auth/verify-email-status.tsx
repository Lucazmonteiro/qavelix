"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient, useSession } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";

type VerifyEmailStatusProps = {
  // Server-derived outcome of an actual verification click (src/app/api/verify-email/
  // route.ts) — null when this page was reached directly (e.g. from the sign-up success
  // screen), in which case the component falls back to reading the live session below,
  // exactly as before.
  result: "success" | "error" | null;
  match: "same" | "different" | "none" | null;
  errorCode: string | null;
  maskedEmail: string | null;
};

export function VerifyEmailStatus({ result, match, errorCode, maskedEmail }: VerifyEmailStatusProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.auth;
  const session = useSession();
  const router = useRouter();

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleResend() {
    const email = session.data?.user.email;

    if (!email) {
      return;
    }

    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `/${locale}/verify-email`,
    });

    setIsResending(false);

    if (error) {
      setResendError(mapAuthErrorCode(error.code, copy.errors));
      return;
    }

    setResendMessage(copy.verifyEmail.resendSuccessMessage);
  }

  // Case C's primary action: never switches accounts automatically — signs the current,
  // unrelated session out first, then sends the visitor to a plain sign-in page they must
  // authenticate against themselves.
  async function handleSignOutAndSignIn() {
    setIsSigningOut(true);
    setSignOutError(null);

    const { error } = await authClient.signOut();

    setIsSigningOut(false);

    if (error) {
      setSignOutError(copy.verifyEmail.signOutErrorMessage);
      return;
    }

    router.push(`/${locale}/sign-in`);
  }

  // Case D: a failed verification (invalid/expired/reused-but-since-invalidated token).
  // Never implies anything about which account the token targeted — the resend action
  // below is always scoped to whichever account is actually signed in right now, if any.
  if (result === "error") {
    const message =
      errorCode === "TOKEN_EXPIRED"
        ? copy.errors.tokenExpired
        : errorCode === "INVALID_TOKEN"
          ? copy.errors.invalidToken
          : copy.errors.unknown;

    return (
      <AuthFormShell
        description={message}
        eyebrow={copy.verifyEmail.eyebrow}
        title={copy.verifyEmail.verificationFailedTitle}
      >
        {session.data ? (
          <>
            <button
              className="button button--secondary auth-form__submit"
              disabled={isResending}
              onClick={handleResend}
              type="button"
            >
              {isResending ? copy.verifyEmail.resendingLabel : copy.verifyEmail.resendButton}
            </button>
            {resendMessage ? (
              <p className="form-status__success" role="status">
                {resendMessage}
              </p>
            ) : null}
            {resendError ? (
              <p className="form-status__error" role="alert">
                {resendError}
              </p>
            ) : null}
          </>
        ) : (
          <a className="button button--primary auth-form__submit" href={`/${locale}/sign-in`}>
            {copy.verifyEmail.goToSignInLabel}
          </a>
        )}
      </AuthFormShell>
    );
  }

  if (result === "success") {
    // Case C: the token verified a real account, but it isn't the one this browser is
    // currently signed in as. Never shown as though the current session were the
    // verified one — a distinct warning state with its own primary action.
    if (match === "different") {
      return (
        <AuthFormShell
          description={
            maskedEmail
              ? copy.verifyEmail.differentAccountMessage.replace("{email}", maskedEmail)
              : copy.verifyEmail.differentAccountMessageGeneric
          }
          eyebrow={copy.verifyEmail.eyebrow}
          title={copy.verifyEmail.differentAccountTitle}
        >
          <button
            className="button button--primary auth-form__submit"
            disabled={isSigningOut}
            onClick={() => void handleSignOutAndSignIn()}
            type="button"
          >
            {isSigningOut ? copy.verifyEmail.signingOutLabel : copy.verifyEmail.signOutAndSignInLabel}
          </button>
          {signOutError ? (
            <p className="form-status__error" role="alert">
              {signOutError}
            </p>
          ) : null}
        </AuthFormShell>
      );
    }

    // Case B: the currently signed-in account is the one that was just verified.
    if (match === "same") {
      return (
        <AuthFormShell
          description={copy.verifyEmail.verifiedMessage}
          eyebrow={copy.verifyEmail.eyebrow}
          title={copy.verifyEmail.verifiedTitle}
        >
          <a className="button button--primary auth-form__submit" href={`/${locale}`}>
            {copy.verifyEmail.goHomeLabel}
          </a>
        </AuthFormShell>
      );
    }

    // Case A: no active session at all — never silently authenticate anyone.
    return (
      <AuthFormShell
        description={copy.verifyEmail.verifiedNoSessionMessage}
        eyebrow={copy.verifyEmail.eyebrow}
        title={copy.verifyEmail.verifiedTitle}
      >
        <a className="button button--primary auth-form__submit" href={`/${locale}/sign-in`}>
          {copy.verifyEmail.goToSignInLabel}
        </a>
      </AuthFormShell>
    );
  }

  // No result param: this page was reached directly (sign-up's "check your email"
  // screen, or a signed-in visitor navigating here on their own), not via a verification
  // link click — the original pending/verified/resend flow, unchanged.
  if (session.isPending) {
    return (
      <AuthFormShell
        description={copy.verifyEmail.pendingMessage}
        eyebrow={copy.verifyEmail.eyebrow}
        title={copy.verifyEmail.title}
      >
        <></>
      </AuthFormShell>
    );
  }

  if (!session.data) {
    return (
      <AuthFormShell
        description={copy.verifyEmail.pendingMessage}
        eyebrow={copy.verifyEmail.eyebrow}
        footer={<a href={`/${locale}/sign-in`}>{copy.signIn.title}</a>}
        title={copy.verifyEmail.title}
      >
        <></>
      </AuthFormShell>
    );
  }

  if (session.data.user.emailVerified) {
    return (
      <AuthFormShell
        description={copy.verifyEmail.verifiedMessage}
        eyebrow={copy.verifyEmail.eyebrow}
        title={copy.verifyEmail.verifiedTitle}
      >
        <a className="button button--primary auth-form__submit" href={`/${locale}`}>
          {copy.verifyEmail.goHomeLabel}
        </a>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      description={copy.verifyEmail.pendingMessage}
      eyebrow={copy.verifyEmail.eyebrow}
      title={copy.verifyEmail.pendingTitle}
    >
      <button
        className="button button--secondary auth-form__submit"
        disabled={isResending}
        onClick={handleResend}
        type="button"
      >
        {isResending ? copy.verifyEmail.resendingLabel : copy.verifyEmail.resendButton}
      </button>
      {resendMessage ? (
        <p className="form-status__success" role="status">
          {resendMessage}
        </p>
      ) : null}
      {resendError ? (
        <p className="form-status__error" role="alert">
          {resendError}
        </p>
      ) : null}
    </AuthFormShell>
  );
}
