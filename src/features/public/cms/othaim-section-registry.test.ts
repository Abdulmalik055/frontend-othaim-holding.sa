import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getOthaimSectionDefinition,
  OTHAIM_SECTION_SLUGS,
} from "@/features/public/cms/othaim-section-registry";
import { CmsPageRenderer } from "@/features/public/cms/CmsPageRenderer";
import type { PublicCmsPage } from "@/features/public/cms/types";

const EXPECTED_SECTION_SLUGS = [
  "home-hero",
  "home-story",
  "home-founder",
  "home-committee",
  "home-team",
  "home-inspiration",
  "home-philosophies",
  "home-partners",
  "home-contact",
  "about-hero",
  "about-mission",
  "about-dna",
  "about-vision",
  "about-values",
  "about-csr",
  "family-hero",
  "family-timeline",
  "founder-hero",
  "founder-profile",
  "founder-companies",
  "committee-hero",
  "committee-members",
  "team-hero",
  "team-profile",
  "portfolio-hero",
  "portfolio-philosophy",
  "portfolio-infrastructure",
  "portfolio-partners",
  "strategy-hero",
  "strategy-pillars",
  "strategy-closing",
  "contact-hero",
  "contact-details",
] as const;

describe("Othaim section registry", () => {
  it("covers the exact 33 seeded structural slugs", () => {
    expect(OTHAIM_SECTION_SLUGS).toEqual(EXPECTED_SECTION_SLUGS);
    expect(new Set(OTHAIM_SECTION_SLUGS).size).toBe(33);

    for (const slug of EXPECTED_SECTION_SLUGS) {
      expect(getOthaimSectionDefinition(slug).kind).not.toBe("fallback");
    }
  });

  it("uses the branded generic fallback for unknown future sections", () => {
    expect(getOthaimSectionDefinition("future-client-section")).toMatchObject({
      kind: "fallback",
    });
  });

  it("routes every seeded slug through a concrete server-renderable section", () => {
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
      assetsById: {},
      sections: EXPECTED_SECTION_SLUGS.map((slug, index) => ({
        id: slug,
        slug,
        order: index + 1,
        updatedAt: "2026-08-15T00:00:00.000Z",
        content: {
          blocks: [
            {
              items: [
                {
                  key: "headline",
                  type: "text" as const,
                  text: { format: "h2" as const, textAr: slug, textEn: slug },
                },
              ],
            },
          ],
        },
      })),
    };
    const labels = new Proxy(
      { legalCentre: "Legal", insidePlatform: "Inside", information: "Info", empty: "Empty" },
      { get: (target, key: string) => Reflect.get(target, key) ?? key }
    ) as Parameters<typeof CmsPageRenderer>[0]["labels"];
    const html = renderToStaticMarkup(
      createElement(CmsPageRenderer, { page, locale: "en", labels })
    );

    for (const slug of EXPECTED_SECTION_SLUGS) {
      expect(html).toContain(`id="${slug}"`);
    }
  });
});
