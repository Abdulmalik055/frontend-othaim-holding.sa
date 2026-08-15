import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl || "http://127.0.0.1:3001";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    },
  },
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    baseURL,
    colorScheme: "dark",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : [
        {
          command: "node tests/e2e/mock-cms-server.mjs",
          url: "http://127.0.0.1:3100/health",
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command:
            "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001 NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:3100 pnpm start",
          url: `${baseURL}/ar`,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      ],
  projects: [
    {
      name: "desktop",
      use: {
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
