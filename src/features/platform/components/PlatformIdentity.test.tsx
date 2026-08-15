// @vitest-environment happy-dom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PLATFORM_BRAND_QUERY_KEY } from "../hooks/usePlatformBrand";
import { PlatformIdentity } from "./PlatformIdentity";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
});

describe("PlatformIdentity", () => {
  it("renders the localized name and logo supplied by the public settings query", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(PLATFORM_BRAND_QUERY_KEY, {
      nameAr: "اسم المنصة",
      nameEn: "Platform Name",
      logoAssetId: "logo-id",
      logoUrl: "/uploads/media/platform-logo.png",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PlatformIdentity locale="ar" />
      </QueryClientProvider>
    );

    expect(screen.getByText("اسم المنصة")).toBeDefined();
    const logo = screen.getByRole("img", { name: "اسم المنصة" });
    expect(logo.getAttribute("src")).toBe("/uploads/media/platform-logo.png");
  });

  it("renders no invented company identity when database branding is empty", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(PLATFORM_BRAND_QUERY_KEY, {
      nameAr: null,
      nameEn: null,
      logoAssetId: null,
      logoUrl: null,
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PlatformIdentity locale="en" />
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});
