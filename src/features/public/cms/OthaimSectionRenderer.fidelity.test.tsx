import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CmsSectionBlock, CmsSectionItem } from "@/features/cms/content-contract";
import type { CmsPageRendererLabels } from "@/features/public/cms/CmsPageRenderer";
import { OthaimSectionRenderer } from "@/features/public/cms/OthaimSectionRenderer";
import type { PublicCmsPage, PublicCmsSection } from "@/features/public/cms/types";

const labels = new Proxy({}, { get: (_target, key: string) => key }) as CmsPageRendererLabels;

const page: PublicCmsPage = {
  id: "home",
  slug: "home",
  titleAr: "الرئيسية",
  titleEn: "Home",
  category: "info",
  template: "home",
  navigationPlacement: "none",
  navigationOrder: 0,
  isIndexable: true,
  updatedAt: "2026-08-15T00:00:00.000Z",
  assetsById: {
    portrait: {
      id: "portrait",
      type: "image",
      url: "/uploads/portrait.png",
      width: 800,
      height: 1000,
    },
    logo: {
      id: "logo",
      type: "image",
      url: "/uploads/logo.png",
      width: 400,
      height: 160,
    },
    "portrait-mobile": {
      id: "portrait-mobile",
      type: "image",
      url: "/uploads/portrait-mobile.png",
      width: 480,
      height: 720,
    },
  },
  sections: [],
};

function text(key: string, value: string, format: "p" | "h2" | "h3" = "p"): CmsSectionItem {
  return { key, type: "text", text: { format, textAr: value, textEn: value } };
}

function image(key: string, assetId: "portrait" | "logo"): CmsSectionItem {
  return {
    key,
    type: "image",
    image: { desktopAssetId: assetId, altAr: key, altEn: key },
  };
}

function responsivePortrait(key: string): CmsSectionItem {
  return {
    key,
    type: "image",
    image: {
      desktopAssetId: "portrait",
      mobileAssetId: "portrait-mobile",
      altAr: key,
      altEn: key,
    },
  };
}

function link(key: string, style: "primary" | "secondary" | "text"): CmsSectionItem {
  return {
    key,
    type: "link",
    link: { href: "/contact", labelAr: "تواصل", labelEn: "Contact", style },
  };
}

function block(items: CmsSectionItem[]): CmsSectionBlock {
  return { items };
}

function renderSection(slug: string, blocks: CmsSectionBlock[], locale: "ar" | "en" = "en") {
  const section: PublicCmsSection = {
    id: slug,
    slug,
    order: 1,
    updatedAt: "2026-08-15T00:00:00.000Z",
    content: { blocks },
  };
  return renderToStaticMarkup(
    createElement(OthaimSectionRenderer, { section, page, locale, labels })
  );
}

describe("Othaim source-fidelity section composition", () => {
  it("marks the Home committee, team, inspiration, philosophies, and partners layouts", () => {
    const intro = block([
      text("eyebrow", "Management"),
      text("headline", "Headline", "h2"),
      text("summary", "Summary"),
      link("link", "secondary"),
      text("name", "Jamil Hallak"),
      text("role", "Chief Investment Officer"),
      image("portrait", "portrait"),
    ]);
    const person = block([
      text("name", "Member", "h3"),
      text("role", "Role"),
      image("portrait", "portrait"),
    ]);
    const philosophy = block([
      text("number", "01"),
      text("name", "Pillar", "h3"),
      text("body", "Body"),
    ]);
    const partner = block([text("name", "Partner", "h3"), image("logo", "logo")]);

    const committee = renderSection("home-committee", [intro, person, person, person, person]);
    const team = renderSection("home-team", [intro]);
    const inspiration = renderSection("home-inspiration", [
      block([
        text("eyebrow", "What inspires us"),
        text("headline", "A legacy", "h2"),
        text("quote", "A sustainable future"),
      ]),
    ]);
    const philosophies = renderSection("home-philosophies", [
      intro,
      philosophy,
      philosophy,
      philosophy,
      philosophy,
      philosophy,
    ]);
    const partners = renderSection("home-partners", [
      intro,
      partner,
      partner,
      partner,
      partner,
      partner,
      partner,
    ]);

    expect(committee).toContain("ogc-home-committee");
    expect(committee.match(/ogc-person-card/g)).toHaveLength(4);
    expect(team).toContain("ogc-home-team-inner");
    expect(team).toContain("ogc-home-team-heading");
    expect(team.indexOf("ogc-home-team-heading")).toBeLessThan(
      team.indexOf("ogc-home-team-inner")
    );
    expect(team).toContain("ogc-pattern");
    expect(inspiration).toContain("ogc-home-inspiration");
    expect(philosophies).toContain("ogc-home-philosophies");
    expect(partners).toContain("ogc-home-partners");
  });

  it("renders secondary CMS links as visible outlined ghost calls to action", () => {
    const html = renderSection("home-team", [
      block([
        text("headline", "Investment Team", "h2"),
        text("name", "Jamil Hallak"),
        image("portrait", "portrait"),
        link("link", "secondary"),
      ]),
    ]);

    expect(html).toContain("ogc-button-ghost");
  });

  it("renders the founder attribution in the Home founder copy", () => {
    const html = renderSection("home-founder", [
      block([
        text("eyebrow", "Management · Founder"),
        text("headline", "A legacy of vision", "h2"),
        text("summary", "Founder biography"),
        text("name", "Abdullah Saleh Al Othaim"),
        text("role", "Founder"),
        image("portrait", "portrait"),
        link("link", "secondary"),
      ]),
    ]);

    expect(html).toContain('<p class="ogc-person-name">Abdullah Saleh Al Othaim</p>');
    expect(html).toContain('<p class="ogc-person-role">Founder</p>');
    expect(html.indexOf("Founder biography")).toBeLessThan(
      html.indexOf("Abdullah Saleh Al Othaim")
    );
  });

  it("renders the founder name and role inside the portrait caption", () => {
    const html = renderSection("founder-hero", [
      block([
        text("eyebrow", "Management · Founder"),
        text("headline", "Abdullah Saleh Al Othaim", "h2"),
        text("summary", "Founder biography"),
        text("name", "Abdullah Saleh Al Othaim"),
        text("role", "Founder"),
        image("portrait", "portrait"),
        link("link", "secondary"),
      ]),
    ]);

    expect(html).toContain("ogc-founder-portrait");
    expect(html).toContain("ogc-founder-caption");
    expect(html).toContain("ogc-founder-copy");
    expect(html.indexOf("ogc-founder-copy")).toBeLessThan(html.indexOf("ogc-founder-portrait"));
    expect(html).toMatch(
      /<div class="ogc-founder-portrait">.*<div class="ogc-founder-caption">.*Founder.*Abdullah Saleh Al Othaim.*<\/div><\/div>/
    );
    expect(html).toMatch(/<a class="ogc-button ogc-button-ghost"[^>]*>Contact<\/a>/);
  });

  it("renders the founder positions with the approved arrow markers", () => {
    const html = renderSection("founder-profile", [
      block([
        text("eyebrow", "Biography"),
        text("headline", "Three decades of leadership", "h2"),
        text("bodyPrimary", "Biography one"),
        text("bodySecondary", "Biography two"),
        text("positions", "Position one\nPosition two"),
      ]),
    ]);

    expect(html.match(/ogc-position-arrow/g)).toHaveLength(2);
    expect(html.match(/aria-hidden="true">→<\/span>/g)).toHaveLength(2);
    expect(html).toContain(
      '<div class="ogc-container"><div class="ogc-prose-grid ogc-reveal">'
    );
  });

  it("keeps the Family timeline heading above the sticky summary grid", () => {
    const html = renderSection("family-timeline", [
      block([
        text("eyebrow", "Timeline"),
        text("headline", "Milestones", "h2"),
        text("range", "1956 → today"),
        text("summary", "Eight defining moments"),
      ]),
      block([
        text("year", "1956"),
        text("name", "Founding", "h3"),
        text("body", "The story begins"),
      ]),
    ]);

    expect(html).toContain("ogc-timeline-heading");
    expect(html).toContain("ogc-timeline-summary");
    expect(html.indexOf("ogc-timeline-heading")).toBeLessThan(
      html.indexOf("ogc-timeline-layout")
    );
    expect(html.indexOf("Eight defining moments")).toBeGreaterThan(
      html.indexOf("ogc-timeline-summary")
    );
  });

  it("keeps the Investment Team card inside the reference container", () => {
    const html = renderSection("team-profile", [
      block([
        text("name", "Jamil Hallak"),
        text("role", "Chief Investment Officer"),
        text("bodyPrimary", "Biography"),
        text("languages", "AR Arabic\nEN English\nFR French"),
        image("portrait", "portrait"),
      ]),
    ]);

    expect(html).toContain(
      '<div class="ogc-container"><div class="ogc-team-profile ogc-reveal">'
    );
  });

  it("marks only the NEPC infrastructure logo for its vertical alignment adjustment", () => {
    const intro = block([text("headline", "Infrastructure Partners", "h2")]);
    const nepc = block([
      text("name", "NEPC", "h3"),
      text("sector", "Financial Consultant"),
      image("logo", "logo"),
    ]);
    const hourani = block([
      text("name", "Hourani Partners", "h3"),
      text("sector", "Law Firm"),
      image("logo", "logo"),
    ]);

    const html = renderSection("portfolio-infrastructure", [intro, nepc, hourani]);

    expect(html.match(/ogc-logo-cell-nepc/g)).toHaveLength(1);
    expect(html).toContain("Financial Consultant");
    expect(html).toContain("Law Firm");
  });

  it("orders Contact details as address, phones, then email", () => {
    const html = renderSection("contact-details", [
      block([
        text("detailsEyebrow", "Contact details"),
        text("detailsHeadline", "Postal address", "h2"),
        text("addressLabel", "Address"),
        text("address", "Guernsey"),
        text("phoneLabel", "Phone"),
        text("phonePrimary", "+966 11 4755 733"),
        text("emailLabel", "Email"),
        text("email", "info@othaimglobal.com"),
      ]),
    ]);

    expect(html.indexOf("Guernsey")).toBeLessThan(html.indexOf("+966 11 4755 733"));
    expect(html.indexOf("+966 11 4755 733")).toBeLessThan(html.indexOf("info@othaimglobal.com"));
  });

  it.each(["home-contact", "contact-details"])(
    "preserves the seeded address line break in %s",
    (slug) => {
      const html = renderSection(slug, [
        block([
          text("addressLabel", "Postal address"),
          text("address", "La Tonnelle House, Les Banques,\nSt Sampson, Guernsey GY1 3HS"),
        ]),
      ]);

      expect(html).toContain("Les Banques,<br/>St Sampson");
    }
  );

  it("renders the original line icon set for landing contact details", () => {
    const html = renderSection("home-contact", [
      block([
        text("email", "info@othaimglobal.com"),
        text("phone", "+966 11 4755 733"),
        text("address", "La Tonnelle House, Les Banques,\nSt Sampson, Guernsey GY1 3HS"),
      ]),
    ]);

    expect(html).toContain('data-contact-icon="email"');
    expect(html).toContain('data-contact-icon="phone"');
    expect(html).toContain('data-contact-icon="address"');
    expect(html).not.toContain("✉");
    expect(html).not.toContain("☎");
    expect(html).not.toContain("⌖");
  });

  it.each(["home-contact", "contact-details"])(
    "keeps the Latin address LTR in the Arabic %s section",
    (slug) => {
      const html = renderSection(
        slug,
        [block([text("address", "La Tonnelle House, Les Banques,\nSt Sampson, Guernsey GY1 3HS")])],
        "ar"
      );

      expect(html).toContain(
        '<p class="ogc-contact-address" dir="ltr">La Tonnelle House, Les Banques,<br/>St Sampson, Guernsey GY1 3HS</p>'
      );
    }
  );

  it("uses editable Contact CMS options, placeholders, and confidentiality copy", () => {
    const html = renderSection("contact-details", [
      block([
        text("fullNamePlaceholder", "Contact-specific name"),
        text("organizationPlaceholder", "Contact-specific organization"),
        text("emailPlaceholder", "contact-specific@example.com"),
        text("messagePlaceholder", "Contact-specific message"),
        text("topicPartnershipLabel", "Contact-specific partnership"),
        text("confidentiality", "Contact-specific confidentiality"),
      ]),
    ]);

    expect(html).toContain('placeholder="Contact-specific name"');
    expect(html).toContain('placeholder="Contact-specific organization"');
    expect(html).toContain('placeholder="contact-specific@example.com"');
    expect(html).toContain('placeholder="Contact-specific message"');
    expect(html).toContain(">Contact-specific partnership<");
    expect(html).toContain("Contact-specific confidentiality");
  });

  it("serves the CMS mobile image below the seeded breakpoint", () => {
    const html = renderSection("home-team", [
      block([
        text("headline", "Investment Team", "h2"),
        text("name", "Jamil Hallak"),
        responsivePortrait("portrait"),
      ]),
    ]);

    expect(html).toContain('<source media="(max-width: 680px)"');
    expect(html).toContain('srcSet="/uploads/portrait-mobile.png"');
    expect(html).toContain(encodeURIComponent("/uploads/portrait.png"));
  });

  it("keeps committee identity separate from every supplied biography paragraph", () => {
    const html = renderSection("committee-members", [
      block([
        text("role", "Member"),
        text("name", "Turki Al Dayel", "h2"),
        text("bodyPrimary", "Primary biography"),
        text("bodySecondary", "Secondary biography"),
        text("bodyTertiary", "Board responsibilities"),
        text("initials", "TD"),
      ]),
    ]);

    expect(html).toContain("ogc-member-identity");
    expect(html).toContain("ogc-member-copy");
    expect(html.indexOf("Turki Al Dayel")).toBeLessThan(html.indexOf("Primary biography"));
    expect(html).toContain("Secondary biography");
    expect(html).toContain("Board responsibilities");
  });

  it("renders investment-team languages as the reference coded pills beside the portrait", () => {
    const html = renderSection("team-profile", [
      block([
        image("portrait", "portrait"),
        text("role", "Chief Investment Officer"),
        text("name", "Jamil Hallak", "h2"),
        text("languages", "AR Arabic\nEN English\nFR French"),
        text("bodyPrimary", "Biography"),
      ]),
    ]);

    expect(html).toContain("ogc-language-list");
    expect(html.match(/ogc-dna-pill/g)).toHaveLength(3);
    expect(html.indexOf("Arabic")).toBeLessThan(html.indexOf("Biography"));
    expect(html).toContain(">AR<");
    expect(html).toContain(">EN<");
    expect(html).toContain(">FR<");
    expect(html).not.toContain("AR Arabic</span>");
    expect(html).not.toContain("EN English</span>");
    expect(html).not.toContain("FR French</span>");
  });

  it("centers the About mission independently of the Home inspiration section", () => {
    const html = renderSection("about-mission", [
      block([text("eyebrow", "Mission"), text("quote", "Our investment mission")]),
    ]);

    expect(html).toContain("ogc-about-mission");
    expect(html).not.toContain("ogc-home-inspiration");
  });

  it("keeps the Strategy closing copy on the locale start edge without an invented arrow", () => {
    const html = renderSection("strategy-closing", [
      block([
        text("eyebrow", "Start a conversation"),
        text("headline", "Partner with us", "h2"),
        text("summary", "Long-term partnerships"),
        link("link", "primary"),
      ]),
    ]);

    expect(html).toContain(
      '<div class="ogc-container"><div class="ogc-closing-copy ogc-reveal">',
    );
    expect(html).toMatch(/<a class="ogc-button"[^>]*>Contact<\/a>/);
    expect(html).not.toContain("aria-hidden");
  });
});
