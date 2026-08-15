"use client";

import type { ReactNode } from "react";
import { usePlatformBrand } from "../hooks/usePlatformBrand";

type Props = {
  locale: string;
  className?: string;
  logoContainerClassName?: string;
  logoClassName?: string;
  nameClassName?: string;
  showName?: boolean;
  subtitle?: ReactNode;
  subtitleClassName?: string;
};

export function PlatformIdentity({
  locale,
  className = "flex items-center gap-3",
  logoContainerClassName = "flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white",
  logoClassName = "h-full w-full object-contain p-1.5",
  nameClassName = "font-bold text-gray-900",
  showName = true,
  subtitle,
  subtitleClassName = "text-xs text-gray-400",
}: Props) {
  const { data: brand } = usePlatformBrand();
  const primaryName = locale === "ar" ? brand?.nameAr : brand?.nameEn;
  const secondaryName = locale === "ar" ? brand?.nameEn : brand?.nameAr;
  const name = primaryName?.trim() || secondaryName?.trim() || "";
  const logoUrl = brand?.logoUrl?.trim() || "";

  if (!name && !logoUrl && !subtitle) return null;

  return (
    <div className={className}>
      {(logoUrl || name) && (
        <span className={logoContainerClassName}>
          {logoUrl ? (
            // The logo URL is a reference-safe media endpoint controlled by platform settings.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={name} className={logoClassName} />
          ) : (
            <span aria-hidden="true" className="text-lg font-black text-admin-primary">
              {Array.from(name)[0]}
            </span>
          )}
        </span>
      )}
      {showName && (name || subtitle) && (
        <span className="flex min-w-0 flex-col">
          {name && <span className={nameClassName}>{name}</span>}
          {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
        </span>
      )}
    </div>
  );
}
