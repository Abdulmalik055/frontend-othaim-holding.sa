import type { AppLocale } from "@/i18n/config";
import { getCmsPagePath } from "@/lib/cms-link";

export const OTHAIM_PUBLIC_PAGE_SLUGS = [
  "about",
  "family",
  "founder",
  "committee",
  "team",
  "portfolio",
  "strategy",
  "contact",
] as const;

export type OthaimPublicPageSlug = (typeof OTHAIM_PUBLIC_PAGE_SLUGS)[number];

export function isOthaimPublicPageSlug(value: string): value is OthaimPublicPageSlug {
  return OTHAIM_PUBLIC_PAGE_SLUGS.includes(value as OthaimPublicPageSlug);
}

const RESERVED_INFO_SLUGS = new Set(["home", "legal", "admin", "auth", "api"]);

export function isPublicInfoSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && !RESERVED_INFO_SLUGS.has(value);
}

export function getPublicPageRoute(locale: AppLocale, slug: string, category: "info" | "legal") {
  const path = getCmsPagePath({ category, slug, template: slug === "home" ? "home" : "default" });
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
