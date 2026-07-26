import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const accountMenu = await readFile("src/components/account-menu.tsx", "utf8");
const toolsMenu = await readFile("src/components/app-header.tsx", "utf8");
const appHeader = toolsMenu;
const globalStyles = await readFile("src/styles/globals.css", "utf8");

test("account menu mirrors tools-menu's exact interaction pattern, not a new one", () => {
  for (const source of [accountMenu, toolsMenu]) {
    assert.match(source, /addEventListener\("pointerdown", handlePointerDown\)/);
    assert.match(source, /addEventListener\("keydown", handleKeyDown\)/);
    assert.match(source, /event\.key === "Escape"/);
  }

  assert.match(accountMenu, /aria-expanded=\{isOpen\}/);
  assert.match(accountMenu, /aria-haspopup="menu"/);
  assert.match(accountMenu, /role="menu"/);
  assert.match(accountMenu, /role="menuitem"/);
});

test("account menu reuses tools-menu CSS classes instead of duplicating dropdown styles", () => {
  assert.match(accountMenu, /className="tools-menu"/);
  assert.match(accountMenu, /tools-menu__button/);
  assert.match(accountMenu, /tools-menu__panel/);
  assert.match(accountMenu, /tools-menu__panel--open/);
  assert.match(accountMenu, /tools-menu__item/);

  assert.match(globalStyles, /button\.tools-menu__item \{/);
});

test("account menu renders session-aware state: guest link vs. signed-in dropdown", () => {
  assert.match(accountMenu, /useSession/);
  assert.match(accountMenu, /if \(session\.isPending\)/);
  assert.match(accountMenu, /if \(!session\.data\)/);
  assert.match(accountMenu, /href=\{`\/\$\{locale\}\/sign-in`\}/);
});

test("logged-out visitors see a registration CTA beside sign-in, registration primary and sign-in secondary", () => {
  const guestBranch = accountMenu.slice(
    accountMenu.indexOf("if (!session.data)"),
    accountMenu.indexOf("const { user } = session.data;"),
  );

  assert.match(guestBranch, /href=\{`\/\$\{locale\}\/sign-up`\}/);
  assert.match(guestBranch, /copy\.guestNav\.signUpLabel/);
  assert.match(guestBranch, /className="button button--primary guest-nav-actions__signup"/);
  // Sign-in stays a plain secondary nav link, not promoted to the primary button style.
  assert.match(
    guestBranch,
    /<a className="primary-nav__link" href=\{`\/\$\{locale\}\/sign-in`\}>/,
  );
});

test("sign out calls the client SDK and returns the visitor to the homepage", () => {
  assert.match(accountMenu, /authClient\.signOut\(\)/);
  assert.match(accountMenu, /router\.push\(`\/\$\{locale\}`\)/);
  assert.match(accountMenu, /router\.refresh\(\)/);
});

test("AccountMenu is composed into the header's existing actions slot, not inlined", () => {
  assert.match(appHeader, /import \{ AccountMenu \} from "@\/components\/account-menu"/);
  assert.match(appHeader, /<AccountMenu dictionary=\{dictionary\} locale=\{locale\} \/>/);
});
