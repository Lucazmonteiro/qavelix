"use client";

import { useState, type FormEvent } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";
import { EMAIL_PATTERN, validatePasswordPair } from "@/lib/auth-validation";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type SignUpFormProps = {
  // Already sanitized server-side (sanitizeCallbackPath) before this component sees it.
  callbackURL?: string | null;
};

export function SignUpForm({ callbackURL }: SignUpFormProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.auth;
  const signInHref = callbackURL
    ? `/${locale}/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`
    : `/${locale}/sign-in`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = copy.validation.nameRequired;
    }

    if (!EMAIL_PATTERN.test(email)) {
      errors.email = copy.validation.emailInvalid;
    }

    const passwordError = validatePasswordPair(password, confirmPassword);

    if (passwordError === "tooShort") {
      errors.password = copy.validation.passwordTooShort;
    } else if (passwordError === "tooLong") {
      errors.password = copy.validation.passwordTooLong;
    } else if (passwordError === "mismatch") {
      errors.confirmPassword = copy.validation.passwordMismatch;
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      // Threaded through to the auto-sent verification email (emailVerification.sendOnSignUp
      // in auth.ts) so the link lands back on our Verify Email page instead of the default "/".
      callbackURL: `/${locale}/verify-email`,
    });

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
        description={copy.signUp.successMessage}
        eyebrow={copy.signUp.eyebrow}
        title={copy.signUp.successTitle}
      >
        <a className="button button--primary auth-form__submit" href={callbackURL ?? `/${locale}`}>
          {copy.verifyEmail.goHomeLabel}
        </a>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      description={copy.signUp.description}
      eyebrow={copy.signUp.eyebrow}
      title={copy.signUp.title}
      footer={
        <p>
          {copy.signUp.hasAccountPrompt} <a href={signInHref}>{copy.signUp.signInLink}</a>
        </p>
      }
    >
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <AuthField
          autoComplete="name"
          error={fieldErrors.name}
          label={copy.fields.nameLabel}
          name="name"
          onChange={(event) => setName(event.target.value)}
          placeholder={copy.fields.namePlaceholder}
          required
          type="text"
          value={name}
        />
        <AuthField
          autoComplete="email"
          error={fieldErrors.email}
          label={copy.fields.emailLabel}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder={copy.fields.emailPlaceholder}
          required
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="new-password"
          error={fieldErrors.password}
          label={copy.fields.passwordLabel}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.fields.passwordPlaceholder}
          required
          type="password"
          value={password}
        />
        <AuthField
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          label={copy.fields.confirmPasswordLabel}
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
          {isSubmitting ? copy.signUp.submittingLabel : copy.signUp.submitLabel}
        </button>
      </form>
    </AuthFormShell>
  );
}
