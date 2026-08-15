import Link from "next/link";
import type { ReactNode } from "react";
import type { AppLocale } from "@/i18n/config";
import { isSafeCmsHref } from "@/lib/cms-link";
import type { CmsSectionItem } from "@/features/admin/cms/schemas/cms-section.schema";
import type { PublicCmsPage, PublicCmsSection } from "@/features/public/cms/types";

export type CmsPageRendererLabels = {
  legalCentre: string;
  insidePlatform: string;
  information: string;
  empty: string;
};

type Props = {
  page: PublicCmsPage;
  locale: AppLocale;
  labels: CmsPageRendererLabels;
};

export type CmsPageTemplateKey = "home" | "about" | "legal" | "default";

export function CmsPageRenderer({ page, locale, labels }: Props) {
  const visibleSections = page.sections.filter((section) => section.isActive !== false);
  const Template = pageTemplateRegistry[getCmsPageTemplateKey(page)];
  const sections = visibleSections.length ? (
    visibleSections.map((section) => (
      <CmsSectionRenderer key={section.id} section={section} page={page} locale={locale} />
    ))
  ) : (
    <div className="mx-auto max-w-4xl px-5 py-24 text-center text-[#5d6268] sm:px-8">
      {labels.empty}
    </div>
  );

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
    <header className="border-b border-black/10 bg-[#f4f1ea] px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.28em] text-[#8b713e]">
          {eyebrow}
        </p>
        <h1 className="max-w-4xl text-4xl font-black leading-[1.15] text-[#111820] sm:text-6xl">
          <PageTitle page={page} locale={locale} />
        </h1>
      </div>
    </header>
  );
}

const pageTemplateRegistry: Record<CmsPageTemplateKey, (props: PageTemplateProps) => ReactNode> = {
  home: ({ children }) => <main className="cms-public-page cms-page-home">{children}</main>,
  about: ({ page, locale, labels, children }) => (
    <main className="cms-public-page cms-page-about">
      <PageHeader page={page} locale={locale} eyebrow={labels.insidePlatform} />
      <div className="border-b-8 border-[#b9985a]">{children}</div>
    </main>
  ),
  legal: ({ page, locale, labels, children }) => (
    <main className="cms-public-page cms-page-legal bg-[#fbfaf7]">
      <PageHeader page={page} locale={locale} eyebrow={labels.legalCentre} />
      <div className="mx-auto max-w-5xl [&_section>div]:max-w-4xl">{children}</div>
    </main>
  ),
  default: ({ page, locale, labels, children }) => (
    <main className="cms-public-page cms-page-default">
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
    <section id={section.slug} className="cms-section relative overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
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
      return (
        <p className="max-w-3xl whitespace-pre-line text-lg leading-8 text-[#4e555b]">{value}</p>
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
      <picture>
        {mobile?.url && <source media="(max-width: 639px)" srcSet={mobile.url} />}
        {/* CMS assets are served through the same-origin uploads proxy. */}
        <img
          src={desktop.url}
          alt={alt}
          loading="lazy"
          className="h-auto w-full rounded-sm object-cover"
          width={desktop.width ?? undefined}
          height={desktop.height ?? undefined}
        />
      </picture>
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
      ? "inline-flex w-fit border-b border-current py-1 font-bold"
      : item.link.style === "secondary"
        ? "inline-flex w-fit border border-current px-6 py-3 font-bold"
        : "inline-flex w-fit bg-[#b9985a] px-6 py-3 font-bold text-[#111820]";
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
  return `/${locale}${href}`;
}

export { isSafeCmsHref };

export function getLocalizedCmsText(
  item: Extract<CmsSectionItem, { type: "text" }>,
  locale: AppLocale
) {
  return locale === "ar" ? item.text.textAr : item.text.textEn;
}
