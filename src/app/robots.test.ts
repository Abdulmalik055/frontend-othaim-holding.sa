import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots metadata", () => {
  it("keeps public media crawlable while excluding API, admin, and auth surfaces", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://othaimglobal.com";
    const metadata = robots();
    const rules = Array.isArray(metadata.rules) ? metadata.rules[0] : metadata.rules;

    expect(rules.disallow).toEqual([
      "/api/",
      "/admin",
      "/auth",
      "/ar/admin",
      "/en/admin",
      "/ar/auth",
      "/en/auth",
    ]);
    expect(rules.disallow).not.toContain("/uploads/");
    expect(metadata.sitemap).toBe("https://othaimglobal.com/sitemap.xml");
  });
});
