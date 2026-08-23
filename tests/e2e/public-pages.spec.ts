import { expect, test, type Page } from "@playwright/test";

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
  "legal/cookies",
  "legal/privacy",
] as const;

for (const locale of locales) {
  for (const slug of slugs) {
    const route = `/${locale}${slug ? `/${slug}` : ""}`;
    test(`${route} renders without broken media or overflow`, async ({ page }) => {
      const runtimeErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("requestfailed", (request) => {
        const errorText = request.failure()?.errorText;
        const isCancelledRscPrefetch =
          errorText === "net::ERR_ABORTED" && request.url().includes("_rsc=");
        if (!isCancelledRscPrefetch) {
          runtimeErrors.push(`${request.method()} ${request.url()} ${errorText}`);
        }
      });

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.ok()).toBe(true);
      await expect(page.locator("main#main-content")).toBeVisible();
      await expect(page.locator("main h1").first()).toBeVisible();
      await settlePage(page);

      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      if (slug.startsWith("legal/")) {
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          new RegExp(`${route.replaceAll("/", "\\/")}$`)
        );
        await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveAttribute(
          "href",
          /\/ar\/legal\//
        );
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
          "href",
          /\/en\/legal\//
        );
        expect(await page.locator("main h2").count()).toBeGreaterThan(0);
        if (slug === "legal/terms") {
          expect(await page.locator("main li").count()).toBeGreaterThan(0);
        }
      }
      if (slug === "legal/privacy") {
        await expect(
          page.locator(".ogc-page-privacy .ogc-legal-section p").filter({
            hasText: /^(01|02|03|04|05|06|07)$/,
          })
        ).toHaveCount(0);
        await expect(page.locator("#privacy-grievance-officer")).toContainText(
          locale === "ar"
            ? "إذا كانت لديك أي استفسارات أو مخاوف بشأن معالجة معلوماتك"
            : "If you have any queries or concerns about the processing of your information"
        );
        await expect(
          page.locator('#privacy-grievance-officer a[href="mailto:info@othaimglobal.com"]')
        ).toBeVisible();
      }
      if (slug === "legal/cookies") {
        await expect(page.locator("#cookies-manage-preferences")).toContainText(
          locale === "ar" ? "إدارة تفضيلات ملفات تعريف الارتباط" : "Manage cookie preferences"
        );
        await expect(
          page.getByRole("button", {
            name: locale === "ar" ? "إعدادات ملفات تعريف الارتباط" : "Cookie Settings",
          })
        ).toBeVisible();
        await expect(page.locator("#cookies-consent-preferences")).toHaveCount(0);
      }
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow).toBeLessThanOrEqual(1);

      const brokenImages = await page
        .locator("img")
        .evaluateAll((elements) =>
          (elements as HTMLImageElement[])
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.getAttribute("src"))
        );
      expect(brokenImages).toEqual([]);

      const unreadableButtons = await page.locator(".ogc-button").evaluateAll((buttons) =>
        buttons.flatMap((button) => {
          const style = getComputedStyle(button);
          const text = button.textContent?.trim() ?? "";
          return !text || style.color === style.backgroundColor
            ? [{ text, color: style.color, background: style.backgroundColor }]
            : [];
        })
      );
      expect(unreadableButtons).toEqual([]);
      expect(runtimeErrors).toEqual([]);

      const screenshot = await page.screenshot({
        fullPage: true,
        type: "png",
      });
      expect(screenshot).toMatchSnapshot(`${locale}-${slug.replace("/", "-") || "home"}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });
  }
}

async function settlePage(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    const step = Math.max(300, Math.floor(window.innerHeight * 0.75));
    for (let top = 0; top < document.documentElement.scrollHeight; top += step) {
      window.scrollTo(0, top);
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    for (const image of Array.from(document.images)) {
      if (image.complete) continue;
      image.scrollIntoView({ block: "center" });
      await Promise.race([
        new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 2_000)),
      ]);
    }
    document.querySelectorAll("video").forEach((video) => video.pause());
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(100);
}
