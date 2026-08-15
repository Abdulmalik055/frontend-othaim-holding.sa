// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PLATFORM_BRAND_QUERY_KEY } from "@/features/platform/hooks/usePlatformBrand";
import { AdminSidebar } from "./AdminSidebar";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
});

vi.mock("next/link", () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => (key === "panelTitle" ? "لوحة الإدارة" : key),
}));

describe("AdminSidebar", () => {
  it("uses an Arabic-safe line height for the database-backed platform name", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(PLATFORM_BRAND_QUERY_KEY, {
      nameAr: "كويري",
      nameEn: "Query",
      logoAssetId: "logo-id",
      logoUrl: "/uploads/media/platform-logo.png",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminSidebar activePath="settings" locale="ar" />
      </QueryClientProvider>
    );

    const platformName = screen.getByText("كويري");
    expect(platformName.className).toContain("leading-[1.4]");
    expect(platformName.className).not.toContain("leading-none");
  });

  it("keeps the existing compact line height for the English platform name", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(PLATFORM_BRAND_QUERY_KEY, {
      nameAr: "كويري",
      nameEn: "Query",
      logoAssetId: "logo-id",
      logoUrl: "/uploads/media/platform-logo.png",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminSidebar activePath="settings" locale="en" />
      </QueryClientProvider>
    );

    const platformName = screen.getByText("Query");
    expect(platformName.className).toContain("leading-none");
    expect(platformName.className).not.toContain("leading-[1.4]");
  });
});
