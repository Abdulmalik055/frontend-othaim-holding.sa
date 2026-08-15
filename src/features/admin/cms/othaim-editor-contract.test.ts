import { describe, expect, it } from "vitest";
import {
  canAddOthaimRepeaterBlock,
  canRemoveOthaimBlock,
  createOthaimRepeaterBlock,
  isProtectedOthaimPageSlug,
  isProtectedOthaimSection,
} from "@/features/admin/cms/othaim-editor-contract";

describe("Othaim admin structural contract", () => {
  it("locks all seeded sections while leaving unknown sections generic", () => {
    expect(isProtectedOthaimPageSlug("home")).toBe(true);
    expect(isProtectedOthaimPageSlug("contact")).toBe(true);
    expect(isProtectedOthaimPageSlug("future-page")).toBe(false);
    expect(isProtectedOthaimSection("home-hero")).toBe(true);
    expect(isProtectedOthaimSection("home-hero", "home")).toBe(true);
    expect(isProtectedOthaimSection("home-hero", "about")).toBe(false);
    expect(isProtectedOthaimSection("home-hero", "future-page")).toBe(false);
    expect(isProtectedOthaimSection("contact-details")).toBe(true);
    expect(isProtectedOthaimSection("future-generic-section")).toBe(false);
  });

  it("allows repeat blocks without allowing the intro or final repeater to be removed", () => {
    expect(canAddOthaimRepeaterBlock("home-philosophies")).toBe(true);
    expect(canRemoveOthaimBlock("home-philosophies", 0, 4)).toBe(false);
    expect(canRemoveOthaimBlock("home-philosophies", 2, 4)).toBe(true);
    expect(canRemoveOthaimBlock("home-philosophies", 1, 2)).toBe(false);
    expect(canAddOthaimRepeaterBlock("home-hero")).toBe(false);
  });

  it("creates repeat blocks with protected keys and required item types", () => {
    expect(
      createOthaimRepeaterBlock("family-timeline")?.items.map(({ key, type }) => [key, type])
    ).toEqual([
      ["year", "text"],
      ["name", "text"],
      ["body", "text"],
    ]);
    expect(
      createOthaimRepeaterBlock("portfolio-infrastructure")?.items.map(({ key, type }) => [
        key,
        type,
      ])
    ).toEqual([
      ["name", "text"],
      ["sector", "text"],
      ["logo", "image"],
    ]);
    expect(
      createOthaimRepeaterBlock("committee-members")?.items.map(({ key, type }) => [key, type])
    ).toEqual([
      ["role", "text"],
      ["name", "text"],
      ["bodyPrimary", "text"],
      ["bodySecondary", "text"],
      ["initials", "text"],
    ]);
  });
});
