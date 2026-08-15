import type {
  CmsSectionBlock,
  CmsSectionItem,
  CmsSectionItemType,
  CmsTextFormat,
} from "@/features/cms/content-contract";
import {
  isOthaimSectionForPage,
  isOthaimSectionSlug,
  OTHAIM_PAGE_SECTION_SLUGS,
} from "@/features/public/cms/othaim-section-registry";

type RepeaterItemSpec = {
  key: string;
  type: CmsSectionItemType;
  format?: CmsTextFormat;
};

type RepeaterContract = {
  startIndex: 0 | 1;
  items: RepeaterItemSpec[];
};

const repeaters: Record<string, RepeaterContract> = {
  "home-committee": {
    startIndex: 1,
    items: [text("name", "h3"), text("role"), image("portrait")],
  },
  "home-philosophies": {
    startIndex: 1,
    items: [text("number"), text("name", "h3"), text("body")],
  },
  "home-partners": {
    startIndex: 1,
    items: [text("name", "h3"), image("logo")],
  },
  "about-dna": {
    startIndex: 1,
    items: [text("number"), text("name", "h3")],
  },
  "about-vision": {
    startIndex: 1,
    items: [text("number"), text("name", "h3"), text("body")],
  },
  "about-values": {
    startIndex: 1,
    items: [text("number"), text("name", "h3"), text("body")],
  },
  "family-timeline": {
    startIndex: 1,
    items: [text("year"), text("name", "h3"), text("body")],
  },
  "founder-companies": {
    startIndex: 1,
    items: [text("number"), text("name", "h3"), text("body")],
  },
  "committee-members": {
    startIndex: 0,
    items: [
      text("role"),
      text("name", "h2"),
      text("bodyPrimary"),
      text("bodySecondary"),
      text("initials"),
    ],
  },
  "portfolio-infrastructure": {
    startIndex: 1,
    items: [text("name", "h3"), text("sector"), image("logo")],
  },
  "portfolio-partners": {
    startIndex: 1,
    items: [text("name", "h3"), image("logo")],
  },
  "strategy-pillars": {
    startIndex: 1,
    items: [text("number"), text("name", "h3"), text("body")],
  },
};

function text(key: string, format: CmsTextFormat = "p"): RepeaterItemSpec {
  return { key, type: "text", format };
}

function image(key: string): RepeaterItemSpec {
  return { key, type: "image" };
}

export function isProtectedOthaimPageSlug(slug: string | undefined): boolean {
  return Boolean(slug && Object.hasOwn(OTHAIM_PAGE_SECTION_SLUGS, slug));
}

export function isProtectedOthaimSection(slug: string | undefined, pageSlug?: string): boolean {
  if (!slug) return false;
  return pageSlug ? isOthaimSectionForPage(pageSlug, slug) : isOthaimSectionSlug(slug);
}

export function canAddOthaimRepeaterBlock(slug: string | undefined): boolean {
  return Boolean(slug && repeaters[slug]);
}

export function getOthaimRepeaterStartIndex(slug: string | undefined): number | null {
  return slug && repeaters[slug] ? repeaters[slug].startIndex : null;
}

export function canRemoveOthaimBlock(
  slug: string | undefined,
  blockIndex: number,
  blockCount: number
): boolean {
  const startIndex = getOthaimRepeaterStartIndex(slug);
  if (startIndex === null || blockIndex < startIndex) return false;
  return blockCount - startIndex > 1;
}

export function canMoveOthaimBlock(
  slug: string | undefined,
  blockIndex: number,
  blockCount: number,
  direction: -1 | 1
): boolean {
  const startIndex = getOthaimRepeaterStartIndex(slug);
  if (startIndex === null || blockIndex < startIndex) return false;
  const destination = blockIndex + direction;
  return destination >= startIndex && destination < blockCount;
}

export function createOthaimRepeaterBlock(slug: string | undefined): CmsSectionBlock | null {
  const contract = slug ? repeaters[slug] : undefined;
  if (!contract) return null;
  return {
    items: contract.items.map(createItem),
  };
}

function createItem(spec: RepeaterItemSpec): CmsSectionItem {
  if (spec.type === "image") {
    return {
      key: spec.key,
      type: "image",
      image: { desktopAssetId: "", altAr: "", altEn: "" },
    };
  }
  return {
    key: spec.key,
    type: "text",
    text: {
      format: spec.format ?? "p",
      textAr: "",
      textEn: "",
    },
  };
}
