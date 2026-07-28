"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/locales";
import { authClient, useSession } from "@/lib/auth-client";

type Dictionary = ReturnType<typeof getDictionary>;

type AccountMenuProps = {
  locale: Locale;
  dictionary: Dictionary;
};

// Mirrors src/components/app-header.tsx's tools-menu dropdown exactly: same state
// shape, same outside-click/Escape wiring, same aria-expanded/role="menu" pattern —
// reused, not reinvented, and shares its CSS (tools-menu/tools-menu__button/
// tools-menu__panel/tools-menu__item) rather than duplicating dropdown styles.
export function AccountMenu({ locale, dictionary }: AccountMenuProps) {
  const copy = dictionary.auth;
  const session = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);

    const { error } = await authClient.signOut();

    setIsSigningOut(false);

    if (error) {
      // Stay put rather than closing the menu and navigating away — that would tell the
      // user they're signed out when the server-side session may still exist.
      return;
    }

    setIsOpen(false);
    router.push(`/${locale}`);
    router.refresh();
  }

  if (session.isPending) {
    return null;
  }

  if (!session.data) {
    return (
      <div className="guest-nav-actions">
        <a
          className="primary-nav__link guest-nav-actions__signin"
          href={`/${locale}/sign-in`}
        >
          {copy.guestNav.signInLabel}
        </a>
        <a className="button button--primary guest-nav-actions__signup" href={`/${locale}/sign-up`}>
          {copy.guestNav.signUpLabel}
        </a>
      </div>
    );
  }

  const { user } = session.data;

  return (
    <div className="tools-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="primary-nav__link tools-menu__button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{copy.accountMenu.openLabel}</span>
        <span aria-hidden="true" className="tools-menu__chevron">
          {"▾"}
        </span>
      </button>
      <div
        aria-hidden={!isOpen}
        className={`tools-menu__panel${isOpen ? " tools-menu__panel--open" : ""}`}
        role="menu"
      >
        <div className="account-menu__identity">
          <span>{copy.accountMenu.signedInAsLabel}</span>
          <strong>{user.name || user.email}</strong>
        </div>
        <a
          className="tools-menu__item"
          href={`/${locale}/dashboard`}
          onClick={() => setIsOpen(false)}
          role="menuitem"
        >
          <span>{copy.accountMenu.dashboardLabel}</span>
        </a>
        <button
          className="tools-menu__item"
          disabled={isSigningOut}
          onClick={handleSignOut}
          role="menuitem"
          type="button"
        >
          <span>
            {isSigningOut ? copy.accountMenu.signingOutLabel : copy.accountMenu.signOutLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
