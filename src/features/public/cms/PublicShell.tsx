import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { getPublicCmsNavigation, getPublicPlatformSettings } from "@/features/public/cms/api";
import { LocaleSwitch } from "@/features/public/cms/LocaleSwitch";
import type { PublicCmsPageSummary, PublicPlatformSettings } from "@/features/public/cms/types";
import { getLocalizedCmsPagePath } from "@/lib/cms-link";

export async function PublicShell({
  locale,
  children,
}: {
  locale: AppLocale;
  children: React.ReactNode;
}) {
  const [navigation, settings] = await Promise.all([
    getPublicCmsNavigation().catch(() => [] as PublicCmsPageSummary[]),
    getPublicPlatformSettings().catch(() => ({}) as PublicPlatformSettings),
  ]);
  const t = await getTranslations({ locale, namespace: "publicCms" });
  const headerPages = navigation.filter(
    (page) => page.navigationPlacement === "header" || page.navigationPlacement === "both"
  );
  const footerPages = navigation.filter(
    (page) => page.navigationPlacement === "footer" || page.navigationPlacement === "both"
  );
  const siteName = locale === "ar" ? settings.nameAr : settings.nameEn;
  const alternateSiteName = locale === "ar" ? settings.nameEn : settings.nameAr;
  const displayName = siteName?.trim() || alternateSiteName?.trim() || "";
  const siteBio = locale === "ar" ? settings.bioAr : settings.bioEn;
  const alternateSiteBio = locale === "ar" ? settings.bioEn : settings.bioAr;
  const displayBio = siteBio?.trim() || alternateSiteBio?.trim() || "";
  const logoUrl = settings.logoUrl?.trim() || "";

  return (
    <div className="min-h-screen bg-white text-[#111820]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111820]/95 text-white backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-8 px-5 sm:px-8">
          {(logoUrl || displayName) && (
            <Link
              href={`/${locale}`}
              aria-label={displayName || t("brandHomeAria")}
              className="inline-flex min-h-12 max-w-56 items-center rounded-xl bg-white px-3 py-2 text-[#111820]"
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={displayName}
                  className="max-h-8 max-w-full object-contain"
                />
              ) : (
                <span className="truncate text-sm font-black">{displayName}</span>
              )}
            </Link>
          )}
          <nav aria-label={t("mainNavigation")} className="hidden items-center gap-7 md:flex">
            {headerPages.map((page) => (
              <Link
                key={page.id}
                href={publicPageHref(page, locale)}
                className="text-sm font-medium text-white/80 transition-colors hover:text-[#cfb271]"
              >
                {locale === "ar" ? page.titleAr : page.titleEn}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <LocaleSwitch locale={locale} />
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none text-sm font-bold">{t("menu")}</summary>
              <nav className="absolute end-0 top-10 grid min-w-56 gap-1 border border-white/10 bg-[#111820] p-3 shadow-2xl">
                {headerPages.map((page) => (
                  <Link
                    key={page.id}
                    href={publicPageHref(page, locale)}
                    className="px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                  >
                    {locale === "ar" ? page.titleAr : page.titleEn}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>

      {children}

      <footer className="bg-[#111820] px-5 py-14 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 border-b border-white/10 pb-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            {(logoUrl || displayName) && (
              <div className="inline-flex min-h-14 max-w-64 items-center rounded-xl bg-white px-4 py-2 text-[#111820]">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={displayName}
                    className="max-h-10 max-w-full object-contain"
                  />
                ) : (
                  <span className="truncate text-base font-black">{displayName}</span>
                )}
              </div>
            )}
            {displayBio && (
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/60">{displayBio}</p>
            )}
          </div>
          <nav aria-label={t("footerNavigation")} className="grid content-start gap-3">
            {footerPages.map((page) => (
              <Link
                key={page.id}
                href={publicPageHref(page, locale)}
                className="text-sm text-white/70 hover:text-white"
              >
                {locale === "ar" ? page.titleAr : page.titleEn}
              </Link>
            ))}
          </nav>
          <address className="not-italic text-sm leading-7 text-white/60">
            {settings.email && (
              <a className="block hover:text-white" href={`mailto:${settings.email}`}>
                {settings.email}
              </a>
            )}
            {settings.phone && (
              <a className="block hover:text-white" href={`tel:${settings.phone}`}>
                {settings.phone}
              </a>
            )}
            <span>{locale === "ar" ? settings.addressAr : settings.addressEn}</span>
          </address>
        </div>
        <p className="mx-auto max-w-7xl pt-7 text-xs text-white/40">
          © {new Date().getFullYear()}
          {displayName ? ` ${displayName}.` : ""} {t("rights")}
        </p>
      </footer>
    </div>
  );
}

export function publicPageHref(
  page: Pick<PublicCmsPageSummary, "slug" | "category" | "template">,
  locale: AppLocale
) {
  return getLocalizedCmsPagePath(page, locale);
}
