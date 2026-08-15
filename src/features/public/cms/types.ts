import type { CmsAssetsById, CmsSectionContent } from "@/features/cms/content-contract";
import type {
  CmsNavigationPlacement,
  CmsPageCategory,
  CmsPageTemplate,
} from "@/features/cms/page-contract";
import type { PlatformBrand } from "@/features/platform/types";

export type PublicCmsSection = {
  id: string;
  slug: string;
  titleAr?: string | null;
  titleEn?: string | null;
  content: CmsSectionContent;
  order: number;
  isActive?: boolean;
  updatedAt: string;
};

export type PublicCmsPage = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  category: CmsPageCategory;
  template: CmsPageTemplate;
  navigationPlacement: CmsNavigationPlacement;
  navigationOrder: number;
  seoTitleAr?: string | null;
  seoTitleEn?: string | null;
  seoDescriptionAr?: string | null;
  seoDescriptionEn?: string | null;
  seoImageAssetId?: string | null;
  isIndexable: boolean;
  sections: PublicCmsSection[];
  assetsById: CmsAssetsById;
  updatedAt: string;
};

export type PublicCmsPageSummary = Pick<
  PublicCmsPage,
  | "id"
  | "slug"
  | "titleAr"
  | "titleEn"
  | "category"
  | "template"
  | "navigationPlacement"
  | "navigationOrder"
  | "isIndexable"
  | "updatedAt"
>;

export type PublicPlatformSettings = PlatformBrand & {
  email?: string | null;
  phone?: string | null;
  addressAr?: string | null;
  addressEn?: string | null;
  socialLinks?: Record<string, string> | null;
};
