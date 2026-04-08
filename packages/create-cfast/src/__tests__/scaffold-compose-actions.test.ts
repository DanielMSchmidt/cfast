/**
 * Regression tests for #153: the scaffolded app must ship a worked
 * `composeActions` example so consumers stop rolling their own
 * `request.formData()` handlers (which silently bypass every permission
 * check and miss the `intent` hidden field).
 *
 * The example is emitted for the `db + ui + auth` combo (which is the
 * shape every real app lands on, and what `--all` produces). Earlier
 * demo apps used raw React Router `action` functions because there was
 * no reference to copy from — this file makes sure the reference stays
 * intact.
 */
import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Config, Features } from "../types";
import { scaffold } from "../scaffold";
import { resolveConfig } from "../config";
import {
  shouldEmitItemsExample,
  generateItemsServer,
  generateItemsRoute,
} from "../generators/items-example";
import { generateRoutesTs } from "../generators/routes-ts";

const tempDirs: string[] = [];

function scaffoldAt(label: string, features: Partial<Features>): string {
  const wsRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), `cfast-compose-${label}-`),
  );
  const targetDir = path.join(wsRoot, `test-${label}`);
  fs.mkdirSync(targetDir, { recursive: true });
  tempDirs.push(wsRoot);

  const config: Config = {
    projectName: `test-${label}`,
    targetDir,
    features: {
      auth: false,
      db: false,
      storage: false,
      email: false,
      ui: false,
      admin: false,
      ...features,
    },
    uiLibrary: features.ui || features.auth || features.admin ? "joy" : null,
  };

  scaffold(resolveConfig(config));
  return targetDir;
}

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function stripComments(src: string): string {
  // Same comment-stripping pass the smoke spec uses so anti-pattern
  // examples inside JSDoc blocks don't false-positive on "bad shape"
  // regexes.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

describe("shouldEmitItemsExample (#153)", () => {
  const makeConfig = (features: Partial<Features>): Config => ({
    projectName: "test",
    targetDir: "/tmp/test",
    features: {
      auth: false,
      db: false,
      storage: false,
      email: false,
      ui: false,
      admin: false,
      ...features,
    },
    uiLibrary: null,
  });

  it("emits for db + ui + auth", () => {
    expect(
      shouldEmitItemsExample(
        makeConfig({ db: true, ui: true, auth: true }),
      ),
    ).toBe(true);
  });

  it("does NOT emit for db + ui without auth (no requireAuthContext)", () => {
    expect(
      shouldEmitItemsExample(makeConfig({ db: true, ui: true })),
    ).toBe(false);
  });

  it("does NOT emit for ui without db (no items table)", () => {
    expect(
      shouldEmitItemsExample(makeConfig({ ui: true, auth: true })),
    ).toBe(false);
  });

  it("does NOT emit for db without ui (no @cfast/actions)", () => {
    expect(shouldEmitItemsExample(makeConfig({ db: true }))).toBe(false);
  });
});

describe("generateItemsServer (#153)", () => {
  const source = generateItemsServer({
    projectName: "test",
    targetDir: "/tmp/test",
    features: {
      auth: true,
      db: true,
      storage: false,
      email: false,
      ui: true,
      admin: false,
    },
    uiLibrary: "joy",
  });

  it("imports createAction from the shared ~/actions.server factory", () => {
    expect(source).toContain(`import { createAction } from "~/actions.server"`);
  });

  it("declares createItem and deleteItem via createAction", () => {
    const code = stripComments(source);
    expect(code).toMatch(/export const createItem = createAction</);
    expect(code).toMatch(/export const deleteItem = createAction</);
  });

  it("uses @cfast/db insert/delete builders, not raw Drizzle", () => {
    // The generator formats multi-line chains across lines, so collapse
    // whitespace before asserting the builder entry points are present.
    const flat = source.replace(/\s+/g, " ");
    expect(flat).toContain("db .insert(items)");
    expect(flat).toContain("db.delete(items)");
  });

  it("does not call request.formData() (handled by createAction)", () => {
    expect(source).not.toContain("request.formData");
  });
});

describe("generateItemsRoute (#153)", () => {
  const source = generateItemsRoute({
    projectName: "test",
    targetDir: "/tmp/test",
    features: {
      auth: true,
      db: true,
      storage: false,
      email: false,
      ui: true,
      admin: false,
    },
    uiLibrary: "joy",
  });

  const code = stripComments(source);

  it("exports action via composeActions(...).action", () => {
    expect(code).toMatch(
      /export\s+const\s+action\s*=\s*composeActions\s*\(/,
    );
  });

  it("never hand-rolls an async function action", () => {
    expect(code).not.toMatch(
      /export\s+async\s+function\s+action\s*\(\s*{\s*request/,
    );
  });

  it("wraps the loader with composeActions(...).loader(...)", () => {
    expect(code).toMatch(/composeActions\([^)]+\)\.loader\(/);
  });

  it("calls requireAuthContext before touching the database", () => {
    // Loader must redirect unauthenticated requests BEFORE the DB query
    // runs, otherwise an anonymous request lands on the items route,
    // the `items` read fails with ForbiddenError, and React Router
    // returns a 500 instead of a 302.
    expect(code).toContain("requireAuthContext");
    const requireIdx = code.indexOf("requireAuthContext");
    const queryIdx = code.indexOf("db\n      .query");
    // If query doesn't appear in fenced form, fall back to any `query(`
    // — still must appear AFTER the auth call.
    const anyQueryIdx = code.indexOf(".query(items)");
    const effectiveQueryIdx = queryIdx >= 0 ? queryIdx : anyQueryIdx;
    expect(requireIdx).toBeGreaterThan(0);
    expect(effectiveQueryIdx).toBeGreaterThan(requireIdx);
  });

  it("uses clientDescriptor([...]) rather than composed.client", () => {
    // Importing `composed.client` from a `.server` module would pull
    // the entire server bundle into the browser — the CLAUDE.md
    // "React Router Server/Client Boundary" rule. Use the pure
    // `clientDescriptor([...])` helper instead.
    expect(code).toContain(
      `clientDescriptor(["createItem", "deleteItem"])`,
    );
    expect(code).not.toContain("composed.client");
  });

  it("uses <ActionForm intent=...> instead of raw hidden inputs", () => {
    expect(code).toContain(`<ActionForm intent="createItem">`);
    expect(code).toContain(`<ActionForm intent="deleteItem"`);
    // Raw `<input type="hidden" name="intent">` is the anti-pattern
    // ActionForm replaces.
    expect(code).not.toContain(`name="intent"`);
  });
});

describe("routes.ts registers the items example (#153)", () => {
  it("adds a route entry when db + ui + auth are enabled", () => {
    const routes = generateRoutesTs({
      projectName: "test",
      targetDir: "/tmp/test",
      features: {
        auth: true,
        db: true,
        storage: false,
        email: false,
        ui: true,
        admin: false,
      },
      uiLibrary: "joy",
    });
    expect(routes).toContain(`route("items", "routes/items.tsx")`);
  });

  it("does NOT add the route entry when db is off", () => {
    const routes = generateRoutesTs({
      projectName: "test",
      targetDir: "/tmp/test",
      features: {
        auth: false,
        db: false,
        storage: false,
        email: false,
        ui: true,
        admin: false,
      },
      uiLibrary: "joy",
    });
    expect(routes).not.toContain(`route("items", "routes/items.tsx")`);
  });
});

describe("scaffold on-disk output (#153)", () => {
  it("writes app/items.server.ts and app/routes/items.tsx for db+ui+auth", () => {
    const targetDir = scaffoldAt("compose-disk", {
      db: true,
      ui: true,
      auth: true,
    });
    expect(
      fs.existsSync(path.join(targetDir, "app", "items.server.ts")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(targetDir, "app", "routes", "items.tsx")),
    ).toBe(true);
  });

  it("omits the example for a minimal scaffold", () => {
    const targetDir = scaffoldAt("compose-minimal", {});
    expect(
      fs.existsSync(path.join(targetDir, "app", "items.server.ts")),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(targetDir, "app", "routes", "items.tsx")),
    ).toBe(false);
  });
});
