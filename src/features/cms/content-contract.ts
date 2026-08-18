import { z } from "zod";
import { isSafeCmsHref } from "@/lib/cms-link";

export const CMS_TEXT_FORMATS = ["h1", "h2", "h3", "p", "ul", "ol"] as const;
export const CMS_SECTION_ITEM_TYPES = ["text", "image", "video", "file", "link"] as const;

const requiredTrimmedString = z.string().trim().min(1);
const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(1).optional()
);
const safeHref = requiredTrimmedString.refine(
  isSafeCmsHref,
  "Links must be relative or use HTTP(S), mailto, or tel"
);

function withoutUndefinedFields<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T;
}

export const cmsSectionTextItemSchema = z
  .object({
    key: requiredTrimmedString,
    type: z.literal("text"),
    text: z
      .object({
        format: z.enum(CMS_TEXT_FORMATS),
        textAr: requiredTrimmedString,
        textEn: requiredTrimmedString,
      })
      .strict()
      .superRefine((text, context) => {
        if (text.format !== "ul" && text.format !== "ol") return;
        const arabicItems = text.textAr.split(/\r?\n/);
        const englishItems = text.textEn.split(/\r?\n/);
        if (
          arabicItems.some((item) => item.trim().length === 0) ||
          englishItems.some((item) => item.trim().length === 0)
        ) {
          context.addIssue({
            code: "custom",
            message: "List items must use one non-empty item per line",
            path: ["textAr"],
          });
        }
        if (arabicItems.length !== englishItems.length) {
          context.addIssue({
            code: "custom",
            message: "Arabic and English lists must contain the same number of items",
            path: ["textEn"],
          });
        }
      }),
  })
  .strict();

export const cmsSectionImageItemSchema = z
  .object({
    key: requiredTrimmedString,
    type: z.literal("image"),
    image: z
      .object({
        desktopAssetId: requiredTrimmedString,
        mobileAssetId: optionalTrimmedString,
        altAr: optionalTrimmedString,
        altEn: optionalTrimmedString,
        decorative: z.boolean().optional(),
      })
      .strict()
      .superRefine((image, context) => {
        if (!image.decorative && (!image.altAr || !image.altEn)) {
          context.addIssue({
            code: "custom",
            message: "Arabic and English alt text are required",
            path: ["altAr"],
          });
        }
      })
      .transform(withoutUndefinedFields),
  })
  .strict()
  .transform(withoutUndefinedFields);

export const cmsSectionVideoItemSchema = z
  .object({
    key: requiredTrimmedString,
    type: z.literal("video"),
    video: z
      .object({
        desktopAssetId: requiredTrimmedString,
        mobileAssetId: optionalTrimmedString,
        posterDesktopAssetId: optionalTrimmedString,
        posterMobileAssetId: optionalTrimmedString,
      })
      .strict()
      .transform(withoutUndefinedFields),
  })
  .strict()
  .transform(withoutUndefinedFields);

export const cmsSectionFileItemSchema = z
  .object({
    key: requiredTrimmedString,
    type: z.literal("file"),
    file: z
      .object({
        assetId: requiredTrimmedString,
        titleAr: optionalTrimmedString,
        titleEn: optionalTrimmedString,
        display: optionalTrimmedString,
      })
      .strict()
      .transform(withoutUndefinedFields),
  })
  .strict();

export const cmsSectionLinkItemSchema = z
  .object({
    key: requiredTrimmedString,
    type: z.literal("link"),
    link: z
      .object({
        labelAr: requiredTrimmedString,
        labelEn: requiredTrimmedString,
        href: safeHref,
        style: z.enum(["primary", "secondary", "text"]).default("primary"),
        openInNewTab: z.boolean().optional(),
      })
      .strict()
      .transform(withoutUndefinedFields),
  })
  .strict();

export const cmsSectionItemSchema = z.discriminatedUnion("type", [
  cmsSectionTextItemSchema,
  cmsSectionImageItemSchema,
  cmsSectionVideoItemSchema,
  cmsSectionFileItemSchema,
  cmsSectionLinkItemSchema,
]);

export const cmsSectionBlockSchema = z
  .object({
    items: z.array(cmsSectionItemSchema).min(1),
  })
  .strict();

export const cmsSectionContentSchema = z
  .object({
    blocks: z.array(cmsSectionBlockSchema).min(1),
  })
  .strict();

export const cmsSectionEditorSchema = z
  .object({
    titleAr: requiredTrimmedString,
    titleEn: requiredTrimmedString,
    content: cmsSectionContentSchema,
    isActive: z.boolean(),
  })
  .strict();

export const cmsSectionSchema = cmsSectionEditorSchema
  .extend({
    order: z.number().int().positive(),
  })
  .strict();

export type CmsMediaAsset = {
  id: string;
  type: "image" | "video" | "file" | string;
  filename?: string | null;
  mimeType?: string | null;
  size?: number | null;
  url?: string | null;
  width?: number | null;
  height?: number | null;
  isTemporary?: boolean;
  _count?: {
    usages: number;
    seoImagePages: number;
    platformLogoSettings?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type CmsAssetsById = Record<string, CmsMediaAsset>;
export type CmsSectionContent = z.infer<typeof cmsSectionContentSchema>;
export type CmsSectionBlock = z.infer<typeof cmsSectionBlockSchema>;
export type CmsSectionItem = z.infer<typeof cmsSectionItemSchema>;
export type CmsSectionItemType = (typeof CMS_SECTION_ITEM_TYPES)[number];
export type CmsTextFormat = (typeof CMS_TEXT_FORMATS)[number];
export type CmsSectionFormData = z.infer<typeof cmsSectionEditorSchema>;

export function normalizeCmsSectionContent(content: unknown): CmsSectionContent {
  const parsed = cmsSectionContentSchema.safeParse(content);
  if (!parsed.success) {
    throw new Error(`Unsupported CMS content: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
