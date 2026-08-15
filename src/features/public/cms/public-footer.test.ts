import { describe, expect, it } from "vitest";
import { resolvePublicFooterBio } from "@/features/public/cms/public-footer";

describe("public footer copy", () => {
  it("uses the Home CMS footer statement and the platform bio on inner pages", () => {
    expect(resolvePublicFooterBio("Short platform bio", "Long Home footer statement")).toBe(
      "Long Home footer statement"
    );
    expect(resolvePublicFooterBio("Short platform bio")).toBe("Short platform bio");
  });
});
