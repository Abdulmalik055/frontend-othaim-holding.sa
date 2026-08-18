import { expect, test } from "@playwright/test";

test("desktop navigation is keyboard operable and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop navigation is hidden at mobile size");
  await page.goto("/en/about", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: "Who We Are" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "About" }).first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("mobile drawer closes with Escape and restores focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile drawer is hidden at desktop size");
  await page.goto("/en/about");
  const menu = page.locator('button[aria-controls="ogc-mobile-navigation"]');
  await expect(menu).toHaveAccessibleName("Menu");
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveAccessibleName("Close menu");
  await expect(page.locator("#ogc-mobile-navigation a").first()).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
});

test("locale switch preserves the route and persists the locale", async ({ page }) => {
  await page.goto("/en/portfolio");
  await page.locator("header").getByRole("button", { name: "Arabic" }).first().click();
  await expect(page).toHaveURL(/\/ar\/portfolio$/);
  await expect
    .poll(async () => {
      const localeCookie = (await page.context().cookies()).find(
        (cookie) => cookie.name === "othaim-global.locale" && cookie.path === "/"
      );
      return localeCookie?.value;
    })
    .toBe("ar");
});

test("legacy routes redirect permanently to clean localized paths", async ({ request }) => {
  const documentHeaders = { accept: "text/html" };
  const htmlResponse = await request.get("/en/about.html", {
    headers: documentHeaders,
    maxRedirects: 0,
  });
  expect(htmlResponse.status()).toBe(308);
  expect(htmlResponse.headers().location).toMatch(/\/en\/about$/);

  const infoResponse = await request.get("/ar/info/home", {
    headers: documentHeaders,
    maxRedirects: 0,
  });
  expect(infoResponse.status()).toBe(308);
  expect(infoResponse.headers().location).toMatch(/\/ar$/);
});

test("contact form focuses the first error and reports a successful submission", async ({
  page,
}) => {
  await page.goto("/en/contact");
  const form = page.locator("form.ogc-inquiry-form");
  await form.getByRole("button", { name: /send/i }).click();
  await expect(form.locator("input").first()).toBeFocused();

  await form.getByLabel(/name/i).fill("Browser Test");
  await form.getByLabel(/organization/i).fill("Othaim Global");
  await form.getByLabel(/email/i).fill("browser@example.com");
  await form.getByLabel(/topic/i).selectOption("partnership");
  await form.getByLabel(/message/i).fill("This is a valid browser acceptance inquiry.");
  await form.getByRole("button", { name: /send/i }).click();
  await expect(form.getByRole("status")).toBeVisible();
  await expect(form.getByLabel(/name/i)).toHaveValue("");
});

test("NEPC infrastructure label remains readable below its logo", async ({ page }) => {
  await page.goto("/ar/portfolio", { waitUntil: "networkidle" });

  const card = page.locator(".ogc-logo-cell-nepc");
  const logo = card.locator("img");
  const sector = card.locator("p");

  await expect(sector).toHaveText("مستشار مالي");
  await expect(sector).toBeVisible();

  const [logoBox, sectorBox] = await Promise.all([logo.boundingBox(), sector.boundingBox()]);
  expect(logoBox).not.toBeNull();
  expect(sectorBox).not.toBeNull();
  expect(sectorBox!.y).toBeGreaterThanOrEqual(logoBox!.y + logoBox!.height);
});

test("reduced motion keeps the Home hero on its optimized poster", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator(".ogc-hero-media img").first()).toBeVisible();
  await expect(page.locator(".ogc-hero-media video")).toHaveCount(0);
});

test("normal motion reveals the Home hero video instead of covering it with a poster", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en");

  const video = page.locator(".ogc-hero-media video");
  await expect(video).toBeVisible();
  await expect(page.locator(".ogc-hero-media img")).toHaveCount(0);
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(2);
  expect(await video.evaluate((element: HTMLVideoElement) => element.error)).toBeNull();
});

test("global crawler metadata routes are not localized", async ({ request }) => {
  const robots = await request.get("/robots.txt", { maxRedirects: 0 });
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");

  const sitemap = await request.get("/sitemap.xml", { maxRedirects: 0 });
  expect(sitemap.status()).toBe(200);
  const sitemapXml = await sitemap.text();
  expect(sitemapXml).toContain("<urlset");
  expect(sitemapXml).toContain("/ar/legal/terms");
  expect(sitemapXml).toContain("/en/legal/usage");
  expect(sitemapXml).toContain("/ar/legal/privacy");
});

test("CMS branding and placement-specific navigation labels reach the public shell", async ({
  page,
}) => {
  await page.goto("/en");

  const headerContactLabels = await page.locator('header a[href="/en/contact"]').allTextContents();
  expect(headerContactLabels).toContain("Contacts");
  await expect(page.locator('footer a[href="/en/contact"]')).toHaveText("Contact");
  const legalHrefs = await page.locator("footer .ogc-footer-legal a").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href"))
  );
  expect(legalHrefs).toEqual([
    "/en/legal/terms",
    "/en/legal/usage",
    "/en/legal/privacy",
  ]);

  const headerLogo = page.locator("header img").first();
  expect(await headerLogo.getAttribute("src")).toContain("uploads");
  const organizationData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) || "{}"
  );
  expect(organizationData.logo).toContain("/uploads/");
});

test("server-rendered public content remains readable without JavaScript", async ({
  browser,
  baseURL,
}, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "The no-JavaScript smoke test runs once");
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto(new URL("/en/about", baseURL).toString());

  expect(response?.ok()).toBe(true);
  await expect(page.locator("main h1")).toBeVisible();
  await expect(page.locator("main section").first()).toBeVisible();
  await context.close();
});

test("all public internal links and rendered assets resolve", async ({ page, request }) => {
  await page.goto("/en", { waitUntil: "networkidle" });
  const internalPaths = await page
    .locator("a[href]")
    .evaluateAll((links) => [
      ...new Set(
        links
          .map((link) => link.getAttribute("href"))
          .filter((href): href is string => Boolean(href?.startsWith("/")))
      ),
    ]);
  for (const path of internalPaths) {
    const response = await request.get(path);
    expect(response.status(), path).toBeLessThan(400);
  }

  const imageUrls = await page
    .locator("img")
    .evaluateAll((elements) =>
      (elements as HTMLImageElement[]).map((image) => image.currentSrc || image.src).filter(Boolean)
    );
  for (const url of imageUrls) {
    const response = await request.get(url);
    expect(response.ok(), url).toBe(true);
  }
});
