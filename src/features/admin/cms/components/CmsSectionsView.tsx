"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminDataTable, type AdminColumn } from "@/components/ui/admin/AdminDataTable";
import { AdminBadge } from "@/components/ui/admin/AdminBadge";
import { useCmsSections, type CmsSection } from "@/features/admin/cms/hooks/useCmsSections";
import { getNextCmsSectionOrder } from "@/features/admin/cms/section-order";
import { useCmsSectionsReorder } from "@/features/admin/cms/hooks/useCmsSectionMutate";
import { CmsSectionDialog } from "@/features/admin/cms/components/CmsSectionDialog";
import type { CmsPage } from "@/features/admin/cms/hooks/useCmsPages";
import { PlusIcon, EditIcon } from "@/components/ui/shared/Icons";
import { useAuthStore } from "@/stores/useAuthStore";
import { hasAdminPermission } from "@/components/layout/admin-navigation";
import { isProtectedOthaimPageSlug } from "@/features/admin/cms/othaim-editor-contract";

type SectionRow = CmsSection & Record<string, unknown>;

type Props = {
  page: CmsPage;
  locale: string;
  onBack: () => void;
  initialSectionId?: string;
};

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
export function CmsSectionsView({ page, locale, onBack, initialSectionId }: Props) {
  const sectionsTranslations = useTranslations("admin.cmsPage.sections");
  const router = useRouter();
  const permissions = useAuthStore((state) => state.permissions);
  const canCreate = hasAdminPermission(permissions, "cms:create");
  const canEdit = hasAdminPermission(permissions, "cms:edit");
  const canDelete = hasAdminPermission(permissions, "cms:delete");
  const isProtectedOthaimPage = isProtectedOthaimPageSlug(page.slug);

  const [sectionDialog, setSectionDialog] = useState<
    { mode: "create" } | { mode: "edit"; section: CmsSection } | null
  >(null);
  const [routeDialogClosed, setRouteDialogClosed] = useState(false);

  const { data: sections = [], isLoading } = useCmsSections(page.id);
  const reorderMutation = useCmsSectionsReorder(page.id);
  const orderedSections = [...sections].sort((a, b) => a.order - b.order);
  const routedDialog =
    routeDialogClosed || !initialSectionId || isLoading
      ? null
      : initialSectionId === "new" && canCreate
        ? ({ mode: "create" } as const)
        : canEdit
          ? (() => {
              const selected = sections.find((section) => section.id === initialSectionId);
              return selected ? ({ mode: "edit", section: selected } as const) : null;
            })()
          : null;
  const activeSectionDialog = sectionDialog ?? routedDialog;
  const rows = orderedSections as SectionRow[];

  function getSectionLabel(row: SectionRow) {
    const localizedTitle =
      locale === "ar" ? row.titleAr || row.titleEn : row.titleEn || row.titleAr;
    return typeof localizedTitle === "string" && localizedTitle.trim()
      ? localizedTitle
      : `${sectionsTranslations("colTitle")} ${row.order}`;
  }

  const columns: AdminColumn<SectionRow>[] = [
    {
      key: "titleAr",
      label: sectionsTranslations("colTitle"),
      sortable: false,
      render: (row) => {
        const section = row as unknown as CmsSection;
        return (
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-gray-800 mb-0.5">{section.titleAr}</p>
            <p className="text-[11px] text-gray-400" dir="ltr">
              {section.titleEn}
            </p>
          </div>
        );
      },
    },
    {
      key: "order",
      label: sectionsTranslations("colOrder"),
      sortable: false,
      render: (row) => {
        const section = row as unknown as CmsSection;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-soft text-gray-700 text-[12px] font-semibold">
            {section.order}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: sectionsTranslations("colStatus"),
      sortable: false,
      render: (row) => {
        const section = row as unknown as CmsSection;
        return (
          <AdminBadge variant={section.isActive ? "active" : "inactive"}>
            {section.isActive
              ? sectionsTranslations("statusActive")
              : sectionsTranslations("statusInactive")}
          </AdminBadge>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb + back — identical to OrgDetailPage */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <nav className="flex items-center gap-[6px] text-[13px] text-gray-500">
          <Link
            href={`/${locale}/admin/dashboard`}
            className="hover:text-admin-primary transition-colors"
          >
            {sectionsTranslations("breadcrumbHome")}
          </Link>
          <span>/</span>
          {canCreate && (
            <button
              onClick={onBack}
              className="hover:text-admin-primary transition-colors border-0 bg-transparent cursor-pointer text-[13px] text-gray-500 p-0"
            >
              {sectionsTranslations("breadcrumbCms")}
            </button>
          )}
          <span>/</span>
          <span className="text-gray-800 font-medium">
            {locale === "ar" ? page.titleAr : page.titleEn}
          </span>
        </nav>
        <button
          onClick={onBack}
          className="flex items-center gap-2 h-[36px] px-4 rounded-[8px] border border-gray-200 text-[13px] text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <span className={locale !== "ar" ? "[transform:scaleX(-1)]" : ""}>
            <BackIcon />
          </span>
          {sectionsTranslations("backToPages")}
        </button>
      </div>

      {/* Sections table */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-[0_2px_12px_rgba(52,89,165,0.10)] overflow-hidden">
        {reorderMutation.isError && (
          <p
            role="alert"
            className="border-b border-red-200 bg-red-50 px-7 py-3 text-sm font-bold text-red-700"
          >
            {sectionsTranslations("reorderError")}
          </p>
        )}
        {/* Table header — same style as OrgDetail section headers */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-surface-soft">
          <div className="flex items-center gap-2 text-[14px] font-bold text-gray-700">
            <span className="text-admin-primary">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            {sectionsTranslations("sectionsTitle")} ({sections.length})
          </div>
          {canCreate && (
            <button
              onClick={() => router.push(`/${locale}/admin/cms/${page.id}/sections/new`)}
              className="flex items-center gap-2 bg-admin-primary text-white px-5 py-2.5 rounded-[8px] text-[14px] font-semibold hover:bg-admin-primary-deep transition-colors border-0 cursor-pointer"
            >
              <PlusIcon />
              {sectionsTranslations("addSection")}
            </button>
          )}
        </div>

        <AdminDataTable<SectionRow>
          columns={columns}
          data={rows}
          keyField="id"
          loading={isLoading}
          emptyMessage={sectionsTranslations("empty")}
          hidePagination
          flat
          actionsLabel={sectionsTranslations("colActions")}
          rowReorder={
            canEdit && !isProtectedOthaimPage
              ? {
                  handleColumn: "titleAr",
                  disabled: reorderMutation.isPending,
                  getItemLabel: getSectionLabel,
                  onReorder: (nextRows) =>
                    reorderMutation.mutate(nextRows.map((row) => String(row.id))),
                  accessibility: {
                    handleLabel: (title) => sectionsTranslations("reorderHandle", { title }),
                    instructions: sectionsTranslations("reorderInstructions"),
                    pickedUp: (title, position, total) =>
                      sectionsTranslations("reorderPickedUp", { title, position, total }),
                    moved: (title, position, total) =>
                      sectionsTranslations("reorderMoved", { title, position, total }),
                    dropped: (title, position, total) =>
                      sectionsTranslations("reorderDropped", { title, position, total }),
                    canceled: (title) => sectionsTranslations("reorderCanceled", { title }),
                  },
                }
              : undefined
          }
          actions={(row) => {
            const section = row as unknown as CmsSection;
            return canEdit ? (
              <button
                onClick={() =>
                  router.push(`/${locale}/admin/cms/${page.id}/sections/${section.id}`)
                }
                className="flex items-center gap-1.5 text-[13px] text-admin-primary border border-gray-200 rounded-[6px] px-3 py-1.5 hover:bg-admin-primary-bg transition-colors whitespace-nowrap cursor-pointer bg-transparent"
              >
                <EditIcon />
                {sectionsTranslations("edit")}
              </button>
            ) : null;
          }}
        />
      </div>

      {/* Section dialog */}
      {activeSectionDialog && (
        <CmsSectionDialog
          mode={activeSectionDialog.mode}
          pageId={page.id}
          pageSlug={page.slug}
          section={activeSectionDialog.mode === "edit" ? activeSectionDialog.section : undefined}
          initialOrder={
            activeSectionDialog.mode === "create" ? getNextCmsSectionOrder(sections) : undefined
          }
          canDelete={canDelete}
          onClose={() => {
            setSectionDialog(null);
            setRouteDialogClosed(true);
            if (initialSectionId) router.push(`/${locale}/admin/cms/${page.id}`);
          }}
        />
      )}
    </div>
  );
}
