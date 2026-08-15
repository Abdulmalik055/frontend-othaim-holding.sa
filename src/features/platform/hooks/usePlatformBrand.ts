import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { CACHE } from "@/lib/constants/cache-config";
import type { PlatformBrand } from "../types";

export const PLATFORM_BRAND_QUERY_KEY = ["platform", "brand"] as const;

export function usePlatformBrand() {
  return useQuery<PlatformBrand>({
    queryKey: PLATFORM_BRAND_QUERY_KEY,
    queryFn: () =>
      apiClient.get<PlatformBrand>("/api/contact-info").then((response) => response.data),
    staleTime: CACHE.MIN_5,
  });
}
