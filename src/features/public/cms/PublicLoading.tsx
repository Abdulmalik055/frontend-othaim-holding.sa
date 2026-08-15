"use client";

import { useTranslations } from "next-intl";

export function PublicLoading() {
  const t = useTranslations("publicCms");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111820] text-white">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#cfb271] motion-reduce:animate-none" />
      <span className="sr-only">{t("loadingContent")}</span>
    </div>
  );
}
