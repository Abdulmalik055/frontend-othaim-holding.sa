"use client";

import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { setLanguagePreferenceCookie } from "@/lib/language-preference";

export function LocaleSwitch({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("publicCms");
  const nextLocale = locale === "ar" ? "en" : "ar";

  function switchLocale() {
    setLanguagePreferenceCookie(nextLocale);
    router.replace(pathname, { locale: nextLocale, scroll: false });
  }

  return (
    <button
      type="button"
      onClick={switchLocale}
      lang={nextLocale}
      className="ogc-language-toggle"
      aria-label={nextLocale === "ar" ? t("languageArabic") : t("languageEnglish")}
    >
      {nextLocale === "ar" ? "عربي" : "EN"}
    </button>
  );
}
