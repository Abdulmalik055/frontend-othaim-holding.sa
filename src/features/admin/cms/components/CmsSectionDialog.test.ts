import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSource = readFileSync(new URL("./CmsSectionDialog.tsx", import.meta.url), "utf8");
const editorSource = readFileSync(new URL("../section-templates.tsx", import.meta.url), "utf8");

describe("CmsSectionDialog presentation-neutral form", () => {
  it("does not render section presentation controls or preset mode", () => {
    expect(dialogSource).not.toContain('sectionDialogTranslations("type")');
    expect(dialogSource).not.toContain("CMS_SECTION_PRESETS");
    expect(dialogSource).not.toContain("advancedMode");
  });

  it("does not render or submit an editor-controlled slug", () => {
    expect(dialogSource).not.toContain('sectionDialogTranslations("slug")');
    expect(dialogSource).not.toContain("slug:");
  });

  it("does not render content or block presentation controls", () => {
    expect(editorSource).not.toContain('sectionDialogTranslations("contentVariant")');
    expect(editorSource).not.toContain('sectionDialogTranslations("blockType")');
    expect(editorSource).not.toContain('sectionDialogTranslations("blockVariant")');
  });

  it("does not seed new button destinations with a homepage link", () => {
    expect(editorSource).not.toContain('href: "/"');
  });

  it("renders save errors as an accessible form-level alert", () => {
    expect(dialogSource).toContain('role="alert"');
  });

  it("creates new sections with strict unversioned content", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:3000";
    const { getDefaultCmsSectionContent } = await import("../section-templates");

    expect(getDefaultCmsSectionContent()).toEqual({
      blocks: [
        {
          items: [
            {
              key: "body",
              type: "text",
              text: { format: "p", textAr: "", textEn: "" },
            },
          ],
        },
      ],
    });
  });
});
