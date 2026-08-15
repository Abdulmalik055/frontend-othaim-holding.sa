"use client";

import { useState, type ReactNode } from "react";
import { AdminPagination } from "./AdminPagination";
import { PAGINATION } from "@/lib/constants/pagination";
import { GripVerticalIcon } from "@/components/ui/shared/Icons";
import {
  SortableCollection,
  type SortableAccessibilityMessages,
  type SortableItemRenderContext,
} from "@/components/ui/shared/SortableCollection";

// ── Types ──────────────────────────────────────────────
export type AdminColumn<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
};

export type AdminRowReorder<T> = {
  handleColumn: keyof T | string;
  getItemLabel: (row: T) => string;
  onReorder: (rows: T[]) => void;
  accessibility: SortableAccessibilityMessages;
  disabled?: boolean;
};

type Props<T> = {
  columns: AdminColumn<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  actions?: (row: T) => ReactNode;
  actionsLabel?: string;
  hidePagination?: boolean;
  flat?: boolean;
  rowReorder?: AdminRowReorder<T>;
};

type SortDir = "asc" | "desc";

// ── Component ──────────────────────────────────────────
export function AdminDataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  loading,
  emptyMessage = "No data",
  pageSize = PAGINATION.DEFAULT_LIMIT,
  actions,
  actionsLabel,
  hidePagination,
  flat,
  rowReorder,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const sorted = [...data].sort((a, b) => {
    if (rowReorder || !sortKey) return 0;
    const aValue = String(a[sortKey] ?? "");
    const bValue = String(b[sortKey] ?? "");
    return sortDir === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const slice = hidePagination ? sorted : sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function renderRow(
    row: T,
    sortable?: Pick<SortableItemRenderContext<T>, "itemRef" | "handleRef" | "isDragging">
  ) {
    return (
      <tr
        key={String(row[keyField])}
        ref={sortable?.itemRef}
        className={[
          "border-b border-gray-100 last:border-0 hover:bg-neutral-50 transition-colors",
          sortable?.isDragging ? "relative z-10 bg-admin-primary-bg shadow-lg" : "",
        ].join(" ")}
      >
        {columns.map((col) => (
          <td
            key={String(col.key)}
            className="px-4 py-3 text-[14px] text-gray-700 align-middle whitespace-nowrap"
          >
            {rowReorder && String(col.key) === String(rowReorder.handleColumn) ? (
              <div className="flex items-center gap-2">
                <button
                  ref={sortable?.handleRef}
                  type="button"
                  disabled={rowReorder.disabled}
                  aria-label={rowReorder.accessibility.handleLabel(rowReorder.getItemLabel(row))}
                  className={[
                    "inline-flex h-8 w-8 shrink-0 touch-none items-center justify-center rounded-[6px] border-0 bg-transparent text-gray-400",
                    "cursor-grab hover:bg-gray-100 hover:text-admin-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary",
                    "active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40",
                    sortable?.isDragging ? "cursor-grabbing bg-white text-admin-primary" : "",
                  ].join(" ")}
                >
                  <GripVerticalIcon />
                </button>
                <div className="min-w-0">
                  {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "-")}
                </div>
              </div>
            ) : col.render ? (
              col.render(row)
            ) : (
              String(row[col.key as keyof T] ?? "-")
            )}
          </td>
        ))}
        {actions && (
          <td className="px-4 py-3 align-middle">
            <div className="flex items-center gap-1.5">{actions(row)}</div>
          </td>
        )}
      </tr>
    );
  }

  const tableContent = (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200">
            <tr className="bg-white">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => col.sortable && !rowReorder && toggleSort(String(col.key))}
                  className={[
                    "px-4 py-3 text-start text-[12px] font-[500] text-gray-400 whitespace-nowrap border-t-0",
                    col.sortable && !rowReorder
                      ? "cursor-pointer select-none hover:text-gray-700"
                      : "",
                  ].join(" ")}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && !rowReorder && (
                      <span className="text-gray-300">
                        {sortKey === String(col.key) ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              {actions && (
                <th
                  className="px-4 py-3 text-start text-[12px] font-[500] text-gray-400"
                  style={{ width: 110 }}
                >
                  {actionsLabel}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                    </td>
                  )}
                </tr>
              ))
            ) : slice.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : rowReorder ? (
              <SortableCollection
                items={slice}
                getItemId={(row) => String(row[keyField])}
                getItemLabel={rowReorder.getItemLabel}
                onReorder={rowReorder.onReorder}
                accessibility={rowReorder.accessibility}
                disabled={rowReorder.disabled}
              >
                {(sortable) => renderRow(sortable.item, sortable)}
              </SortableCollection>
            ) : (
              slice.map((row) => renderRow(row))
            )}
          </tbody>
        </table>
      </div>

      {!hidePagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
          <span>
            {sorted.length} items · Page {page} of {totalPages}
          </span>
          <AdminPagination totalPages={totalPages} currentPage={page} onPageChange={setPage} />
        </div>
      )}
    </>
  );

  if (flat) return tableContent;

  return (
    <div className="section-card flex flex-col gap-0 bg-white rounded-[10px] border border-gray-200 shadow-[0_2px_12px_rgba(52,89,165,0.07)] overflow-hidden">
      {tableContent}
    </div>
  );
}
