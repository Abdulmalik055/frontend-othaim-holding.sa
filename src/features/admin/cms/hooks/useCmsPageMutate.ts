import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CMS_LINK_PAGES_QUERY_KEY } from "@/features/admin/cms/hooks/useCmsPages";
import type { CmsPageCategory, CmsPageTemplate } from "@/features/admin/cms/types";

function invalidatePages(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["admin", "cms", "pages"] }),
    queryClient.invalidateQueries({ queryKey: ["admin", "media"] }),
    queryClient.invalidateQueries({ queryKey: CMS_LINK_PAGES_QUERY_KEY }),
  ]);
}

export interface CmsPagePayload {
  category: CmsPageCategory;
  template: CmsPageTemplate;
  slug: string;
  titleAr: string;
  titleEn: string;
  seoTitleAr?: string;
  seoTitleEn?: string;
  seoDescriptionAr?: string;
  seoDescriptionEn?: string;
  seoImageAssetId?: string | null;
  isIndexable: boolean;
  isActive?: boolean;
  uploadToken?: string;
}

export function useCmsPageCreate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CmsPagePayload) =>
      apiClient.post("/api/admin/cms/pages", payload).then((response) => response.data),
    onSuccess: () => invalidatePages(queryClient),
  });
}

export function useCmsPageUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CmsPagePayload> }) =>
      apiClient.patch(`/api/admin/cms/pages/${id}`, payload).then((response) => response.data),
    onSuccess: () => invalidatePages(queryClient),
  });
}

export function useCmsPageDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/admin/cms/pages/${id}`).then((response) => response.data),
    onSuccess: () => invalidatePages(queryClient),
  });
}
