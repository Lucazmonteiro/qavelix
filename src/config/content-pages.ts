export const contentPageSlugs = [
  "about",
  "contact",
  "faq",
  "privacy-policy",
  "terms",
  "cookie-policy",
] as const;

export type ContentPageSlug = (typeof contentPageSlugs)[number];

export function isContentPageSlug(value: string): value is ContentPageSlug {
  return contentPageSlugs.includes(value as ContentPageSlug);
}
