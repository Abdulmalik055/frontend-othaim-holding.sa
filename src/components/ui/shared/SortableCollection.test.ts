import { describe, expect, it } from "vitest";
import { moveSortableItem } from "./SortableCollection";

describe("moveSortableItem", () => {
  it("moves an item without mutating the controlled input", () => {
    const items = ["alpha", "beta", "gamma"];

    expect(moveSortableItem(items, 0, 2)).toEqual(["beta", "gamma", "alpha"]);
    expect(items).toEqual(["alpha", "beta", "gamma"]);
  });

  it("preserves the original array when the position does not change", () => {
    const items = ["alpha", "beta"];

    expect(moveSortableItem(items, 0, 0)).toBe(items);
  });

  it("preserves the original array for invalid positions", () => {
    const items = ["alpha", "beta"];

    expect(moveSortableItem(items, -1, 1)).toBe(items);
    expect(moveSortableItem(items, 0, 2)).toBe(items);
  });
});
