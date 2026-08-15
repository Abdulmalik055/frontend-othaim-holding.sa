import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tableSource = readFileSync(new URL("./CmsPagesTable.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(
  new URL("../../../../components/layout/AdminLayoutClient.tsx", import.meta.url),
  "utf8"
);

describe("CMS page administration", () => {
  it("does not expose the removed authenticated preview", () => {
    expect(tableSource).not.toContain("admin/cms/preview");
    expect(layoutSource).not.toContain("admin\\/cms\\/preview");
    expect(layoutSource).not.toContain("usePathname");
  });
});
