import type { Locale } from "@/i18n/locales";

import type { getDictionary } from "@/i18n/dictionaries";

type Dictionary = ReturnType<typeof getDictionary>;

type AppFooterProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function AppFooter({ locale, dictionary }: AppFooterProps) {
  const links = [
    { href: `/${locale}#product`, label: dictionary.navigation.product },
    { href: `/${locale}#design-system`, label: dictionary.navigation.design },
    { href: `/${locale}#accessibility`, label: dictionary.navigation.accessibility },
    { href: `/${locale}#readiness`, label: dictionary.navigation.readiness },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <a
            className="brand brand--footer"
            href={`/${locale}`}
            aria-label="QAVELIX home"
          >
            <span className="brand__mark" aria-hidden="true">
              Q
            </span>
            <span className="brand__text">QAVELIX</span>
          </a>
          <p className="site-footer__description">{dictionary.footer.description}</p>
        </div>

        <nav aria-label={dictionary.footer.linksLabel} className="site-footer__links">
          {links.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <p className="site-footer__phase">{dictionary.footer.phase}</p>
      </div>
    </footer>
  );
}
