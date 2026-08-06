"use client";

import { useState, type FormEvent } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { useLocaleState } from "@/i18n/locale-context";
import { authClient } from "@/lib/auth-client";
import { mapAuthErrorCode } from "@/lib/auth-errors";
import {
  EMAIL_PATTERN,
  isPasswordStrong,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  validatePasswordPair,
} from "@/lib/auth-validation";

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type SignUpFormProps = {
  // Already sanitized server-side (sanitizeCallbackPath) before this component sees it.
  callbackURL?: string | null;
  // Set only when this sign-up originated from the PRO pricing card's anonymous CTA —
  // narrowed to a fixed literal server-side (see sign-up/page.tsx), never trusted as an
  // arbitrary string. Threaded into the verification email's own callback so
  // verify-email-status.tsx can auto-start Stripe checkout the moment the account is
  // confirmed, instead of losing the conversion moment on a generic "verified" page.
  intent?: "checkout_pro" | null;
};

export function SignUpForm({ callbackURL, intent }: SignUpFormProps) {
  const { dictionary, locale } = useLocaleState();
  const copy = dictionary.auth;
  const signInHref = callbackURL
    ? `/${locale}/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`
    : `/${locale}/sign-in`;
  // sanitizeCallbackPath's allowlist only accepts this one exact literal suffix on
  // /verify-email — see that function's comment for why it's safe to round-trip through
  // Better Auth's own verification-link building untouched.
  const verifyCallbackURL =
    intent === "checkout_pro" ? `/${locale}/verify-email?intent=checkout_pro` : `/${locale}/verify-email`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!name.trim()) {
      errors.name = copy.validation.nameRequired;
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.name = copy.validation.nameTooLong;
    }

    if (!EMAIL_PATTERN.test(email)) {
      errors.email = copy.validation.emailInvalid;
    } else if (email.length > MAX_EMAIL_LENGTH) {
      errors.email = copy.validation.emailTooLong;
    }

    const passwordError = validatePasswordPair(password, confirmPassword);

    if (passwordError === "tooShort") {
      errors.password = copy.validation.passwordTooShort;
    } else if (passwordError === "tooLong") {
      errors.password = copy.validation.passwordTooLong;
    } else if (!isPasswordStrong(password)) {
      errors.password = copy.validation.passwordTooWeak;
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
      // in auth.ts) so the link lands back on our Verify Email page instead of the default "/",
      // carrying the checkout intent forward when this sign-up started from the PRO card.
      callbackURL: verifyCallbackURL,
    });

    setIsSubmitting(false);

    if (error) {
      setFormError(mapAuthErrorCode(error.code, copy.errors));
      return;
    }

    setIsComplete(true);
  }

  // Better Auth signs the account in immediately on a successful signUp.email() call
  // (with emailVerified: false), so this resend can target the just-submitted email
  // directly rather than needing a session read — same endpoint, same callbackURL,
  // VerifyEmailStatus's own handleResend just reads it from the live session instead
  // since it has no locally-captured form value to reuse.
  async function handleResend() {
    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: verifyCallbackURL,
    });

    setIsResending(false);

    if (error) {
      setResendError(mapAuthErrorCode(error.code, copy.errors));
      return;
    }

    setResendMessage(copy.verifyEmail.resendSuccessMessage);
  }

  if (isComplete) {
    return (
      <AuthFormShell
        description={copy.signUp.successMessage}
        eyebrow={copy.signUp.eyebrow}
        title={copy.signUp.successTitle}
      >
        <button
          className="button button--secondary auth-form__submit"
          disabled={isResending}
          onClick={() => void handleResend()}
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
          maxLength={MAX_NAME_LENGTH}
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
          maxLength={MAX_EMAIL_LENGTH}
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
          maxLength={MAX_PASSWORD_LENGTH}
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
          {isSubmitting ? copy.signUp.submittingLabel : copy.signUp.submitLabel}
        </button>
      </form>
    </AuthFormShell>
  );
}
