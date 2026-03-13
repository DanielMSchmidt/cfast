import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "read-only",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /^(?!.*(mutations|pagination|screenshots)).*\.spec\.ts$/,
    },
    {
      name: "mutations",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(mutations|pagination)\.spec\.ts$/,
      dependencies: ["read-only"],
    },
    {
      name: "screenshots",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
      testMatch: /screenshots\.spec\.ts$/,
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
