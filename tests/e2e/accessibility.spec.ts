import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/ar",
  "/ar/about",
  "/ar/family",
  "/ar/founder",
  "/ar/committee",
  "/ar/team",
  "/ar/portfolio",
  "/ar/strategy",
  "/ar/contact",
  "/en",
  "/en/about",
  "/en/family",
  "/en/founder",
  "/en/committee",
  "/en/team",
  "/en/portfolio",
  "/en/strategy",
  "/en/contact",
] as const;

for (const route of routes) {
  test(`${route} has no automated WCAG A/AA violations`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "The full route audit runs once at desktop size");
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("main#main-content")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          summary: node.failureSummary,
        })),
      }))
    ).toEqual([]);
  });
}
