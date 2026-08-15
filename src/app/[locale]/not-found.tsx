"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";

export default function LocalizedNotFound() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("publicCms");
  return (
    <main className="ogc-public ogc-state">
      <div>
        <Image
          src="/branding/logo-dark.svg"
          alt="Othaim Global"
          width={218}
          height={100}
          priority
        />
        <p className="ogc-state-code">404</p>
        <h1>{t("notFoundTitle")}</h1>
        <p>{t("notFoundDescription")}</p>
        <Link className="ogc-button" href="/" locale={locale}>
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
