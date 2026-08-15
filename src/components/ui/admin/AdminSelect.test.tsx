// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminDialog } from "./AdminDialog";
import { AdminSelect } from "./AdminSelect";

describe("AdminSelect", () => {
  it("renders an open menu outside a dialog's clipped scroll region", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AdminDialog title="Edit section" onClose={vi.fn()}>
        <AdminSelect
          label="Link type"
          options={[
            { value: "internal", label: "Internal link" },
            { value: "url", label: "URL" },
          ]}
        />
      </AdminDialog>
    );
    const scrollRegion = container.querySelector(".overflow-y-auto");

    await user.click(screen.getByRole("combobox", { name: "Link type" }));

    const listbox = screen.getByRole("listbox");
    const layeredPortal = Array.from(document.body.querySelectorAll<HTMLElement>("div")).find(
      (element) => window.getComputedStyle(element).zIndex === "70" && element.contains(listbox)
    );

    expect(scrollRegion?.contains(listbox)).toBe(false);
    expect(layeredPortal).toBeDefined();
  });

  it("keeps the base option styles when a caller styles grouped menu parts", async () => {
    const user = userEvent.setup();
    render(
      <AdminSelect
        label="Page"
        options={[
          {
            label: "Info",
            options: [{ value: "/info/about", label: "About Us" }],
          },
        ]}
        classNames={{
          groupHeading: () => "custom-group-heading",
        }}
      />
    );

    await user.click(screen.getByRole("combobox", { name: "Page" }));

    expect(screen.getByText("Info").className).toContain("custom-group-heading");
    expect(screen.getByRole("option", { name: "About Us" }).className).toContain("px-3");
  });
});
