"use client";

import { useState } from "react";

import { CompressionPanel } from "@/components/compression-panel";
import type { getDictionary } from "@/i18n/dictionaries";

type Dictionary = ReturnType<typeof getDictionary>;

type HomepageCompressorProps = {
  copy: {
    title: Dictionary["home"]["title"];
    eyebrow: Dictionary["home"]["eyebrow"];
    description: Dictionary["home"]["description"];
    primaryAction: Dictionary["home"]["primaryAction"];
    compression: Dictionary["compression"];
  };
};

export function HomepageCompressor({ copy }: HomepageCompressorProps) {
  const [hasValidatedFile, setHasValidatedFile] = useState(false);

  return (
    <section className="hero-section hero-section--tool" id="product">
      <div className="hero-section__content hero-section__content--tool">
        {/* Visually hidden: the page's single semantic <h1>, matching the same
            sr-only pattern already used on the Extract Audio tool page. The visible
            headline design (eyebrow + description) is unchanged; this only gives the
            homepage a real heading for SEO/assistive tech without altering the look. */}
        <h1 className="sr-only">{copy.title}</h1>
        <p className="eyebrow">{copy.eyebrow}</p>
        <p className="hero-section__description">
          {hasValidatedFile
            ? copy.compression.validationHelper
            : copy.description}
        </p>
      </div>

      <div className="homepage-tool" aria-label={copy.primaryAction}>
        <CompressionPanel
          copy={copy.compression}
          onValidatedChange={setHasValidatedFile}
        />
      </div>
    </section>
  );
}
