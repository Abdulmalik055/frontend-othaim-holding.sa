import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CmsPageRenderer } from "@/features/public/cms/CmsPageRenderer";
import { PublicShell } from "@/features/public/cms/PublicShell";
import { getPublicCmsPage, PublicCmsRequestError } from "@/features/public/cms/api";
import { createCmsMetadata } from "@/features/public/cms/metadata";
import { routing } from "@/i18n/routing";
import type { AppLocale } from "@/i18n/config";
import { createCmsPageRendererLabels } from "@/features/public/cms/labels";
import { getHomeFooterStatement } from "@/features/public/cms/othaim-content";
import { PublicUnavailable } from "@/features/public/cms/PublicUnavailable";

type Props = { params: Promise<{ locale: string }> };

async function resolveLocale(params: Props["params"]): Promise<AppLocale> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) notFound();
  return locale as AppLocale;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  try {
    return createCmsMetadata(await getPublicCmsPage("info", "home"), locale);
  } catch {
    return {};
  }
}

export default async function LocaleRootPage({ params }: Props) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "publicCms" });
  let page;
  try {
    page = await getPublicCmsPage("info", "home");
  } catch (error) {
    if (error instanceof PublicCmsRequestError && error.status === 404) notFound();
    return (
      <PublicShell locale={locale}>
        <PublicUnavailable title={t("contentUnavailableTitle")} message={t("retry")} />
      </PublicShell>
    );
  }
  return (
    <PublicShell locale={locale} footerStatement={getHomeFooterStatement(page, locale)}>
      <CmsPageRenderer page={page} locale={locale} labels={createCmsPageRendererLabels(t)} />
    </PublicShell>
  );
}
