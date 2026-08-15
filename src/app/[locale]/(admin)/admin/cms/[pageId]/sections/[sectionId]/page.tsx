import { CmsPageSectionsRoute } from "@/features/admin/cms/components/CmsPageSectionsRoute";

export default async function CmsSectionEditorPage({
  params,
}: {
  params: Promise<{ locale: string; pageId: string; sectionId: string }>;
}) {
  const { locale, pageId, sectionId } = await params;
  return <CmsPageSectionsRoute locale={locale} pageId={pageId} sectionId={sectionId} />;
}
