// Shared between the client-side amount picker and (conceptually) the server-side
// validation bounds in src/app/api/support/checkout/route.ts — the server re-validates
// independently and never trusts these client-side constants, but keeping the numbers in
// one place avoids the UI ever offering an amount the server would reject.
export const SUGGESTED_CONTRIBUTION_AMOUNTS_CENTS = [500, 1_000, 2_500, 5_000] as const;

export const MIN_CONTRIBUTION_CENTS = 100; // $1
export const MAX_CONTRIBUTION_CENTS = 50_000; // $500

export function formatContributionAmount(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(cents / 100);
}

export function isValidContributionCents(cents: number): boolean {
  return (
    Number.isSafeInteger(cents) && cents >= MIN_CONTRIBUTION_CENTS && cents <= MAX_CONTRIBUTION_CENTS
  );
}
