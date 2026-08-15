import type { AppLocale } from "@/i18n/config";
import type {
  CmsSectionBlock,
  CmsSectionContent,
  CmsSectionItem,
} from "@/features/cms/content-contract";
import type { PublicCmsPage } from "@/features/public/cms/types";

type ItemOfType<Type extends CmsSectionItem["type"]> = Extract<CmsSectionItem, { type: Type }>;

export function getItem<Type extends CmsSectionItem["type"]>(
  block: CmsSectionBlock | undefined,
  key: string,
  type: Type
): ItemOfType<Type> | undefined {
  return block?.items.find(
    (item): item is ItemOfType<Type> => item.key === key && item.type === type
  );
}

export function getText(block: CmsSectionBlock | undefined, key: string, locale: AppLocale) {
  const item = getItem(block, key, "text");
  if (!item) return undefined;
  return locale === "ar" ? item.text.textAr : item.text.textEn;
}

export function getImage(block: CmsSectionBlock | undefined, key: string) {
  return getItem(block, key, "image");
}

export function getVideo(block: CmsSectionBlock | undefined, key: string) {
  return getItem(block, key, "video");
}

export function getLink(block: CmsSectionBlock | undefined, key: string) {
  return getItem(block, key, "link");
}

export function getBlocks(content: CmsSectionContent) {
  const [intro, ...repeated] = content.blocks;
  return { intro, repeated };
}

export function getHomeFooterStatement(page: PublicCmsPage, locale: AppLocale) {
  const section = page.sections.find((entry) => entry.slug === "home-contact");
  return section ? getText(section.content.blocks[0], "footerStatement", locale) : undefined;
}
