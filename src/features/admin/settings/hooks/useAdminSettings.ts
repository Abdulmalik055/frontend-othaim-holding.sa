import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CACHE } from "@/lib/constants/cache-config";

export interface AdminSettings {
  id: string;
  nameAr: string | null;
  nameEn: string | null;
  bioAr: string | null;
  bioEn: string | null;
  email: string;
  phone: string | null;
  addressAr: string | null;
  addressEn: string | null;
  workingHoursAr: string | null;
  workingHoursEn: string | null;
  socialLinks: Record<string, string> | null;
  logoAssetId: string | null;
  logoUrl: string | null;
  updatedAt: string;
}

export function useAdminSettings() {
  return useQuery<AdminSettings>({
    queryKey: ["admin", "settings"],
    queryFn: () =>
      apiClient.get<AdminSettings>("/api/admin/settings").then((response) => response.data),
    staleTime: CACHE.MIN_5,
  });
}
