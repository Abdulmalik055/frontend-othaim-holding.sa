"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CmsPageHeader } from "@/features/admin/cms/components/CmsPageHeader";
import { CmsPagesTable } from "@/features/admin/cms/components/CmsPagesTable";
import { CmsPageDialog } from "@/features/admin/cms/components/CmsPageDialog";
import type { CmsPage } from "@/features/admin/cms/hooks/useCmsPages";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasAdminPermission } from "@/components/layout/admin-navigation";

type PageDialog = { mode: "create" } | { mode: "view" | "edit"; page: CmsPage };

export function CmsMain() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const permissions = useAuthStore((state) => state.permissions);
  const canCreate = hasAdminPermission(permissions, "cms:create");
  const canEdit = hasAdminPermission(permissions, "cms:edit");
  const canDelete = hasAdminPermission(permissions, "cms:delete");

  const [pageDialog, setPageDialog] = useState<PageDialog | null>(null);

  // ── Pages list ────────────────────────────────────────
  return (
    <>
      <CmsPageHeader onAdd={canCreate ? () => setPageDialog({ mode: "create" }) : undefined} />

      <CmsPagesTable
        locale={locale}
        onOpenDialog={(page) => setPageDialog({ mode: "view", page })}
        onViewSections={(page) => router.push(`/${locale}/admin/cms/${page.id}`)}
      />

      {pageDialog && (
        <CmsPageDialog
          mode={pageDialog.mode}
          page={pageDialog.mode !== "create" ? pageDialog.page : undefined}
          onClose={() => setPageDialog(null)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}
    </>
  );
}
