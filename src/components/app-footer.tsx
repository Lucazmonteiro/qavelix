import type { Locale } from "@/i18n/locales";

import { contentPageSlugs } from "@/config/content-pages";
import type { getDictionary } from "@/i18n/dictionaries";

type Dictionary = ReturnType<typeof getDictionary>;

type AppFooterProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function AppFooter({ locale, dictionary }: AppFooterProps) {
  const currentYear = new Date().getFullYear();
  const links = contentPageSlugs.map((slug) => ({
    href: `/${locale}/${slug}`,
    label: dictionary.pages[slug].label,
  }));

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <a
            className="brand brand--footer"
            href={`/${locale}`}
            aria-label={dictionary.navigation.homeLabel}
          >
            <span className="brand__mark" aria-hidden="true">
              Q
            </span>
            <span className="brand__text">QAVELIX</span>
          </a>
          <p className="site-footer__description">{dictionary.footer.description}</p>
        </div>

        <nav
          aria-label={dictionary.footer.linksLabel}
          className="site-footer__links"
          data-navigation-origin="footer-navigation"
          id="footer-navigation"
          tabIndex={-1}
        >
          {links.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <p className="site-footer__phase">
          © {currentYear} QAVELIX. {dictionary.footer.phase}
        </p>
      </div>
    </footer>
  );
}
