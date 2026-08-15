import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/config";
import type { PublicCmsPage } from "@/features/public/cms/types";
import { getPublicPageRoute } from "@/features/public/cms/public-routes";

export function createCmsMetadata(page: PublicCmsPage, locale: AppLocale): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const isHome = page.template === "home" || page.slug === "home";
  const route = isHome ? `/${locale}` : getPublicPageRoute(locale, page.slug, page.category);
  const alternateRoute = isHome
    ? (nextLocale: AppLocale) => `/${nextLocale}`
    : (nextLocale: AppLocale) => getPublicPageRoute(nextLocale, page.slug, page.category);
  const title = locale === "ar" ? page.seoTitleAr || page.titleAr : page.seoTitleEn || page.titleEn;
  const description = getCmsDescription(page, locale);
  const seoImage = page.seoImageAssetId ? page.assetsById[page.seoImageAssetId] : undefined;
  const seoImageUrl =
    seoImage?.type === "image" && typeof seoImage.url === "string" && seoImage.url
      ? new URL(seoImage.url, siteUrl).toString()
      : undefined;

  return {
    title: { absolute: title },
    description,
    robots: page.isIndexable ? { index: true, follow: true } : { index: false, follow: false },
    alternates: {
      canonical: new URL(route, siteUrl).toString(),
      languages: {
        ar: new URL(alternateRoute("ar"), siteUrl).toString(),
        en: new URL(alternateRoute("en"), siteUrl).toString(),
        "x-default": new URL(alternateRoute("ar"), siteUrl).toString(),
      },
    },
    openGraph: {
      title,
      description,
      url: new URL(route, siteUrl).toString(),
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_SA"],
      type: "website",
      ...(seoImageUrl ? { images: [seoImageUrl] } : {}),
    },
    twitter: {
      card: seoImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(seoImageUrl ? { images: [seoImageUrl] } : {}),
    },
  };
}

export function getCmsDescription(page: PublicCmsPage, locale: AppLocale) {
  const explicit = locale === "ar" ? page.seoDescriptionAr : page.seoDescriptionEn;
  if (explicit?.trim()) return explicit.trim();

  const paragraph = page.sections
    .flatMap((section) => section.content.blocks)
    .flatMap((block) => block.items)
    .find((item) => item.type === "text" && item.text.format === "p");
  if (!paragraph || paragraph.type !== "text") return undefined;

  const localized = locale === "ar" ? paragraph.text.textAr : paragraph.text.textEn;
  const normalized = localized.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, 160) : undefined;
}
