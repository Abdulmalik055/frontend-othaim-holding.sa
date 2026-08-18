import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CMS_TEXT_FORMATS,
  CMS_SECTION_ITEM_TYPES,
  normalizeCmsSectionContent,
} from "@/features/cms/content-contract";

describe("shared CMS content contract", () => {
  it("is the neutral structured-content source for both public and admin surfaces", () => {
    expect(CMS_SECTION_ITEM_TYPES).toEqual(["text", "image", "video", "file", "link"]);
    expect(CMS_TEXT_FORMATS).toEqual(["h1", "h2", "h3", "p", "ul", "ol"]);
    expect(
      normalizeCmsSectionContent({
        blocks: [
          {
            items: [
              {
                key: "headline",
                type: "text",
                text: { format: "h1", textAr: "عنوان", textEn: "Headline" },
              },
            ],
          },
        ],
      })
    ).toBeTruthy();

    const publicTypes = readFileSync(new URL("../public/cms/types.ts", import.meta.url), "utf8");
    expect(publicTypes).not.toContain("features/admin");
  });

  it.each(["ul", "ol"] as const)("accepts bilingual %s list content", (format) => {
    expect(
      normalizeCmsSectionContent({
        blocks: [
          {
            items: [
              {
                key: "legal-list",
                type: "text",
                text: {
                  format,
                  textAr: "البند الأول\nالبند الثاني",
                  textEn: "First item\nSecond item",
                },
              },
            ],
          },
        ],
      }).blocks[0].items[0]
    ).toMatchObject({ type: "text", text: { format } });
  });

  it.each([
    ["different bilingual item counts", "عنصر أول\nعنصر ثان", "First item"],
    ["blank list lines", "عنصر أول\n\nعنصر ثان", "First item\nSecond item"],
  ])("rejects lists with %s", (_reason, textAr, textEn) => {
    expect(() =>
      normalizeCmsSectionContent({
        blocks: [
          {
            items: [
              {
                key: "legal-list",
                type: "text",
                text: { format: "ul", textAr, textEn },
              },
            ],
          },
        ],
      })
    ).toThrow("Unsupported CMS content");
  });
});
