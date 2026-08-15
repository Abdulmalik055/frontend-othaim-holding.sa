import type { MetadataRoute } from "next";
import { getPublicCmsNavigation } from "@/features/public/cms/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const pages = await getPublicCmsNavigation().catch(() => []);
  return pages
    .filter((page) => page.isIndexable)
    .flatMap((page) =>
      (["ar", "en"] as const).map((locale) => {
        const path =
          page.template === "home" || page.slug === "home"
            ? `/${locale}`
            : `/${locale}/${page.category}/${page.slug}`;
        return {
          url: new URL(path, siteUrl).toString(),
          lastModified: new Date(page.updatedAt),
          changeFrequency: "weekly" as const,
          priority: page.template === "home" ? 1 : page.category === "legal" ? 0.4 : 0.7,
          alternates: {
            languages: {
              ar: new URL(path.replace(`/${locale}`, "/ar"), siteUrl).toString(),
              en: new URL(path.replace(`/${locale}`, "/en"), siteUrl).toString(),
            },
          },
        };
      })
    );
}
