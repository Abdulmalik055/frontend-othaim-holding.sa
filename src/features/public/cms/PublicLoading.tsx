"use client";

import { useTranslations } from "next-intl";

export function PublicLoading() {
  const t = useTranslations("publicCms");

  return (
    <div className="ogc-public ogc-state" role="status" aria-label={t("loadingContent")}>
      <div>
        <span className="ogc-loader" aria-hidden />
        <p>{t("loadingContent")}</p>
      </div>
    </div>
  );
}
