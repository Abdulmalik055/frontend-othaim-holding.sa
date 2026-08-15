import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSource = readFileSync(new URL("./CmsPageDialog.tsx", import.meta.url), "utf8");

describe("CmsPageDialog form structure", () => {
  it("renders search and social sharing as a semantic disclosure closed by default", () => {
    expect(dialogSource).toContain("<details");
    expect(dialogSource).not.toContain("<details open");
    expect(dialogSource).toContain("<summary");
    expect(dialogSource).toContain('{t("seo")}');
  });

  it("does not render navigation controls", () => {
    expect(dialogSource).not.toContain("navigationPlacement");
    expect(dialogSource).not.toContain("navigationOrder");
  });

  it("uses the shared fail-closed media deletion policy", () => {
    expect(dialogSource).toContain("canDeleteCmsMediaAsset(asset)");
    expect(dialogSource).not.toContain("asset._count?.");
    expect(dialogSource).not.toContain("_count?.usages ?? 0");
    expect(dialogSource).not.toContain("_count?.seoImagePages ?? 0");
    expect(dialogSource).not.toContain("_count?.platformLogoSettings ?? 0");
  });
});
