import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { CmsPageRenderer } from "@/features/public/cms/CmsPageRenderer";
import { PublicShell } from "@/features/public/cms/PublicShell";
import { getPublicCmsPage, PublicCmsRequestError } from "@/features/public/cms/api";
import { createCmsPageRendererLabels } from "@/features/public/cms/labels";
import { createCmsMetadata } from "@/features/public/cms/metadata";
import {
  isOthaimPublicPageSlug,
  OTHAIM_PUBLIC_PAGE_SLUGS,
} from "@/features/public/cms/public-routes";
import { PublicUnavailable } from "@/features/public/cms/PublicUnavailable";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

async function resolveParams(params: Props["params"]) {
  const value = await params;
  if (!routing.locales.includes(value.locale as AppLocale) || !isOthaimPublicPageSlug(value.slug)) {
    notFound();
  }
  return value as { locale: AppLocale; slug: (typeof OTHAIM_PUBLIC_PAGE_SLUGS)[number] };
}

export function generateStaticParams() {
  return OTHAIM_PUBLIC_PAGE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await resolveParams(params);
  try {
    return createCmsMetadata(await getPublicCmsPage("info", slug), locale);
  } catch {
    const t = await getTranslations({ locale, namespace: "publicCms" });
    return { title: t("notFoundMetadata") };
  }
}

export default async function OthaimPublicPage({ params }: Props) {
  const { locale, slug } = await resolveParams(params);
  const t = await getTranslations({ locale, namespace: "publicCms" });
  let page;
  try {
    page = await getPublicCmsPage("info", slug);
  } catch (error) {
    if (error instanceof PublicCmsRequestError && error.status === 404) notFound();
    return (
      <PublicShell locale={locale}>
        <PublicUnavailable title={t("pageUnavailableTitle")} message={t("retryLater")} />
      </PublicShell>
    );
  }
  return (
    <PublicShell locale={locale}>
      <CmsPageRenderer page={page} locale={locale} labels={createCmsPageRendererLabels(t)} />
    </PublicShell>
  );
}
