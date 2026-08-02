export {};

declare global {
  interface Window {
    // Pushed to by AdUnit (src/components/ads/ad-unit.tsx) to request each ad slot's
    // render, per Google AdSense's own integration contract. The array exists (and is
    // read/pushed to) whether or not the adsbygoogle.js loader has finished loading yet —
    // that script drains and takes over the array once it runs.
    adsbygoogle?: unknown[];
  }
}
