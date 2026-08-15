import { describe, expect, it } from "vitest";
import {
  OTHAIM_PUBLIC_PAGE_SLUGS,
  getPublicPageRoute,
  isPublicInfoSlug,
  isOthaimPublicPageSlug,
} from "@/features/public/cms/public-routes";

describe("Othaim public routes", () => {
  it("exposes exactly eight clean public leaf routes", () => {
    expect(OTHAIM_PUBLIC_PAGE_SLUGS).toEqual([
      "about",
      "family",
      "founder",
      "committee",
      "team",
      "portfolio",
      "strategy",
      "contact",
    ]);
    expect(getPublicPageRoute("en", "about", "info")).toBe("/en/about");
    expect(isOthaimPublicPageSlug("privacy")).toBe(false);
  });

  it("retains the future legal route namespace", () => {
    expect(getPublicPageRoute("ar", "privacy", "legal")).toBe("/ar/legal/privacy");
  });

  it("allows future safe info slugs while reserving structural routes", () => {
    expect(isPublicInfoSlug("investment-profile")).toBe(true);
    expect(isPublicInfoSlug("home")).toBe(false);
    expect(isPublicInfoSlug("legal")).toBe(false);
    expect(isPublicInfoSlug("Not Safe")).toBe(false);
  });
});
