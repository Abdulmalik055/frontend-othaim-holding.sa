import { describe, expect, it } from "vitest";
import { buildOthaimNavigation } from "@/features/public/cms/public-navigation";
import type { PublicCmsPageSummary } from "@/features/public/cms/types";

function page(slug: string, titleAr: string, titleEn: string): PublicCmsPageSummary {
  return {
    id: slug,
    slug,
    titleAr,
    titleEn,
    category: "info",
    template: slug === "about" ? "about" : "default",
    navigationPlacement: "both",
    navigationOrder: 1,
    isIndexable: true,
    updatedAt: "2026-08-15T00:00:00.000Z",
  };
}

describe("Othaim public navigation", () => {
  it("keeps the fixed hierarchy while taking leaf labels from CMS", () => {
    const navigation = buildOthaimNavigation(
      [
        page("about", "عن العثيم العالمية", "About from CMS"),
        page("family", "عائلة العثيم", "Family from CMS"),
        page("founder", "المؤسس", "Founder from CMS"),
        page("committee", "لجنة الاستثمار", "Committee from CMS"),
        page("team", "فريق الاستثمار", "Team from CMS"),
        page("portfolio", "المحفظة", "Portfolio from CMS"),
        page("strategy", "الاستراتيجية", "Strategy from CMS"),
        page("contact", "التواصل", "Contact from CMS"),
      ],
      "en"
    );

    expect(navigation.whoWeAre.map((entry) => entry.label)).toEqual([
      "About from CMS",
      "Family from CMS",
    ]);
    expect(navigation.management.map((entry) => entry.slug)).toEqual([
      "founder",
      "committee",
      "team",
    ]);
    expect(navigation.business.map((entry) => entry.href)).toEqual([
      "/portfolio",
      "/strategy",
      "/contact",
    ]);
  });

  it("never exposes future legal pages in the client navigation", () => {
    const legalPage = {
      ...page("privacy", "الخصوصية", "Privacy"),
      category: "legal" as const,
    };
    const navigation = buildOthaimNavigation([legalPage], "en");

    expect(navigation.whoWeAre).toEqual([]);
    expect(navigation.management).toEqual([]);
    expect(navigation.business).toEqual([]);
  });

  it("uses CMS-owned placement labels for Contact while preserving title fallbacks", () => {
    const contactPage = {
      ...page("contact", "تواصل", "Contact"),
      headerNavigationLabelAr: "تواصل",
      headerNavigationLabelEn: "Contacts",
      footerNavigationLabelAr: "تواصل",
      footerNavigationLabelEn: "Contact",
    };

    const header = buildOthaimNavigation([contactPage], "en", { placement: "header" });
    const footer = buildOthaimNavigation([contactPage], "en", { placement: "footer" });

    expect(header.business[0]?.label).toBe("Contacts");
    expect(footer.business[0]?.label).toBe("Contact");
    expect(
      buildOthaimNavigation([page("contact", "تواصل", "Title fallback")], "en").business[0]?.label
    ).toBe("Title fallback");
  });
});
