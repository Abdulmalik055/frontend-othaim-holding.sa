import type { AppLocale } from "@/i18n/config";
import type { PublicCmsPageSummary } from "@/features/public/cms/types";

export type OthaimNavigationItem = {
  id: string;
  slug: string;
  label: string;
  href: string;
};

export type OthaimNavigation = {
  whoWeAre: OthaimNavigationItem[];
  management: OthaimNavigationItem[];
  business: OthaimNavigationItem[];
};

const navigationHierarchy = {
  whoWeAre: ["about", "family"],
  management: ["founder", "committee", "team"],
  business: ["portfolio", "strategy", "contact"],
} as const;

export function buildOthaimNavigation(
  pages: PublicCmsPageSummary[],
  locale: AppLocale
): OthaimNavigation {
  const pagesBySlug = new Map(
    pages
      .filter(
        (page) =>
          page.category === "info" &&
          (page.navigationPlacement === "header" ||
            page.navigationPlacement === "footer" ||
            page.navigationPlacement === "both")
      )
      .map((page) => [page.slug, page])
  );

  function select(slugs: readonly string[]) {
    return slugs.flatMap((slug) => {
      const page = pagesBySlug.get(slug);
      if (!page) return [];
      return [
        {
          id: page.id,
          slug: page.slug,
          label: locale === "ar" ? page.titleAr : page.titleEn,
          href: `/${page.slug}`,
        },
      ];
    });
  }

  return {
    whoWeAre: select(navigationHierarchy.whoWeAre),
    management: select(navigationHierarchy.management),
    business: select(navigationHierarchy.business),
  };
}
