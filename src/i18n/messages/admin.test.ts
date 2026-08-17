import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import arMessages from "@/i18n/messages/ar/admin.json";
import arCommonMessages from "@/i18n/messages/ar/common.json";
import enMessages from "@/i18n/messages/en/admin.json";
import enCommonMessages from "@/i18n/messages/en/common.json";

const topBarSource = readFileSync(
  new URL("../../components/layout/TopBar.tsx", import.meta.url),
  "utf8"
);

const reorderMessageKeys = [
  "reorderHandle",
  "reorderInstructions",
  "reorderPickedUp",
  "reorderMoved",
  "reorderDropped",
  "reorderCanceled",
  "reorderError",
] as const;
const removedPresentationKeys = [
  "slug",
  "slugConflict",
  "type",
  "typePlaceholder",
  "contentVariant",
  "contentVariantPlaceholder",
  "blockType",
  "blockTypePlaceholder",
  "blockVariant",
  "blockVariantPlaceholder",
  "useAdvancedMode",
  "usePresetMode",
] as const;

describe("CMS admin messages", () => {
  it("uses the approved Arabic holding name in the public footer", () => {
    expect(arCommonMessages.publicCms.navigation.holding).toBe("العثيم القابضة");
  });

  it("labels the public root as the live site in both locales", () => {
    expect(enMessages.admin).toHaveProperty("viewLiveSite", "View live site");
    expect(arMessages.admin).toHaveProperty("viewLiveSite", "عرض الموقع المباشر");
    expect(topBarSource).toContain("viewLiveSite");
  });

  it("uses availability language for public CMS empty and missing-page states", () => {
    expect(enCommonMessages.publicCms).toMatchObject({
      empty: "No content is available yet.",
      notFoundDescription: "The page may be unavailable or moved.",
    });
    expect(arCommonMessages.publicCms).toMatchObject({
      empty: "لا يوجد محتوى متاح بعد.",
      notFoundDescription: "قد تكون الصفحة غير متاحة أو تم نقلها.",
    });
  });

  it("uses Button terminology and provides dynamic destination messages in both locales", () => {
    const en = enMessages.admin.cmsPage.sectionDialog;
    const ar = arMessages.admin.cmsPage.sectionDialog;

    expect(en).toMatchObject({
      itemTypeLink: "Button",
      linkLabelAr: "Arabic button label",
      linkLabelEn: "English button label",
      linkHref: "Link",
    });
    expect(ar).toMatchObject({
      itemTypeLink: "زر",
      linkLabelAr: "نص الزر بالعربية",
      linkLabelEn: "نص الزر بالإنجليزية",
      linkHref: "الرابط",
    });

    for (const messages of [en, ar]) {
      for (const key of [
        "linkType",
        "linkTypeInternal",
        "linkTypeUrl",
        "linkTypeEmail",
        "linkTypePhone",
        "linkSelectPage",
        "linkNoPages",
        "linkPagesError",
        "linkRetryPages",
        "linkUnavailable",
        "linkUrlPlaceholder",
        "linkEmailPlaceholder",
        "linkPhonePlaceholder",
      ] as const) {
        expect(messages[key]).toEqual(expect.any(String));
      }
    }
  });

  it.each([
    ["ar", arMessages],
    ["en", enMessages],
  ])("provides section reorder messages for %s", (_locale, messages) => {
    const sectionMessages = messages.admin.cmsPage.sections as Record<string, unknown>;

    for (const key of reorderMessageKeys) {
      expect(sectionMessages[key]).toEqual(expect.any(String));
    }
    expect(sectionMessages).not.toHaveProperty("moveUp");
    expect(sectionMessages).not.toHaveProperty("moveDown");
  });

  it.each([
    ["ar", arMessages],
    ["en", enMessages],
  ])("does not expose removed section presentation messages for %s", (_locale, messages) => {
    const dialogMessages = messages.admin.cmsPage.sectionDialog as Record<string, unknown>;

    for (const key of removedPresentationKeys) {
      expect(dialogMessages).not.toHaveProperty(key);
    }
    expect(Object.keys(dialogMessages).some((key) => key.startsWith("preset_"))).toBe(false);
    expect(dialogMessages).not.toHaveProperty("order");
    expect(dialogMessages.identifierConflict).toEqual(expect.any(String));
  });
});
