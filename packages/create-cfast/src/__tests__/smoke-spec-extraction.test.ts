import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scaffold } from "../scaffold";
import { resolveConfig } from "../config";
import type { Config } from "../types";

/**
 * Mirrors the route-discovery logic in
 * `templates/base/e2e/smoke.spec.ts::discoverRoutes()`.
 *
 * The smoke spec runs inside the scaffolded app at runtime where vitest is not
 * available, so we duplicate the function here and assert the regex behaviour
 * end-to-end. If you change the smoke spec's discovery, change this in lockstep.
 */
function extractRoutes(routesFile: string): string[] {
  const routes: string[] = [];
  if (/index\(/.test(routesFile)) routes.push("/");
  const matches = routesFile.matchAll(/route\(\s*["']([^"']+)["']/g);
  for (const m of matches) {
    const p = m[1];
    if (p.includes(":") || p.includes("*")) continue;
    routes.push(`/${p}`);
  }
  return routes;
}

describe("route extraction", () => {
  it("finds index", () => {
    expect(extractRoutes(`index("routes/_index.tsx")`)).toEqual(["/"]);
  });

  it("finds simple routes", () => {
    expect(extractRoutes(`route("login", "routes/login.tsx")`)).toEqual(["/login"]);
  });

  it("skips dynamic routes", () => {
    expect(extractRoutes(`route("foo/:id", "routes/foo.$id.tsx")`)).toEqual([]);
  });

  it("skips wildcards", () => {
    expect(extractRoutes(`route("api/*", "routes/api.$.tsx")`)).toEqual([]);
  });

  it("finds index plus multiple static routes and skips dynamic ones", () => {
    const file = `
      import { type RouteConfig, index, route } from "@react-router/dev/routes";

      export default [
        index("routes/_index.tsx"),
        route("login", "routes/login.tsx"),
        route("admin", "routes/admin.tsx"),
        route("api/auth/*", "routes/auth.$.tsx"),
        route("posts/:id", "routes/posts.$id.tsx"),
        route("about", "routes/about.tsx"),
      ] satisfies RouteConfig;
    `;
    expect(extractRoutes(file)).toEqual(["/", "/login", "/admin", "/about"]);
  });

  it("handles single quotes", () => {
    expect(extractRoutes(`route('settings', 'routes/settings.tsx')`)).toEqual([
      "/settings",
    ]);
  });

  it("returns empty when no routes are present", () => {
    expect(extractRoutes(`export default [] satisfies RouteConfig;`)).toEqual([]);
  });
});

describe("scaffold ships e2e infrastructure", () => {
  function scaffoldFixture(label: string, partial: Partial<Config["features"]> = {}): string {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `cfast-e2e-template-${label}-`));
    const targetDir = path.join(tmp, "demo-app");
    const config = resolveConfig({
      projectName: "demo-app",
      targetDir,
      features: {
        auth: false,
        db: false,
        storage: false,
        email: false,
        ui: false,
        admin: false,
        ...partial,
      },
      uiLibrary: null,
    });
    scaffold(config);
    return targetDir;
  }

  it("ships e2e/playwright.config.ts with localhost baseURL and webServer", () => {
    const targetDir = scaffoldFixture("playwright");
    const pw = fs.readFileSync(
      path.join(targetDir, "e2e", "playwright.config.ts"),
      "utf-8",
    );
    expect(pw).toContain("http://localhost:${PORT}");
    expect(pw).toContain("webServer");
    expect(pw).toContain("reuseExistingServer: !process.env.CI");
    expect(pw).toContain("E2E_BASE_URL");
    fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
  });

  it("ships e2e/smoke.spec.ts that auto-discovers routes", () => {
    const targetDir = scaffoldFixture("smoke");
    const smoke = fs.readFileSync(path.join(targetDir, "e2e", "smoke.spec.ts"), "utf-8");
    expect(smoke).toContain("discoverRoutes");
    expect(smoke).toContain('readFileSync(join(__dirname, "..", "app", "routes.ts"');
    expect(smoke).toContain("Get started by editing");
    expect(smoke).toContain("/Users/");
    expect(smoke).toContain("/home/");
    fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
  });

  it("ships e2e/helpers.ts with gotoOk", () => {
    const targetDir = scaffoldFixture("helpers");
    const helpers = fs.readFileSync(path.join(targetDir, "e2e", "helpers.ts"), "utf-8");
    expect(helpers).toContain("export async function gotoOk");
    expect(helpers).toContain("status !== 401 && status !== 403");
    fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
  });

  it("ships test:e2e script and @playwright/test devDep in package.json", () => {
    const targetDir = scaffoldFixture("pkg");
    const pkg = JSON.parse(
      fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"),
    );
    expect(pkg.scripts["test:e2e"]).toBe(
      "playwright test --config=e2e/playwright.config.ts",
    );
    expect(pkg.devDependencies["@playwright/test"]).toBeTruthy();
    fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
  });

  it("documents the local-first e2e contract in CLAUDE.md", () => {
    const targetDir = scaffoldFixture("docs");
    const claudeMd = fs.readFileSync(path.join(targetDir, "CLAUDE.md"), "utf-8");
    expect(claudeMd).toContain("E2E Tests Are Local-First");
    expect(claudeMd).toContain("baseURL` MUST default to `http://localhost:5173`");
    expect(claudeMd).toContain("webServer");
    expect(claudeMd).toContain("smoke.spec.ts");
    expect(claudeMd).toContain("gotoOk");
    fs.rmSync(path.dirname(targetDir), { recursive: true, force: true });
  });
});
