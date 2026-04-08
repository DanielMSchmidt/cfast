/**
 * Regression tests for #190: the scaffolded `scripts/seed.ts` must use
 * the canonical `defineSeed()` helper from `@cfast/db`, not the
 * hand-rolled `db.mutate("tablename")` or `db.insert` patterns demo
 * apps used to copy.
 */
import { describe, it, expect, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Config, Features } from "../types";
import { scaffold } from "../scaffold";
import { resolveConfig } from "../config";
import { generateSeedScript } from "../generators/seed-script";

const tempDirs: string[] = [];

function scaffoldAt(label: string, features: Partial<Features>): string {
  const wsRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), `cfast-seed-${label}-`),
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
    uiLibrary: null,
  };

  scaffold(resolveConfig(config));
  return targetDir;
}

afterAll(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("generateSeedScript (#190)", () => {
  const source = generateSeedScript({
    projectName: "test-seed",
    targetDir: "/tmp/test-seed",
    features: {
      db: true,
      auth: false,
      storage: false,
      email: false,
      ui: false,
      admin: false,
    },
    uiLibrary: null,
  });

  it("imports defineSeed from @cfast/db", () => {
    expect(source).toContain(
      `import { createDb, defineSeed } from "@cfast/db"`,
    );
  });

  it("declares the seed via defineSeed({ entries })", () => {
    expect(source).toContain("defineSeed({");
    expect(source).toContain("entries:");
  });

  it("uses a schema table reference, not a string table name", () => {
    expect(source).toContain("table: schema.items");
    // Regression guard for the old `db.mutate("tablename")` pattern
    // that demo apps were copying — `mutate` never existed on `@cfast/db`.
    expect(source).not.toContain("db.mutate");
  });

  it("calls seed.run(db) against a real Db instance", () => {
    expect(source).toContain("await seed.run(db)");
  });

  it("creates the db via createDb({ d1, schema, grants, user })", () => {
    expect(source).toContain("createDb({");
    expect(source).toContain("d1: proxy.env.DB");
    expect(source).toContain("grants: [],");
    expect(source).toContain("user: null");
  });
});

describe("scaffold writes scripts/seed.ts when db is enabled (#190)", () => {
  it("writes scripts/seed.ts for db-only scaffold", () => {
    const targetDir = scaffoldAt("db-only", { db: true });
    const seedPath = path.join(targetDir, "scripts", "seed.ts");
    expect(fs.existsSync(seedPath)).toBe(true);
    expect(fs.readFileSync(seedPath, "utf-8")).toContain("defineSeed");
  });

  it("writes scripts/seed.ts for db+auth+ui scaffold", () => {
    const targetDir = scaffoldAt("db-auth-ui", {
      db: true,
      auth: true,
      ui: true,
    });
    expect(
      fs.existsSync(path.join(targetDir, "scripts", "seed.ts")),
    ).toBe(true);
  });

  it("does NOT write scripts/seed.ts when db is disabled", () => {
    const targetDir = scaffoldAt("no-db", {});
    expect(
      fs.existsSync(path.join(targetDir, "scripts", "seed.ts")),
    ).toBe(false);
  });
});

describe("package.json wires db:seed:local + tsx devDep (#190)", () => {
  it("adds db:seed:local script for db-enabled scaffolds", () => {
    const targetDir = scaffoldAt("pkg-db", { db: true });
    const pkg = JSON.parse(
      fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"),
    ) as {
      scripts: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(pkg.scripts["db:seed:local"]).toBe("tsx scripts/seed.ts");
    expect(pkg.devDependencies.tsx).toBeDefined();
  });

  it("does not add db:seed:local when db is disabled", () => {
    const targetDir = scaffoldAt("pkg-nodb", {});
    const pkg = JSON.parse(
      fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"),
    ) as { scripts: Record<string, string> };
    expect(pkg.scripts["db:seed:local"]).toBeUndefined();
  });
});
