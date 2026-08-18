import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { getPublicCmsNavigation, getPublicPlatformSettings } from "@/features/public/cms/api";
import { PublicHeader } from "@/features/public/cms/PublicHeader";
import { OthaimMotionEnhancer } from "@/features/public/cms/OthaimMotionEnhancer";
import { PublicNavigationProgress } from "@/features/public/cms/PublicNavigationProgress";
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
  const headerNavigation = buildOthaimNavigation(pages, locale, { placement: "header" });
  const footerNavigation = buildOthaimNavigation(pages, locale, { placement: "footer" });
  const legalLinks = buildFooterLegalLinks(pages, t);
  const displayName = localizedSetting(settings.nameAr, settings.nameEn, locale) || "Othaim Global";
  const displayBio = resolvePublicFooterBio(
    localizedSetting(settings.bioAr, settings.bioEn, locale),
    footerStatement
  );
  const address = localizedSetting(settings.addressAr, settings.addressEn, locale);
  const logoUrl = settings.logoUrl?.trim() || "/branding/logo-dark.svg";
  const holdingUrl = resolveHoldingUrl(settings.socialLinks?.holding);

  return (
    <div className="ogc-public min-h-screen">
      <a className="ogc-skip-link" href="#main-content">
        {t("skipToContent")}
      </a>
      <PublicHeader
        locale={locale}
        navigation={headerNavigation}
        logoUrl={logoUrl}
        logoAlt={displayName}
        labels={{
          home: t("brandHomeAria"),
          mainNavigation: t("mainNavigation"),
          menu: t("menu"),
          closeMenu: t("closeMenu"),
          whoWeAre: t("navigation.whoWeAre"),
          management: t("navigation.management"),
        }}
      />
      <PublicNavigationProgress label={t("loadingContent")} />
      <OthaimMotionEnhancer />

      {children}

      <footer className="ogc-footer">
        <div className="ogc-container">
          <div className="ogc-footer-grid">
            <div>
              <Image
                src={logoUrl}
                alt={displayName}
                width={218}
                height={100}
                className="ogc-footer-logo"
              />
              {displayBio && <p>{displayBio}</p>}
            </div>
            <FooterGroup
              label={t("navigation.whoWeAre")}
              items={footerNavigation.whoWeAre}
              locale={locale}
            />
            <FooterGroup
              label={t("navigation.management")}
              items={footerNavigation.management}
              locale={locale}
            />
            <div>
              <h2>{t("navigation.business")}</h2>
              {footerNavigation.business.map((item) => (
                <Link key={item.id} href={item.href} locale={locale}>
                  {item.label}
                </Link>
              ))}
              <a href={holdingUrl} target="_blank" rel="noopener noreferrer">
                {t("navigation.holding")} <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
          <div className="ogc-footer-bottom">
            <p>
              © {new Date().getFullYear()} {displayName}. {t("rights")}
            </p>
            {legalLinks.length > 0 && (
              <nav className="ogc-footer-legal" aria-label={t("legalCentre")}>
                {legalLinks.map((item) => (
                  <Link key={item.slug} href={`/legal/${item.slug}`} locale={locale}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </footer>
      <OrganizationJsonLd
        settings={settings}
        displayName={displayName}
        address={address}
        logoUrl={logoUrl}
        holdingUrl={holdingUrl}
      />
    </div>
  );
}

function buildFooterLegalLinks(
  pages: PublicCmsPageSummary[],
  t: (key: string) => string
) {
  const required = [
    { slug: "terms", label: t("legal.terms") },
    { slug: "usage", label: t("legal.usage") },
    { slug: "privacy", label: t("legal.privacy") },
  ] as const;
  const available = new Set(
    pages.filter((page) => page.category === "legal").map((page) => page.slug)
  );
  return required.every((item) => available.has(item.slug)) ? required : [];
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
  logoUrl,
  holdingUrl,
}: {
  settings: PublicPlatformSettings;
  displayName: string;
  address: string;
  logoUrl: string;
  holdingUrl: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return null;
  const sameAs = Object.entries(settings.socialLinks ?? {}).flatMap(([key, url]) =>
    key !== "holding" && /^https?:\/\//.test(url) ? [url] : []
  );
  const alternateNames = [settings.nameAr?.trim(), settings.nameEn?.trim()].filter(
    (name): name is string => Boolean(name && name !== displayName)
  );
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: displayName,
    alternateName: alternateNames.length ? alternateNames : undefined,
    url: siteUrl,
    logo: new URL(logoUrl, siteUrl).toString(),
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    address: address || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    parentOrganization: {
      "@type": "Organization",
      name: "Al Othaim Holding",
      url: holdingUrl,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

function resolveHoldingUrl(value: string | null | undefined) {
  const candidate = value?.trim();
  return candidate && /^https?:\/\//.test(candidate) ? candidate : "https://othaim.com.sa/";
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
