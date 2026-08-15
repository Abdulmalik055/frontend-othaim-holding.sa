// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { AdminSettings } from "./useAdminSettings";

describe("useAdminSettingsUpdate", () => {
  it("persists the logo asset and refreshes every brand consumer", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useAdminSettingsUpdate }, { PLATFORM_BRAND_QUERY_KEY }] =
      await Promise.all([
        import("@/lib/api-client"),
        import("./useAdminSettingsMutation"),
        import("@/features/platform/hooks/usePlatformBrand"),
      ]);
    const response = {
      id: "settings-id",
      nameAr: "المنصة",
      nameEn: "Platform",
      bioAr: null,
      bioEn: null,
      email: "admin@example.com",
      phone: null,
      addressAr: null,
      addressEn: null,
      workingHoursAr: null,
      workingHoursEn: null,
      socialLinks: {},
      logoAssetId: "logo-id",
      logoUrl: "/uploads/media/platform-logo.png",
      updatedAt: "2026-08-10T00:00:00.000Z",
    } satisfies AdminSettings;
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
      data: response,
      status: 200,
    });
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAdminSettingsUpdate(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ logoAssetId: "logo-id" });
    });

    expect(patchSpy).toHaveBeenCalledWith("/api/admin/settings", {
      logoAssetId: "logo-id",
    });
    expect(queryClient.getQueryData(PLATFORM_BRAND_QUERY_KEY)).toMatchObject({
      nameEn: "Platform",
      logoUrl: "/uploads/media/platform-logo.png",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "media"] });
    patchSpy.mockRestore();
  });

  it("uploads logo images through the settings-scoped endpoint", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useAdminSettingsLogoUpload }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useAdminSettingsMutation"),
    ]);
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
      data: { id: "logo-id", type: "image" },
      status: 201,
    });
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAdminSettingsLogoUpload(), { wrapper });
    const file = new File(["logo"], "logo.png", { type: "image/png" });

    await act(async () => {
      await result.current.mutateAsync({ file, uploadToken: "settings-logo-token" });
    });

    const [, body] = postSpy.mock.calls[0];
    expect(postSpy).toHaveBeenCalledWith("/api/admin/settings/logo", expect.any(FormData));
    expect((body as FormData).get("file")).toBe(file);
    expect((body as FormData).get("uploadToken")).toBe("settings-logo-token");
    postSpy.mockRestore();
  });
});
