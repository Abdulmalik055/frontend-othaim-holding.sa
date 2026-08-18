import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const surfaces = [
  ["login", new URL("../../auth/components/LoginForm.tsx", import.meta.url)],
  ["admin sidebar", new URL("../../../components/layout/AdminSidebar.tsx", import.meta.url)],
] as const;

describe("platform logo surfaces", () => {
  it.each(surfaces)("uses the brand-green logo background on the %s", (_name, file) => {
    const source = readFileSync(file, "utf8");

    expect(source).toMatch(/logoContainerClassName="[^"]*bg-admin-primary/);
    expect(source).not.toMatch(/logoContainerClassName="[^"]*bg-white/);
  });
});
