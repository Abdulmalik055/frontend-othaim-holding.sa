import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { routing } from "@/i18n/routing";
import { CmsPageRenderer } from "@/features/public/cms/CmsPageRenderer";
import { PublicShell } from "@/features/public/cms/PublicShell";
import { getPublicCmsPage, PublicCmsRequestError } from "@/features/public/cms/api";
import { createCmsMetadata } from "@/features/public/cms/metadata";

type Props = {
  params: Promise<{ locale: string; category: string; slug: string }>;
};

async function resolveParams(params: Props["params"]) {
  const value = await params;
  if (
    !routing.locales.includes(value.locale as AppLocale) ||
    (value.category !== "info" && value.category !== "legal") ||
    value.slug === "home"
  ) {
    notFound();
  }
  return value as { locale: AppLocale; category: "info" | "legal"; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, category, slug } = await resolveParams(params);
  try {
    return createCmsMetadata(await getPublicCmsPage(category, slug), locale);
  } catch {
    const t = await getTranslations({ locale, namespace: "publicCms" });
    return { title: t("notFoundMetadata") };
  }
}

export default async function PublicCmsPageRoute({ params }: Props) {
  const { locale, category, slug } = await resolveParams(params);
  const t = await getTranslations({ locale, namespace: "publicCms" });
  let page;
  try {
    page = await getPublicCmsPage(category, slug);
  } catch (error) {
    if (error instanceof PublicCmsRequestError && error.status === 404) notFound();
    return (
      <PublicShell locale={locale}>
        <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-24 text-center">
          <h1 className="text-3xl font-black">{t("pageUnavailableTitle")}</h1>
          <p className="mt-4 text-[#5d6268]">{t("retryLater")}</p>
        </main>
      </PublicShell>
    );
  }
  return (
    <PublicShell locale={locale}>
      <CmsPageRenderer
        page={page}
        locale={locale}
        labels={{
          legalCentre: t("legalCentre"),
          insidePlatform: t("insidePlatform"),
          information: t("information"),
          empty: t("empty"),
        }}
      />
    </PublicShell>
  );
}
