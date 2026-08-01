// Shared by sign-up-form.tsx and reset-password-form.tsx, which both need the exact same
// password rules — previously duplicated as separate local constants and separate
// length/match checks in each file. Mirrors, not exceeds, Better Auth's own server-side
// emailAndPassword defaults (minPasswordLength: 8, maxPasswordLength: 128); this is a
// convenience layer only, the server call in each form is still the authoritative check.
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const MAX_NAME_LENGTH = 100;
export const MAX_EMAIL_LENGTH = 254;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type PasswordValidationError = "tooShort" | "tooLong" | "mismatch" | null;

export function validatePasswordPair(
  password: string,
  confirmPassword: string,
): PasswordValidationError {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "tooShort";
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return "tooLong";
  }

  if (confirmPassword !== password) {
    return "mismatch";
  }

  return null;
}

// Sign-up only (see sign-up-form.tsx) — not folded into validatePasswordPair above,
// which reset-password-form.tsx and password-settings-form.tsx also rely on for setting
// a new password without this extra bar. Deliberately just length + character-class
// checks, nothing password-manager-hostile like a max-one-repeated-char rule.
export function isPasswordStrong(password: string): boolean {
  return /[A-Z]/.test(password) && /[a-z]/.test(password) && /[^A-Za-z0-9]/.test(password);
}
