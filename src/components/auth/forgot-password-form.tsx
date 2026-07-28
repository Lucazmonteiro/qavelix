"use client";

import { useState, type FormEvent } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";
import { EMAIL_PATTERN } from "@/lib/auth-validation";

export function ForgotPasswordForm() {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.auth;

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!EMAIL_PATTERN.test(email)) {
      setFormError(copy.validation.emailInvalid);
      return;
    }

    setIsSubmitting(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `/${locale}/reset-password`,
    });

    setIsSubmitting(false);

    if (error) {
      setFormError(mapAuthErrorCode(error.code, copy.errors));
      return;
    }

    setIsComplete(true);
  }

  const backToSignIn = <a href={`/${locale}/sign-in`}>{copy.forgotPassword.backToSignInLink}</a>;

  if (isComplete) {
    return (
      <AuthFormShell
        description={copy.forgotPassword.successMessage}
        eyebrow={copy.forgotPassword.eyebrow}
        footer={backToSignIn}
        title={copy.forgotPassword.successTitle}
      >
        <></>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      description={copy.forgotPassword.description}
      eyebrow={copy.forgotPassword.eyebrow}
      footer={backToSignIn}
      title={copy.forgotPassword.title}
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          label={copy.fields.emailLabel}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.fields.emailPlaceholder}
          required
          type="email"
          value={email}
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
          {isSubmitting ? copy.forgotPassword.submittingLabel : copy.forgotPassword.submitLabel}
        </button>
      </form>
    </AuthFormShell>
  );
}
