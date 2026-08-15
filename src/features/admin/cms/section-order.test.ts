import { describe, expect, it } from "vitest";
import { getNextCmsSectionOrder } from "@/features/admin/cms/section-order";
import * as sectionOrder from "@/features/admin/cms/section-order";

describe("getNextCmsSectionOrder", () => {
  it("returns an order after every existing section position", () => {
    expect(getNextCmsSectionOrder([])).toBe(1);
    expect(getNextCmsSectionOrder([{ order: 1 }, { order: 2 }, { order: 3 }])).toBe(4);
    expect(getNextCmsSectionOrder([{ order: 1 }, { order: 1 }, { order: 1 }])).toBe(4);
    expect(getNextCmsSectionOrder([{ order: 1 }, { order: 4 }])).toBe(5);
  });
});

describe("reorderCmsSections", () => {
  it("returns sections in ID order with normalized one-based positions", () => {
    expect(sectionOrder).toHaveProperty("reorderCmsSections");

    const reorderCmsSections = (
      sectionOrder as typeof sectionOrder & {
        reorderCmsSections: <T extends { id: string; order: number }>(
          sections: T[],
          sectionIds: string[]
        ) => T[];
      }
    ).reorderCmsSections;
    const sections = [
      { id: "alpha", order: 4, title: "Alpha" },
      { id: "beta", order: 2, title: "Beta" },
      { id: "gamma", order: 9, title: "Gamma" },
    ];

    expect(reorderCmsSections(sections, ["gamma", "alpha", "beta"])).toEqual([
      { id: "gamma", order: 1, title: "Gamma" },
      { id: "alpha", order: 2, title: "Alpha" },
      { id: "beta", order: 3, title: "Beta" },
    ]);
  });

  it("preserves the cache snapshot when the ID list is incomplete or invalid", () => {
    const sections = [
      { id: "alpha", order: 1 },
      { id: "beta", order: 2 },
    ];

    expect(sectionOrder.reorderCmsSections(sections, ["alpha"])).toBe(sections);
    expect(sectionOrder.reorderCmsSections(sections, ["alpha", "missing"])).toBe(sections);
    expect(sectionOrder.reorderCmsSections(sections, ["alpha", "alpha"])).toBe(sections);
  });
});
