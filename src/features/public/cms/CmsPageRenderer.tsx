import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { AppLocale } from "@/i18n/config";
import { isSafeCmsHref } from "@/lib/cms-link";
import type { CmsSectionItem } from "@/features/cms/content-contract";
import type { PublicCmsPage, PublicCmsSection } from "@/features/public/cms/types";
import { OthaimSectionRenderer } from "@/features/public/cms/OthaimSectionRenderer";
import { isOthaimSectionSlug } from "@/features/public/cms/othaim-section-registry";
import { isOthaimPublicPageSlug } from "@/features/public/cms/public-routes";

export type CmsPageRendererLabels = {
  legalCentre: string;
  insidePlatform: string;
  information: string;
  empty: string;
  formFullName: string;
  formOrganization: string;
  formEmail: string;
  formTopic: string;
  formMessage: string;
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
  const isOthaimPage =
    page.slug === "home" ||
    isOthaimPublicPageSlug(page.slug) ||
    visibleSections.some((section) => isOthaimSectionSlug(section.slug));
  const Template = pageTemplateRegistry[getCmsPageTemplateKey(page)];
  const sections = visibleSections.length ? (
    visibleSections.map((section) =>
      isOthaimSectionSlug(section.slug) ? (
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

  return (
    <Template page={page} locale={locale} labels={labels}>
      {sections}
    </Template>
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
};

function PageTitle({ page, locale }: Pick<PageTemplateProps, "page" | "locale">) {
  return locale === "ar" ? page.titleAr : page.titleEn;
}

function PageHeader({
  eyebrow,
  page,
  locale,
}: Pick<PageTemplateProps, "page" | "locale"> & { eyebrow: string }) {
  return (
    <header className="ogc-generic-header">
      <div className="ogc-container">
        <p className="ogc-eyebrow">{eyebrow}</p>
        <h1>
          <PageTitle page={page} locale={locale} />
        </h1>
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
  legal: ({ page, locale, labels, children }) => (
    <main id="main-content" className="ogc-page ogc-page-generic">
      <PageHeader page={page} locale={locale} eyebrow={labels.legalCentre} />
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
  return (
    <section id={section.slug} className="cms-section ogc-section ogc-section-light">
      <div className="ogc-container ogc-generic-content">
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
