import { describe, expect, it } from "vitest";
import type { PublicCmsPage } from "@/features/public/cms/types";
import { createCmsMetadata, getCmsDescription } from "@/features/public/cms/metadata";

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

  it("publishes clean localized canonicals with Arabic x-default", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://othaimglobal.com";
    const metadata = createCmsMetadata(
      page({
        seoTitleEn: "Othaim Global — About",
      }),
      "en"
    );

    expect(metadata.alternates).toMatchObject({
      canonical: "https://othaimglobal.com/en/about",
      languages: {
        ar: "https://othaimglobal.com/ar/about",
        en: "https://othaimglobal.com/en/about",
        "x-default": "https://othaimglobal.com/ar/about",
      },
    });
    expect(metadata.title).toEqual({ absolute: "Othaim Global — About" });
    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("emits a social image only when the configured asset resolves", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://othaimglobal.com";
    const metadata = createCmsMetadata(
      page({
        seoImageAssetId: "seo-image",
        assetsById: {
          "seo-image": { id: "seo-image", type: "image", url: "/uploads/seo.png" },
        },
      }),
      "en"
    );

    expect(metadata.openGraph).toMatchObject({
      images: ["https://othaimglobal.com/uploads/seo.png"],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://othaimglobal.com/uploads/seo.png"],
    });
  });
});
