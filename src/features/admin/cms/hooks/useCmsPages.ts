import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  normalizeCmsPageCategory,
  normalizeCmsPageTemplate,
  type CmsNavigationPlacement,
  type CmsPageCategory,
  type CmsPageTemplate,
} from "@/features/admin/cms/types";
import { CACHE } from "@/lib/constants/cache-config";
import { paginationParams, type PaginatedResponse, type PaginationParams } from "@/lib/pagination";

export interface CmsPage {
  id: string;
  category: CmsPageCategory;
  template: CmsPageTemplate;
  slug: string;
  titleAr: string;
  titleEn: string;
  isActive: boolean;
  navigationPlacement: CmsNavigationPlacement;
  navigationOrder: number;
  seoTitleAr?: string | null;
  seoTitleEn?: string | null;
  seoDescriptionAr?: string | null;
  seoDescriptionEn?: string | null;
  seoImageAssetId?: string | null;
  isIndexable: boolean;
  createdAt: string;
  updatedAt: string;
  sectionsCount?: number;
  _count?: { sections: number };
}

type UseCmsPagesOptions = {
  enabled?: boolean;
  category?: CmsPageCategory;
  isActive?: boolean;
} & PaginationParams;

type RawCmsPage = Omit<CmsPage, "category" | "template"> & { category?: string; template?: string };

export type CmsPagesResponse = PaginatedResponse<CmsPage>;

export interface CmsLinkPage {
  id: string;
  category: CmsPageCategory;
  template: CmsPageTemplate;
  slug: string;
  titleAr: string;
  titleEn: string;
}

export const CMS_LINK_PAGES_QUERY_KEY = ["public", "cms", "pages", "link-options"] as const;

export function getCmsPageSectionsCount(page: CmsPage) {
  return page.sectionsCount ?? page._count?.sections ?? 0;
}

export function useCmsPages(options: UseCmsPagesOptions = {}) {
  return useQuery<CmsPagesResponse>({
    queryKey: ["admin", "cms", "pages", options],
    queryFn: () =>
      apiClient
        .get<PaginatedResponse<RawCmsPage>>("/api/admin/cms/pages", {
          params: {
            ...paginationParams(options),
            category: options.category,
            isActive: options.isActive,
          },
        })
        .then((response) => ({
          ...response.data,
          data: response.data.data.map((page) => ({
            ...page,
            category: normalizeCmsPageCategory(page.category, page.slug),
            template: normalizeCmsPageTemplate(page.template),
            navigationPlacement: page.navigationPlacement ?? "none",
            navigationOrder: page.navigationOrder ?? 0,
            isIndexable: page.isIndexable ?? true,
          })),
        })),
    staleTime: CACHE.MIN_2,
    enabled: options.enabled ?? true,
  });
}

export function useCmsPage(id: string | null | undefined) {
  return useQuery<CmsPage>({
    queryKey: ["admin", "cms", "pages", id],
    queryFn: () =>
      apiClient.get<RawCmsPage>(`/api/admin/cms/pages/${id}`).then(({ data: page }) => ({
        ...page,
        category: normalizeCmsPageCategory(page.category, page.slug),
        template: normalizeCmsPageTemplate(page.template),
        navigationPlacement: page.navigationPlacement ?? "none",
        navigationOrder: page.navigationOrder ?? 0,
        isIndexable: page.isIndexable ?? true,
      })),
    enabled: !!id,
    staleTime: CACHE.MIN_2,
  });
}

export function useCmsLinkPages(options: { enabled?: boolean } = {}) {
  return useQuery<CmsLinkPage[]>({
    queryKey: CMS_LINK_PAGES_QUERY_KEY,
    queryFn: () => apiClient.get<CmsLinkPage[]>("/api/cms/pages").then((response) => response.data),
    staleTime: CACHE.MIN_2,
    enabled: options.enabled ?? true,
  });
}
