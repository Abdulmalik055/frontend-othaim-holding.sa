"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/config";

export function LocaleSwitch({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const t = useTranslations("publicCms");
  const nextLocale = locale === "ar" ? "en" : "ar";
  const href = pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${nextLocale}`);
  return (
    <Link
      href={href}
      hrefLang={nextLocale}
      className="text-xs font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
    >
      {nextLocale === "ar" ? t("languageArabic") : t("languageEnglish")}
    </Link>
  );
}
