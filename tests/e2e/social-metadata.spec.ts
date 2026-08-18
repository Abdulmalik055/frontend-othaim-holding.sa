import { expect, test } from "@playwright/test";

const locales = ["ar", "en"] as const;
const slugs = [
  "",
  "about",
  "family",
  "founder",
  "committee",
  "team",
  "portfolio",
  "strategy",
  "contact",
  "legal/terms",
  "legal/usage",
  "legal/privacy",
] as const;
const sharedSocialImage = /\/uploads\/media\/images\/othaim-global\/othaim-global-logo\.png$/;

for (const locale of locales) {
  for (const slug of slugs) {
    const route = `/${locale}${slug ? `/${slug}` : ""}`;

    test(`${route} uses the shared Othaim Global social image`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });

      expect(response?.ok()).toBe(true);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        sharedSocialImage
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        "content",
        sharedSocialImage
      );
    });
  }
}
