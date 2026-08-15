import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSource = readFileSync(new URL("./CmsSectionDialog.tsx", import.meta.url), "utf8");
const sectionsViewSource = readFileSync(new URL("./CmsSectionsView.tsx", import.meta.url), "utf8");

describe("CMS section create order", () => {
  it("passes the next section order into the create dialog", () => {
    expect(sectionsViewSource).toContain("getNextCmsSectionOrder(sections)");
    expect(sectionsViewSource).toContain("initialOrder=");
    expect(dialogSource).toContain("{ ...payload, order: initialOrder }");
  });

  it("keeps order out of the section editor UI and update payload", () => {
    expect(dialogSource).not.toContain('sectionDialogTranslations("order")');
    expect(dialogSource).not.toContain("setOrder");
    expect(dialogSource).toContain("cmsSectionEditorSchema");
    expect(dialogSource).toContain("{ ...payload, order: initialOrder }");
  });

  it("uses handle-only reordering for editors while preserving the order column", () => {
    expect(sectionsViewSource).toContain("rowReorder=");
    expect(sectionsViewSource).toContain("canEdit");
    expect(sectionsViewSource).toContain("disabled: reorderMutation.isPending");
    expect(sectionsViewSource).toContain("const rows = orderedSections as SectionRow[]");
    expect(sectionsViewSource).toContain('key: "order"');
    expect(sectionsViewSource).toContain("sortable: false");
    expect(sectionsViewSource).not.toContain("moveSection");
    expect(sectionsViewSource).not.toContain('sectionsTranslations("moveUp")');
    expect(sectionsViewSource).not.toContain('sectionsTranslations("moveDown")');
  });
});
