"use client";

import { useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  persistLanguagePreference,
  setLanguagePreferenceCookie,
  type AppLanguage,
} from "@/lib/language-preference";

type Props = {
  locale: string;
  className?: string;
};

export function AdminLanguageSwitcher({ locale, className = "" }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  function switchLocale(target: AppLanguage) {
    if (target === locale || isSwitching) return;
    setIsSwitching(true);

    setLanguagePreferenceCookie(target);
    router.replace(pathname, { locale: target, scroll: false });
    setIsSwitching(false);
    void persistLanguagePreference(target);
  }

  return (
    <div
      className={`flex h-[34px] overflow-hidden rounded-[8px] border border-gray-200 text-[12px] ${className}`}
    >
      <button
        type="button"
        onClick={() => switchLocale("ar")}
        className={`inline-flex min-w-[48px] items-center justify-center px-3 leading-none transition-all duration-150 ${
          locale === "ar"
            ? "bg-admin-primary text-white font-bold"
            : "bg-white text-mid hover:text-admin-primary"
        } ${isSwitching ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span className="-translate-y-px">ع</span>
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={`inline-flex min-w-[48px] items-center justify-center px-3 leading-none transition-all duration-150 ${
          locale === "en"
            ? "bg-admin-primary text-white font-bold"
            : "bg-white text-mid hover:text-admin-primary"
        } ${isSwitching ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        EN
      </button>
    </div>
  );
}
