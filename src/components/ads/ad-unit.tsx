"use client";

import { useEffect, useId, useRef, useState } from "react";

export type AdFormat = "top-banner" | "sidebar" | "in-article" | "interstitial";

type AdUnitPlan = "anonymous" | "free" | "pro" | null;

type AdUnitProps = {
  format: AdFormat;
  // The actor's plan, as resolved by useEntitlementGate()/checkEntitlement() elsewhere in
  // the same tool — passed in as a prop rather than fetched again here, so this component
  // never independently talks to /api/entitlements/* and can't disagree with the gate
  // that's already deciding whether the tool itself is usable. `null` means "not resolved
  // yet" (first render, before the gate's initial fetch lands) and renders the reserved-
  // space skeleton rather than either an ad or nothing, so layout never shifts once the
  // real plan arrives.
  plan: AdUnitPlan;
  className?: string;
  label?: string;
};

// Slot ids read directly via process.env.NEXT_PUBLIC_* (not the shared @/env/server
// module) — this is a client component, and every other importer of that module is
// server-only code (see its own comments); pulling the whole zod-validated env module
// into a client bundle for four optional strings isn't worth being the first exception to
// that boundary. Next.js inlines NEXT_PUBLIC_* references at build time either way.
const AD_SLOT_BY_FORMAT: Record<AdFormat, string | undefined> = {
  "top-banner": process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP_BANNER,
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  "in-article": process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE,
  interstitial: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INTERSTITIAL,
};

const AD_FORMAT_ATTR: Record<AdFormat, string> = {
  "top-banner": "auto",
  sidebar: "auto",
  "in-article": "fluid",
  interstitial: "auto",
};

// Reusable, format-aware AdSense unit. Renders nothing at all for Pro (100% ad-free, per
// product requirement — no DOM node, no script push, no ad request ever made) and nothing
// when AdSense isn't configured for this format (missing client id or slot id), so the
// component is always safe to drop into a page regardless of environment. While the
// actor's plan is still resolving, it reserves the ad's footprint with a skeleton so the
// eventual ad (or its absence) never causes layout shift — see .ad-unit--skeleton in
// globals.css for the fixed min-height per format this depends on.
export function AdUnit({ format, plan, className, label = "Advertisement" }: AdUnitProps) {
  const insertedRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const labelId = useId();
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = AD_SLOT_BY_FORMAT[format];
  const configured = Boolean(clientId && slotId);

  useEffect(() => {
    if (!configured || plan === "pro" || plan === null || insertedRef.current) {
      return;
    }

    // Deferred to a microtask (rather than calling setFailed directly in the effect body)
    // so the fallible push — ad blockers and browser extensions routinely make
    // adsbygoogle.js unavailable or throw here — never surfaces as an app error; it just
    // leaves the reserved space empty for this visitor.
    async function requestAd() {
      try {
        (window.adsbygoogle = window.adsbygoogle ?? []).push({});
        insertedRef.current = true;
      } catch {
        setFailed(true);
      }
    }

    void requestAd();
  }, [configured, plan]);

  if (plan === "pro" || !configured || failed) {
    return null;
  }

  if (plan === null) {
    return (
      <div
        aria-hidden="true"
        className={`ad-unit ad-unit--${format} ad-unit--skeleton${className ? ` ${className}` : ""}`}
      />
    );
  }

  return (
    <div aria-labelledby={labelId} className={`ad-unit ad-unit--${format}${className ? ` ${className}` : ""}`} role="complementary">
      <span className="ad-unit__label" id={labelId}>
        {label}
      </span>
      <ins
        className="adsbygoogle"
        data-ad-client={clientId}
        data-ad-format={AD_FORMAT_ATTR[format]}
        data-ad-slot={slotId}
        data-full-width-responsive="true"
        style={{ display: "block" }}
      />
    </div>
  );
}
