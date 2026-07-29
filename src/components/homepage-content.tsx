"use client";

import { FoundationCard } from "@/components/foundation-card";
import { HomepageCompressor } from "@/components/homepage-compressor";
import { SectionHeading } from "@/components/section-heading";
import { useLocaleState } from "@/i18n/locale-context";

export function HomepageContent() {
  const { dictionary, locale } = useLocaleState();
  const design = dictionary.home.sections.designSystem;
  const accessibility = dictionary.home.sections.accessibility;
  const readiness = dictionary.home.sections.readiness;
  const pricing = dictionary.home.pricing;

  return (
    <main className="page-shell" id="main-content">
      <HomepageCompressor
        copy={{
          title: dictionary.home.title,
          eyebrow: dictionary.home.eyebrow,
          description: dictionary.home.description,
          primaryAction: dictionary.home.primaryAction,
          compression: dictionary.compression,
        }}
      />

      <section className="workflow-summary" aria-label={dictionary.home.statusLabel}>
        <div>
          <p className="eyebrow">{dictionary.home.previewLabel}</p>
          <h2>{dictionary.home.previewTitle}</h2>
          <p>{dictionary.home.previewDescription}</p>
        </div>

        <dl className="stat-grid" aria-label={dictionary.home.statusLabel}>
          <div className="stat-grid__item stat-grid__item--max-size">
            <dt>{dictionary.home.maxSizeCard.label}</dt>
            <dd className="stat-grid__max-size-rows">
              <span className="stat-grid__max-size-row">
                <span className="stat-grid__max-size-plan">
                  {dictionary.home.maxSizeCard.freeLabel}
                </span>
                <span className="stat-grid__max-size-value">
                  {dictionary.home.maxSizeCard.freeValue}
                </span>
              </span>
              <span className="stat-grid__max-size-row stat-grid__max-size-row--pro">
                <span className="stat-grid__max-size-plan">
                  {dictionary.home.maxSizeCard.proLabel}
                </span>
                <span className="stat-grid__max-size-value">
                  {dictionary.home.maxSizeCard.proValue}
                </span>
              </span>
            </dd>
          </div>
          {dictionary.home.stats.map((stat) => (
            <div className="stat-grid__item" key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="supporting-preview">
        <aside className="product-preview" aria-labelledby="preview-title">
          <p className="product-preview__label">{dictionary.home.previewLabel}</p>
          <h2 id="preview-title">{dictionary.home.previewTitle}</h2>
          <p>{dictionary.home.previewDescription}</p>
          <ul>
            {dictionary.home.previewItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="scope-note">
            <span>{dictionary.home.statusLabel}</span>
            <strong>{dictionary.home.statusValue}</strong>
          </div>
        </aside>
      </section>

      <section className="content-section" id="pricing">
        <SectionHeading
          description={pricing.description}
          eyebrow={pricing.eyebrow}
          title={pricing.title}
        />
        <div className="pricing-grid">
          {pricing.plans.map((plan) => (
            <article
              className={`pricing-card${plan.highlight ? " pricing-card--highlight" : ""}`}
              key={plan.name}
            >
              {plan.badge ? <p className="pricing-card__badge">{plan.badge}</p> : null}
              <h3>{plan.name}</h3>
              <p className="pricing-card__price">
                <span className="pricing-card__amount">{plan.price}</span>
                {plan.cadence ? (
                  <span className="pricing-card__cadence">{plan.cadence}</span>
                ) : null}
              </p>
              <ul className="check-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <a
                className={`button ${plan.highlight ? "button--primary" : "button--secondary"}`}
                href={`/${locale}/sign-up`}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
        <p className="pricing-note">{pricing.note}</p>
      </section>

      <section className="content-section" id="faq">
        <SectionHeading
          description={dictionary.pages.faq.description}
          eyebrow={dictionary.pages.faq.eyebrow}
          title={dictionary.pages.faq.title}
        />
        <div className="feature-grid">
          {dictionary.pages.faq.sections.slice(0, 6).map((item) => (
            <FoundationCard
              description={item.body.join(" ")}
              key={item.title}
              title={item.title}
            />
          ))}
        </div>
      </section>

      <section className="card-grid" aria-label={dictionary.home.eyebrow}>
        {dictionary.home.principles.map((principle) => (
          <FoundationCard
            description={principle.description}
            key={principle.title}
            title={principle.title}
          />
        ))}
      </section>

      <section className="content-section" id="design-system">
        <SectionHeading
          description={design.description}
          eyebrow={design.eyebrow}
          title={design.title}
        />
        <div className="feature-grid">
          {design.items.map((item) => (
            <FoundationCard
              description={item.description}
              key={item.title}
              title={item.title}
            />
          ))}
        </div>
      </section>

      <section className="split-section" id="accessibility">
        <div>
          <SectionHeading
            description={accessibility.description}
            eyebrow={accessibility.eyebrow}
            title={accessibility.title}
          />
        </div>
        <ul className="check-list">
          {accessibility.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="content-section content-section--last" id="readiness">
        <SectionHeading
          description={readiness.description}
          eyebrow={readiness.eyebrow}
          title={readiness.title}
        />
        <div className="feature-grid">
          {readiness.items.map((item) => (
            <FoundationCard
              description={item.description}
              key={item.title}
              title={item.title}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
