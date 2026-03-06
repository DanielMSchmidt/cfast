import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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
      testMatch: /^(?!.*(mutations|pagination)).*\.spec\.ts$/,
    },
    {
      name: "mutations",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(mutations|pagination)\.spec\.ts$/,
      dependencies: ["read-only"],
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
