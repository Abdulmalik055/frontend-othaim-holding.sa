"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminInput } from "@/components/ui/admin/AdminInput";
import { AdminSelect, type SelectOption } from "@/components/ui/admin/AdminSelect";
import { AdminTextArea } from "@/components/ui/admin/AdminTextArea";
import {
  FileIcon,
  ExternalLinkIcon,
  ImageIcon,
  LayersIcon,
  MonitorIcon,
  PlusIcon,
  SmartphoneIcon,
  TextIcon,
  TrashIcon,
  VideoIcon,
} from "@/components/ui/shared/Icons";
import type { AutoConvertInvalidReason } from "@/lib/input-auto-convert";
import {
  CMS_SECTION_ITEM_TYPES,
  CMS_TEXT_FORMATS,
  normalizeCmsSectionContent,
  type CmsAssetsById,
  type CmsMediaAsset,
  type CmsSectionBlock,
  type CmsSectionContent,
  type CmsSectionItem,
  type CmsSectionItemType,
  type CmsTextFormat,
} from "@/features/admin/cms/schemas/cms-section.schema";
import {
  useAdminMediaAssets,
  useAdminMediaDelete,
  useAdminMediaUpload,
} from "@/features/admin/cms/hooks/useCmsSectionMutate";
import { useCmsLinkPages } from "@/features/admin/cms/hooks/useCmsPages";
import { CmsButtonItemFields } from "@/features/admin/cms/components/CmsButtonItemFields";
import {
  canDeleteCmsMediaAsset,
  resolveCmsMediaAsset,
} from "@/features/admin/cms/media-asset-deletion";
import { areCmsInternalHrefsAvailable } from "@/lib/cms-link";
import {
  canAddOthaimRepeaterBlock,
  canMoveOthaimBlock,
  canRemoveOthaimBlock,
  createOthaimRepeaterBlock,
  isProtectedOthaimSection,
} from "@/features/admin/cms/othaim-editor-contract";

type AutoConvertMessages = Partial<Record<AutoConvertInvalidReason, string>>;

type Props = {
  pageId: string;
  sectionId?: string;
  sectionSlug?: string;
  uploadToken: string;
  content: CmsSectionContent;
  assetsById: CmsAssetsById;
  onAssetUploaded: (asset: CmsMediaAsset) => void;
  onChange: (content: CmsSectionContent) => void;
  autoConvertMessages: AutoConvertMessages;
  canDeleteAssets: boolean;
  onValidityChange?: (isValid: boolean) => void;
  onUploadingChange?: (isUploading: boolean) => void;
};

type TextItem = Extract<CmsSectionItem, { type: "text" }>;
type ImageItem = Extract<CmsSectionItem, { type: "image" }>;
type VideoItem = Extract<CmsSectionItem, { type: "video" }>;
type FileItem = Extract<CmsSectionItem, { type: "file" }>;
type LinkItem = Extract<CmsSectionItem, { type: "link" }>;
type AssetKind = "image" | "video" | "file";
type AssetDevice = "desktop" | "mobile";

const labelClass =
  "block text-[10px] font-semibold text-gray-400 uppercase tracking-[0.5px] mb-[6px]";
const blockPanelClass = "rounded-[8px] border border-gray-200 bg-white overflow-hidden";
const blockHeaderClass =
  "flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200";
const blockBodyClass = "p-4 flex flex-col gap-4";
const itemPanelClass = "bg-white p-4 border-s-4";
const mediaPanelClass = "rounded-[8px] bg-gray-50 p-3";
const inputClass = "h-[40px] rounded-[8px] px-3 text-[13px] text-gray-800 focus:shadow-none";
const textareaClass =
  "!min-h-[84px] h-[84px] border-gray-200 rounded-[8px] px-3 py-2 text-[13px] text-gray-800 leading-normal focus:shadow-none resize-none";
const addBlockButtonClass =
  "h-[36px] px-4 rounded-[8px] text-[12px] font-semibold bg-admin-primary text-white hover:bg-admin-primary-dark transition-colors cursor-pointer border-0 inline-flex items-center gap-1.5 shadow-[0_4px_12px_rgba(52,89,165,0.2)]";
const ghostButtonClass =
  "h-[32px] px-3 rounded-[8px] text-[12px] border border-admin-primary-bg text-admin-primary hover:bg-admin-primary-bg transition-colors cursor-pointer bg-white inline-flex items-center gap-1.5";
const dangerIconButtonClass =
  "w-[32px] h-[32px] rounded-[8px] border border-transparent text-gray-400 hover:text-danger-red hover:bg-danger-bg transition-colors cursor-pointer bg-transparent inline-flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed";

function createDefaultTextItem(): TextItem {
  return {
    key: "text",
    type: "text",
    text: {
      format: "p",
      textAr: "",
      textEn: "",
    },
  };
}

function createDefaultImageItem(): ImageItem {
  return {
    key: "",
    type: "image",
    image: {
      desktopAssetId: "",
      altAr: "",
      altEn: "",
    },
  };
}

function createDefaultVideoItem(): VideoItem {
  return {
    key: "",
    type: "video",
    video: {
      desktopAssetId: "",
    },
  };
}

function createDefaultFileItem(): FileItem {
  return {
    key: "",
    type: "file",
    file: {
      assetId: "",
      titleAr: "",
      titleEn: "",
    },
  };
}

function createDefaultLinkItem(): LinkItem {
  return {
    key: "link",
    type: "link",
    link: {
      labelAr: "",
      labelEn: "",
      href: "",
      style: "primary",
    },
  };
}

function createDefaultItem(type: CmsSectionItemType = "text"): CmsSectionItem {
  if (type === "image") return createDefaultImageItem();
  if (type === "video") return createDefaultVideoItem();
  if (type === "file") return createDefaultFileItem();
  if (type === "link") return createDefaultLinkItem();
  return createDefaultTextItem();
}

function createDefaultBlock(): CmsSectionBlock {
  return {
    items: [createDefaultTextItem()],
  };
}

export function getDefaultCmsSectionContent(): CmsSectionContent {
  const item = {
    ...createDefaultTextItem(),
    key: "body",
  };
  return {
    blocks: [{ items: [item] }],
  };
}

export function getInitialCmsSectionContent(content?: CmsSectionContent | null): CmsSectionContent {
  if (!content) return getDefaultCmsSectionContent();
  return normalizeCmsSectionContent(content);
}

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function assetDisplayName(asset: CmsMediaAsset) {
  return asset.filename || asset.url || asset.id;
}

function itemTypeLabel(translations: ReturnType<typeof useTranslations>, type: CmsSectionItemType) {
  if (type === "image") return translations("itemTypeImage");
  if (type === "video") return translations("itemTypeVideo");
  if (type === "file") return translations("itemTypeFile");
  if (type === "link") return translations("itemTypeLink");
  return translations("itemTypeText");
}

function formatLabel(translations: ReturnType<typeof useTranslations>, format: CmsTextFormat) {
  if (format === "h1") return translations("formatH1");
  if (format === "h2") return translations("formatH2");
  if (format === "h3") return translations("formatH3");
  return translations("formatP");
}

function itemTypeStyles(type: CmsSectionItemType) {
  if (type === "image") {
    return {
      edge: "border-s-emerald-500",
      icon: "bg-emerald-50 text-emerald-700 border-emerald-100",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      activeButton:
        "border-emerald-300 bg-emerald-50 text-emerald-800 shadow-[0_0_0_2px_rgba(16,185,129,0.12)]",
      idleButton:
        "border-gray-200 bg-white text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50",
    };
  }

  if (type === "video") {
    return {
      edge: "border-s-violet-500",
      icon: "bg-violet-50 text-violet-700 border-violet-100",
      badge: "bg-violet-50 text-violet-700 border-violet-200",
      activeButton:
        "border-violet-300 bg-violet-50 text-violet-800 shadow-[0_0_0_2px_rgba(139,92,246,0.12)]",
      idleButton:
        "border-gray-200 bg-white text-gray-500 hover:border-violet-200 hover:bg-violet-50/50",
    };
  }

  if (type === "file" || type === "link") {
    return {
      edge: "border-s-amber-500",
      icon: "bg-amber-50 text-amber-700 border-amber-100",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      activeButton:
        "border-amber-300 bg-amber-50 text-amber-800 shadow-[0_0_0_2px_rgba(245,158,11,0.12)]",
      idleButton:
        "border-gray-200 bg-white text-gray-500 hover:border-amber-200 hover:bg-amber-50/50",
    };
  }

  return {
    edge: "border-s-admin-primary",
    icon: "bg-admin-primary-bg text-admin-primary border-admin-primary-bg",
    badge: "bg-admin-primary-bg text-admin-primary border-admin-primary-bg",
    activeButton:
      "border-admin-primary bg-admin-primary-bg text-admin-primary shadow-[0_0_0_2px_rgba(52,89,165,0.12)]",
    idleButton:
      "border-gray-200 bg-white text-gray-500 hover:border-admin-primary-bg hover:bg-admin-primary-bg/60",
  };
}

function ItemTypeIcon({ type, className }: { type: CmsSectionItemType; className?: string }) {
  if (type === "text") return <TextIcon size={17} className={className} />;
  if (type === "image") return <ImageIcon size={17} className={className} />;
  if (type === "video") return <VideoIcon size={17} className={className} />;
  if (type === "link") return <ExternalLinkIcon size={17} className={className} />;
  return <FileIcon size={17} className={className} />;
}

export function CmsSectionContentEditor({
  pageId,
  sectionId,
  sectionSlug,
  uploadToken,
  content,
  assetsById,
  onAssetUploaded,
  onChange,
  autoConvertMessages,
  canDeleteAssets,
  onValidityChange,
  onUploadingChange,
}: Props) {
  const sectionDialogTranslations = useTranslations("admin.cmsPage.sectionDialog");
  const structureProtected = isProtectedOthaimSection(sectionSlug);
  const hasRepeater = canAddOthaimRepeaterBlock(sectionSlug);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isAddItemMenuOpen, setIsAddItemMenuOpen] = useState(false);
  const activeUploads = useRef(new Set<symbol>());
  const isEditorMounted = useRef(true);
  const hasButtonItems = content.blocks.some((block) =>
    block.items.some((item) => item.type === "link")
  );
  const linkPages = useCmsLinkPages({ enabled: hasButtonItems });
  const linkHrefs = content.blocks.flatMap((block) =>
    block.items.flatMap((item) => (item.type === "link" ? [item.link.href] : []))
  );
  const areInternalLinksValid =
    !hasButtonItems ||
    !linkPages.isSuccess ||
    areCmsInternalHrefsAvailable(linkHrefs, linkPages.data, pageId);
  const textFormatOptions: SelectOption[] = CMS_TEXT_FORMATS.map((format) => ({
    value: format,
    label: formatLabel(sectionDialogTranslations, format),
  }));

  const activeBlockIndex = Math.max(0, Math.min(selectedBlockIndex, content.blocks.length - 1));
  const activeBlock = content.blocks[activeBlockIndex] ?? createDefaultBlock();
  const activeItemIndex = Math.max(0, Math.min(selectedItemIndex, activeBlock.items.length - 1));
  const activeItem = activeBlock.items[activeItemIndex] ?? createDefaultTextItem();

  useEffect(() => {
    onValidityChange?.(areInternalLinksValid);
  }, [areInternalLinksValid, onValidityChange]);

  useEffect(() => {
    isEditorMounted.current = true;
    return () => {
      isEditorMounted.current = false;
    };
  }, []);

  const handleAssetUploadingChange = useCallback(
    (uploadId: symbol, isUploading: boolean) => {
      if (!isEditorMounted.current) return;
      const wasUploading = activeUploads.current.size > 0;
      if (isUploading) activeUploads.current.add(uploadId);
      else activeUploads.current.delete(uploadId);
      const isAnyUploading = activeUploads.current.size > 0;
      if (wasUploading !== isAnyUploading) onUploadingChange?.(isAnyUploading);
    },
    [onUploadingChange]
  );

  function updateContent(nextContent: CmsSectionContent) {
    onChange(nextContent);
  }

  function updateBlock(blockIndex: number, nextBlock: CmsSectionBlock) {
    updateContent({
      ...content,
      blocks: content.blocks.map((block, index) => (index === blockIndex ? nextBlock : block)),
    });
  }

  function addBlock() {
    const nextBlock = structureProtected
      ? createOthaimRepeaterBlock(sectionSlug)
      : createDefaultBlock();
    if (!nextBlock) return;
    updateContent({ ...content, blocks: [...content.blocks, nextBlock] });
    setSelectedBlockIndex(content.blocks.length);
    setSelectedItemIndex(0);
    setIsAddItemMenuOpen(false);
  }

  function removeBlock(blockIndex: number) {
    if (
      structureProtected
        ? !canRemoveOthaimBlock(sectionSlug, blockIndex, content.blocks.length)
        : content.blocks.length <= 1
    )
      return;
    const nextBlocks = content.blocks.filter((_, index) => index !== blockIndex);

    updateContent({
      ...content,
      blocks: nextBlocks,
    });
    setSelectedBlockIndex(Math.max(0, Math.min(blockIndex, nextBlocks.length - 1)));
    setSelectedItemIndex(0);
    setIsAddItemMenuOpen(false);
  }

  function moveBlock(blockIndex: number, direction: -1 | 1) {
    if (!canMoveOthaimBlock(sectionSlug, blockIndex, content.blocks.length, direction)) return;
    const destination = blockIndex + direction;
    const nextBlocks = [...content.blocks];
    [nextBlocks[blockIndex], nextBlocks[destination]] = [
      nextBlocks[destination],
      nextBlocks[blockIndex],
    ];
    updateContent({ ...content, blocks: nextBlocks });
    setSelectedBlockIndex(destination);
  }

  function updateItem(blockIndex: number, itemIndex: number, nextItem: CmsSectionItem) {
    const block = content.blocks[blockIndex];
    if (!block) return;

    updateBlock(blockIndex, {
      ...block,
      items: block.items.map((item, index) => (index === itemIndex ? nextItem : item)),
    });
  }

  function addItem(blockIndex: number, type: CmsSectionItemType = "text") {
    const block = content.blocks[blockIndex];
    if (!block) return;
    const nextItem = createDefaultItem(type);

    updateBlock(blockIndex, {
      ...block,
      items: [...block.items, nextItem],
    });
    setSelectedBlockIndex(blockIndex);
    setSelectedItemIndex(block.items.length);
    setIsAddItemMenuOpen(false);
  }

  function removeItem(blockIndex: number, itemIndex: number) {
    const block = content.blocks[blockIndex];
    if (!block || block.items.length <= 1) return;
    const nextItems = block.items.filter((_, index) => index !== itemIndex);

    updateBlock(blockIndex, {
      ...block,
      items: nextItems,
    });
    setSelectedBlockIndex(blockIndex);
    setSelectedItemIndex(Math.max(0, Math.min(itemIndex, nextItems.length - 1)));
    setIsAddItemMenuOpen(false);
  }

  function updateItemType(blockIndex: number, itemIndex: number, type: string) {
    if (!CMS_SECTION_ITEM_TYPES.includes(type as CmsSectionItemType)) return;
    updateItem(blockIndex, itemIndex, createDefaultItem(type as CmsSectionItemType));
  }

  function updateActiveItemKey(value: string) {
    updateItem(activeBlockIndex, activeItemIndex, { ...activeItem, key: value } as CmsSectionItem);
  }

  function updateTextItem(
    blockIndex: number,
    itemIndex: number,
    item: TextItem,
    key: keyof TextItem["text"],
    value: string
  ) {
    updateItem(blockIndex, itemIndex, {
      ...item,
      text: {
        ...item.text,
        [key]: value,
      },
    });
  }

  function updateImageField(
    blockIndex: number,
    itemIndex: number,
    item: ImageItem,
    key: keyof ImageItem["image"],
    value: string | number | boolean | undefined
  ) {
    updateItem(blockIndex, itemIndex, {
      ...item,
      image: {
        ...item.image,
        [key]: value,
      },
    });
  }

  function addImageMobile(blockIndex: number, itemIndex: number, item: ImageItem) {
    updateItem(blockIndex, itemIndex, {
      ...item,
      image: {
        ...item.image,
        mobileAssetId: "",
      },
    });
  }

  function removeImageMobile(blockIndex: number, itemIndex: number, item: ImageItem) {
    const image = { ...item.image };
    delete image.mobileAssetId;
    updateItem(blockIndex, itemIndex, { ...item, image });
  }

  function updateVideoField(
    blockIndex: number,
    itemIndex: number,
    item: VideoItem,
    key: keyof VideoItem["video"],
    value: string
  ) {
    updateItem(blockIndex, itemIndex, {
      ...item,
      video: {
        ...item.video,
        [key]: value,
      },
    });
  }

  function addVideoMobileAssets(blockIndex: number, itemIndex: number, item: VideoItem) {
    updateItem(blockIndex, itemIndex, {
      ...item,
      video: {
        ...item.video,
        mobileAssetId: "",
        posterMobileAssetId: "",
      },
    });
  }

  function removeVideoMobileAssets(blockIndex: number, itemIndex: number, item: VideoItem) {
    const video = { ...item.video };
    delete video.mobileAssetId;
    delete video.posterMobileAssetId;
    updateItem(blockIndex, itemIndex, { ...item, video });
  }

  function updateFileField(
    blockIndex: number,
    itemIndex: number,
    item: FileItem,
    key: keyof FileItem["file"],
    value: string
  ) {
    updateItem(blockIndex, itemIndex, {
      ...item,
      file: {
        ...item.file,
        [key]: value,
      },
    });
  }

  const activeItemStyles = itemTypeStyles(activeItem.type);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 items-start">
        <aside className="rounded-[8px] border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-[13px] font-semibold text-gray-800">
              {sectionDialogTranslations("contentStructure")}
            </h4>
            {(!structureProtected || hasRepeater) && (
              <button type="button" onClick={addBlock} className={addBlockButtonClass}>
                <PlusIcon />
                <LayersIcon />
                {sectionDialogTranslations("addBlockShort")}
              </button>
            )}
          </div>
          <div className="p-3 flex flex-col gap-2">
            {content.blocks.map((block, blockIndex) => {
              const selected = blockIndex === activeBlockIndex;

              return (
                <div
                  key={blockIndex}
                  className={[
                    "rounded-[8px] border bg-white transition-colors",
                    selected
                      ? "border-admin-primary bg-admin-primary-bg/40"
                      : "border-gray-200 hover:border-admin-primary-bg",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBlockIndex(blockIndex);
                        setSelectedItemIndex(0);
                        setIsAddItemMenuOpen(false);
                      }}
                      className="flex-1 min-w-0 text-start border-0 bg-transparent cursor-pointer p-0"
                    >
                      <span className="block text-[12px] font-semibold text-gray-800">
                        {sectionDialogTranslations("block")} {blockIndex + 1}
                      </span>
                    </button>
                    {structureProtected && hasRepeater && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveBlock(blockIndex, -1)}
                          disabled={
                            !canMoveOthaimBlock(sectionSlug, blockIndex, content.blocks.length, -1)
                          }
                          className={dangerIconButtonClass}
                          aria-label={sectionDialogTranslations("moveBlockUp")}
                        >
                          <span aria-hidden>↑</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBlock(blockIndex, 1)}
                          disabled={
                            !canMoveOthaimBlock(sectionSlug, blockIndex, content.blocks.length, 1)
                          }
                          className={dangerIconButtonClass}
                          aria-label={sectionDialogTranslations("moveBlockDown")}
                        >
                          <span aria-hidden>↓</span>
                        </button>
                      </>
                    )}
                    {(!structureProtected || hasRepeater) && (
                      <button
                        type="button"
                        onClick={() => removeBlock(blockIndex)}
                        disabled={
                          structureProtected
                            ? !canRemoveOthaimBlock(sectionSlug, blockIndex, content.blocks.length)
                            : content.blocks.length <= 1
                        }
                        className={dangerIconButtonClass}
                        aria-label={sectionDialogTranslations("removeBlock")}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  {selected ? (
                    <div className="px-2 pb-2 flex max-h-[260px] flex-col gap-1.5 overflow-y-auto">
                      {block.items.map((item, itemIndex) => {
                        const styles = itemTypeStyles(item.type);
                        const selectedItem = itemIndex === activeItemIndex;

                        return (
                          <button
                            key={itemIndex}
                            type="button"
                            onClick={() => {
                              setSelectedBlockIndex(blockIndex);
                              setSelectedItemIndex(itemIndex);
                              setIsAddItemMenuOpen(false);
                            }}
                            className={[
                              "w-full min-h-[40px] rounded-[8px] border px-2.5 py-2 text-start transition-colors cursor-pointer inline-flex items-center justify-between gap-2",
                              selectedItem ? styles.activeButton : styles.idleButton,
                            ].join(" ")}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <ItemTypeIcon type={item.type} className="flex-shrink-0" />
                              <span className="min-w-0">
                                <span className="block truncate text-[12px] font-semibold">
                                  {sectionDialogTranslations("item")} {itemIndex + 1}
                                </span>
                                <span className="block truncate text-[10px] font-semibold opacity-60">
                                  {itemTypeLabel(sectionDialogTranslations, item.type)}
                                </span>
                              </span>
                            </span>
                            <span className="h-[24px] px-2 rounded-full border border-current/20 text-[10px] font-semibold inline-flex items-center justify-center flex-shrink-0">
                              {sectionDialogTranslations("editAction")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-2 pb-2">
                      <span className="h-[24px] px-2 rounded-full border border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-500 inline-flex items-center gap-1">
                        {block.items.length} {sectionDialogTranslations("item")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <section className={blockPanelClass}>
          <div className={blockHeaderClass}>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-800">
                {sectionDialogTranslations("editBlock")} {activeBlockIndex + 1}
              </p>
            </div>
            {(!structureProtected || hasRepeater) && (
              <button
                type="button"
                onClick={() => removeBlock(activeBlockIndex)}
                disabled={
                  structureProtected
                    ? !canRemoveOthaimBlock(sectionSlug, activeBlockIndex, content.blocks.length)
                    : content.blocks.length <= 1
                }
                className={dangerIconButtonClass}
                aria-label={sectionDialogTranslations("removeBlock")}
              >
                <TrashIcon />
              </button>
            )}
          </div>

          <div className={blockBodyClass}>
            <div className="rounded-[8px] border border-admin-primary-bg bg-admin-primary-bg/30 px-3 py-2.5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h5 className="text-[12px] font-semibold text-gray-800">
                    {sectionDialogTranslations("items")}
                  </h5>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {activeBlock.items.length} {sectionDialogTranslations("item")}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  {structureProtected ? (
                    <p className="text-[11px] font-semibold text-gray-500">
                      {sectionDialogTranslations("protectedStructureNotice")}
                    </p>
                  ) : !isAddItemMenuOpen ? (
                    <button
                      type="button"
                      onClick={() => setIsAddItemMenuOpen(true)}
                      className={ghostButtonClass}
                    >
                      <PlusIcon />
                      {sectionDialogTranslations("addItem")}
                    </button>
                  ) : (
                    <div className="rounded-[8px] border border-gray-200 bg-white p-2 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="text-[11px] font-semibold text-gray-400">
                          {sectionDialogTranslations("itemType")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddItemMenuOpen(false)}
                          className="border-0 bg-transparent p-0 text-[11px] font-semibold text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          {sectionDialogTranslations("cancel")}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CMS_SECTION_ITEM_TYPES.map((type) => {
                          const styles = itemTypeStyles(type);

                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => addItem(activeBlockIndex, type)}
                              className={[
                                "h-[34px] rounded-[8px] border px-3 text-[12px] font-semibold transition-colors cursor-pointer bg-white inline-flex items-center justify-center gap-1.5",
                                styles.idleButton,
                              ].join(" ")}
                            >
                              <ItemTypeIcon type={type} />
                              {itemTypeLabel(sectionDialogTranslations, type)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={[
                itemPanelClass,
                activeItemStyles.edge,
                "rounded-[8px] border border-gray-200",
              ].join(" ")}
            >
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={[
                        "w-8 h-8 rounded-[8px] border flex items-center justify-center flex-shrink-0",
                        activeItemStyles.icon,
                      ].join(" ")}
                    >
                      <ItemTypeIcon type={activeItem.type} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-gray-800">
                          {sectionDialogTranslations("editItem")} {activeItemIndex + 1}
                        </p>
                        <span
                          className={[
                            "h-[22px] px-2 rounded-full border text-[11px] font-semibold inline-flex items-center gap-1.5",
                            activeItemStyles.badge,
                          ].join(" ")}
                        >
                          <ItemTypeIcon type={activeItem.type} />
                          {itemTypeLabel(sectionDialogTranslations, activeItem.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!structureProtected && (
                    <button
                      type="button"
                      onClick={() => removeItem(activeBlockIndex, activeItemIndex)}
                      disabled={activeBlock.items.length <= 1}
                      className={dangerIconButtonClass}
                      aria-label={sectionDialogTranslations("removeItem")}
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>

                <div>
                  <label className={labelClass}>{sectionDialogTranslations("itemType")}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {CMS_SECTION_ITEM_TYPES.map((type) => {
                      const styles = itemTypeStyles(type);
                      const selected = activeItem.type === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={structureProtected}
                          onClick={() => updateItemType(activeBlockIndex, activeItemIndex, type)}
                          className={[
                            "h-[36px] rounded-[8px] border px-3 text-[12px] font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-2",
                            selected ? styles.activeButton : styles.idleButton,
                          ].join(" ")}
                        >
                          <ItemTypeIcon type={type} />
                          {itemTypeLabel(sectionDialogTranslations, type)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>{sectionDialogTranslations("itemKey")}</label>
                  <AdminInput
                    dir="ltr"
                    variant="filter"
                    autoConvertMode="none"
                    className={inputClass}
                    value={activeItem.key}
                    disabled={structureProtected}
                    onChange={(event) => updateActiveItemKey(event.target.value)}
                    placeholder={sectionDialogTranslations("itemKeyPlaceholder")}
                  />
                </div>
              </div>

              {activeItem.type === "text" && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="w-full md:w-[180px]">
                    <label className={labelClass}>{sectionDialogTranslations("textFormat")}</label>
                    <AdminSelect
                      variant="filter"
                      options={textFormatOptions}
                      value={
                        textFormatOptions.find(
                          (option) => option.value === activeItem.text.format
                        ) ?? null
                      }
                      onChange={(option) =>
                        updateTextItem(
                          activeBlockIndex,
                          activeItemIndex,
                          activeItem,
                          "format",
                          ((option as SelectOption | null)?.value ?? "p") as CmsTextFormat
                        )
                      }
                      isSearchable={false}
                      isClearable={false}
                      placeholder=""
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{sectionDialogTranslations("textAr")}</label>
                    <AdminTextArea
                      dir="rtl"
                      rows={2}
                      className={textareaClass}
                      textLanguage="arabic"
                      autoConvertMessages={autoConvertMessages}
                      value={activeItem.text.textAr}
                      onChange={(event) =>
                        updateTextItem(
                          activeBlockIndex,
                          activeItemIndex,
                          activeItem,
                          "textAr",
                          event.target.value
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{sectionDialogTranslations("textEn")}</label>
                    <AdminTextArea
                      dir="ltr"
                      rows={2}
                      className={textareaClass}
                      textLanguage="english"
                      autoConvertMessages={autoConvertMessages}
                      value={activeItem.text.textEn}
                      onChange={(event) =>
                        updateTextItem(
                          activeBlockIndex,
                          activeItemIndex,
                          activeItem,
                          "textEn",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {activeItem.type === "image" && (
                <div className="flex flex-col gap-3">
                  <AssetUploadField
                    pageId={pageId}
                    sectionId={sectionId}
                    uploadToken={uploadToken}
                    onUploadingChange={handleAssetUploadingChange}
                    label={sectionDialogTranslations("desktopImage")}
                    device="desktop"
                    kind="image"
                    accept="image/*"
                    assetId={activeItem.image.desktopAssetId}
                    assetsById={assetsById}
                    canDeleteAsset={canDeleteAssets}
                    required
                    onAssetChange={(assetId) =>
                      updateImageField(
                        activeBlockIndex,
                        activeItemIndex,
                        activeItem,
                        "desktopAssetId",
                        assetId
                      )
                    }
                    onAssetUploaded={onAssetUploaded}
                  />

                  {activeItem.image.mobileAssetId !== undefined ? (
                    <AssetUploadField
                      pageId={pageId}
                      sectionId={sectionId}
                      uploadToken={uploadToken}
                      onUploadingChange={handleAssetUploadingChange}
                      label={sectionDialogTranslations("mobileImage")}
                      device="mobile"
                      kind="image"
                      accept="image/*"
                      assetId={activeItem.image.mobileAssetId ?? ""}
                      assetsById={assetsById}
                      canDeleteAsset={canDeleteAssets}
                      onAssetChange={(assetId) =>
                        updateImageField(
                          activeBlockIndex,
                          activeItemIndex,
                          activeItem,
                          "mobileAssetId",
                          assetId
                        )
                      }
                      onAssetUploaded={onAssetUploaded}
                      onRemove={() =>
                        removeImageMobile(activeBlockIndex, activeItemIndex, activeItem)
                      }
                      removeLabel={sectionDialogTranslations("removeMobileImage")}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => addImageMobile(activeBlockIndex, activeItemIndex, activeItem)}
                      className={ghostButtonClass}
                    >
                      <PlusIcon />
                      {sectionDialogTranslations("addMobileImage")}
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>{sectionDialogTranslations("altAr")}</label>
                      <AdminInput
                        dir="rtl"
                        variant="filter"
                        className={inputClass}
                        textLanguage="arabic"
                        autoConvertMessages={autoConvertMessages}
                        value={activeItem.image.altAr ?? ""}
                        onChange={(event) =>
                          updateImageField(
                            activeBlockIndex,
                            activeItemIndex,
                            activeItem,
                            "altAr",
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{sectionDialogTranslations("altEn")}</label>
                      <AdminInput
                        dir="ltr"
                        variant="filter"
                        className={inputClass}
                        textLanguage="english"
                        autoConvertMessages={autoConvertMessages}
                        value={activeItem.image.altEn ?? ""}
                        onChange={(event) =>
                          updateImageField(
                            activeBlockIndex,
                            activeItemIndex,
                            activeItem,
                            "altEn",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={activeItem.image.decorative ?? false}
                      onChange={(event) =>
                        updateImageField(
                          activeBlockIndex,
                          activeItemIndex,
                          activeItem,
                          "decorative",
                          event.target.checked
                        )
                      }
                    />
                    {sectionDialogTranslations("decorativeImage")}
                  </label>
                </div>
              )}

              {activeItem.type === "video" && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
                    <AssetUploadField
                      pageId={pageId}
                      sectionId={sectionId}
                      uploadToken={uploadToken}
                      onUploadingChange={handleAssetUploadingChange}
                      label={sectionDialogTranslations("desktopVideo")}
                      device="desktop"
                      kind="video"
                      accept="video/*"
                      assetId={activeItem.video.desktopAssetId}
                      assetsById={assetsById}
                      canDeleteAsset={canDeleteAssets}
                      required
                      onAssetChange={(assetId) =>
                        updateVideoField(
                          activeBlockIndex,
                          activeItemIndex,
                          activeItem,
                          "desktopAssetId",
                          assetId
                        )
                      }
                      onAssetUploaded={onAssetUploaded}
                    />
                    <AssetUploadField
                      pageId={pageId}
                      sectionId={sectionId}
                      uploadToken={uploadToken}
                      onUploadingChange={handleAssetUploadingChange}
                      label={sectionDialogTranslations("posterDesktopMedia")}
                      device="desktop"
                      kind="image"
                      accept="image/*"
                      assetId={activeItem.video.posterDesktopAssetId ?? ""}
                      assetsById={assetsById}
                      canDeleteAsset={canDeleteAssets}
                      onAssetChange={(assetId) =>
                        updateVideoField(
                          activeBlockIndex,
                          activeItemIndex,
                          activeItem,
                          "posterDesktopAssetId",
                          assetId
                        )
                      }
                      onAssetUploaded={onAssetUploaded}
                    />
                  </div>

                  {activeItem.video.mobileAssetId !== undefined ||
                  activeItem.video.posterMobileAssetId !== undefined ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3 px-1">
                        <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500">
                          <SmartphoneIcon size={14} className="text-gray-400" />
                          <span>{sectionDialogTranslations("mobileVideoOption")}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            removeVideoMobileAssets(activeBlockIndex, activeItemIndex, activeItem)
                          }
                          className={dangerIconButtonClass}
                          aria-label={sectionDialogTranslations("removeMobileVideoAssets")}
                          title={sectionDialogTranslations("removeMobileVideoAssets")}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
                        <AssetUploadField
                          pageId={pageId}
                          sectionId={sectionId}
                          uploadToken={uploadToken}
                          onUploadingChange={handleAssetUploadingChange}
                          label={sectionDialogTranslations("mobileVideo")}
                          device="mobile"
                          kind="video"
                          accept="video/*"
                          assetId={activeItem.video.mobileAssetId ?? ""}
                          assetsById={assetsById}
                          canDeleteAsset={canDeleteAssets}
                          onAssetChange={(assetId) =>
                            updateVideoField(
                              activeBlockIndex,
                              activeItemIndex,
                              activeItem,
                              "mobileAssetId",
                              assetId
                            )
                          }
                          onAssetUploaded={onAssetUploaded}
                        />
                        <AssetUploadField
                          pageId={pageId}
                          sectionId={sectionId}
                          uploadToken={uploadToken}
                          onUploadingChange={handleAssetUploadingChange}
                          label={sectionDialogTranslations("posterMobileMedia")}
                          device="mobile"
                          kind="image"
                          accept="image/*"
                          assetId={activeItem.video.posterMobileAssetId ?? ""}
                          assetsById={assetsById}
                          canDeleteAsset={canDeleteAssets}
                          onAssetChange={(assetId) =>
                            updateVideoField(
                              activeBlockIndex,
                              activeItemIndex,
                              activeItem,
                              "posterMobileAssetId",
                              assetId
                            )
                          }
                          onAssetUploaded={onAssetUploaded}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        addVideoMobileAssets(activeBlockIndex, activeItemIndex, activeItem)
                      }
                      className={ghostButtonClass}
                    >
                      <PlusIcon />
                      {sectionDialogTranslations("addMobileVideo")}
                    </button>
                  )}
                </div>
              )}

              {activeItem.type === "file" && (
                <div className="grid grid-cols-1 gap-3">
                  <AssetUploadField
                    pageId={pageId}
                    sectionId={sectionId}
                    uploadToken={uploadToken}
                    onUploadingChange={handleAssetUploadingChange}
                    label={sectionDialogTranslations("fileAsset")}
                    kind="file"
                    assetId={activeItem.file.assetId}
                    assetsById={assetsById}
                    canDeleteAsset={canDeleteAssets}
                    required
                    onAssetChange={(assetId) =>
                      updateFileField(
                        activeBlockIndex,
                        activeItemIndex,
                        activeItem,
                        "assetId",
                        assetId
                      )
                    }
                    onAssetUploaded={onAssetUploaded}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>
                        {sectionDialogTranslations("fileTitleAr")}
                      </label>
                      <AdminInput
                        dir="rtl"
                        variant="filter"
                        className={inputClass}
                        textLanguage="arabic"
                        autoConvertMessages={autoConvertMessages}
                        value={activeItem.file.titleAr ?? ""}
                        onChange={(event) =>
                          updateFileField(
                            activeBlockIndex,
                            activeItemIndex,
                            activeItem,
                            "titleAr",
                            event.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        {sectionDialogTranslations("fileTitleEn")}
                      </label>
                      <AdminInput
                        dir="ltr"
                        variant="filter"
                        className={inputClass}
                        textLanguage="english"
                        autoConvertMessages={autoConvertMessages}
                        value={activeItem.file.titleEn ?? ""}
                        onChange={(event) =>
                          updateFileField(
                            activeBlockIndex,
                            activeItemIndex,
                            activeItem,
                            "titleEn",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeItem.type === "link" && (
                <CmsButtonItemFields
                  pageId={pageId}
                  link={activeItem.link}
                  pages={linkPages.data ?? []}
                  isPagesLoading={linkPages.isLoading}
                  isPagesError={linkPages.isError}
                  onRetryPages={() => void linkPages.refetch()}
                  onChange={(link) =>
                    updateItem(activeBlockIndex, activeItemIndex, { ...activeItem, link })
                  }
                  autoConvertMessages={autoConvertMessages}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type AssetUploadFieldProps = {
  pageId: string;
  sectionId?: string;
  uploadToken: string;
  onUploadingChange: (uploadId: symbol, isUploading: boolean) => void;
  label: string;
  device?: AssetDevice;
  kind: AssetKind;
  assetId?: string;
  accept?: string;
  assetsById: CmsAssetsById;
  required?: boolean;
  removeLabel?: string;
  onRemove?: () => void;
  onAssetChange: (assetId: string) => void;
  onAssetUploaded: (asset: CmsMediaAsset) => void;
  canDeleteAsset: boolean;
};

function AssetUploadField({
  pageId,
  sectionId,
  uploadToken,
  onUploadingChange,
  label,
  device,
  kind,
  assetId,
  accept,
  assetsById,
  required,
  removeLabel,
  onRemove,
  onAssetChange,
  onAssetUploaded,
  canDeleteAsset,
}: AssetUploadFieldProps) {
  const sectionDialogTranslations = useTranslations("admin.cmsPage.sectionDialog");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadId = useRef(Symbol("cms-section-media-upload")).current;
  const isReportedUploading = useRef(false);
  const isMounted = useRef(true);
  const uploadMutation = useAdminMediaUpload();
  const [librarySearch, setLibrarySearch] = useState("");
  const mediaLibrary = useAdminMediaAssets({
    type: kind,
    search: librarySearch || undefined,
    limit: 50,
  });
  const deleteMutation = useAdminMediaDelete();
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const asset = resolveCmsMediaAsset(assetId, assetsById, mediaLibrary.data?.data);
  const isUploading = uploadMutation.isPending;
  const isUploadUnavailable = false;

  const reportUploading = useCallback(
    (nextIsUploading: boolean) => {
      if (isReportedUploading.current === nextIsUploading) return;
      isReportedUploading.current = nextIsUploading;
      onUploadingChange(uploadId, nextIsUploading);
    },
    [onUploadingChange, uploadId]
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError("");
    reportUploading(true);

    try {
      const uploadedAsset = await uploadMutation.mutateAsync({
        file,
        pageId,
        sectionId,
        uploadToken,
      });
      if (!isMounted.current) return;
      onAssetUploaded(uploadedAsset);
      onAssetChange(uploadedAsset.id);
    } catch {
      if (isMounted.current) setError(sectionDialogTranslations("uploadError"));
    } finally {
      reportUploading(false);
      if (isMounted.current && inputRef.current) inputRef.current.value = "";
    }
  }

  function openFilePicker() {
    if (isUploadUnavailable) {
      setError(sectionDialogTranslations("mediaUploadRequiresSection"));
      return;
    }
    if (!isUploading) inputRef.current?.click();
  }

  const EmptyIcon = kind === "image" ? ImageIcon : kind === "video" ? VideoIcon : FileIcon;
  const DeviceIcon =
    device === "desktop" ? MonitorIcon : device === "mobile" ? SmartphoneIcon : null;
  const emptyLabelKey =
    kind === "image" ? "noImageSelected" : kind === "video" ? "noVideoSelected" : "noFileSelected";
  const dropHintKey =
    kind === "image" ? "dropImageHint" : kind === "video" ? "dropVideoHint" : "dropFileHint";
  const uploadLabelKey =
    kind === "image" ? "uploadImage" : kind === "video" ? "uploadVideo" : "uploadFile";
  const changeLabelKey =
    kind === "image" ? "changeImage" : kind === "video" ? "changeVideo" : "changeFile";

  return (
    <div className={mediaPanelClass}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-700">
          {DeviceIcon && <DeviceIcon size={14} className="text-gray-400" />}
          <span>{label}</span>
          {required && <span className="text-danger-red ms-0.5">*</span>}
        </label>
        {onRemove && (
          <button
            type="button"
            onClick={() => {
              setError("");
              onRemove();
            }}
            className="border-0 bg-transparent p-0 text-[11px] font-semibold text-gray-400 hover:text-danger-red cursor-pointer"
          >
            {removeLabel ?? sectionDialogTranslations("clearAsset")}
          </button>
        )}
        {!onRemove && assetId && (
          <button
            type="button"
            onClick={() => {
              setError("");
              onAssetChange("");
            }}
            className="border-0 bg-transparent p-0 text-[11px] font-semibold text-gray-400 hover:text-danger-red cursor-pointer"
          >
            {sectionDialogTranslations("clearAsset")}
          </button>
        )}
      </div>

      <input
        type="search"
        value={librarySearch}
        onChange={(event) => setLibrarySearch(event.target.value)}
        placeholder={sectionDialogTranslations("searchMediaLibrary")}
        className="mb-2 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700"
      />
      <select
        aria-label={sectionDialogTranslations("mediaLibrary")}
        className="mb-2 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700"
        value={assetId ?? ""}
        onChange={(event) => {
          const selectedAsset = mediaLibrary.data?.data.find(
            (candidate) => candidate.id === event.target.value
          );
          if (selectedAsset) onAssetUploaded(selectedAsset);
          onAssetChange(event.target.value);
        }}
      >
        <option value="">{sectionDialogTranslations("chooseFromLibrary")}</option>
        {mediaLibrary.data?.data.map((libraryAsset) => (
          <option key={libraryAsset.id} value={libraryAsset.id}>
            {assetDisplayName(libraryAsset)}
          </option>
        ))}
      </select>
      {canDeleteAsset && canDeleteCmsMediaAsset(asset) && asset && (
        <button
          type="button"
          className="mb-2 text-xs font-bold text-danger-red underline underline-offset-4"
          disabled={deleteMutation.isPending}
          onClick={async () => {
            try {
              await deleteMutation.mutateAsync(asset.id);
              onAssetChange("");
              await mediaLibrary.refetch();
            } catch {
              setError(sectionDialogTranslations("deleteAssetError"));
            }
          }}
        >
          {sectionDialogTranslations("deleteUnusedAsset")}
        </button>
      )}

      <div
        role="button"
        tabIndex={isUploading || isUploadUnavailable ? -1 : 0}
        onClick={openFilePicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") openFilePicker();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isUploading && !isUploadUnavailable) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!isUploading && !isUploadUnavailable)
            handleFile(event.dataTransfer.files?.[0] ?? null);
        }}
        className={[
          "rounded-[8px] border border-dashed bg-white px-3 py-3 transition-colors cursor-pointer min-h-[112px] flex flex-col justify-center",
          isDragging
            ? "border-admin-primary bg-admin-primary-bg/50"
            : "border-gray-200 hover:border-admin-primary-bg hover:bg-gray-50",
          isUploading ? "opacity-60 cursor-wait" : "",
          isUploadUnavailable ? "opacity-70 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {asset ? (
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-800 truncate" dir="ltr">
              {assetDisplayName(asset)}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-gray-400">
              <span dir="ltr">{asset.id}</span>
              {asset.mimeType && <span>{asset.mimeType}</span>}
              {formatSize(asset.size) && <span>{formatSize(asset.size)}</span>}
              {asset.width && asset.height && (
                <span>
                  {asset.width}x{asset.height}
                </span>
              )}
            </div>
          </div>
        ) : assetId ? (
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-gray-800 truncate" dir="ltr">
              {assetId}
            </p>
            <p className="mt-1 text-[10px] font-semibold text-gray-400">
              {sectionDialogTranslations("assetDetailsUnavailable")}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-[8px] bg-admin-primary-bg text-admin-primary flex items-center justify-center flex-shrink-0">
              <EmptyIcon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-gray-700">
                {sectionDialogTranslations(emptyLabelKey)}
              </p>
              <p className="text-[11px] font-semibold text-gray-400 mt-1">
                {sectionDialogTranslations(dropHintKey)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="h-[30px] px-3 rounded-[8px] text-[12px] border border-admin-primary-bg text-admin-primary bg-white inline-flex items-center gap-1.5">
            <PlusIcon />
            {isUploading
              ? sectionDialogTranslations("uploadingAsset")
              : assetId
                ? sectionDialogTranslations(changeLabelKey)
                : sectionDialogTranslations(uploadLabelKey)}
          </span>
          {asset?.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="h-[30px] px-3 rounded-[8px] text-[12px] border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors bg-white inline-flex items-center"
            >
              {sectionDialogTranslations("openAsset")}
            </a>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={isUploading || isUploadUnavailable}
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />

      {error && <p className="text-[11px] text-danger-red mt-1">{error}</p>}
    </div>
  );
}
