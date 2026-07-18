"use client";

import { useState } from "react";

import { CompressionPanel } from "@/components/compression-panel";
import type { getDictionary } from "@/i18n/dictionaries";

type Dictionary = ReturnType<typeof getDictionary>;

type HomepageCompressorProps = {
  copy: {
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
