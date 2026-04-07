import { defineConfig } from "@playwright/test";

// Port can be overridden via E2E_PORT (useful for running against a non-default
// dev server port, or for test harnesses that pick a free port per run).
const PORT = Number(process.env.E2E_PORT ?? 5173);
const LOCAL_BASE_URL = `http://localhost:${PORT}`;
const baseURL = process.env.E2E_BASE_URL ?? LOCAL_BASE_URL;
const isLocal = baseURL === LOCAL_BASE_URL;

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Auto-start the dev server only when running locally
  webServer: isLocal
    ? {
        command: `pnpm dev --port=${PORT}`,
        url: LOCAL_BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
