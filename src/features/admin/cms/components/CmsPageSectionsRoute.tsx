"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/shared/Spinner";
import { useCmsPage } from "@/features/admin/cms/hooks/useCmsPages";
import { CmsSectionsView } from "@/features/admin/cms/components/CmsSectionsView";

export function CmsPageSectionsRoute({
  pageId,
  locale,
  sectionId,
}: {
  pageId: string;
  locale: string;
  sectionId?: string;
}) {
  const router = useRouter();
  const t = useTranslations("admin.cmsPage.sections");
  const pageQuery = useCmsPage(pageId);
  if (pageQuery.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-admin-primary">
        <Spinner />
      </div>
    );
  }
  if (!pageQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
        {t("loadPageError")}
      </div>
    );
  }
  return (
    <CmsSectionsView
      page={pageQuery.data}
      locale={locale}
      initialSectionId={sectionId}
      onBack={() => router.push(`/${locale}/admin/cms`)}
    />
  );
}
