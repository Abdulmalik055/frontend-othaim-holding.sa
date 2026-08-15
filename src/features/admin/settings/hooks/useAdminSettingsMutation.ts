import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AdminSettings } from "./useAdminSettings";
import { PLATFORM_BRAND_QUERY_KEY } from "@/features/platform/hooks/usePlatformBrand";
import type { PlatformBrand } from "@/features/platform/types";
import type { CmsMediaAsset } from "@/features/admin/cms/schemas/cms-section.schema";

export interface AdminSettingsPayload {
  uploadToken?: string;
  logoAssetId?: string | null;
  nameAr?: string;
  nameEn?: string;
  bioAr?: string;
  bioEn?: string;
  email?: string;
  phone?: string;
  addressAr?: string;
  addressEn?: string;
  workingHoursAr?: string;
  workingHoursEn?: string;
  socialLinks?: Record<string, string>;
}

type AdminSettingsLogoUploadInput = {
  file: File;
  uploadToken: string;
};

function cleanSocialLinksMap(links: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(links).filter(([, value]) => value.trim().length > 0)
  ) as Record<string, string>;
}

export function useAdminSettingsUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminSettingsPayload) => {
      const normalizedPayload: AdminSettingsPayload = {
        ...payload,
        ...(payload.socialLinks !== undefined
          ? { socialLinks: cleanSocialLinksMap(payload.socialLinks) }
          : {}),
      };

      return apiClient
        .patch<AdminSettings>("/api/admin/settings", normalizedPayload)
        .then((response) => response.data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "settings"], data);
      queryClient.setQueryData<PlatformBrand>(PLATFORM_BRAND_QUERY_KEY, {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        bioAr: data.bioAr,
        bioEn: data.bioEn,
        logoAssetId: data.logoAssetId,
        logoUrl: data.logoUrl,
      });
      return queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });
}

export function useAdminSettingsLogoUpload() {
  return useMutation({
    mutationFn: ({ file, uploadToken }: AdminSettingsLogoUploadInput) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadToken", uploadToken);

      return apiClient
        .post<CmsMediaAsset, FormData>("/api/admin/settings/logo", formData)
        .then((response) => response.data);
    },
  });
}
