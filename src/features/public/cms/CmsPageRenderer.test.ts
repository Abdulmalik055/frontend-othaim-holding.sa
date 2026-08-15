import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CmsPageRenderer,
  getCmsPageTemplateKey,
  getLocalizedCmsText,
  isSafeCmsHref,
  localizeCmsHref,
} from "@/features/public/cms/CmsPageRenderer";
import type { PublicCmsPage } from "@/features/public/cms/types";

const rendererSource = readFileSync(new URL("./CmsPageRenderer.tsx", import.meta.url), "utf8");
const rendererLabels = {
  legalCentre: "Legal",
  insidePlatform: "Inside",
  information: "Information",
  empty: "Empty",
  formFullName: "Full name",
  formOrganization: "Organization",
  formEmail: "Email",
  formTopic: "Topic",
  formMessage: "Message",
  formSubmit: "Submit",
  formSubmitting: "Submitting",
  formSuccess: "Success",
  formError: "Error",
  formRateLimited: "Rate limited",
  formConfidentiality: "Confidential",
  topicPartnership: "Partnership",
  topicCoInvestment: "Co-investment",
  topicFamilyOffice: "Family office",
  topicMedia: "Media",
  topicOther: "Other",
  validationFullName: "Invalid name",
  validationOrganization: "Invalid organization",
  validationEmail: "Invalid email",
  validationTopic: "Invalid topic",
  validationMessage: "Invalid message",
};

describe("public CMS link handling", () => {
  it("localizes internal CMS routes without rewriting uploads or external links", () => {
    expect(localizeCmsHref("/info/about", "ar")).toBe("/ar/about");
    expect(localizeCmsHref("/en/legal/privacy", "ar")).toBe("/en/legal/privacy");
    expect(localizeCmsHref("/uploads/media/file.pdf", "ar")).toBe("/uploads/media/file.pdf");
    expect(localizeCmsHref("https://example.com", "ar")).toBe("https://example.com");
  });

  it("rejects executable and protocol-relative destinations", () => {
    expect(isSafeCmsHref("javascript:alert(1)")).toBe(false);
    expect(isSafeCmsHref("//malicious.example")).toBe(false);
    expect(isSafeCmsHref("mailto:hello@example.com")).toBe(true);
  });
});

describe("public CMS rendering registry", () => {
  it("uses a generic section and block renderer without presentation metadata", () => {
    expect(rendererSource).not.toContain("presetClassNames");
    expect(rendererSource).not.toContain("data-section-type");
    expect(rendererSource).not.toContain("data-block-type");
    expect(rendererSource).not.toContain("isHero");
    expect(rendererSource).not.toContain("autoPlay");
    expect(rendererSource).toContain("controls: true");
    expect(rendererSource).toContain('preload: "none"');
  });

  it("has no private-preview rendering mode", () => {
    expect(rendererSource).not.toContain("preview?:");
    expect(rendererSource).not.toContain("preview =");
    expect(rendererSource).not.toContain("inactiveSection");
  });

  it("has no renderer for removed list text formats", () => {
    expect(rendererSource).not.toContain('item.text.format === "ul"');
    expect(rendererSource).not.toContain('item.text.format === "ol"');
    expect(rendererSource).not.toContain("list-disc");
    expect(rendererSource).not.toContain("list-decimal");
    expect(rendererSource).toContain('item.text.format === "p"');
  });

  it("renders every supported item from canonical unversioned content", () => {
    const page: PublicCmsPage = {
      id: "page-id",
      slug: "about",
      titleAr: "من نحن",
      titleEn: "About",
      category: "info",
      template: "default",
      navigationPlacement: "none",
      navigationOrder: 0,
      isIndexable: true,
      updatedAt: "2026-08-14T00:00:00.000Z",
      assetsById: {
        image: { id: "image", type: "image", url: "/uploads/image.png" },
        video: { id: "video", type: "video", url: "/uploads/video.mp4" },
        file: { id: "file", type: "file", url: "/uploads/file.pdf", filename: "file.pdf" },
      },
      sections: [
        {
          id: "section-id",
          slug: "introduction",
          order: 1,
          updatedAt: "2026-08-14T00:00:00.000Z",
          content: {
            blocks: [
              {
                items: [
                  {
                    type: "text",
                    key: "body",
                    text: { format: "p", textAr: "نص", textEn: "Canonical copy" },
                  },
                  {
                    type: "image",
                    key: "image",
                    image: {
                      desktopAssetId: "image",
                      altAr: "صورة",
                      altEn: "Canonical image",
                    },
                  },
                  {
                    type: "video",
                    key: "video",
                    video: { desktopAssetId: "video" },
                  },
                  {
                    type: "file",
                    key: "file",
                    file: { assetId: "file", titleAr: "ملف", titleEn: "Canonical file" },
                  },
                  {
                    type: "link",
                    key: "link",
                    link: {
                      labelAr: "تواصل",
                      labelEn: "Canonical link",
                      href: "mailto:hello@example.com",
                      style: "primary",
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    };

    const html = renderToStaticMarkup(
      createElement(CmsPageRenderer, {
        page,
        locale: "en",
        labels: rendererLabels,
      })
    );

    expect(html).toContain("Canonical copy");
    expect(html).toContain("Canonical image");
    expect(html).toContain(encodeURIComponent("/uploads/image.png"));
    expect(html).toContain('src="/uploads/video.mp4"');
    expect(html).toContain("Canonical file");
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).not.toContain('"version"');
  });

  it.each(["ul", "ol"] as const)("does not render untyped legacy %s content", (format) => {
    const page = {
      id: "page-id",
      slug: "about",
      titleAr: "من نحن",
      titleEn: "About",
      category: "info",
      template: "default",
      navigationPlacement: "none",
      navigationOrder: 0,
      isIndexable: true,
      updatedAt: "2026-08-13T00:00:00.000Z",
      assetsById: {},
      sections: [
        {
          id: "section-id",
          slug: "legacy-list",
          order: 1,
          updatedAt: "2026-08-13T00:00:00.000Z",
          content: {
            blocks: [
              {
                items: [
                  {
                    type: "text",
                    key: "legacy-list",
                    text: {
                      format,
                      textAr: "محتوى قائمة قديم",
                      textEn: "Legacy list content",
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    } as unknown as PublicCmsPage;

    const html = renderToStaticMarkup(
      createElement(CmsPageRenderer, {
        page,
        locale: "en",
        labels: rendererLabels,
      })
    );

    expect(html).not.toContain("Legacy list content");
    expect(html).not.toContain(`<${format}`);
  });

  it("selects only the requested localized text", () => {
    const item = {
      type: "text" as const,
      key: "headline",
      text: { format: "h2" as const, textAr: "استثمار مستدام", textEn: "Enduring value" },
    };
    expect(getLocalizedCmsText(item, "ar")).toBe("استثمار مستدام");
    expect(getLocalizedCmsText(item, "en")).toBe("Enduring value");
  });

  it("selects an explicit page presentation without relying on section order", () => {
    expect(getCmsPageTemplateKey({ template: "home", category: "info" })).toBe("home");
    expect(getCmsPageTemplateKey({ template: "about", category: "info" })).toBe("about");
    expect(getCmsPageTemplateKey({ template: "default", category: "legal" })).toBe("legal");
    expect(getCmsPageTemplateKey({ template: "default", category: "info" })).toBe("default");
  });

  it("renders an empty Othaim page with the branded state treatment", () => {
    const page = {
      id: "empty-page",
      slug: "about",
      titleAr: "من نحن",
      titleEn: "About",
      category: "info",
      template: "about",
      navigationPlacement: "header",
      navigationOrder: 1,
      isIndexable: true,
      updatedAt: "2026-08-15T00:00:00.000Z",
      assetsById: {},
      sections: [],
    } as PublicCmsPage;

    const html = renderToStaticMarkup(
      createElement(CmsPageRenderer, { page, locale: "en", labels: rendererLabels })
    );

    expect(html).toContain("ogc-public-error");
    expect(html).toContain("Empty");
    expect(html).not.toContain("#5d6268");
  });

  it("does not dispatch branded sections when the page and section contract do not match", () => {
    const page = {
      id: "future-page",
      slug: "future-page",
      titleAr: "صفحة مستقبلية",
      titleEn: "Future page",
      category: "info",
      template: "default",
      navigationPlacement: "none",
      navigationOrder: 0,
      isIndexable: true,
      updatedAt: "2026-08-15T00:00:00.000Z",
      assetsById: {},
      sections: [
        {
          id: "spoofed-home-hero",
          slug: "home-hero",
          order: 1,
          updatedAt: "2026-08-15T00:00:00.000Z",
          content: {
            blocks: [
              {
                items: [
                  {
                    key: "headline",
                    type: "text",
                    text: { format: "h1", textAr: "عنوان", textEn: "Generic headline" },
                  },
                ],
              },
            ],
          },
        },
      ],
    } as PublicCmsPage;

    const html = renderToStaticMarkup(
      createElement(CmsPageRenderer, { page, locale: "en", labels: rendererLabels })
    );

    expect(html).toContain("cms-section");
    expect(html).toContain("Generic headline");
    expect(html).not.toContain("ogc-video-hero");
  });
});
