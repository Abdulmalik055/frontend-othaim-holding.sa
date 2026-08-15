import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicCmsNavigation } = vi.hoisted(() => ({
  getPublicCmsNavigation: vi.fn(),
}));

vi.mock("@/features/public/cms/api", () => ({ getPublicCmsNavigation }));

import sitemap from "@/app/sitemap";

describe("localized sitemap", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://othaimglobal.com";
    getPublicCmsNavigation.mockResolvedValue([
      {
        id: "home",
        slug: "home",
        category: "info",
        template: "home",
        isIndexable: true,
        updatedAt: "2026-08-15T00:00:00.000Z",
      },
      {
        id: "about",
        slug: "about",
        category: "info",
        template: "about",
        isIndexable: true,
        updatedAt: "2026-08-15T00:00:00.000Z",
      },
    ]);
  });

  it("uses clean localized page URLs and Arabic x-default alternates", async () => {
    const entries = await sitemap();

    expect(entries.map((entry) => entry.url)).toEqual([
      "https://othaimglobal.com/ar",
      "https://othaimglobal.com/en",
      "https://othaimglobal.com/ar/about",
      "https://othaimglobal.com/en/about",
    ]);
    expect(entries[2].alternates?.languages).toEqual({
      ar: "https://othaimglobal.com/ar/about",
      en: "https://othaimglobal.com/en/about",
      "x-default": "https://othaimglobal.com/ar/about",
    });
  });
});
