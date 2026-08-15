// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

describe("useCmsSectionDetail", () => {
  it("validates canonical content while removing a retired top-level section type", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const [{ apiClient }, { useCmsSectionDetail }] = await Promise.all([
      import("@/lib/api-client"),
      import("./useCmsSections"),
    ]);
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue({
      status: 200,
      data: {
        section: {
          id: "section-1",
          pageId: "page-1",
          type: "rich_text",
          titleAr: "مقدمة",
          titleEn: "Introduction",
          content: {
            blocks: [
              {
                items: [
                  {
                    key: "body",
                    type: "text",
                    text: { format: "p", textAr: "نص", textEn: "Copy" },
                  },
                ],
              },
            ],
          },
          order: 1,
          isActive: true,
        },
        assetsById: {},
      },
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCmsSectionDetail("page-1", "section-1"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getSpy).toHaveBeenCalledWith("/api/admin/cms/pages/page-1/sections/section-1");
    expect(result.current.data?.section).not.toHaveProperty("version");
    expect(result.current.data?.section.content).not.toHaveProperty("version");
    expect(result.current.data?.section).not.toHaveProperty("type");
    getSpy.mockRestore();
  });
});
