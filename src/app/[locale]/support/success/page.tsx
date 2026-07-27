import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, locales } from "@/i18n/locales";
import { formatContributionAmount } from "@/lib/contribution-amounts";
import { getStripeClient } from "@/lib/server/stripe-client";

type SupportSuccessPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type VerifiedContribution = {
  amountCents: number;
};

// Never trusts the redirect alone (no "?success=true" query flag exists on this route
// for exactly that reason) — re-verifies the actual payment state directly against
// Stripe, the same "don't trust the client, confirm with the source of truth" pattern
// getPlan() already uses for subscription checkout. Confirms both that the session was
// actually paid AND that it's tagged as a contribution (not, say, someone hand-crafting
// this URL with an unrelated session id) before showing the thank-you message.
async function verifyContribution(sessionId: string | undefined): Promise<VerifiedContribution | null> {
  if (!sessionId) {
    return null;
  }

  const stripeClient = getStripeClient();

  if (!stripeClient) {
    return null;
  }

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    if (
      session.payment_status !== "paid" ||
      session.metadata?.type !== "qavelix_contribution" ||
      session.amount_total === null
    ) {
      return null;
    }

    return { amountCents: session.amount_total };
  } catch {
    return null;
  }
}

export default async function SupportSuccessPage({ params, searchParams }: SupportSuccessPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const { session_id: sessionId } = await searchParams;
  const dictionary = getDictionary(locale);
  const copy = dictionary.support.success;
  const contribution = await verifyContribution(sessionId);

  return (
    <AppShell dictionary={dictionary} locale={locale}>
      <AuthFormShell
        description={
          contribution
            ? copy.description
            : copy.notVerifiedDescription
        }
        eyebrow={copy.eyebrow}
        title={contribution ? copy.title : copy.notVerifiedTitle}
      >
        {contribution ? (
          <p role="status">
            {copy.amountLabel.replace("{amount}", formatContributionAmount(contribution.amountCents, locale))}
          </p>
        ) : null}
        <a className="button button--primary" href={`/${locale}`}>
          {copy.returnHomeLabel}
        </a>
      </AuthFormShell>
    </AppShell>
  );
}
