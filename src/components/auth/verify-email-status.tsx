"use client";

import { useState } from "react";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient, useSession } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";

export function VerifyEmailStatus() {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.auth;
  const session = useSession();

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

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
