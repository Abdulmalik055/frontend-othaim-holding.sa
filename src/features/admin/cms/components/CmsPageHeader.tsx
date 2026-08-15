"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { AdminButton, ADMIN_HEADER_ACTION_BUTTON_CLASS } from "@/components/ui/admin/AdminButton";
import { PlusIcon } from "@/components/ui/shared/Icons";

type Props = { onAdd?: () => void };

export function CmsPageHeader({ onAdd }: Props) {
  const { locale } = useParams<{ locale: string }>();
  const tableTranslations = useTranslations("admin.cmsPage.table");

  return (
    <AdminPageHeader
      title={tableTranslations("pageTitle")}
      breadcrumbs={[
        { label: tableTranslations("breadcrumbHome"), href: `/${locale}/admin/dashboard` },
        { label: tableTranslations("breadcrumbCms") },
      ]}
      action={
        onAdd ? (
          <AdminButton size="sm" className={ADMIN_HEADER_ACTION_BUTTON_CLASS} onClick={onAdd}>
            <PlusIcon />
            {tableTranslations("addPage")}
          </AdminButton>
        ) : undefined
      }
    />
  );
}
