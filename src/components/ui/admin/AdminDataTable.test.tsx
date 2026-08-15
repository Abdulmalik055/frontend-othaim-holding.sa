// @vitest-environment happy-dom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminDataTable, type AdminColumn } from "./AdminDataTable";

type Row = {
  id: string;
  name: string;
} & Record<string, unknown>;

const columns: AdminColumn<Row>[] = [
  {
    key: "name",
    label: "Name",
  },
];

describe("AdminDataTable row reordering", () => {
  it("renders an accessible drag handle in the configured column", () => {
    render(
      <AdminDataTable<Row>
        columns={columns}
        data={[{ id: "alpha", name: "Alpha" }]}
        keyField="id"
        hidePagination
        rowReorder={{
          handleColumn: "name",
          getItemLabel: (row) => row.name,
          onReorder: vi.fn(),
          accessibility: {
            handleLabel: (label) => `Reorder ${label}`,
            instructions: "Use the arrow keys to change the item position.",
            pickedUp: (label, position, total) =>
              `${label} picked up at position ${position} of ${total}.`,
            moved: (label, position, total) =>
              `${label} moved to position ${position} of ${total}.`,
            dropped: (label, position, total) =>
              `${label} dropped at position ${position} of ${total}.`,
            canceled: (label) => `Moving ${label} was canceled.`,
          },
        }}
      />
    );

    expect(
      (screen.getByRole("button", { name: "Reorder Alpha" }) as HTMLButtonElement).disabled
    ).toBe(false);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("disables the handle when reordering is locked", () => {
    render(
      <AdminDataTable<Row>
        columns={columns}
        data={[{ id: "alpha", name: "Alpha" }]}
        keyField="id"
        hidePagination
        rowReorder={{
          handleColumn: "name",
          getItemLabel: (row) => row.name,
          onReorder: vi.fn(),
          disabled: true,
          accessibility: {
            handleLabel: (label) => `Reorder ${label}`,
            instructions: "Use the arrow keys to change the item position.",
            pickedUp: () => "Picked up.",
            moved: () => "Moved.",
            dropped: () => "Dropped.",
            canceled: () => "Canceled.",
          },
        }}
      />
    );

    expect(
      (screen.getByRole("button", { name: "Reorder Alpha" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("keeps canonical input order when row reordering is enabled", async () => {
    const user = userEvent.setup();

    render(
      <AdminDataTable<Row>
        columns={[{ ...columns[0], sortable: true }]}
        data={[
          { id: "beta", name: "Beta" },
          { id: "alpha", name: "Alpha" },
        ]}
        keyField="id"
        hidePagination
        rowReorder={{
          handleColumn: "name",
          getItemLabel: (row) => row.name,
          onReorder: vi.fn(),
          accessibility: {
            handleLabel: (label) => `Reorder ${label}`,
            instructions: "Use the arrow keys to change the item position.",
            pickedUp: (label, position, total) =>
              `${label} picked up at position ${position} of ${total}.`,
            moved: (label, position, total) =>
              `${label} moved to position ${position} of ${total}.`,
            dropped: (label, position, total) =>
              `${label} dropped at position ${position} of ${total}.`,
            canceled: (label) => `Moving ${label} was canceled.`,
          },
        }}
      />
    );

    await user.click(screen.getByRole("columnheader", { name: /Name/ }));

    const rows = screen.getAllByRole("row");
    expect(rows[1].textContent).toContain("Beta");
    expect(rows[2].textContent).toContain("Alpha");
  });

  it("supports keyboard activation and cancellation from the drag handle", async () => {
    const onReorder = vi.fn();
    Object.defineProperty(document, "getAnimations", {
      configurable: true,
      value: () => [],
    });
    Object.defineProperty(HTMLElement.prototype, "getAnimations", {
      configurable: true,
      value: () => [],
    });
    Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
      configurable: true,
      value: function getBoundingClientRect(this: HTMLElement) {
        const rowIndex =
          this.tagName === "TR" && this.parentElement?.tagName === "TBODY"
            ? Array.from(this.parentElement.children).indexOf(this)
            : -1;
        const top = rowIndex >= 0 ? rowIndex * 40 : 0;
        const height = rowIndex >= 0 ? 40 : 400;
        const width = 600;
        return {
          x: 0,
          y: top,
          top,
          right: width,
          bottom: top + height,
          left: 0,
          width,
          height,
          toJSON: () => ({}),
        };
      },
    });

    render(
      <AdminDataTable<Row>
        columns={columns}
        data={[
          { id: "alpha", name: "Alpha" },
          { id: "beta", name: "Beta" },
        ]}
        keyField="id"
        hidePagination
        rowReorder={{
          handleColumn: "name",
          getItemLabel: (row) => row.name,
          onReorder,
          accessibility: {
            handleLabel: (label) => `Reorder ${label}`,
            instructions: "Use the arrow keys to change the item position.",
            pickedUp: (label, position, total) =>
              `${label} picked up at position ${position} of ${total}.`,
            moved: (label, position, total) =>
              `${label} moved to position ${position} of ${total}.`,
            dropped: (label, position, total) =>
              `${label} dropped at position ${position} of ${total}.`,
            canceled: (label) => `Moving ${label} was canceled.`,
          },
        }}
      />
    );

    const handle = screen.getByRole("button", { name: "Reorder Alpha" });
    handle.focus();
    fireEvent.keyDown(handle, { key: " ", code: "Space" });

    await waitFor(() => {
      const activeHandle = screen.getByRole("button", { name: "Reorder Alpha" });
      expect(activeHandle.getAttribute("aria-grabbed")).toBe("true");
      expect(activeHandle.className).toContain("cursor-grabbing");
      expect(screen.getByText("Use the arrow keys to change the item position.")).toBeDefined();
    });
    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Reorder Alpha" }).getAttribute("aria-grabbed")
      ).toBe("false");
    });
    expect(onReorder).not.toHaveBeenCalled();
  });
});
