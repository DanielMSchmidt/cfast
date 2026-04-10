import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

export type CfastPlaywrightConfigOptions = {
  /** Local dev server port. Defaults to 5173. */
  port?: number;
  /** Dev server start command. Defaults to "pnpm dev". */
  command?: string;
  /** Test directory relative to the config file. Defaults to ".". */
  testDir?: string;
  /** Test timeout in milliseconds. Defaults to 30_000. */
  timeout?: number;
  /** Dev server startup timeout in milliseconds. Defaults to 120_000. */
  serverTimeout?: number;
  /** Additional Playwright config to merge. */
  overrides?: Partial<PlaywrightTestConfig>;
};

/**
 * Creates a shared Playwright config for cfast apps.
 *
 * Provides sensible defaults matching the cfast convention:
 * - Local-first: baseURL defaults to localhost, with `E2E_BASE_URL` override
 * - Auto-starts dev server when running locally
 * - Chromium-only for speed
 * - Traces on first retry, screenshots on failure
 *
 * @example
 * ```ts
 * // e2e/playwright.config.ts
 * import { createPlaywrightConfig } from "@cfast/test-e2e/config";
 * export default createPlaywrightConfig();
 * ```
 *
 * @example With custom port
 * ```ts
 * export default createPlaywrightConfig({ port: 3000 });
 * ```
 */
export function createPlaywrightConfig(
  options: CfastPlaywrightConfigOptions = {},
): PlaywrightTestConfig {
  const {
    port = 5173,
    command = "pnpm dev",
    testDir = ".",
    timeout = 30_000,
    serverTimeout = 120_000,
    overrides = {},
  } = options;

  const LOCAL_BASE_URL = `http://localhost:${port}`;
  const baseURL = process.env.E2E_BASE_URL ?? LOCAL_BASE_URL;
  const isLocal = baseURL === LOCAL_BASE_URL;

  return defineConfig({
    testDir,
    timeout,
    use: {
      baseURL,
      trace: "on-first-retry",
      screenshot: "only-on-failure",
    },
    webServer: isLocal
      ? {
          command,
          url: LOCAL_BASE_URL,
          reuseExistingServer: !process.env.CI,
          timeout: serverTimeout,
          stdout: "pipe",
          stderr: "pipe",
        }
      : undefined,
    projects: [{ name: "chromium", use: { browserName: "chromium" } }],
    ...overrides,
  });
}
