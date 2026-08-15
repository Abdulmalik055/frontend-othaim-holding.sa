"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { AdminPageHeader } from "@/components/ui/admin/AdminPageHeader";
import { AdminTabs } from "@/components/ui/admin/AdminTabs";
import { SettingsGeneralTab } from "./SettingsGeneralTab";
// import { SettingsIntegrationsTab } from "./SettingsIntegrationsTab";

export function SettingsMain() {
  const settingsTranslations = useTranslations("admin.settingsPage");
  const adminTranslations = useTranslations("admin");
  const locale = useLocale();

  return (
    <div>
      <AdminPageHeader
        title={settingsTranslations("pageTitle")}
        breadcrumbs={[
          { label: adminTranslations("dashboard"), href: `/${locale}/admin/dashboard` },
          { label: settingsTranslations("pageTitle") },
        ]}
      />

      <div className="mt-6 bg-white rounded-[16px] shadow-[0_2px_12px_rgba(52,89,165,0.08)] p-6">
        <h3 className="text-[18px] font-bold text-gray-800 mb-4">
          {settingsTranslations("cardTitle")}
        </h3>
        <AdminTabs
          variant="config"
          tabs={[
            {
              id: "general",
              label: settingsTranslations("tabGeneral"),
              content: <SettingsGeneralTab />,
            },
            // {
            //   id: "integrations",
            //   label: settingsTranslations("tabIntegrations"),
            //   content: <SettingsIntegrationsTab />,
            // },
          ]}
        />
      </div>
    </div>
  );
}
