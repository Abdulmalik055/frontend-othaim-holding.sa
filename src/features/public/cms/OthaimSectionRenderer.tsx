import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { AppLocale } from "@/i18n/config";
import type { ContactInquiryFormLabels } from "@/features/public/contact/ContactInquiryForm";
import { ContactInquiryForm } from "@/features/public/contact/ContactInquiryForm";
import type { CmsSectionBlock, CmsSectionItem } from "@/features/cms/content-contract";
import { isSafeCmsHref } from "@/lib/cms-link";
import { OthaimHeroMedia } from "@/features/public/cms/OthaimHeroMedia";
import {
  getBlocks,
  getImage,
  getLink,
  getText,
  getVideo,
} from "@/features/public/cms/othaim-content";
import { getOthaimSectionDefinition } from "@/features/public/cms/othaim-section-registry";
import type { CmsPageRendererLabels } from "@/features/public/cms/CmsPageRenderer";
import type { PublicCmsPage, PublicCmsSection } from "@/features/public/cms/types";

type SectionProps = {
  section: PublicCmsSection;
  page: PublicCmsPage;
  locale: AppLocale;
  labels: CmsPageRendererLabels;
};

export function OthaimSectionRenderer(props: SectionProps) {
  const definition = getOthaimSectionDefinition(props.section.slug);
  const className = `ogc-section ogc-section-${definition.tone ?? "light"}`;

  if (definition.kind === "video-hero") return <VideoHero {...props} />;
  if (definition.kind === "page-hero") return <PageHero {...props} />;
  if (definition.kind === "founder-hero") return <FounderHero {...props} />;
  if (definition.kind === "story") return <StorySection {...props} />;
  if (definition.kind === "profile-promo") return <ProfilePromo {...props} />;
  if (definition.kind === "people-preview") return <PeoplePreview {...props} />;
  if (definition.kind === "quote") return <QuoteSection {...props} />;
  if (definition.kind === "numbered-names") return <NumberedNames {...props} />;
  if (definition.kind === "numbered-cards") return <NumberedCards {...props} />;
  if (definition.kind === "logos") return <LogoGrid {...props} />;
  if (definition.kind === "prose") return <ProseSection {...props} />;
  if (definition.kind === "timeline") return <TimelineSection {...props} />;
  if (definition.kind === "profile-body") return <ProfileBody {...props} />;
  if (definition.kind === "member-profiles") return <MemberProfiles {...props} />;
  if (definition.kind === "team-profile") return <TeamProfile {...props} />;
  if (definition.kind === "cta") return <ClosingCta {...props} />;
  if (definition.kind === "home-contact") return <HomeContact {...props} />;
  if (definition.kind === "contact") return <ContactDetails {...props} />;

  return (
    <section id={props.section.slug} className={className}>
      <div className="ogc-container">
        <GenericStructuredContent {...props} />
      </div>
    </section>
  );
}

function VideoHero({ section, page, locale }: SectionProps) {
  const { intro } = getBlocks(section.content);
  const videoItem = getVideo(intro, "hero");
  const video = videoItem ? page.assetsById[videoItem.video.desktopAssetId] : undefined;
  const mobileVideo = videoItem?.video.mobileAssetId
    ? page.assetsById[videoItem.video.mobileAssetId]
    : undefined;
  const poster = videoItem?.video.posterDesktopAssetId
    ? page.assetsById[videoItem.video.posterDesktopAssetId]
    : undefined;
  const mobilePoster = videoItem?.video.posterMobileAssetId
    ? page.assetsById[videoItem.video.posterMobileAssetId]
    : undefined;

  return (
    <section id={section.slug} className="ogc-video-hero">
      <OthaimHeroMedia
        videoUrl={video?.url}
        videoType={video?.mimeType}
        mobileVideoUrl={mobileVideo?.url}
        mobileVideoType={mobileVideo?.mimeType}
        posterUrl={poster?.url}
        mobilePosterUrl={mobilePoster?.url}
      />
      <div className="ogc-hero-shade" />
      <div className="ogc-container ogc-video-hero-content">
        <p className="ogc-hero-eyebrow">{getText(intro, "eyebrow", locale)}</p>
        <h1>{getText(intro, "headline", locale)}</h1>
        <p className="ogc-hero-tagline">{getText(intro, "tagline", locale)}</p>
      </div>
      <a className="ogc-scroll-cue" href="#home-story">
        {getText(intro, "scrollLabel", locale)}
        <span aria-hidden>⌄</span>
      </a>
    </section>
  );
}

function PageHero({ section, locale }: SectionProps) {
  const { intro } = getBlocks(section.content);
  return (
    <section id={section.slug} className="ogc-page-hero">
      <div className="ogc-container ogc-reveal">
        <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
        <h1>{getText(intro, "headline", locale)}</h1>
        <Lead>{getText(intro, "summary", locale)}</Lead>
      </div>
    </section>
  );
}

function FounderHero(props: SectionProps) {
  const { section, locale } = props;
  const { intro } = getBlocks(section.content);
  return (
    <section id={section.slug} className="ogc-page-hero ogc-profile-hero">
      <div className="ogc-container ogc-split ogc-reveal">
        <CmsImage {...props} block={intro} itemKey="portrait" className="ogc-portrait" priority />
        <div>
          <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
          <h1>{getText(intro, "headline", locale)}</h1>
          <Lead>{getText(intro, "summary", locale)}</Lead>
          <p className="ogc-person-name">{getText(intro, "name", locale)}</p>
          <p className="ogc-person-role">{getText(intro, "role", locale)}</p>
          <CmsLink {...props} block={intro} itemKey="link" />
        </div>
      </div>
    </section>
  );
}

function StorySection(props: SectionProps) {
  const { section, locale } = props;
  const { intro } = getBlocks(section.content);
  return (
    <section id={section.slug} className="ogc-section ogc-section-dark ogc-home-story">
      <div className="ogc-container">
        <SectionHeading block={intro} locale={locale} />
        <div className="ogc-split ogc-reveal">
          <CmsImage {...props} block={intro} itemKey="image" className="ogc-landscape" />
          <div>
            <Lead>{getText(intro, "bodyPrimary", locale)}</Lead>
            <Lead>{getText(intro, "bodySecondary", locale)}</Lead>
            <CmsLink {...props} block={intro} itemKey="link" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfilePromo(props: SectionProps) {
  const { section, locale } = props;
  const { intro } = getBlocks(section.content);

  if (section.slug === "home-team") {
    return (
      <section id={section.slug} className="ogc-section ogc-section-dark ogc-pattern ogc-home-team">
        <div className="ogc-container ogc-home-team-inner ogc-reveal">
          <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
          <h2>{getText(intro, "headline", locale)}</h2>
          <CmsImage {...props} block={intro} itemKey="portrait" className="ogc-portrait" />
          <p className="ogc-person-name">{getText(intro, "name", locale)}</p>
          <p className="ogc-person-role">{getText(intro, "role", locale)}</p>
          <Lead>{getText(intro, "summary", locale)}</Lead>
          <CmsLink {...props} block={intro} itemKey="link" />
        </div>
      </section>
    );
  }

  return (
    <section
      id={section.slug}
      className="ogc-section ogc-section-dark ogc-pattern ogc-profile-promo ogc-home-founder"
    >
      <div className="ogc-container ogc-split ogc-reveal">
        <CmsImage {...props} block={intro} itemKey="portrait" className="ogc-portrait" />
        <div>
          <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
          <h2>{getText(intro, "headline", locale)}</h2>
          <Lead>{getText(intro, "summary", locale)}</Lead>
          {getText(intro, "name", locale) && (
            <p className="ogc-person-name">{getText(intro, "name", locale)}</p>
          )}
          {getText(intro, "role", locale) && (
            <p className="ogc-person-role">{getText(intro, "role", locale)}</p>
          )}
          <CmsLink {...props} block={intro} itemKey="link" />
        </div>
      </div>
    </section>
  );
}

function PeoplePreview(props: SectionProps) {
  const { section, locale } = props;
  const { intro, repeated } = getBlocks(section.content);
  return (
    <section id={section.slug} className="ogc-section ogc-section-teal ogc-home-committee">
      <div className="ogc-container">
        <SectionHeading block={intro} locale={locale} />
        <div className="ogc-people-grid">
          {repeated.map((block, index) => (
            <article key={blockKey(block, index)} className="ogc-person-card ogc-reveal">
              <CmsImage {...props} block={block} itemKey="portrait" className="ogc-member-photo" />
              <h3>{getText(block, "name", locale)}</h3>
              <p className="ogc-person-role">{getText(block, "role", locale)}</p>
            </article>
          ))}
        </div>
        <CmsLink {...props} block={intro} itemKey="link" />
      </div>
    </section>
  );
}

function QuoteSection({ section, locale }: SectionProps) {
  const { intro } = getBlocks(section.content);
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-teal ogc-quote-section${
        section.slug === "home-inspiration"
          ? " ogc-home-inspiration"
          : section.slug === "about-mission"
            ? " ogc-about-mission"
            : ""
      }`}
    >
      <div className="ogc-container ogc-reveal">
        <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
        {getText(intro, "headline", locale) && <h2>{getText(intro, "headline", locale)}</h2>}
        <blockquote>{getText(intro, "quote", locale)}</blockquote>
      </div>
    </section>
  );
}

function NumberedNames({ section, locale }: SectionProps) {
  const { intro, repeated } = getBlocks(section.content);
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-dark ogc-section-${section.slug}`}
    >
      <div className="ogc-container">
        <SectionHeading block={intro} locale={locale} />
        <div className="ogc-pill-grid">
          {repeated.map((block, index) => (
            <div key={blockKey(block, index)} className="ogc-dna-pill ogc-reveal">
              <span>{getText(block, "number", locale)}</span>
              {getText(block, "name", locale)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NumberedCards(props: SectionProps) {
  const { section, locale } = props;
  const { intro, repeated } = getBlocks(section.content);
  const tone = getOthaimSectionDefinition(section.slug).tone;
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-${tone ?? "light"} ogc-section-${section.slug}${
        section.slug === "home-philosophies" ? " ogc-home-philosophies" : ""
      }`}
    >
      <div className="ogc-container">
        <SectionHeading block={intro} locale={locale} />
        <div className="ogc-card-grid">
          {repeated.map((block, index) => (
            <article key={blockKey(block, index)} className="ogc-number-card ogc-reveal">
              <span>{getText(block, "number", locale)}</span>
              <h3>{getText(block, "name", locale)}</h3>
              <Lead>{getText(block, "body", locale)}</Lead>
            </article>
          ))}
        </div>
        <CmsLink {...props} block={intro} itemKey="link" />
      </div>
    </section>
  );
}

function LogoGrid(props: SectionProps) {
  const { section, locale } = props;
  const { intro, repeated } = getBlocks(section.content);
  const tone = getOthaimSectionDefinition(section.slug).tone;
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-${tone ?? "light"} ogc-section-${section.slug}${
        section.slug === "home-partners" ? " ogc-home-partners" : ""
      }`}
    >
      <div className="ogc-container">
        <SectionHeading block={intro} locale={locale} />
        <div className="ogc-logo-grid">
          {repeated.map((block, index) => {
            const name = getText(block, "name", locale);
            const isNepc =
              section.slug === "portfolio-infrastructure" &&
              name?.trim().toUpperCase() === "NEPC";
            return (
              <article
                key={blockKey(block, index)}
                className={`ogc-logo-cell${isNepc ? " ogc-logo-cell-nepc" : ""} ogc-reveal`}
              >
                <CmsImage {...props} block={block} itemKey="logo" className="ogc-logo-image" />
                <h3 className="sr-only">{name}</h3>
                {getText(block, "sector", locale) && <p>{getText(block, "sector", locale)}</p>}
              </article>
            );
          })}
        </div>
        <CmsLink {...props} block={intro} itemKey="link" />
      </div>
    </section>
  );
}

function ProseSection({ section, locale }: SectionProps) {
  const { intro } = getBlocks(section.content);
  const tone = getOthaimSectionDefinition(section.slug).tone;
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-${tone ?? "dark"} ogc-section-${section.slug}`}
    >
      <div className="ogc-container ogc-prose-grid ogc-reveal">
        <div>
          <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
          <h2>{getText(intro, "headline", locale)}</h2>
        </div>
        <div>
          <Lead>{getText(intro, "bodyPrimary", locale)}</Lead>
          <Lead>{getText(intro, "bodySecondary", locale)}</Lead>
        </div>
      </div>
    </section>
  );
}

function TimelineSection({ section, locale }: SectionProps) {
  const { intro, repeated } = getBlocks(section.content);
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-dark ogc-section-${section.slug}`}
    >
      <div className="ogc-container ogc-timeline-layout">
        <div className="ogc-reveal">
          <SectionHeading block={intro} locale={locale} />
          <p className="ogc-range">{getText(intro, "range", locale)}</p>
        </div>
        <div>
          {repeated.map((block, index) => (
            <article key={blockKey(block, index)} className="ogc-timeline-item ogc-reveal">
              <p className="ogc-timeline-year">{getText(block, "year", locale)}</p>
              <h3>{getText(block, "name", locale)}</h3>
              <Lead>{getText(block, "body", locale)}</Lead>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileBody({ section, locale }: SectionProps) {
  const { intro } = getBlocks(section.content);
  const positions = getText(intro, "positions", locale)?.split("\n").filter(Boolean) ?? [];
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-dark ogc-section-${section.slug}`}
    >
      <div className="ogc-container ogc-prose-grid ogc-reveal">
        <div>
          <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
          <h2>{getText(intro, "headline", locale)}</h2>
        </div>
        <div>
          <Lead>{getText(intro, "bodyPrimary", locale)}</Lead>
          <Lead>{getText(intro, "bodySecondary", locale)}</Lead>
          {positions.length > 0 && (
            <ul className="ogc-position-list">
              {positions.map((position, index) => (
                <li key={`${index}-${position}`}>{position}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function MemberProfiles(props: SectionProps) {
  const { section, locale } = props;
  const repeated = section.content.blocks;
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-dark ogc-section-${section.slug}`}
    >
      <div className="ogc-container ogc-member-list">
        {repeated.map((block, index) => {
          const initials = getText(block, "initials", locale);
          const education = getText(block, "education", locale);
          return (
            <article key={blockKey(block, index)} className="ogc-member-profile ogc-reveal">
              <div className="ogc-member-identity">
                <div className="ogc-member-visual">
                  <CmsImage
                    {...props}
                    block={block}
                    itemKey="portrait"
                    className="ogc-member-photo"
                  />
                  {!getImage(block, "portrait") && initials && (
                    <span className="ogc-initials" aria-hidden>
                      {initials}
                    </span>
                  )}
                </div>
                <p className="ogc-person-role">{getText(block, "role", locale)}</p>
                <h2>{getText(block, "name", locale)}</h2>
              </div>
              <div className="ogc-member-copy">
                <Lead>{getText(block, "bodyPrimary", locale)}</Lead>
                <Lead>{getText(block, "bodySecondary", locale)}</Lead>
                <Lead>{getText(block, "bodyTertiary", locale)}</Lead>
                {education && (
                  <div className="ogc-education">
                    <strong>{getText(block, "educationLabel", locale)}</strong>
                    <TextList value={education} />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TeamProfile(props: SectionProps) {
  const { section, locale } = props;
  const { intro } = getBlocks(section.content);
  const bodyKeys = ["bodyPrimary", "bodySecondary", "bodyTertiary", "bodyQuaternary"];
  return (
    <section
      id={section.slug}
      className={`ogc-section ogc-section-dark ogc-section-${section.slug}`}
    >
      <div className="ogc-container ogc-team-profile ogc-reveal">
        <div>
          <CmsImage {...props} block={intro} itemKey="portrait" className="ogc-portrait" />
          <p className="ogc-person-role">{getText(intro, "role", locale)}</p>
          <h2>{getText(intro, "name", locale)}</h2>
        </div>
        <div>
          {bodyKeys.map((key) => (
            <Lead key={key}>{getText(intro, key, locale)}</Lead>
          ))}
          {getText(intro, "languages", locale) && (
            <div className="ogc-profile-detail">
              <TextList value={getText(intro, "languages", locale)} />
            </div>
          )}
          {getText(intro, "education", locale) && (
            <div className="ogc-education">
              <strong>{getText(intro, "educationLabel", locale)}</strong>
              <TextList value={getText(intro, "education", locale)} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ClosingCta(props: SectionProps) {
  const { section, locale } = props;
  const { intro } = getBlocks(section.content);
  return (
    <section id={section.slug} className="ogc-section ogc-closing-cta">
      <div className="ogc-container ogc-reveal">
        <Eyebrow>{getText(intro, "eyebrow", locale)}</Eyebrow>
        <h2>{getText(intro, "headline", locale)}</h2>
        <Lead>{getText(intro, "summary", locale)}</Lead>
        <CmsLink {...props} block={intro} itemKey="link" />
      </div>
    </section>
  );
}

function HomeContact(props: SectionProps) {
  const { section, locale, labels } = props;
  const { intro } = getBlocks(section.content);
  return (
    <section id={section.slug} className="ogc-section ogc-home-contact">
      <div className="ogc-container ogc-contact-grid">
        <div className="ogc-reveal">
          <SectionHeading block={intro} locale={locale} />
          <ContactInformation block={intro} locale={locale} variant="home" />
        </div>
        <div className="ogc-form-card ogc-reveal">
          <ContactInquiryForm
            source="home"
            locale={locale}
            labels={contactFormLabels(intro, locale, labels)}
          />
        </div>
      </div>
    </section>
  );
}

function ContactDetails(props: SectionProps) {
  const { section, locale, labels } = props;
  const { intro } = getBlocks(section.content);
  return (
    <section id={section.slug} className="ogc-section ogc-section-dark ogc-contact-details">
      <div className="ogc-container ogc-contact-grid">
        <div className="ogc-reveal">
          <Eyebrow>
            {getText(intro, "detailsEyebrow", locale) ?? getText(intro, "eyebrow", locale)}
          </Eyebrow>
          <h2>{getText(intro, "detailsHeadline", locale) ?? getText(intro, "headline", locale)}</h2>
          <ContactInformation block={intro} locale={locale} variant="contact" />
        </div>
        <div className="ogc-form-card ogc-reveal">
          <Eyebrow>{getText(intro, "formEyebrow", locale)}</Eyebrow>
          <h2>{getText(intro, "formHeadline", locale)}</h2>
          <ContactInquiryForm
            source="contact"
            locale={locale}
            labels={contactFormLabels(intro, locale, labels, true)}
          />
        </div>
      </div>
    </section>
  );
}

function ContactInformation({
  block,
  locale,
  variant,
}: {
  block?: CmsSectionBlock;
  locale: AppLocale;
  variant: "home" | "contact";
}) {
  const email = getText(block, "email", locale);
  const emailLink = getLink(block, "emailLink")?.link.href;
  const emailLabel = getText(block, "emailLabel", locale);
  const phoneLabel = getText(block, "phoneLabel", locale);
  const addressLabel = getText(block, "addressLabel", locale);
  const phones = [
    [getText(block, "phone", locale), getLink(block, "phoneLink")?.link.href],
    [getText(block, "phonePrimary", locale), getLink(block, "phonePrimaryLink")?.link.href],
    [getText(block, "phoneSecondary", locale), getLink(block, "phoneSecondaryLink")?.link.href],
  ].flatMap(([value, href]) =>
    value
      ? value.split("\n").map((number) => ({
          number,
          href: href && isSafeCmsHref(href) ? href : `tel:${number.replace(/[^+\d]/g, "")}`,
        }))
      : []
  );
  const address = getText(block, "address", locale);
  const entries = {
    email: email ? (
      <ContactEntry key="email" icon={variant === "home" ? "email" : undefined} label={emailLabel}>
        <a href={emailLink && isSafeCmsHref(emailLink) ? emailLink : `mailto:${email}`}>{email}</a>
      </ContactEntry>
    ) : null,
    phone:
      phones.length > 0 ? (
        <ContactEntry
          key="phone"
          icon={variant === "home" ? "phone" : undefined}
          label={phoneLabel}
        >
          {phones.map(({ number, href }) => (
            <a key={number} href={href} dir="ltr">
              {number}
            </a>
          ))}
        </ContactEntry>
      ) : null,
    address: address ? (
      <ContactEntry
        key="address"
        icon={variant === "home" ? "address" : undefined}
        label={addressLabel}
      >
        <p className="ogc-contact-address" dir="ltr">
          {address.split("\n").map((line, index) => (
            <Fragment key={`${index}-${line}`}>
              {index > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>
      </ContactEntry>
    ) : null,
  };
  const order =
    variant === "contact" ? ["address", "phone", "email"] : ["email", "phone", "address"];

  return (
    <address className="ogc-contact-list">
      {order.map((key) => entries[key as keyof typeof entries])}
    </address>
  );
}

function ContactEntry({
  icon,
  label,
  children,
}: {
  icon?: "email" | "phone" | "address";
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="ogc-contact-entry">
      {icon && (
        <span className="ogc-contact-icon" aria-hidden>
          <ContactIcon icon={icon} />
        </span>
      )}
      <div>
        {label && <span>{label}</span>}
        {children}
      </div>
    </div>
  );
}

function ContactIcon({ icon }: { icon: "email" | "phone" | "address" }) {
  return (
    <svg
      data-contact-icon={icon}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      focusable="false"
    >
      {icon === "email" && (
        <path
          d="M2 4h12v8H2zM2 4l6 4 6-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {icon === "phone" && (
        <path
          d="M3 3l2 0 1 3-1.5 1c.6 1.4 1.7 2.5 3.1 3.1L9 8.5l3 1v2c0 .8-.7 1.5-1.5 1.5C5.8 13 3 10.2 3 4.5 3 3.7 3.7 3 3 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {icon === "address" && (
        <>
          <path
            d="M8 2a4 4 0 014 4c0 3-4 8-4 8s-4-5-4-8a4 4 0 014-4z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

function contactFormLabels(
  block: CmsSectionBlock | undefined,
  locale: AppLocale,
  labels: CmsPageRendererLabels,
  useSharedFormCopy = false
): ContactInquiryFormLabels {
  const sharedOrCmsText = (key: string, fallback: string) =>
    useSharedFormCopy ? fallback : (getText(block, key, locale) ?? fallback);

  return {
    fullName: getText(block, "fullNameLabel", locale) ?? labels.formFullName,
    organization: getText(block, "organizationLabel", locale) ?? labels.formOrganization,
    email: getText(block, "emailFieldLabel", locale) ?? labels.formEmail,
    topic: getText(block, "topicLabel", locale) ?? labels.formTopic,
    message: getText(block, "messageLabel", locale) ?? labels.formMessage,
    submit: getText(block, "submitLabel", locale) ?? labels.formSubmit,
    submitting: labels.formSubmitting,
    success: labels.formSuccess,
    error: labels.formError,
    rateLimited: labels.formRateLimited,
    confidentiality: getText(block, "confidentiality", locale) ?? labels.formConfidentiality,
    topics: {
      partnership: sharedOrCmsText("topicPartnershipLabel", labels.topicPartnership),
      co_investment: sharedOrCmsText("topicCoInvestmentLabel", labels.topicCoInvestment),
      family_office: sharedOrCmsText("topicFamilyOfficeLabel", labels.topicFamilyOffice),
      media: sharedOrCmsText("topicMediaLabel", labels.topicMedia),
      other: sharedOrCmsText("topicOtherLabel", labels.topicOther),
    },
    placeholders: {
      fullName: sharedOrCmsText("fullNamePlaceholder", labels.formFullNamePlaceholder),
      organization: sharedOrCmsText(
        "organizationPlaceholder",
        labels.formOrganizationPlaceholder
      ),
      email: sharedOrCmsText("emailPlaceholder", labels.formEmailPlaceholder),
      message: sharedOrCmsText("messagePlaceholder", labels.formMessagePlaceholder),
    },
    validation: {
      fullName: labels.validationFullName,
      organization: labels.validationOrganization,
      email: labels.validationEmail,
      topic: labels.validationTopic,
      message: labels.validationMessage,
    },
  };
}

function SectionHeading({ block, locale }: { block?: CmsSectionBlock; locale: AppLocale }) {
  return (
    <header className="ogc-section-heading ogc-reveal">
      <Eyebrow>{getText(block, "eyebrow", locale)}</Eyebrow>
      <h2>{getText(block, "headline", locale)}</h2>
      <Lead>{getText(block, "summary", locale)}</Lead>
    </header>
  );
}

function Eyebrow({ children }: { children?: ReactNode }) {
  return children ? <p className="ogc-eyebrow">{children}</p> : null;
}

function Lead({ children }: { children?: ReactNode }) {
  return children ? <p className="ogc-lead">{children}</p> : null;
}

function TextList({ value }: { value?: string }) {
  if (!value) return null;
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) return <p>{lines[0]}</p>;
  return (
    <ul>
      {lines.map((line, index) => (
        <li key={`${index}-${line}`}>{line}</li>
      ))}
    </ul>
  );
}

function CmsImage({
  block,
  itemKey,
  page,
  locale,
  className,
  priority = false,
}: SectionProps & {
  block?: CmsSectionBlock;
  itemKey: string;
  className: string;
  priority?: boolean;
}) {
  const item = getImage(block, itemKey);
  if (!item) return null;
  const asset = page.assetsById[item.image.desktopAssetId];
  if (!asset?.url) return null;
  const mobileAsset = item.image.mobileAssetId
    ? page.assetsById[item.image.mobileAssetId]
    : undefined;
  const alt = item.image.decorative
    ? ""
    : locale === "ar"
      ? (item.image.altAr ?? "")
      : (item.image.altEn ?? "");
  return (
    <div className={className}>
      <picture>
        {mobileAsset?.url && <source media="(max-width: 680px)" srcSet={mobileAsset.url} />}
        <Image
          src={asset.url}
          alt={alt}
          width={asset.width ?? 1200}
          height={asset.height ?? 900}
          priority={priority}
          sizes="(max-width: 860px) 100vw, 50vw"
        />
      </picture>
    </div>
  );
}

function CmsLink({
  block,
  itemKey,
  locale,
}: SectionProps & { block?: CmsSectionBlock; itemKey: string }) {
  const item = getLink(block, itemKey);
  if (!item || !isSafeCmsHref(item.link.href)) return null;
  const label = locale === "ar" ? item.link.labelAr : item.link.labelEn;
  const href = localizePublicHref(item.link.href, locale);
  const className =
    item.link.style === "text"
      ? "ogc-text-link"
      : item.link.style === "secondary"
        ? "ogc-button ogc-button-ghost"
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
        <span aria-hidden>↗</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
      <span aria-hidden>→</span>
    </Link>
  );
}

export function localizePublicHref(href: string, locale: AppLocale) {
  if (!href.startsWith("/") || href.startsWith("/uploads/")) return href;
  if (/^\/(ar|en)(\/|$)/.test(href)) return href;
  const cleanHref = href.replace(/^\/info(?=\/)/, "");
  return cleanHref === "/home" || cleanHref === "/" ? `/${locale}` : `/${locale}${cleanHref}`;
}

function GenericStructuredContent({ section, locale }: SectionProps) {
  return (
    <div className="ogc-generic-content">
      {section.content.blocks.map((block, blockIndex) => (
        <div key={blockKey(block, blockIndex)}>
          {block.items.map((item) => (
            <GenericItem key={item.key} item={item} locale={locale} />
          ))}
        </div>
      ))}
    </div>
  );
}

function GenericItem({ item, locale }: { item: CmsSectionItem; locale: AppLocale }) {
  if (item.type !== "text") return null;
  const value = locale === "ar" ? item.text.textAr : item.text.textEn;
  if (item.text.format === "h1") return <h1>{value}</h1>;
  if (item.text.format === "h2") return <h2>{value}</h2>;
  if (item.text.format === "h3") return <h3>{value}</h3>;
  return item.text.format === "p" ? <Lead>{value}</Lead> : null;
}

function blockKey(block: CmsSectionBlock, index: number) {
  return `block-${index}-${block.items[0]?.key ?? "empty"}`;
}
