// Shared by sign-up-form.tsx and reset-password-form.tsx, which both need the exact same
// password rules — previously duplicated as separate local constants and separate
// length/match checks in each file. Mirrors, not exceeds, Better Auth's own server-side
// emailAndPassword defaults (minPasswordLength: 8, maxPasswordLength: 128); this is a
// convenience layer only, the server call in each form is still the authoritative check.
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
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
