"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { getDictionary } from "@/i18n/dictionaries";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/i18n/locales";

type Dictionary = ReturnType<typeof getDictionary>;

type SettingsSignOutButtonProps = {
  dictionary: Dictionary;
  locale: Locale;
};

// Same sign-out call and destination as AccountMenu's own handler (authClient.signOut()
// then the public homepage) — a second, independent entry point to the identical flow,
// not a competing reimplementation.
export function SettingsSignOutButton({ dictionary, locale }: SettingsSignOutButtonProps) {
  const copy = dictionary.dashboard.settings.account;
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    const { error } = await authClient.signOut();

    setIsSigningOut(false);

    if (error) {
      return;
    }

    router.push(`/${locale}`);
    router.refresh();
  }

  return (
    <button
      className="button button--secondary"
      disabled={isSigningOut}
      onClick={() => void handleSignOut()}
      type="button"
    >
      {isSigningOut ? copy.signingOutLabel : copy.signOutLabel}
    </button>
  );
}
