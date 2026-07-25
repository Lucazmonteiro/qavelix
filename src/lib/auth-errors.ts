import type { Dictionary } from "@/i18n/dictionaries";

type AuthErrors = Dictionary["auth"]["errors"];

// Better Auth's own error codes (@better-auth/core/error), curated to the ones our
// 5 flows can actually surface. Anything not in this list — a real possibility, Better
// Auth has ~50 codes for plugins/flows we don't use — falls back to a generic message
// rather than leaking an internal code to the UI.
const errorCodeMap: Partial<Record<string, keyof AuthErrors>> = {
  INVALID_EMAIL: "invalidEmail",
  // The Zod-level rejection every endpoint's email field falls back to (confirmed against
  // a real response: `{"message":"[body.email] Invalid email address","code":"VALIDATION_ERROR"}`).
  // Client-side validation catches malformed emails before they'd normally reach the
  // server, but the server call is still the authoritative check, so this needs a real
  // mapping rather than falling through to the generic "unknown" message.
  VALIDATION_ERROR: "invalidEmail",
  USER_ALREADY_EXISTS: "userAlreadyExists",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "userAlreadyExists",
  INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
  PASSWORD_TOO_SHORT: "passwordTooShort",
  PASSWORD_TOO_LONG: "passwordTooLong",
  INVALID_TOKEN: "invalidToken",
  TOKEN_EXPIRED: "tokenExpired",
  EMAIL_ALREADY_VERIFIED: "emailAlreadyVerified",
};

export function mapAuthErrorCode(code: string | undefined, errors: AuthErrors): string {
  if (!code) {
    return errors.unknown;
  }

  const key = errorCodeMap[code];

  return key ? errors[key] : errors.unknown;
}
