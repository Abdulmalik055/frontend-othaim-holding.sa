// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

describe("useCmsLinkPages", () => {
  it("loads the complete active public page list for internal destination options", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsLinkPages }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsPages"),
    ]);
    const response = [
      {
        id: "about-page",
        category: "info" as const,
        template: "about" as const,
        slug: "about",
        titleAr: "من نحن",
        titleEn: "About Us",
        navigationPlacement: "both" as const,
        navigationOrder: 10,
        isIndexable: true,
        updatedAt: "2026-08-08T00:00:00.000Z",
      },
    ];
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({ data: response, status: 200 });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCmsLinkPages(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSpy).toHaveBeenCalledWith("/api/cms/pages");
    expect(result.current.data).toEqual(response);
    getSpy.mockRestore();
  });
});

describe("useCmsPage", () => {
  it("does not synthesize the retired page row version", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsPage }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsPages"),
    ]);
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      status: 200,
      data: {
        id: "about-page",
        category: "info",
        template: "about",
        slug: "about",
        titleAr: "من نحن",
        titleEn: "About Us",
        isActive: true,
        navigationPlacement: "none",
        navigationOrder: 0,
        isIndexable: true,
        createdAt: "2026-08-08T00:00:00.000Z",
        updatedAt: "2026-08-08T00:00:00.000Z",
      },
    });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCmsPage("about-page"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).not.toHaveProperty("version");
    getSpy.mockRestore();
  });
});
