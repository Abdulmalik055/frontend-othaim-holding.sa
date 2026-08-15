// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("usePlatformBrand", () => {
  it("loads the public database-backed brand contract", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { PLATFORM_BRAND_QUERY_KEY, usePlatformBrand }] = await Promise.all([
      import("@/lib/api-client"),
      import("./usePlatformBrand"),
    ]);
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      data: {
        nameAr: "المنصة",
        nameEn: "Platform",
        logoAssetId: "logo-id",
        logoUrl: "/uploads/media/platform-logo.png",
      },
      status: 200,
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => usePlatformBrand(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSpy).toHaveBeenCalledWith("/api/contact-info");
    expect(queryClient.getQueryData(PLATFORM_BRAND_QUERY_KEY)).toMatchObject({
      nameEn: "Platform",
      logoAssetId: "logo-id",
    });
    getSpy.mockRestore();
  });
});
