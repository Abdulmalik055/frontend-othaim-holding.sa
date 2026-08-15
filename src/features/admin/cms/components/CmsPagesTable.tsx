"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminDataTable, type AdminColumn } from "@/components/ui/admin/AdminDataTable";
import { AdminBadge } from "@/components/ui/admin/AdminBadge";
import { AdminSearchBar } from "@/components/ui/admin/AdminSearchBar";
import { AdminPagination } from "@/components/ui/admin/AdminPagination";
import {
  getCmsPageSectionsCount,
  useCmsPages,
  type CmsPage,
} from "@/features/admin/cms/hooks/useCmsPages";
import type { CmsPageCategory } from "@/features/admin/cms/types";
import { PAGINATION } from "@/lib/constants/pagination";
import { getLocalizedCmsPagePath } from "@/lib/cms-link";
import { getPaginationMeta } from "@/lib/pagination";
import { ExternalLinkIcon, EyeIcon, FileIcon, LayersIcon } from "@/components/ui/shared/Icons";

type PageRow = CmsPage & Record<string, unknown>;

type Props = {
  locale: string;
  onOpenDialog: (page: CmsPage) => void;
  onViewSections: (page: CmsPage) => void;
};

export function CmsPagesTable({ locale, onOpenDialog, onViewSections }: Props) {
  const tableTranslations = useTranslations("admin.cmsPage.table");

  const [page, setPage] = useState(1);
  const [inputVal, setInputVal] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"" | CmsPageCategory>("");
  const [statusFilter, setStatusFilter] = useState<"" | "true" | "false">("");

  const { data, isLoading } = useCmsPages({
    page,
    limit: PAGINATION.TABLE_LIMIT,
    search,
    category: categoryFilter || undefined,
    isActive: statusFilter === "" ? undefined : statusFilter === "true",
  });

  const rows = (data?.data ?? []) as PageRow[];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? page;
  const currentLimit = data?.limit ?? PAGINATION.TABLE_LIMIT;
  const { totalPages } = getPaginationMeta(total, currentPage, currentLimit);

  function categoryLabel(category: CmsPageCategory) {
    return category === "legal"
      ? tableTranslations("categoryLegal")
      : tableTranslations("categoryInfo");
  }

  const columns: AdminColumn<PageRow>[] = [
    {
      key: "titleAr",
      label: tableTranslations("colPage"),
      sortable: false,
      render: (row) => {
        const page = row as unknown as CmsPage;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-surface-soft flex items-center justify-center text-gray-500 flex-shrink-0">
              <FileIcon />
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-gray-800 mb-0.5">
                {locale === "ar" ? page.titleAr : page.titleEn}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      label: tableTranslations("colCategory"),
      sortable: false,
      render: (row) => {
        const page = row as unknown as CmsPage;
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-[8px] border border-gray-200 bg-gray-50 text-[12px] text-slate-600">
            {categoryLabel(page.category)}
          </span>
        );
      },
    },
    {
      key: "sections",
      label: tableTranslations("colSections"),
      sortable: false,
      render: (row) => {
        const page = row as unknown as CmsPage;
        return (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-soft text-gray-700 text-[12px] font-semibold">
            {getCmsPageSectionsCount(page)}
          </span>
        );
      },
    },
    {
      key: "updatedAt",
      label: tableTranslations("colDate"),
      sortable: true,
      render: (row) => {
        const page = row as unknown as CmsPage;
        return (
          <span className="text-gray-500 text-[13px]">
            {new Date(page.updatedAt).toLocaleDateString(
              locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB",
              { day: "2-digit", month: "2-digit", year: "numeric" }
            )}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: tableTranslations("colStatus"),
      sortable: false,
      render: (row) => {
        const page = row as unknown as CmsPage;
        return (
          <AdminBadge variant={page.isActive ? "active" : "inactive"}>
            {page.isActive
              ? tableTranslations("statusActive")
              : tableTranslations("statusInactive")}
          </AdminBadge>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Search */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_8px_rgba(52,89,165,0.05)] px-5 py-4">
        <AdminSearchBar
          search={inputVal}
          onSearchChange={setInputVal}
          searchPlaceholder={tableTranslations("search")}
          filters={[
            {
              key: "category",
              placeholder: tableTranslations("categoryAll"),
              options: [
                { label: tableTranslations("categoryAll"), value: "" },
                { label: tableTranslations("categoryLegal"), value: "legal" },
                { label: tableTranslations("categoryInfo"), value: "info" },
              ],
            },
            {
              key: "isActive",
              placeholder: tableTranslations("statusAll"),
              options: [
                { label: tableTranslations("statusAll"), value: "" },
                { label: tableTranslations("statusActive"), value: "true" },
                { label: tableTranslations("statusInactive"), value: "false" },
              ],
            },
          ]}
          filterValues={{ category: categoryFilter, isActive: statusFilter }}
          onFilterChange={(key, value) => {
            if (key === "category") setCategoryFilter(value as "" | CmsPageCategory);
            if (key === "isActive") setStatusFilter(value as "" | "true" | "false");
            setPage(1);
          }}
          onSearch={() => {
            setSearch(inputVal);
            setPage(1);
          }}
          searchButtonLabel={tableTranslations("searchButton")}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_12px_rgba(52,89,165,0.07)] overflow-hidden">
        <AdminDataTable<PageRow>
          columns={columns}
          data={rows}
          keyField="id"
          loading={isLoading}
          emptyMessage={tableTranslations("empty")}
          hidePagination
          flat
          actionsLabel={tableTranslations("colActions")}
          actions={(row) => {
            const page = row as unknown as CmsPage;
            const liveHref = getLocalizedCmsPagePath(page, locale);
            return (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenDialog(page)}
                  className="flex items-center gap-1.5 text-[13px] text-gray-500 border border-gray-200 rounded-[6px] px-3 py-1.5 hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer bg-transparent"
                >
                  <EyeIcon />
                  {tableTranslations("details")}
                </button>
                <button
                  onClick={() => onViewSections(page)}
                  className="flex items-center gap-1.5 text-[13px] text-admin-primary border border-gray-200 rounded-[6px] px-3 py-1.5 hover:bg-admin-primary-bg transition-colors whitespace-nowrap cursor-pointer bg-transparent"
                >
                  <LayersIcon />
                  {tableTranslations("viewSections")} ({getCmsPageSectionsCount(page)})
                </button>
                <a
                  href={liveHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={tableTranslations("previewNewTab")}
                  className="flex items-center gap-1.5 text-[13px] text-[#166534] border border-green-200 bg-success-bg rounded-[6px] px-3 py-1.5 hover:bg-success-bg-alt transition-colors whitespace-nowrap"
                >
                  <span aria-hidden="true">
                    <ExternalLinkIcon />
                  </span>
                  {tableTranslations("preview")}
                </a>
              </div>
            );
          }}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
            <span>
              {tableTranslations("paginationInfo", {
                total,
                current: currentPage,
                last: totalPages,
              })}
            </span>
            <AdminPagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
