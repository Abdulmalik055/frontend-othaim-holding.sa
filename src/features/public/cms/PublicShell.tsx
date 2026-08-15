import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { getPublicCmsNavigation, getPublicPlatformSettings } from "@/features/public/cms/api";
import { PublicHeader } from "@/features/public/cms/PublicHeader";
import { OthaimMotionEnhancer } from "@/features/public/cms/OthaimMotionEnhancer";
import { buildOthaimNavigation } from "@/features/public/cms/public-navigation";
import type { PublicCmsPageSummary, PublicPlatformSettings } from "@/features/public/cms/types";
import { getLocalizedCmsPagePath } from "@/lib/cms-link";
import { resolvePublicFooterBio } from "@/features/public/cms/public-footer";

export async function PublicShell({
  locale,
  children,
  footerStatement,
}: {
  locale: AppLocale;
  children: React.ReactNode;
  footerStatement?: string;
}) {
  const [pages, settings] = await Promise.all([
    getPublicCmsNavigation().catch(() => [] as PublicCmsPageSummary[]),
    getPublicPlatformSettings().catch(() => ({}) as PublicPlatformSettings),
  ]);
  const t = await getTranslations({ locale, namespace: "publicCms" });
  const navigation = buildOthaimNavigation(pages, locale);
  const displayName = localizedSetting(settings.nameAr, settings.nameEn, locale) || "Othaim Global";
  const displayBio = resolvePublicFooterBio(
    localizedSetting(settings.bioAr, settings.bioEn, locale),
    footerStatement
  );
  const address = localizedSetting(settings.addressAr, settings.addressEn, locale);

  return (
    <div className="ogc-public min-h-screen">
      <a className="ogc-skip-link" href="#main-content">
        {t("skipToContent")}
      </a>
      <PublicHeader
        locale={locale}
        navigation={navigation}
        labels={{
          home: t("brandHomeAria"),
          mainNavigation: t("mainNavigation"),
          menu: t("menu"),
          closeMenu: t("closeMenu"),
          whoWeAre: t("navigation.whoWeAre"),
          management: t("navigation.management"),
        }}
      />
      <OthaimMotionEnhancer />

      {children}

      <footer className="ogc-footer">
        <div className="ogc-container">
          <div className="ogc-footer-grid">
            <div>
              <Image
                src="/branding/logo-dark.svg"
                alt={displayName}
                width={218}
                height={100}
                className="ogc-footer-logo"
              />
              {displayBio && <p>{displayBio}</p>}
            </div>
            <FooterGroup
              label={t("navigation.whoWeAre")}
              items={navigation.whoWeAre}
              locale={locale}
            />
            <FooterGroup
              label={t("navigation.management")}
              items={navigation.management}
              locale={locale}
            />
            <div>
              <h2>{t("navigation.business")}</h2>
              {navigation.business.map((item) => (
                <Link key={item.id} href={item.href} locale={locale}>
                  {item.label}
                </Link>
              ))}
              <a href="https://othaim.com.sa/" target="_blank" rel="noopener noreferrer">
                {t("navigation.holding")} <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
          <div className="ogc-footer-bottom">
            <p>
              © {new Date().getFullYear()} {displayName}. {t("rights")}
            </p>
          </div>
        </div>
      </footer>
      <OrganizationJsonLd settings={settings} displayName={displayName} address={address} />
    </div>
  );
}

function FooterGroup({
  label,
  items,
  locale,
}: {
  label: string;
  items: ReturnType<typeof buildOthaimNavigation>["whoWeAre"];
  locale: AppLocale;
}) {
  return (
    <div>
      <h2>{label}</h2>
      {items.map((item) => (
        <Link key={item.id} href={item.href} locale={locale}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function OrganizationJsonLd({
  settings,
  displayName,
  address,
}: {
  settings: PublicPlatformSettings;
  displayName: string;
  address: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return null;
  const sameAs = Object.values(settings.socialLinks ?? {}).filter((url) =>
    /^https?:\/\//.test(url)
  );
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: displayName,
    url: siteUrl,
    logo: new URL("/branding/logo-dark.svg", siteUrl).toString(),
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    address: address || undefined,
    sameAs: sameAs.length ? sameAs : ["https://othaim.com.sa/"],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function localizedSetting(
  arabic: string | null | undefined,
  english: string | null | undefined,
  locale: AppLocale
) {
  const preferred = locale === "ar" ? arabic : english;
  const alternate = locale === "ar" ? english : arabic;
  return preferred?.trim() || alternate?.trim() || "";
}

export function publicPageHref(
  page: Pick<PublicCmsPageSummary, "slug" | "category" | "template">,
  locale: AppLocale
) {
  return getLocalizedCmsPagePath(page, locale);
}
