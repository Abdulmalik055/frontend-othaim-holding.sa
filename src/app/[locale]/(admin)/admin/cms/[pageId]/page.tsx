import { CmsPageSectionsRoute } from "@/features/admin/cms/components/CmsPageSectionsRoute";

export default async function CmsPageSectionsPage({
  params,
}: {
  params: Promise<{ locale: string; pageId: string }>;
}) {
  const { locale, pageId } = await params;
  return <CmsPageSectionsRoute locale={locale} pageId={pageId} />;
}
