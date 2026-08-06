"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient, startProUpgradeCheckout, useSession } from "@/lib/auth-client";
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
  // Narrowed server-side to a fixed literal (sign-up/page.tsx, verify-email/page.tsx) —
  // set only when this account's sign-up started from the PRO pricing card's anonymous
  // CTA. Drives Case B's auto-checkout redirect below.
  intent: "checkout_pro" | null;
};

export function VerifyEmailStatus({
  result,
  match,
  errorCode,
  maskedEmail,
  intent,
}: VerifyEmailStatusProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.auth;
  const upgradeCopy = dictionary.upgradeModal;
  const session = useSession();
  const router = useRouter();

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const hasStartedCheckoutRef = useRef(false);

  // Case B's auto-redirect: fires exactly once, the moment this browser lands on its own
  // just-verified, just-signed-in account with a PRO intent attached — see the guard
  // below, which mirrors Case B's own render condition exactly so this can never fire for
  // any other case. A ref (not state) tracks "already attempted" so a retry after a
  // failed checkout doesn't get raced by this effect firing again on the same mount.
  useEffect(() => {
    if (
      intent !== "checkout_pro" ||
      result !== "success" ||
      match !== "same" ||
      hasStartedCheckoutRef.current
    ) {
      return;
    }

    hasStartedCheckoutRef.current = true;
    void handleStartCheckout();
    // handleStartCheckout is a stable function declaration closing over props/state read
    // fresh on each call, not a changing dependency; including it would refire this
    // effect on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent, result, match]);

  // Case B's auto-redirect handler and its manual retry button share this one function.
  // cancelUrl is the plain homepage — a Stripe-checkout cancellation here has nowhere
  // more specific to return to (there's no tool page this flow started from), and the
  // account is already a verified, signed-in Free user by this point regardless of
  // whether checkout completes, so landing on the homepage is a normal, functional state,
  // not a dead end.
  async function handleStartCheckout() {
    setCheckoutError(null);

    const { error } = await startProUpgradeCheckout(locale, `/${locale}`);

    if (error) {
      setCheckoutError(
        error.code === "EMAIL_VERIFICATION_REQUIRED"
          ? upgradeCopy.emailVerificationRequiredMessage
          : upgradeCopy.checkoutErrorMessage,
      );
    }
  }

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
      if (intent === "checkout_pro") {
        return (
          <AuthFormShell
            description={checkoutError ?? copy.verifyEmail.checkoutRedirectMessage}
            eyebrow={copy.verifyEmail.eyebrow}
            title={copy.verifyEmail.verifiedTitle}
          >
            {checkoutError ? (
              <>
                <button
                  className="button button--primary auth-form__submit"
                  onClick={() => void handleStartCheckout()}
                  type="button"
                >
                  {upgradeCopy.upgradeButtonLabel}
                </button>
                <a className="button button--secondary auth-form__submit" href={`/${locale}`}>
                  {copy.verifyEmail.goHomeLabel}
                </a>
              </>
            ) : (
              <span
                aria-label={copy.verifyEmail.checkoutRedirectMessage}
                className="validation-loader"
                role="progressbar"
              />
            )}
          </AuthFormShell>
        );
      }

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
