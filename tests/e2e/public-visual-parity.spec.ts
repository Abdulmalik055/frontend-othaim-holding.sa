import { expect, test, type Page } from "@playwright/test";

const locales = ["ar", "en"] as const;
const subpageSlugs = [
  "about",
  "family",
  "founder",
  "committee",
  "team",
  "portfolio",
  "strategy",
  "contact",
] as const;

for (const locale of locales) {
  test(`${locale} public typography and shell match the reference`, async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === "mobile";

    await openSettledPage(page, `/${locale}`);
    await expect(page.locator(".ogc-video-hero h1")).toHaveCSS(
      "font-size",
      isMobile ? "36px" : "72px"
    );
    await expect(page.locator(".ogc-hero-tagline")).toHaveCSS(
      "line-height",
      isMobile ? "25.5px" : "32.3px"
    );
    await expect(page.locator(".ogc-header-logo img")).toHaveCSS("height", "76px");
    await expect(page.locator(".ogc-footer")).toHaveCSS("padding-top", "80px");
    await expect(page.locator(".ogc-footer")).toHaveCSS("padding-bottom", "40px");

    for (const slug of subpageSlugs) {
      await openSettledPage(page, `/${locale}/${slug}`);
      await expect(page.locator(".ogc-page-hero h1")).toHaveCSS(
        "font-size",
        isMobile ? "40px" : "72px"
      );
      await expect(page.locator(".ogc-page-hero")).toHaveCSS(
        "padding-top",
        isMobile ? "130px" : "180px"
      );
      await expect(page.locator(".ogc-page-hero")).toHaveCSS(
        "padding-bottom",
        isMobile ? "80px" : "120px"
      );
      await expect(page.locator(".ogc-page-hero .ogc-lead")).toHaveCSS("line-height", "28px");
    }
  });
}

test("portrait media uses the reference top crop", async ({ page }) => {
  for (const route of ["/ar/founder", "/ar/committee", "/ar/team"] as const) {
    await openSettledPage(page, route);
    await expect(page.locator("main img").first()).toHaveCSS("object-position", "50% 0%");
  }
});

test("founder attribution remains visible on Home and Founder pages", async ({ page }) => {
  for (const locale of locales) {
    await openSettledPage(page, `/${locale}`);
    const homeFounder = page.locator(".ogc-home-founder");
    await expect(homeFounder.locator(".ogc-person-name")).toHaveText(
      locale === "ar" ? "عبدالله صالح العثيم" : "Abdullah Saleh Al Othaim"
    );
    await expect(homeFounder.locator(".ogc-person-role")).toHaveText(
      locale === "ar" ? "المؤسس" : "Founder"
    );
    await expect(homeFounder.locator(".ogc-person-name")).toBeVisible();

    await openSettledPage(page, `/${locale}/founder`);
    const founderCaption = page.locator(".ogc-founder-caption");
    await expect(founderCaption).toContainText(
      locale === "ar" ? "عبدالله صالح العثيم" : "Abdullah Saleh Al Othaim"
    );
    await expect(founderCaption).toBeVisible();
  }
});

test("contact form keeps its current interface", async ({ page }, testInfo) => {
  await openSettledPage(page, "/ar/contact");
  const isMobile = testInfo.project.name === "mobile";
  const card = page.locator(".ogc-contact-details .ogc-form-card");
  const field = card.locator(".ogc-form-field").first();
  const row = card.locator(".ogc-form-row").first();

  await expect(card).toHaveCSS("border-radius", "20px");
  await expect(card).toHaveCSS("padding", isMobile ? "24px" : "40px");
  await expect(row).toHaveCSS(
    "grid-template-columns",
    isMobile ? /\d+(?:\.\d+)?px/ : /\d+(?:\.\d+)?px \d+(?:\.\d+)?px/
  );
  await expect(field).toHaveCSS("min-height", "48px");
  await expect(field).toHaveCSS("border-radius", "10px");
  await expect(field).toHaveCSS("font-size", "14.4px");
  await expect(card.locator("textarea")).toHaveCSS("min-height", "120px");
});

async function openSettledPage(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.querySelectorAll<HTMLElement>(".ogc-reveal").forEach((element) => {
      delete element.dataset.ogcReveal;
    });
    const video = document.querySelector<HTMLVideoElement>("video");
    video?.pause();
    window.scrollTo(0, 0);
  });
}
