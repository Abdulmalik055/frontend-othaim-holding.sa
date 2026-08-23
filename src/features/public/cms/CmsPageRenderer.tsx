import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { AppLocale } from "@/i18n/config";
import { isSafeCmsHref } from "@/lib/cms-link";
import type { CmsSectionItem } from "@/features/cms/content-contract";
import type { PublicCmsPage, PublicCmsSection } from "@/features/public/cms/types";
import { OthaimSectionRenderer } from "@/features/public/cms/OthaimSectionRenderer";
import {
  CookieConsentManager,
  CookieSettingsTrigger,
} from "@/features/public/cms/CookieConsentManager";
import { isOthaimSectionForPage } from "@/features/public/cms/othaim-section-registry";
import { isOthaimPublicPageSlug } from "@/features/public/cms/public-routes";

export type CmsPageRendererLabels = {
  legalCentre: string;
  lastUpdated: string;
  insidePlatform: string;
  information: string;
  empty: string;
  formFullName: string;
  formOrganization: string;
  formEmail: string;
  formTopic: string;
  formMessage: string;
  formFullNamePlaceholder: string;
  formOrganizationPlaceholder: string;
  formEmailPlaceholder: string;
  formMessagePlaceholder: string;
  formSubmit: string;
  formSubmitting: string;
  formSuccess: string;
  formError: string;
  formRateLimited: string;
  formConfidentiality: string;
  topicPartnership: string;
  topicCoInvestment: string;
  topicFamilyOffice: string;
  topicMedia: string;
  topicOther: string;
  validationFullName: string;
  validationOrganization: string;
  validationEmail: string;
  validationTopic: string;
  validationMessage: string;
};

type Props = {
  page: PublicCmsPage;
  locale: AppLocale;
  labels: CmsPageRendererLabels;
};

export type CmsPageTemplateKey = "home" | "about" | "legal" | "default";

export function CmsPageRenderer({ page, locale, labels }: Props) {
  const visibleSections = page.sections.filter((section) => section.isActive !== false);
  const legalHeroSection =
    page.category === "legal"
      ? visibleSections.find((section) => section.slug === `${page.slug}-hero`)
      : undefined;
  const cookieConsentSection =
    page.category === "legal" && page.slug === "cookies"
      ? visibleSections.find((section) => section.slug === "cookies-consent-preferences")
      : undefined;
  const contentSections = visibleSections.filter(
    (section) => section.id !== legalHeroSection?.id && section.id !== cookieConsentSection?.id
  );
  const isOthaimPage = page.slug === "home" || isOthaimPublicPageSlug(page.slug);
  const Template = pageTemplateRegistry[getCmsPageTemplateKey(page)];
  const sections = contentSections.length ? (
    contentSections.map((section) =>
      isOthaimSectionForPage(page.slug, section.slug) ? (
        <OthaimSectionRenderer
          key={section.id}
          section={section}
          page={page}
          locale={locale}
          labels={labels}
        />
      ) : (
        <CmsSectionRenderer key={section.id} section={section} page={page} locale={locale} />
      )
    )
  ) : (
    <div className="ogc-public-error">{labels.empty}</div>
  );

  if (isOthaimPage) {
    return (
      <main id="main-content" className={`ogc-page ogc-page-${page.slug}`}>
        {sections}
      </main>
    );
  }

  const renderedPage = (
    <Template
      page={page}
      locale={locale}
      labels={labels}
      heroSummary={getLegalHeroSummary(legalHeroSection, locale)}
    >
      {sections}
    </Template>
  );
  return cookieConsentSection ? (
    <CookieConsentManager locale={locale} section={cookieConsentSection}>
      {renderedPage}
    </CookieConsentManager>
  ) : (
    renderedPage
  );
}

export function getCmsPageTemplateKey(
  page: Pick<PublicCmsPage, "template" | "category">
): CmsPageTemplateKey {
  if (page.template === "home") return "home";
  if (page.template === "about") return "about";
  return page.category === "legal" ? "legal" : "default";
}

type PageTemplateProps = {
  page: PublicCmsPage;
  locale: AppLocale;
  labels: CmsPageRendererLabels;
  children: ReactNode;
  heroSummary?: string;
};

function PageTitle({ page, locale }: Pick<PageTemplateProps, "page" | "locale">) {
  return locale === "ar" ? page.titleAr : page.titleEn;
}

function PageHeader({
  eyebrow,
  page,
  locale,
  description,
  updatedLabel,
}: Pick<PageTemplateProps, "page" | "locale"> & {
  eyebrow: string;
  description?: string;
  updatedLabel?: string;
}) {
  return (
    <header className="ogc-generic-header">
      <div className="ogc-container">
        <p className="ogc-eyebrow">{eyebrow}</p>
        <h1>
          <PageTitle page={page} locale={locale} />
        </h1>
        {description && <p className="ogc-legal-header-copy">{description}</p>}
        {updatedLabel && <p className="ogc-legal-updated">{updatedLabel}</p>}
      </div>
    </header>
  );
}

const pageTemplateRegistry: Record<CmsPageTemplateKey, (props: PageTemplateProps) => ReactNode> = {
  home: ({ children }) => (
    <main id="main-content" className="ogc-page ogc-page-generic">
      {children}
    </main>
  ),
  about: ({ page, locale, labels, children }) => (
    <main id="main-content" className="ogc-page ogc-page-generic">
      <PageHeader page={page} locale={locale} eyebrow={labels.insidePlatform} />
      {children}
    </main>
  ),
  legal: ({ page, locale, labels, heroSummary, children }) => (
    <main id="main-content" className="ogc-page ogc-page-generic ogc-page-legal">
      <PageHeader
        page={page}
        locale={locale}
        eyebrow={labels.legalCentre}
        description={heroSummary}
        updatedLabel={formatLegalUpdatedLabel(page, locale, labels.lastUpdated)}
      />
      {children}
    </main>
  ),
  default: ({ page, locale, labels, children }) => (
    <main id="main-content" className="ogc-page ogc-page-generic">
      <PageHeader page={page} locale={locale} eyebrow={labels.information} />
      {children}
    </main>
  ),
};

function CmsSectionRenderer({
  section,
  page,
  locale,
}: {
  section: PublicCmsSection;
  page: PublicCmsPage;
  locale: AppLocale;
}) {
  const isLegal = page.category === "legal";
  return (
    <section
      id={section.slug}
      className={
        isLegal ? "cms-section ogc-legal-section" : "cms-section ogc-section ogc-section-light"
      }
    >
      <div
        className={
          isLegal ? "ogc-container ogc-generic-content ogc-legal-content" : "ogc-container ogc-generic-content"
        }
      >
        <div className="grid gap-8">
          {section.content.blocks.map((block, blockIndex) => (
            <div key={`${section.id}-${blockIndex}`} className="grid gap-5">
              {block.items.map((item) => (
                <CmsItemRenderer key={item.key} item={item} locale={locale} page={page} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CmsItemRenderer({
  item,
  locale,
  page,
}: {
  item: CmsSectionItem;
  locale: AppLocale;
  page: PublicCmsPage;
}) {
  if (item.type === "text") {
    const value = getLocalizedCmsText(item, locale);
    if (page.slug === "cookies" && item.key === "settingsLabel") {
      return <CookieSettingsTrigger label={value} />;
    }
    if (item.text.format === "h1") {
      return <h1 className="max-w-5xl text-5xl font-black leading-[1.08] sm:text-7xl">{value}</h1>;
    }
    if (item.text.format === "h2") {
      return <h2 className="text-3xl font-black leading-tight sm:text-5xl">{value}</h2>;
    }
    if (item.text.format === "h3") {
      return <h3 className="text-xl font-bold leading-tight sm:text-2xl">{value}</h3>;
    }
    if (item.text.format === "p") {
      return <p className="ogc-generic-copy">{value}</p>;
    }
    if (item.text.format === "ul" || item.text.format === "ol") {
      const items = splitCmsListItems(value);
      const List = item.text.format;
      return (
        <List className="ogc-legal-list">
          {items.map((entry, index) => (
            <li key={`${item.key}-${index}`}>{entry}</li>
          ))}
        </List>
      );
    }
    return null;
  }

  if (item.type === "image") {
    const desktop = page.assetsById[item.image.desktopAssetId];
    const mobile = item.image.mobileAssetId ? page.assetsById[item.image.mobileAssetId] : undefined;
    if (!desktop?.url) return null;
    const alt = item.image.decorative
      ? ""
      : locale === "ar"
        ? (item.image.altAr ?? "")
        : (item.image.altEn ?? "");
    return (
      <div>
        {mobile?.url && (
          <Image
            src={mobile.url}
            alt={alt}
            width={mobile.width ?? desktop.width ?? 900}
            height={mobile.height ?? desktop.height ?? 1200}
            className="h-auto w-full rounded-sm object-cover sm:hidden"
            sizes="100vw"
          />
        )}
        <Image
          src={desktop.url}
          alt={alt}
          width={desktop.width ?? 1200}
          height={desktop.height ?? 900}
          className={`h-auto w-full rounded-sm object-cover${mobile?.url ? " hidden sm:block" : ""}`}
          sizes="(max-width: 860px) 100vw, 1180px"
        />
      </div>
    );
  }

  if (item.type === "video") {
    const desktop = page.assetsById[item.video.desktopAssetId];
    const mobile = item.video.mobileAssetId ? page.assetsById[item.video.mobileAssetId] : undefined;
    const poster = item.video.posterDesktopAssetId
      ? page.assetsById[item.video.posterDesktopAssetId]
      : undefined;
    const mobilePoster = item.video.posterMobileAssetId
      ? page.assetsById[item.video.posterMobileAssetId]
      : undefined;
    if (!desktop?.url) return null;

    const videoClassName = "h-auto w-full rounded-sm object-cover";
    const videoProps = {
      controls: true,
      playsInline: true,
      preload: "none" as const,
    };

    return (
      <>
        {mobile?.url ? (
          <>
            <video
              {...videoProps}
              className={`${videoClassName} sm:hidden`}
              poster={mobilePoster?.url ?? poster?.url ?? undefined}
            >
              <source src={mobile.url} type={mobile.mimeType ?? undefined} />
            </video>
            <video
              {...videoProps}
              className={`${videoClassName} hidden sm:block`}
              poster={poster?.url ?? undefined}
            >
              <source src={desktop.url} type={desktop.mimeType ?? undefined} />
            </video>
          </>
        ) : (
          <video {...videoProps} className={videoClassName} poster={poster?.url ?? undefined}>
            <source src={desktop.url} type={desktop.mimeType ?? undefined} />
          </video>
        )}
      </>
    );
  }

  if (item.type === "file") {
    const asset = page.assetsById[item.file.assetId];
    if (!asset?.url) return null;
    return (
      <a
        href={asset.url}
        download
        className="inline-flex w-fit items-center gap-3 border-b border-current py-2 text-base font-bold transition-opacity hover:opacity-60"
      >
        {locale === "ar"
          ? (item.file.titleAr ?? asset.filename)
          : (item.file.titleEn ?? asset.filename)}
        <span aria-hidden>↓</span>
      </a>
    );
  }

  if (!isSafeCmsHref(item.link.href)) return null;
  const href = localizeCmsHref(item.link.href, locale);
  const label = locale === "ar" ? item.link.labelAr : item.link.labelEn;
  const className =
    item.link.style === "text"
      ? "ogc-generic-link ogc-generic-link-text"
      : item.link.style === "secondary"
        ? "ogc-generic-link ogc-generic-link-secondary"
        : "ogc-button";
  const external = /^(https?:|mailto:|tel:)/.test(href);
  if (external) {
    return (
      <a
        href={href}
        className={className}
        target={item.link.openInNewTab ? "_blank" : undefined}
        rel={item.link.openInNewTab ? "noopener noreferrer" : undefined}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function localizeCmsHref(href: string, locale: AppLocale) {
  if (!href.startsWith("/") || href.startsWith("/uploads/")) return href;
  if (/^\/(ar|en)(\/|$)/.test(href)) return href;
  const cleanHref = href.replace(/^\/info(?=\/)/, "");
  return cleanHref === "/home" || cleanHref === "/" ? `/${locale}` : `/${locale}${cleanHref}`;
}

export { isSafeCmsHref };

export function getLocalizedCmsText(
  item: Extract<CmsSectionItem, { type: "text" }>,
  locale: AppLocale
) {
  return locale === "ar" ? item.text.textAr : item.text.textEn;
}

function splitCmsListItems(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getLegalHeroSummary(section: PublicCmsSection | undefined, locale: AppLocale) {
  if (!section) return undefined;
  for (const block of section.content.blocks) {
    const summary = block.items.find(
      (item) => item.type === "text" && item.text.format === "p"
    );
    if (summary?.type === "text") return getLocalizedCmsText(summary, locale);
  }
  return undefined;
}

function formatLegalUpdatedLabel(
  page: PublicCmsPage,
  locale: AppLocale,
  labelTemplate: string
) {
  const timestamp = page.latestUpdatedAt ?? page.updatedAt;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return undefined;
  const formatted = date.toLocaleDateString(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return labelTemplate.replace("{date}", formatted);
}
