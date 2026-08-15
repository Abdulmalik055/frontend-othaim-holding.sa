import type { MetadataRoute } from "next";
import { getPublicCmsNavigation } from "@/features/public/cms/api";
import { getPublicPageRoute } from "@/features/public/cms/public-routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const pages = await getPublicCmsNavigation().catch(() => []);
  return pages
    .filter((page) => page.isIndexable)
    .flatMap((page) =>
      (["ar", "en"] as const).map((locale) => {
        const path = getPublicPageRoute(locale, page.slug, page.category);
        const arabicPath = getPublicPageRoute("ar", page.slug, page.category);
        const englishPath = getPublicPageRoute("en", page.slug, page.category);
        return {
          url: new URL(path, siteUrl).toString(),
          lastModified: new Date(page.updatedAt),
          changeFrequency: "weekly" as const,
          priority: page.template === "home" ? 1 : page.category === "legal" ? 0.4 : 0.7,
          alternates: {
            languages: {
              ar: new URL(arabicPath, siteUrl).toString(),
              en: new URL(englishPath, siteUrl).toString(),
              "x-default": new URL(arabicPath, siteUrl).toString(),
            },
          },
        };
      })
    );
}
