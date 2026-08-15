import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CmsMediaAsset,
  CmsSectionContent,
} from "@/features/admin/cms/schemas/cms-section.schema";
import type { CmsSection } from "@/features/admin/cms/hooks/useCmsSections";
import { reorderCmsSections } from "@/features/admin/cms/section-order";

function invalidateSections(
  queryClient: ReturnType<typeof useQueryClient>,
  pageId: string,
  includeMedia = false
) {
  const invalidations = [
    queryClient.invalidateQueries({ queryKey: ["admin", "cms", "sections", pageId] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "cms", "pages"] }),
  ];
  if (includeMedia) {
    invalidations.push(queryClient.invalidateQueries({ queryKey: ["admin", "media"] }));
  }
  return Promise.all(invalidations);
}

export interface CmsSectionPayload {
  titleAr: string;
  titleEn: string;
  content: CmsSectionContent;
  isActive: boolean;
  uploadToken?: string;
}

export interface CmsSectionCreatePayload extends CmsSectionPayload {
  order: number;
}

export type CmsSectionUpdatePayload = Partial<CmsSectionPayload>;

export type AdminMediaUploadInput = {
  file: File;
  pageId?: string;
  sectionId?: string;
  uploadToken: string;
};

export function useCmsSectionCreate(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CmsSectionCreatePayload) =>
      apiClient
        .post(`/api/admin/cms/pages/${pageId}/sections`, payload)
        .then((response) => response.data),
    onSuccess: () => invalidateSections(queryClient, pageId, true),
  });
}

export function useCmsSectionUpdate(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, payload }: { sectionId: string; payload: CmsSectionUpdatePayload }) =>
      apiClient
        .patch(`/api/admin/cms/pages/${pageId}/sections/${sectionId}`, payload)
        .then((response) => response.data),
    onSuccess: () => invalidateSections(queryClient, pageId, true),
  });
}

export function useCmsSectionDelete(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) =>
      apiClient
        .delete(`/api/admin/cms/pages/${pageId}/sections/${sectionId}`)
        .then((response) => response.data),
    onSuccess: () => invalidateSections(queryClient, pageId, true),
  });
}

export function useCmsSectionsReorder(pageId: string) {
  const queryClient = useQueryClient();
  const sectionsQueryKey = ["admin", "cms", "sections", pageId] as const;

  return useMutation({
    mutationFn: (sectionIds: string[]) =>
      apiClient
        .patch(`/api/admin/cms/pages/${pageId}/sections/reorder`, { sectionIds })
        .then((response) => response.data),
    onMutate: async (sectionIds) => {
      await queryClient.cancelQueries({ queryKey: sectionsQueryKey });
      const previousSections = queryClient.getQueryData<CmsSection[]>(sectionsQueryKey);

      if (previousSections) {
        queryClient.setQueryData(
          sectionsQueryKey,
          reorderCmsSections(previousSections, sectionIds)
        );
      }

      return { previousSections };
    },
    onError: (_error, _sectionIds, context) => {
      if (context?.previousSections) {
        queryClient.setQueryData(sectionsQueryKey, context.previousSections);
      }
    },
    onSettled: () => invalidateSections(queryClient, pageId),
  });
}

export function useAdminMediaUpload() {
  return useMutation({
    mutationFn: ({ file, pageId, sectionId, uploadToken }: AdminMediaUploadInput) => {
      const formData = new FormData();
      formData.append("file", file);
      if (pageId) formData.append("pageId", pageId);
      if (sectionId) formData.append("sectionId", sectionId);
      formData.append("uploadToken", uploadToken);

      return apiClient
        .post<CmsMediaAsset, FormData>("/api/admin/media", formData)
        .then((response) => response.data);
    },
  });
}

export function useAdminMediaAssets(
  options: {
    type?: "image" | "video" | "file";
    search?: string;
    usage?: "used" | "unused";
    page?: number;
    limit?: number;
  } = {}
) {
  return useQuery({
    queryKey: ["admin", "media", options],
    queryFn: () =>
      apiClient
        .get<{
          data: CmsMediaAsset[];
          total: number;
          page: number;
          limit: number;
        }>("/api/admin/media", { params: options })
        .then((response) => response.data),
  });
}

export function useAdminMediaDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) =>
      apiClient.delete(`/api/admin/media/${assetId}`).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "media"] }),
  });
}
