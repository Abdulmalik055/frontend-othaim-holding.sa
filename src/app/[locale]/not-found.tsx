"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function LocalizedNotFound() {
  const { locale } = useParams<{ locale?: string }>();
  const isArabic = locale === "ar";
  const t = useTranslations("publicCms");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111820] px-5 text-center text-white">
      <div>
        <p className="text-sm font-bold tracking-[0.3em] text-[#cfb271]">404</p>
        <h1 className="mt-5 text-4xl font-black">{t("notFoundTitle")}</h1>
        <p className="mt-4 text-white/60">{t("notFoundDescription")}</p>
        <Link
          className="mt-8 inline-flex bg-[#cfb271] px-6 py-3 font-bold text-[#111820]"
          href={`/${isArabic ? "ar" : "en"}`}
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
