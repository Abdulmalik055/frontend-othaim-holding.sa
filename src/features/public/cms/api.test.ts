import { describe, expect, it } from "vitest";
import { normalizePublicCmsPage, type PublicCmsPageResponse } from "@/features/public/cms/api";

const canonicalContent = {
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

function pageWithContent(content: unknown, sectionType?: string): PublicCmsPageResponse {
  return {
    id: "page-id",
    slug: "home",
    titleAr: "الرئيسية",
    titleEn: "Home",
    category: "info",
    template: "home",
    navigationPlacement: "none",
    navigationOrder: 0,
    isIndexable: true,
    updatedAt: "2026-08-06T00:00:00.000Z",
    assetsById: {},
    sections: [
      {
        id: "section-id",
        slug: "intro",
        titleAr: "مقدمة",
        titleEn: "Introduction",
        type: sectionType,
        content,
        order: 1,
        isActive: true,
        updatedAt: "2026-08-06T00:00:00.000Z",
      },
    ],
  } as PublicCmsPageResponse;
}

describe("public CMS API content validation", () => {
  it("accepts canonical unversioned content without row revisions", () => {
    const page = normalizePublicCmsPage(pageWithContent(canonicalContent, "rich_text"));

    expect(page).not.toHaveProperty("version");
    expect(page.sections[0]).not.toHaveProperty("version");
    expect(page.sections[0].content).toEqual(canonicalContent);
    expect(page.sections[0].content).not.toHaveProperty("version");
    expect(page.sections[0]).not.toHaveProperty("type");
  });

  it.each([1, 2, 3] as const)("rejects a public content version %s", (version) => {
    expect(() => normalizePublicCmsPage(pageWithContent({ ...canonicalContent, version }))).toThrow(
      /Unsupported CMS content/
    );
  });

  it("rejects legacy flat public content rather than converting it", () => {
    expect(() =>
      normalizePublicCmsPage(
        pageWithContent({
          paragraphAr: "<p>نبذة</p>",
          paragraphEn: "<p>Summary</p>",
        })
      )
    ).toThrow(/Unsupported CMS content/);
  });

  it.each(["ul", "ol"] as const)("rejects removed %s list content", (format) => {
    expect(() =>
      normalizePublicCmsPage(
        pageWithContent({
          blocks: [
            {
              items: [
                {
                  type: "text",
                  key: "list",
                  text: { format, textAr: "الأول\nالثاني", textEn: "First\nSecond" },
                },
              ],
            },
          ],
        })
      )
    ).toThrow(/Unsupported CMS content/);
  });
});
