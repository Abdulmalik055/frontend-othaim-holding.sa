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

export type OthaimNavigationLabelOverrides = Partial<Record<string, string | undefined>>;

type NavigationOptions = {
  placement?: "header" | "footer";
  labelOverrides?: OthaimNavigationLabelOverrides;
};

const navigationHierarchy = {
  whoWeAre: ["about", "family"],
  management: ["founder", "committee", "team"],
  business: ["portfolio", "strategy", "contact"],
} as const;

export function buildOthaimNavigation(
  pages: PublicCmsPageSummary[],
  locale: AppLocale,
  options: NavigationOptions = {}
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
          label: resolveNavigationLabel(page, locale, options),
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

function resolveNavigationLabel(
  page: PublicCmsPageSummary,
  locale: AppLocale,
  options: NavigationOptions
) {
  const placementLabel =
    options.placement === "header"
      ? locale === "ar"
        ? page.headerNavigationLabelAr
        : page.headerNavigationLabelEn
      : options.placement === "footer"
        ? locale === "ar"
          ? page.footerNavigationLabelAr
          : page.footerNavigationLabelEn
        : undefined;

  return (
    options.labelOverrides?.[page.slug]?.trim() ||
    placementLabel?.trim() ||
    (locale === "ar" ? page.titleAr : page.titleEn)
  );
}
