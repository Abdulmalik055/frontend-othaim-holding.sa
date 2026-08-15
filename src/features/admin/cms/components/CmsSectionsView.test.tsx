// @vitest-environment happy-dom

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CmsPage } from "@/features/admin/cms/hooks/useCmsPages";
import { CmsSectionsView } from "./CmsSectionsView";

const testState = vi.hoisted(() => ({
  permissions: [] as string[],
  reorder: vi.fn(),
  push: vi.fn(),
  isPending: false,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: testState.push }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values?.title ? `${key} ${values.title}` : key,
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: (selector: (state: { permissions: string[] }) => unknown) =>
    selector({ permissions: testState.permissions }),
}));

vi.mock("@/features/admin/cms/hooks/useCmsSections", () => ({
  useCmsSections: () => ({
    data: [
      {
        id: "second",
        titleAr: "الثاني",
        titleEn: "Second",
        order: 2,
        isActive: true,
      },
      {
        id: "first",
        titleAr: "الأول",
        titleEn: "First",
        order: 1,
        isActive: true,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("@/features/admin/cms/hooks/useCmsSectionMutate", () => ({
  useCmsSectionsReorder: () => ({
    mutate: testState.reorder,
    isPending: testState.isPending,
    isError: false,
  }),
  useCmsSectionCreate: () => ({ mutate: vi.fn(), isPending: false }),
  useCmsSectionUpdate: () => ({ mutate: vi.fn(), isPending: false }),
  useCmsSectionDelete: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/features/admin/cms/components/CmsSectionDialog", () => ({
  CmsSectionDialog: () => null,
}));

const page = {
  id: "page-1",
  titleAr: "صفحة",
  titleEn: "Page",
} as CmsPage;

describe("CmsSectionsView permissions and ordering", () => {
  beforeEach(() => {
    testState.permissions = [];
    testState.reorder.mockReset();
    testState.push.mockReset();
    testState.isPending = false;
  });

  it("shows localized handles to editors and keeps rows in canonical order", () => {
    testState.permissions = ["cms:edit"];

    render(<CmsSectionsView page={page} locale="en" onBack={vi.fn()} />);

    expect(screen.getByRole("button", { name: "reorderHandle First" })).toBeDefined();
    expect(screen.getByRole("button", { name: "reorderHandle Second" })).toBeDefined();
    const rows = screen.getAllByRole("row");
    expect(rows[1].textContent).toContain("First");
    expect(rows[1].textContent).toContain("1");
    expect(rows[2].textContent).toContain("Second");
    expect(rows[2].textContent).toContain("2");
  });

  it("uses Arabic titles in Arabic and hides drag controls from read-only users", () => {
    testState.permissions = ["cms:edit"];
    const { rerender } = render(<CmsSectionsView page={page} locale="ar" onBack={vi.fn()} />);

    expect(screen.getByRole("button", { name: "reorderHandle الأول" })).toBeDefined();

    testState.permissions = [];
    rerender(<CmsSectionsView page={page} locale="ar" onBack={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /^reorderHandle/ })).toBeNull();
  });

  it("locks every handle while a reorder request is pending", () => {
    testState.permissions = ["cms:edit"];
    testState.isPending = true;

    render(<CmsSectionsView page={page} locale="en" onBack={vi.fn()} />);

    for (const handle of screen.getAllByRole("button", { name: /^reorderHandle/ })) {
      expect((handle as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it("does not offer backend-rejected reordering for seeded client pages", () => {
    testState.permissions = ["cms:edit"];

    render(
      <CmsSectionsView page={{ ...page, slug: "about" } as CmsPage} locale="en" onBack={vi.fn()} />
    );

    expect(screen.queryByRole("button", { name: /^reorderHandle/ })).toBeNull();
  });
});
