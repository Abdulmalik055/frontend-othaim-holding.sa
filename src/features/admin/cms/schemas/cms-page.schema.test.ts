import { describe, expect, it } from "vitest";
import { cmsPageSchema } from "@/features/admin/cms/schemas/cms-page.schema";

describe("cmsPageSchema", () => {
  it("falls back blank SEO titles to the localized page titles", () => {
    const result = cmsPageSchema.parse({
      slug: "about",
      titleAr: "من نحن",
      titleEn: "About Us",
      category: "info",
      template: "about",
      seoTitleAr: "   ",
      seoTitleEn: "",
      isIndexable: true,
      isActive: true,
    });

    expect(result.seoTitleAr).toBe("من نحن");
    expect(result.seoTitleEn).toBe("About Us");
  });

  it("truncates blank SEO title fallbacks to 60 characters", () => {
    const result = cmsPageSchema.parse({
      slug: "about",
      titleAr: `  ${"أ".repeat(61)}  `,
      titleEn: `  ${"E".repeat(61)}  `,
      category: "info",
      template: "about",
      seoTitleAr: "   ",
      seoTitleEn: "",
      isIndexable: true,
      isActive: true,
    });

    expect(result.seoTitleAr).toBe("أ".repeat(60));
    expect(result.seoTitleEn).toBe("E".repeat(60));
  });

  it.each([
    ["seoTitleAr", "أ".repeat(61)],
    ["seoTitleEn", "E".repeat(61)],
  ] as const)("rejects an explicit %s longer than 60 characters", (field, value) => {
    const result = cmsPageSchema.safeParse({
      slug: "about",
      titleAr: "من نحن",
      titleEn: "About Us",
      category: "info",
      template: "about",
      [field]: value,
      isIndexable: true,
      isActive: true,
    });

    expect(result.success).toBe(false);
  });

  it("omits menu navigation fields from the page mutation payload", () => {
    const result = cmsPageSchema.parse({
      slug: "investment-profile",
      titleAr: "ملف الاستثمار",
      titleEn: "Investment Profile",
      category: "info",
      template: "default",
      navigationPlacement: "header",
      navigationOrder: 20,
      seoTitleAr: "ملف الاستثمار",
      seoTitleEn: "Investment Profile",
      seoDescriptionAr: "تعرف على استثمارات المنصة وشراكاتها.",
      seoDescriptionEn: "Explore the platform's investments and partnerships.",
      seoImageAssetId: null,
      isIndexable: true,
      isActive: false,
    });

    expect(result).not.toHaveProperty("navigationPlacement");
    expect(result).not.toHaveProperty("navigationOrder");
  });

  it("omits the retired page row version from mutation payloads", () => {
    const result = cmsPageSchema.parse({
      slug: "about",
      titleAr: "من نحن",
      titleEn: "About Us",
      category: "info",
      template: "about",
      isIndexable: true,
      isActive: true,
      version: 7,
    });

    expect(result).not.toHaveProperty("version");
  });

  it("rejects unsafe slugs and about templates in the legal category", () => {
    expect(
      cmsPageSchema.safeParse({
        slug: "خصوصية",
        titleAr: "الخصوصية",
        titleEn: "Privacy",
        category: "legal",
        template: "about",
        isIndexable: true,
        isActive: true,
      }).success
    ).toBe(false);
  });
});

const validPage = {
  slug: "about-us",
  titleAr: "من نحن",
  titleEn: "About us",
  category: "info" as const,
  template: "default" as const,
  seoImageAssetId: null,
  isIndexable: true,
  isActive: true,
};

describe("cmsPageSchema homepage classification", () => {
  it("accepts the active system homepage tuple", () => {
    const result = cmsPageSchema.safeParse({
      ...validPage,
      slug: "home",
      template: "home",
    });

    expect(result.success).toBe(true);
  });

  it.each([
    { slug: "home", category: "info", template: "default", isActive: true },
    { slug: "landing", category: "info", template: "home", isActive: true },
    { slug: "home", category: "legal", template: "home", isActive: true },
    { slug: "home", category: "info", template: "home", isActive: false },
  ] as const)("rejects an incomplete homepage classification: %o", (classification) => {
    expect(cmsPageSchema.safeParse({ ...validPage, ...classification }).success).toBe(false);
  });
});
