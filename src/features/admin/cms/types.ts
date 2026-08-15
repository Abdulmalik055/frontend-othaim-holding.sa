export type CmsPageCategory = "legal" | "info";
export type CmsPageTemplate = "home" | "about" | "default";
export type CmsNavigationPlacement = "none" | "header" | "footer" | "both";

export const CMS_PAGE_CATEGORIES: CmsPageCategory[] = ["legal", "info"];
export const CMS_PAGE_TEMPLATES: CmsPageTemplate[] = ["home", "about", "default"];
export const CMS_NAVIGATION_PLACEMENTS: CmsNavigationPlacement[] = [
  "none",
  "header",
  "footer",
  "both",
];

export function normalizeCmsPageCategory(value: string | undefined, slug: string): CmsPageCategory {
  if (value === "legal" || value === "info") return value;

  // Migration fallback for old pages that don't have category yet.
  if (slug === "terms" || slug === "privacy" || slug === "usage") return "legal";

  return "info";
}

export function normalizeCmsPageTemplate(value: string | undefined): CmsPageTemplate {
  if (value === "home" || value === "about" || value === "default") return value;
  return "default";
}
