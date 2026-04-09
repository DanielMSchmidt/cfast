import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scaffold } from "../scaffold";
import { resolveConfig } from "../config";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyConfig(targetDir: string) {
  return resolveConfig({
    projectName: "scaffold-test",
    targetDir,
    features: {
      auth: false,
      db: false,
      storage: false,
      email: false,
      ui: false,
      admin: false,
    },
    uiLibrary: null,
  });
}

function makeTmpParent(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "cfast-scaffold-test-"));
}

// ---------------------------------------------------------------------------
// Error conditions
// ---------------------------------------------------------------------------

describe("scaffold — error conditions", () => {
  it("throws when target directory exists and is non-empty", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cfast-nonempty-"));
    fs.writeFileSync(path.join(dir, "existing.txt"), "I exist");

    expect(() => scaffold(emptyConfig(dir))).toThrow(/already exists/);
  });

  it("does not throw when target directory is freshly created (empty)", () => {
    const parent = makeTmpParent();
    const targetDir = path.join(parent, "new-empty-app");

    expect(() => scaffold(emptyConfig(targetDir))).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Generated structure — minimal (no features)
// ---------------------------------------------------------------------------

describe("scaffold — minimal (no features)", () => {
  function setup() {
    const parent = makeTmpParent();
    const targetDir = path.join(parent, "minimal-app");
    scaffold(emptyConfig(targetDir));
    return targetDir;
  }

  it("creates package.json", () => {
    const dir = setup();
    expect(fs.existsSync(path.join(dir, "package.json"))).toBe(true);
  });

  it("creates wrangler.toml", () => {
    const dir = setup();
    expect(fs.existsSync(path.join(dir, "wrangler.toml"))).toBe(true);
  });

  it("creates app/env.ts", () => {
    const dir = setup();
    expect(fs.existsSync(path.join(dir, "app", "env.ts"))).toBe(true);
  });

  it("creates app/cfast.server.ts", () => {
    const dir = setup();
    expect(fs.existsSync(path.join(dir, "app", "cfast.server.ts"))).toBe(true);
  });

  it("does NOT generate .dev.vars without auth", () => {
    const dir = setup();
    expect(fs.existsSync(path.join(dir, ".dev.vars"))).toBe(false);
  });

  it("does NOT generate auth.setup.server.ts without auth", () => {
    const dir = setup();
    expect(
      fs.existsSync(path.join(dir, "app", "auth.setup.server.ts")),
    ).toBe(false);
  });

  it("replaces {{projectName}} in wrangler.toml", () => {
    const parent = makeTmpParent();
    const targetDir = path.join(parent, "my-project");
    scaffold(
      resolveConfig({
        projectName: "my-project",
        targetDir,
        features: {
          auth: false,
          db: false,
          storage: false,
          email: false,
          ui: false,
          admin: false,
        },
        uiLibrary: null,
      }),
    );

    const wrangler = fs.readFileSync(
      path.join(targetDir, "wrangler.toml"),
      "utf-8",
    );
    expect(wrangler).toContain("my-project");
    expect(wrangler).not.toContain("{{projectName}}");
  });
});

// ---------------------------------------------------------------------------
// Auth feature — additional generated files
// ---------------------------------------------------------------------------

describe("scaffold — auth feature", () => {
  function setup() {
    const parent = makeTmpParent();
    const targetDir = path.join(parent, "auth-app");
    scaffold(
      resolveConfig({
        projectName: "auth-app",
        targetDir,
        features: {
          auth: true,
          db: false,
          storage: false,
          email: false,
          ui: false,
          admin: false,
        },
        uiLibrary: null,
      }),
    );
    return targetDir;
  }

  it("does NOT generate .dev.vars with auth alone (email must be enabled)", () => {
    const dir = setup();
    // .dev.vars is only generated when features.email is true (for MAILGUN_API_KEY).
    // Auth alone (passkey-only) doesn't require email secrets.
    expect(fs.existsSync(path.join(dir, ".dev.vars"))).toBe(false);
  });

  it("generates auth.setup.server.ts when auth is enabled", () => {
    const dir = setup();
    expect(
      fs.existsSync(path.join(dir, "app", "auth.setup.server.ts")),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Config resolution — dependency cascade
// ---------------------------------------------------------------------------

describe("scaffold — feature dependency cascade", () => {
  it("admin feature auto-resolves db, ui, and auth", () => {
    const parent = makeTmpParent();
    const targetDir = path.join(parent, "admin-app");

    // admin only — other features false
    scaffold(
      resolveConfig({
        projectName: "admin-app",
        targetDir,
        features: {
          auth: false,
          db: false,
          storage: false,
          email: false,
          ui: false,
          admin: true,
        },
        uiLibrary: null,
      }),
    );

    // admin → auth → db+ui. .dev.vars is NOT generated because
    // admin doesn't cascade to email (only email → .dev.vars).
    expect(fs.existsSync(path.join(targetDir, ".dev.vars"))).toBe(false);
    // auth.setup.server.ts IS generated because admin → auth.
    expect(
      fs.existsSync(path.join(targetDir, "app", "auth.setup.server.ts")),
    ).toBe(true);
  });
});
