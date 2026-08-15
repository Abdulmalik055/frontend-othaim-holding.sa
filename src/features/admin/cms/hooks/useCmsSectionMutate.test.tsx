// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { CmsSection } from "./useCmsSections";

describe("CMS section mutations", () => {
  it("refreshes section, page, and media caches after creating a section", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsSectionCreate }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsSectionMutate"),
    ]);
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: {}, status: 201 });
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCmsSectionCreate("page-1"), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        titleAr: "مقدمة",
        titleEn: "Introduction",
        content: {
          blocks: [
            {
              items: [
                {
                  key: "body",
                  type: "text",
                  text: { format: "p", textAr: "نص", textEn: "Text" },
                },
              ],
            },
          ],
        },
        isActive: true,
        order: 1,
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "cms", "sections", "page-1"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "cms", "pages"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "media"] });
    const request = postSpy.mock.calls[0][1] as { content: unknown };
    expect(request.content).not.toHaveProperty("version");
    postSpy.mockRestore();
  });

  it("awaits media cache invalidation after manually deleting an asset", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useAdminMediaDelete }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsSectionMutate"),
    ]);
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: null, status: 204 });
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useAdminMediaDelete(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("asset-1");
    });

    expect(deleteSpy).toHaveBeenCalledWith("/api/admin/media/asset-1");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "media"] });
    deleteSpy.mockRestore();
  });
});

describe("useCmsSectionsReorder", () => {
  it("optimistically renumbers sections and restores the cache on failure", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsSectionsReorder }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsSectionMutate"),
    ]);
    let rejectRequest: (error: Error) => void = () => undefined;
    const request = new Promise<never>((_resolve, reject) => {
      rejectRequest = reject;
    });
    const patchSpy = vi.spyOn(apiClient, "patch").mockReturnValue(request);
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    const previousSections: CmsSection[] = [
      { id: "alpha", order: 1, isActive: true },
      { id: "beta", order: 2, isActive: true },
      { id: "gamma", order: 3, isActive: true },
    ];
    queryClient.setQueryData(["admin", "cms", "sections", "page-1"], previousSections);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCmsSectionsReorder("page-1"), { wrapper });

    act(() => result.current.mutate(["gamma", "alpha", "beta"]));

    await waitFor(() => {
      expect(
        queryClient.getQueryData<CmsSection[]>(["admin", "cms", "sections", "page-1"])
      ).toEqual([
        { id: "gamma", order: 1, isActive: true },
        { id: "alpha", order: 2, isActive: true },
        { id: "beta", order: 3, isActive: true },
      ]);
    });
    expect(result.current.isPending).toBe(true);
    expect(patchSpy).toHaveBeenCalledWith("/api/admin/cms/pages/page-1/sections/reorder", {
      sectionIds: ["gamma", "alpha", "beta"],
    });

    rejectRequest(new Error("save failed"));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<CmsSection[]>(["admin", "cms", "sections", "page-1"])).toEqual(
      previousSections
    );
    patchSpy.mockRestore();
  });

  it("invalidates the section and page queries after a successful reorder", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsSectionsReorder }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsSectionMutate"),
    ]);
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: {}, status: 200 });
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false },
        queries: { retry: false },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    queryClient.setQueryData<CmsSection[]>(
      ["admin", "cms", "sections", "page-1"],
      [
        { id: "alpha", order: 1, isActive: true },
        { id: "beta", order: 2, isActive: true },
      ]
    );
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCmsSectionsReorder("page-1"), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(["beta", "alpha"]);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["admin", "cms", "sections", "page-1"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "cms", "pages"] });
    patchSpy.mockRestore();
  });
});
