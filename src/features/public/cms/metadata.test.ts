import { describe, expect, it } from "vitest";
import type { PublicCmsPage } from "@/features/public/cms/types";
import { getCmsDescription } from "@/features/public/cms/metadata";

function page(overrides: Partial<PublicCmsPage> = {}): PublicCmsPage {
  return {
    id: "page-id",
    slug: "about",
    titleAr: "من نحن",
    titleEn: "About",
    category: "info",
    template: "about",
    navigationPlacement: "header",
    navigationOrder: 1,
    isIndexable: true,
    updatedAt: "2026-08-04T00:00:00.000Z",
    assetsById: {},
    sections: [
      {
        id: "section-id",
        slug: "introduction",
        order: 1,
        updatedAt: "2026-08-04T00:00:00.000Z",
        content: {
          blocks: [
            {
              items: [
                {
                  type: "text",
                  key: "intro",
                  text: {
                    format: "p",
                    textAr: "نبذة تعريفية عن المنصة",
                    textEn: "An introduction to the platform",
                  },
                },
              ],
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe("CMS metadata fallbacks", () => {
  it("uses the localized SEO description when one is configured", () => {
    expect(getCmsDescription(page({ seoDescriptionEn: "Purpose-built metadata" }), "en")).toBe(
      "Purpose-built metadata"
    );
  });

  it("falls back to localized structured paragraph content", () => {
    expect(getCmsDescription(page(), "ar")).toBe("نبذة تعريفية عن المنصة");
    expect(getCmsDescription(page(), "en")).toBe("An introduction to the platform");
  });
});
