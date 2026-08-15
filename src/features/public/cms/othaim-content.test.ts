import { describe, expect, it } from "vitest";
import { getBlocks, getImage, getLink, getText } from "@/features/public/cms/othaim-content";
import type { CmsSectionContent } from "@/features/cms/content-contract";

const content: CmsSectionContent = {
  blocks: [
    {
      items: [
        {
          key: "headline",
          type: "text",
          text: { format: "h1", textAr: "عنوان", textEn: "Headline" },
        },
        {
          key: "portrait",
          type: "image",
          image: {
            desktopAssetId: "portrait-desktop",
            mobileAssetId: "portrait-mobile",
            altAr: "صورة شخصية",
            altEn: "Portrait",
          },
        },
        {
          key: "link",
          type: "link",
          link: {
            href: "/founder",
            labelAr: "اعرف أكثر",
            labelEn: "Learn more",
            style: "text",
          },
        },
      ],
    },
    {
      items: [
        {
          key: "name",
          type: "text",
          text: { format: "h3", textAr: "عضو", textEn: "Member" },
        },
      ],
    },
  ],
};

describe("Othaim CMS content selectors", () => {
  it("selects text by structural key in either locale", () => {
    expect(getText(content.blocks[0], "headline", "ar")).toBe("عنوان");
    expect(getText(content.blocks[0], "headline", "en")).toBe("Headline");
    expect(getText(content.blocks[0], "missing", "en")).toBeUndefined();
  });

  it("selects typed media and links without depending on item order", () => {
    expect(getImage(content.blocks[0], "portrait")?.image.desktopAssetId).toBe("portrait-desktop");
    expect(getLink(content.blocks[0], "link")?.link.labelAr).toBe("اعرف أكثر");
  });

  it("separates the intro block from repeated content blocks", () => {
    expect(getBlocks(content).intro).toBe(content.blocks[0]);
    expect(getBlocks(content).repeated).toEqual([content.blocks[1]]);
  });
});
