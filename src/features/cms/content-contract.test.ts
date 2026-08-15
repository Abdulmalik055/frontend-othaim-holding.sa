import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  CMS_SECTION_ITEM_TYPES,
  normalizeCmsSectionContent,
} from "@/features/cms/content-contract";

describe("shared CMS content contract", () => {
  it("is the neutral structured-content source for both public and admin surfaces", () => {
    expect(CMS_SECTION_ITEM_TYPES).toEqual(["text", "image", "video", "file", "link"]);
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
});
