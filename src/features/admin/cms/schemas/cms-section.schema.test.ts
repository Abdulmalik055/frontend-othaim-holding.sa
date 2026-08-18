import { describe, expect, it } from "vitest";
import {
  cmsSectionContentSchema,
  cmsSectionEditorSchema,
  cmsSectionSchema,
  normalizeCmsSectionContent,
} from "@/features/admin/cms/schemas/cms-section.schema";

const canonicalTextContent = {
  blocks: [
    {
      items: [
        {
          type: "text" as const,
          key: "body",
          text: { format: "p" as const, textAr: "نص", textEn: "Copy" },
        },
      ],
    },
  ],
};

describe("CMS section content", () => {
  it("accepts the strict unversioned content contract unchanged", () => {
    expect(normalizeCmsSectionContent(canonicalTextContent)).toEqual(canonicalTextContent);
  });

  it.each([1, 2, 3] as const)("rejects an explicit content version %s", (version) => {
    expect(() =>
      normalizeCmsSectionContent({
        ...canonicalTextContent,
        version,
      })
    ).toThrow(/Unsupported CMS content/);
  });

  it("rejects legacy flat bilingual content instead of converting it", () => {
    expect(() =>
      normalizeCmsSectionContent({
        icon: "building",
        paragraphAr: "<p>نبذة</p>",
        paragraphEn: "<p>Summary</p>",
        bodyAr: "<p>التفاصيل</p>",
        bodyEn: "<p>Details</p>",
      })
    ).toThrow(/Unsupported CMS content/);
  });

  it("rejects versionless transitional blocks instead of synthesizing item keys", () => {
    expect(() =>
      normalizeCmsSectionContent({
        blocks: [
          {
            items: [
              {
                type: "text",
                text: { format: "p", textAr: "نص", textEn: "Copy" },
              },
            ],
          },
        ],
      })
    ).toThrow(/Unsupported CMS content/);
  });

  it("rejects extra root properties instead of stripping them", () => {
    expect(() =>
      normalizeCmsSectionContent({
        ...canonicalTextContent,
        variant: "hero",
      })
    ).toThrow(/Unsupported CMS content/);
  });

  it("keeps every supported text, image, video, file, and link item", () => {
    const content = {
      blocks: [
        {
          items: [
            canonicalTextContent.blocks[0].items[0],
            {
              type: "image" as const,
              key: "hero-image",
              image: {
                desktopAssetId: "image-desktop",
                mobileAssetId: "image-mobile",
                altAr: "صورة",
                altEn: "Image",
              },
            },
            {
              type: "video" as const,
              key: "hero-video",
              video: {
                desktopAssetId: "video-desktop",
                mobileAssetId: "video-mobile",
                posterDesktopAssetId: "poster-desktop",
                posterMobileAssetId: "poster-mobile",
              },
            },
            {
              type: "file" as const,
              key: "document",
              file: {
                assetId: "document-file",
                titleAr: "المستند",
                titleEn: "Document",
                display: "download",
              },
            },
            {
              type: "link" as const,
              key: "contact",
              link: {
                labelAr: "تواصل",
                labelEn: "Contact",
                href: "mailto:hello@example.com",
                style: "primary" as const,
                openInNewTab: true,
              },
            },
          ],
        },
      ],
    };

    expect(normalizeCmsSectionContent(content)).toEqual(content);
  });

  it.each(["ul", "ol"] as const)("accepts supported %s list content", (format) => {
    const content = {
      blocks: [
        {
          items: [
            {
              type: "text" as const,
              key: `${format}-list`,
              text: { format, textAr: "الأول\nالثاني", textEn: "First\nSecond" },
            },
          ],
        },
      ],
    };

    expect(normalizeCmsSectionContent(content)).toEqual(content);
  });

  it("accepts safe localized links and rejects javascript destinations", () => {
    const base = {
      blocks: [
        {
          items: [
            {
              type: "link" as const,
              key: "contact",
              link: {
                labelAr: "تواصل",
                labelEn: "Contact",
                href: "mailto:hello@example.com",
                style: "primary" as const,
              },
            },
          ],
        },
      ],
    };
    expect(cmsSectionContentSchema.safeParse(base).success).toBe(true);
    expect(
      cmsSectionContentSchema.safeParse({
        ...base,
        blocks: [
          {
            ...base.blocks[0],
            items: [
              {
                ...base.blocks[0].items[0],
                link: { ...base.blocks[0].items[0].link, href: "javascript:alert(1)" },
              },
            ],
          },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects incomplete or malformed typed button destinations", () => {
    const item = {
      type: "link" as const,
      key: "contact",
      link: {
        labelAr: "تواصل",
        labelEn: "Contact",
        href: "mailto:",
        style: "primary" as const,
      },
    };
    const content = (href: string) => ({
      blocks: [{ items: [{ ...item, link: { ...item.link, href } }] }],
    });

    expect(cmsSectionContentSchema.safeParse(content("mailto:")).success).toBe(false);
    expect(cmsSectionContentSchema.safeParse(content("mailto:not-an-email")).success).toBe(false);
    expect(cmsSectionContentSchema.safeParse(content("tel:")).success).toBe(false);
    expect(cmsSectionContentSchema.safeParse(content("tel:+12")).success).toBe(false);
    expect(cmsSectionContentSchema.safeParse(content("https://")).success).toBe(false);
  });

  it("rejects presentation metadata in canonical content", () => {
    expect(
      cmsSectionContentSchema.safeParse({
        variant: "hero",
        blocks: [
          {
            type: "hero_content",
            variant: "centered",
            items: [canonicalTextContent.blocks[0].items[0]],
          },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects the removed top-level section type", () => {
    expect(
      cmsSectionSchema.safeParse({
        type: "hero",
        titleAr: "قسم",
        titleEn: "Section",
        content: canonicalTextContent,
        order: 1,
        isActive: true,
      }).success
    ).toBe(false);
  });

  it("rejects editor-supplied slugs from section mutations", () => {
    expect(
      cmsSectionSchema.safeParse({
        slug: "editor-controlled-slug",
        titleAr: "قسم نصي",
        titleEn: "Text Section",
        content: canonicalTextContent,
        order: 1,
        isActive: true,
      }).success
    ).toBe(false);
  });

  it("keeps order outside the regular section editor contract", () => {
    const editorPayload = {
      titleAr: "قسم نصي",
      titleEn: "Text Section",
      content: canonicalTextContent,
      isActive: true,
    };

    expect(cmsSectionEditorSchema.safeParse(editorPayload).success).toBe(true);
    expect(cmsSectionEditorSchema.safeParse({ ...editorPayload, order: 1 }).success).toBe(false);
  });

  it("rejects the retired section row version from editor payloads", () => {
    expect(
      cmsSectionEditorSchema.safeParse({
        titleAr: "قسم نصي",
        titleEn: "Text Section",
        content: canonicalTextContent,
        isActive: true,
        version: 7,
      }).success
    ).toBe(false);
  });
});
