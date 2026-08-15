// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

describe("CMS page mutations", () => {
  it("awaits page, media, and link-option cache invalidation after creating a page", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsPageCreate }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsPageMutate"),
    ]);
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({ data: {}, status: 201 });
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    let releaseInvalidation!: () => void;
    const invalidation = new Promise<void>((resolve) => {
      releaseInvalidation = resolve;
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockReturnValue(invalidation);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useCmsPageCreate(), { wrapper });

    let settled = false;
    const mutation = act(async () => {
      await result.current.mutateAsync({
        category: "info",
        template: "default",
        slug: "about-us",
        titleAr: "من نحن",
        titleEn: "About us",
        isIndexable: true,
      });
      settled = true;
    });

    await vi.waitFor(() => expect(invalidateSpy).toHaveBeenCalledTimes(3));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "cms", "pages"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["admin", "media"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["public", "cms", "pages", "link-options"],
    });
    expect(settled).toBe(false);

    releaseInvalidation();
    await mutation;
    expect(settled).toBe(true);
    postSpy.mockRestore();
  });

  it("invalidates link options after updating and deleting pages", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsPageDelete, useCmsPageUpdate }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsPageMutate"),
    ]);
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({ data: {}, status: 200 });
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ data: {}, status: 200 });
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () => ({ update: useCmsPageUpdate(), remove: useCmsPageDelete() }),
      { wrapper }
    );

    await act(async () => {
      await result.current.update.mutateAsync({
        id: "about-page",
        payload: { titleEn: "Updated About Us" },
      });
      await result.current.remove.mutateAsync("about-page");
    });

    expect(
      invalidateSpy.mock.calls.filter(
        ([filters]) =>
          JSON.stringify(filters?.queryKey) ===
          JSON.stringify(["public", "cms", "pages", "link-options"])
      )
    ).toHaveLength(2);
    patchSpy.mockRestore();
    deleteSpy.mockRestore();
  });
});
