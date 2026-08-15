import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CACHE } from "@/lib/constants/cache-config";
import {
  normalizeCmsSectionContent,
  type CmsAssetsById,
  type CmsSectionContent,
} from "@/features/admin/cms/schemas/cms-section.schema";

export interface CmsSection {
  id: string;
  slug?: string;
  pageId?: string;
  titleAr?: string | null;
  titleEn?: string | null;
  content?: CmsSectionContent;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsSectionDetailResponse {
  section: CmsSection & { content: CmsSectionContent };
  assetsById: CmsAssetsById;
}

type CmsSectionDetailApiResponse = Omit<CmsSectionDetailResponse, "section"> & {
  section: Omit<CmsSection, "content"> & {
    type?: string;
    content: unknown;
  };
};

export function useCmsSections(pageId: string | null | undefined) {
  return useQuery<CmsSection[]>({
    queryKey: ["admin", "cms", "sections", pageId],
    queryFn: () =>
      apiClient
        .get<CmsSection[]>(`/api/admin/cms/pages/${pageId}/sections`)
        .then((response) => response.data),
    enabled: !!pageId,
    staleTime: CACHE.MIN_2,
  });
}

export function useCmsSectionDetail(
  pageId: string | null | undefined,
  sectionId: string | null | undefined
) {
  return useQuery<CmsSectionDetailResponse>({
    queryKey: ["admin", "cms", "sections", pageId, sectionId],
    queryFn: () =>
      apiClient
        .get<CmsSectionDetailApiResponse>(`/api/admin/cms/pages/${pageId}/sections/${sectionId}`)
        .then((response) => {
          const section = { ...response.data.section };
          delete section.type;
          return {
            ...response.data,
            section: {
              ...section,
              content: normalizeCmsSectionContent(section.content),
            },
          };
        }),
    enabled: !!pageId && !!sectionId,
    staleTime: CACHE.MIN_2,
  });
}
