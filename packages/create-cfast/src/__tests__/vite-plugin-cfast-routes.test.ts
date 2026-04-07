import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  parseRegisteredRoutes,
  walkRouteFiles,
  cfastRoutesCheckPlugin,
} from "../../templates/base/vite-plugin-cfast-routes";

describe("parseRegisteredRoutes", () => {
  it("extracts module path from index() call", () => {
    const src = `
      import { type RouteConfig, index, route } from "@react-router/dev/routes";
      export default [
        index("routes/_index.tsx"),
      ] satisfies RouteConfig;
    `;
    const result = parseRegisteredRoutes(src);
    expect(result.has("routes/_index.tsx")).toBe(true);
  });

  it("extracts module path from route() call (second arg)", () => {
    const src = `
      export default [
        route("login", "routes/login.tsx"),
        route("api/auth/*", "routes/auth.$.tsx"),
      ];
    `;
    const result = parseRegisteredRoutes(src);
    expect(result.has("routes/login.tsx")).toBe(true);
    expect(result.has("routes/auth.$.tsx")).toBe(true);
  });

  it("ignores commented-out route() calls (line comments)", () => {
    const src = `
      export default [
        index("routes/_index.tsx"),
        // route("projects", "routes/projects._index.tsx"),
      ];
    `;
    const result = parseRegisteredRoutes(src);
    expect(result.has("routes/_index.tsx")).toBe(true);
    expect(result.has("routes/projects._index.tsx")).toBe(false);
  });

  it("ignores commented-out route() calls (block comments)", () => {
    const src = `
      export default [
        index("routes/_index.tsx"),
        /* route("projects", "routes/projects._index.tsx"), */
      ];
    `;
    const result = parseRegisteredRoutes(src);
    expect(result.has("routes/projects._index.tsx")).toBe(false);
  });

  it("handles multiple routes mixed with comments", () => {
    const src = `
      export default [
        index("routes/_index.tsx"),
        route("login", "routes/login.tsx"),
        // commented: route("dead", "routes/dead.tsx"),
        route("api/auth/*", "routes/auth.$.tsx"),
      ];
    `;
    const result = parseRegisteredRoutes(src);
    expect(result.size).toBe(3);
    expect(result.has("routes/dead.tsx")).toBe(false);
  });
});

describe("walkRouteFiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cfast-routes-walk-"));
    fs.mkdirSync(path.join(tmpDir, "app", "routes"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns paths relative to app/", () => {
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "_index.tsx"), "export default () => null;");
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "login.tsx"), "export default () => null;");

    const result = walkRouteFiles(path.join(tmpDir, "app", "routes"));
    const normalized = result.map((p) => p.replace(/\\/g, "/")).sort();
    expect(normalized).toEqual(["routes/_index.tsx", "routes/login.tsx"]);
  });

  it("walks nested directories", () => {
    fs.mkdirSync(path.join(tmpDir, "app", "routes", "admin"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "admin", "users.tsx"), "x");

    const result = walkRouteFiles(path.join(tmpDir, "app", "routes"));
    const normalized = result.map((p) => p.replace(/\\/g, "/"));
    expect(normalized).toContain("routes/admin/users.tsx");
  });

  it("ignores non-source files (md, css)", () => {
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "README.md"), "x");
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "styles.css"), "x");
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "page.tsx"), "x");

    const result = walkRouteFiles(path.join(tmpDir, "app", "routes"));
    const normalized = result.map((p) => p.replace(/\\/g, "/"));
    expect(normalized).toEqual(["routes/page.tsx"]);
  });
});

describe("cfastRoutesCheckPlugin (integration)", () => {
  let tmpDir: string;
  let cwd: string;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cfast-plugin-"));
    fs.mkdirSync(path.join(tmpDir, "app", "routes"), { recursive: true });
    cwd = process.cwd();
    process.chdir(tmpDir);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(cwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    warnSpy.mockRestore();
  });

  it("warns when a route file exists but is not registered", () => {
    fs.writeFileSync(
      path.join(tmpDir, "app", "routes.ts"),
      `import { index } from "@react-router/dev/routes";
       export default [index("routes/_index.tsx")];`,
    );
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "_index.tsx"), "x");
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "foo.tsx"), "x");

    const plugin = cfastRoutesCheckPlugin();
    // @ts-expect-error - calling buildStart manually for the test
    plugin.buildStart!();

    const all = warnSpy.mock.calls.flat().join("\n");
    expect(all).toContain("foo.tsx is not registered");
    expect(all).toContain('Add: route("foo", "routes/foo.tsx")');
  });

  it("does not warn when all files are registered", () => {
    fs.writeFileSync(
      path.join(tmpDir, "app", "routes.ts"),
      `import { index, route } from "@react-router/dev/routes";
       export default [
         index("routes/_index.tsx"),
         route("foo", "routes/foo.tsx"),
       ];`,
    );
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "_index.tsx"), "x");
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "foo.tsx"), "x");

    const plugin = cfastRoutesCheckPlugin();
    // @ts-expect-error - calling buildStart manually for the test
    plugin.buildStart!();

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns when routes.ts has a commented-out route entry", () => {
    fs.writeFileSync(
      path.join(tmpDir, "app", "routes.ts"),
      `import { index } from "@react-router/dev/routes";
       export default [
         index("routes/_index.tsx"),
         // route("foo", "routes/foo.tsx"),
       ];`,
    );
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "_index.tsx"), "x");
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "foo.tsx"), "x");

    const plugin = cfastRoutesCheckPlugin();
    // @ts-expect-error - calling buildStart manually for the test
    plugin.buildStart!();

    const all = warnSpy.mock.calls.flat().join("\n");
    expect(all).toContain("foo.tsx is not registered");
  });

  it("does not duplicate warnings for the same file across the same buildStart cycle", () => {
    fs.writeFileSync(
      path.join(tmpDir, "app", "routes.ts"),
      `import { index } from "@react-router/dev/routes";
       export default [index("routes/_index.tsx")];`,
    );
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "_index.tsx"), "x");
    fs.writeFileSync(path.join(tmpDir, "app", "routes", "foo.tsx"), "x");

    const plugin = cfastRoutesCheckPlugin();
    // @ts-expect-error - calling buildStart manually for the test
    plugin.buildStart!();

    const fooMentions = warnSpy.mock.calls
      .flat()
      .join("\n")
      .match(/foo\.tsx is not registered/g);
    expect(fooMentions?.length ?? 0).toBe(1);
  });
});
