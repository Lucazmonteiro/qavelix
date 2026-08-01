"use client";

import { useState, type FormEvent } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";
import { MAX_PASSWORD_LENGTH, validatePasswordPair } from "@/lib/auth-validation";

type ResetPasswordFormProps = {
  // Read server-side from the page's searchParams, not via useSearchParams() client-side
  // — avoids the Suspense-boundary requirement that hook otherwise imposes, and the
  // token is already available to the Server Component for free.
  token: string | null;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.auth;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  if (!token) {
    return (
      <AuthFormShell
        description={copy.resetPassword.invalidLinkMessage}
        eyebrow={copy.resetPassword.eyebrow}
        title={copy.resetPassword.invalidLinkTitle}
      >
        <a className="button button--primary auth-form__submit" href={`/${locale}/forgot-password`}>
          {copy.resetPassword.requestNewLinkLabel}
        </a>
      </AuthFormShell>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const passwordError = validatePasswordPair(newPassword, confirmPassword);

    if (passwordError === "tooShort") {
      setFormError(copy.validation.passwordTooShort);
      return;
    }

    if (passwordError === "tooLong") {
      setFormError(copy.validation.passwordTooLong);
      return;
    }

    if (passwordError === "mismatch") {
      setFormError(copy.validation.passwordMismatch);
      return;
    }

    setIsSubmitting(true);

    const { error } = await authClient.resetPassword({ newPassword, token: token as string });

    setIsSubmitting(false);

    if (error) {
      setFormError(mapAuthErrorCode(error.code, copy.errors));
      return;
    }

    setIsComplete(true);
  }

  if (isComplete) {
    return (
      <AuthFormShell
        description={copy.resetPassword.successMessage}
        eyebrow={copy.resetPassword.eyebrow}
        title={copy.resetPassword.successTitle}
      >
        <a className="button button--primary auth-form__submit" href={`/${locale}/sign-in`}>
          {copy.resetPassword.successActionLabel}
        </a>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      description={copy.resetPassword.description}
      eyebrow={copy.resetPassword.eyebrow}
      title={copy.resetPassword.title}
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="new-password"
          label={copy.fields.newPasswordLabel}
          maxLength={MAX_PASSWORD_LENGTH}
          name="newPassword"
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder={copy.fields.newPasswordPlaceholder}
          required
          type="password"
          value={newPassword}
        />
        <AuthField
          autoComplete="new-password"
          label={copy.fields.confirmPasswordLabel}
          maxLength={MAX_PASSWORD_LENGTH}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder={copy.fields.confirmPasswordPlaceholder}
          required
          type="password"
          value={confirmPassword}
        />
        {formError ? (
          <p className="form-status__error" role="alert">
            {formError}
          </p>
        ) : null}
        <button
          className="button button--primary auth-form__submit"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? copy.resetPassword.submittingLabel : copy.resetPassword.submitLabel}
        </button>
      </form>
    </AuthFormShell>
  );
}
