import { describe, it, expect, vi, beforeEach } from "vitest";
import { join } from "node:path";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

import { discoverRoutes } from "../smoke.js";

describe("discoverRoutes", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "cfast-test-e2e-"));
    mkdirSync(join(tmpDir, "app"), { recursive: true });
  });

  function writeRoutesFile(content: string) {
    writeFileSync(join(tmpDir, "app", "routes.ts"), content, "utf-8");
  }

  it("discovers index route", () => {
    writeRoutesFile(`
      import { index } from "@react-router/dev/routes";
      export default [index("routes/_index.tsx")];
    `);
    expect(discoverRoutes(tmpDir)).toEqual(["/"]);
  });

  it("discovers named routes", () => {
    writeRoutesFile(`
      import { index, route } from "@react-router/dev/routes";
      export default [
        index("routes/_index.tsx"),
        route("about", "routes/about.tsx"),
        route("settings", "routes/settings.tsx"),
      ];
    `);
    expect(discoverRoutes(tmpDir)).toEqual(["/", "/about", "/settings"]);
  });

  it("skips dynamic routes with :id", () => {
    writeRoutesFile(`
      import { index, route } from "@react-router/dev/routes";
      export default [
        index("routes/_index.tsx"),
        route("posts/:postId", "routes/post-detail.tsx"),
        route("about", "routes/about.tsx"),
      ];
    `);
    expect(discoverRoutes(tmpDir)).toEqual(["/", "/about"]);
  });

  it("skips wildcard routes with *", () => {
    writeRoutesFile(`
      import { route } from "@react-router/dev/routes";
      export default [
        route("files/*", "routes/file-browser.tsx"),
        route("admin", "routes/admin.tsx"),
      ];
    `);
    expect(discoverRoutes(tmpDir)).toEqual(["/admin"]);
  });

  it("returns empty array when no routes found", () => {
    writeRoutesFile(`export default [];`);
    expect(discoverRoutes(tmpDir)).toEqual([]);
  });
});
