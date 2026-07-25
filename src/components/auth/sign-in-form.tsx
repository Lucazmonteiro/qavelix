"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";
import { EMAIL_PATTERN } from "@/lib/auth-validation";

export function SignInForm() {
  const { dictionary, locale } = useLocaleState();
  const router = useRouter();
  const copy = dictionary.auth;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!EMAIL_PATTERN.test(email) || !password) {
      setFormError(copy.errors.invalidCredentials);
      return;
    }

    setIsSubmitting(true);

    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      setIsSubmitting(false);
      setFormError(mapAuthErrorCode(error.code, copy.errors));
      return;
    }

    router.push(`/${locale}`);
  }

  return (
    <AuthFormShell
      eyebrow={copy.signIn.eyebrow}
      title={copy.signIn.title}
      description={copy.signIn.description}
      footer={
        <>
          <a href={`/${locale}/forgot-password`}>{copy.signIn.forgotPasswordLink}</a>
          <p>
            {copy.signIn.noAccountPrompt} <a href={`/${locale}/sign-up`}>{copy.signIn.signUpLink}</a>
          </p>
        </>
      }
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
        <AuthField
          autoComplete="current-password"
          label={copy.fields.passwordLabel}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.fields.passwordPlaceholder}
          required
          type="password"
          value={password}
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
          {isSubmitting ? copy.signIn.submittingLabel : copy.signIn.submitLabel}
        </button>
      </form>
    </AuthFormShell>
  );
}
