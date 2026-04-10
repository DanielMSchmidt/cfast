import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type SmokeTestOptions = {
  /**
   * Absolute path to the project root directory (the directory containing
   * `app/routes.ts`). Typically pass `__dirname` or use `fileURLToPath`.
   *
   * @example
   * ```ts
   * import { dirname } from "node:path";
   * import { fileURLToPath } from "node:url";
   * const HERE = dirname(fileURLToPath(import.meta.url));
   * registerSmokeTests({ projectRoot: join(HERE, "..") });
   * ```
   */
  projectRoot: string;
};

/**
 * Auto-discovers routes from `app/routes.ts` and returns their paths.
 *
 * Matches:
 * - `index("routes/_index.tsx")` -> "/"
 * - `route("foo", "routes/foo.tsx")` -> "/foo"
 *
 * Skips dynamic routes (`:id`, `*`) that cannot be resolved for a smoke test.
 */
export function discoverRoutes(projectRoot: string): string[] {
  const file = readFileSync(join(projectRoot, "app", "routes.ts"), "utf-8");
  const routes: string[] = [];
  if (/index\(/.test(file)) routes.push("/");
  const routeMatches = file.matchAll(/route\(\s*["']([^"']+)["']/g);
  for (const m of routeMatches) {
    const path = m[1];
    if (path.includes(":") || path.includes("*")) continue;
    routes.push(`/${path}`);
  }
  return routes;
}

/**
 * Registers Playwright smoke tests that verify every discovered route:
 * - Returns HTTP < 400 (or 401/403 for protected routes)
 * - Body does NOT contain placeholder strings or absolute filesystem paths
 *
 * Call this in your `smoke.spec.ts`:
 * ```ts
 * import { registerSmokeTests } from "@cfast/test-e2e/smoke";
 * import { dirname, join } from "node:path";
 * import { fileURLToPath } from "node:url";
 *
 * const HERE = dirname(fileURLToPath(import.meta.url));
 * registerSmokeTests({ projectRoot: join(HERE, "..") });
 * ```
 */
export function registerSmokeTests(options: SmokeTestOptions): void {
  const ROUTES = discoverRoutes(options.projectRoot);

  const OK = (code: number) => code < 400 || code === 401 || code === 403;

  for (const path of ROUTES) {
    test(`route ${path} is registered and responds`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response, `no response for ${path}`).not.toBeNull();
      const status = response!.status();
      expect(OK(status), `${path} returned ${status}`).toBe(true);

      // Catch placeholder pages even if status is 200
      const body = await page.content();
      expect(body, `${path} contains scaffold placeholder`).not.toContain(
        "Get started by editing",
      );
      expect(body, `${path} leaks absolute filesystem path`).not.toContain("/Users/");
      expect(body, `${path} leaks absolute filesystem path`).not.toContain("/home/");
    });
  }

  test(`smoke: discovered ${ROUTES.length} routes`, async () => {
    expect(ROUTES.length, "no routes discovered from app/routes.ts").toBeGreaterThan(0);
  });
}
