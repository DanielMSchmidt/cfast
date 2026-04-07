import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Auto-discovers routes from app/routes.ts and verifies each one:
 *  - returns HTTP < 400 (or 401/403 for protected routes)
 *  - body does NOT contain placeholder strings ("Get started by editing", absolute fs paths)
 *
 * If you add a route to app/routes.ts and `pnpm test:e2e` is green,
 * the route is reachable. If it fails, your routes.ts is wrong or
 * the route file has a runtime error.
 */

// ESM-safe __dirname (scaffolded projects are `"type": "module"`).
const HERE = dirname(fileURLToPath(import.meta.url));

function discoverRoutes(): string[] {
  const file = readFileSync(join(HERE, "..", "app", "routes.ts"), "utf-8");
  // Match index("routes/_index.tsx") -> "/"
  // Match route("foo", "routes/foo.tsx") -> "/foo"
  // Skip dynamic routes (":id", "*") that we can't resolve for a smoke test
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

const ROUTES = discoverRoutes();

// Status codes that are acceptable for "the route exists"
const OK = (code: number) => code < 400 || code === 401 || code === 403;

for (const path of ROUTES) {
  test(`route ${path} is registered and responds`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response, `no response for ${path}`).not.toBeNull();
    const status = response!.status();
    expect(OK(status), `${path} returned ${status}`).toBe(true);

    // Wait for the page to settle. In vite dev mode the first visit may
    // trigger a dependency optimization reload — reading `page.content()`
    // mid-navigation throws. `networkidle` is overkill for most production
    // deploys but is the simplest thing that's reliable in dev.
    await page.waitForLoadState("networkidle");

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
