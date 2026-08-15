// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsPage } from "@/features/admin/cms/hooks/useCmsPages";
import { CmsPagesTable } from "./CmsPagesTable";

const testState = vi.hoisted(() => ({
  pages: [] as CmsPage[],
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/features/admin/cms/hooks/useCmsPages", () => ({
  getCmsPageSectionsCount: (page: CmsPage) => page.sectionsCount ?? 0,
  useCmsPages: () => ({
    data: {
      data: testState.pages,
      total: testState.pages.length,
      page: 1,
      limit: 10,
    },
    isLoading: false,
  }),
}));

function createPage(overrides: Partial<CmsPage>): CmsPage {
  return {
    id: "page-1",
    category: "info",
    template: "default",
    slug: "about",
    titleAr: "صفحة",
    titleEn: "Page",
    isActive: true,
    navigationPlacement: "none",
    navigationOrder: 0,
    isIndexable: true,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    sectionsCount: 0,
    ...overrides,
  };
}

describe("CMS page live links", () => {
  beforeEach(() => {
    testState.pages = [];
  });

  it("opens a regular page's locale-aware live URL in a new tab", () => {
    testState.pages = [
      createPage({ id: "privacy", category: "legal", slug: "privacy", isActive: false }),
    ];

    render(<CmsPagesTable locale="ar" onOpenDialog={vi.fn()} onViewSections={vi.fn()} />);

    const link = screen.getByRole("link", { name: "previewNewTab" });
    expect(link.getAttribute("href")).toBe("/ar/legal/privacy");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
  });

  it("uses the locale root as the homepage's live URL", () => {
    testState.pages = [
      createPage({ id: "home", category: "info", template: "home", slug: "home" }),
    ];

    render(<CmsPagesTable locale="en" onOpenDialog={vi.fn()} onViewSections={vi.fn()} />);

    expect(screen.getByRole("link", { name: "previewNewTab" }).getAttribute("href")).toBe("/en");
  });
});
