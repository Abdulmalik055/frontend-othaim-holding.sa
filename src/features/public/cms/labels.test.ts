import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import arMessages from "@/i18n/messages/ar/common.json";
import { createCmsPageRendererLabels } from "@/features/public/cms/labels";

describe("createCmsPageRendererLabels", () => {
  it("loads the last-updated ICU template without formatting it prematurely", () => {
    const t = createTranslator({
      locale: "ar",
      messages: arMessages,
      namespace: "publicCms",
    });

    expect(() => createCmsPageRendererLabels(t)).not.toThrow();
    expect(createCmsPageRendererLabels(t).lastUpdated).toBe("آخر تحديث: {date}");
  });
});
