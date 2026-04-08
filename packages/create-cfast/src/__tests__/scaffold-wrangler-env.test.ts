/**
 * Regression tests for #183: the scaffolded `wrangler.toml` must emit
 * every repeated binding (d1_databases, r2_buckets, kv_namespaces) as a
 * TOML array-of-tables (`[[...]]`). The single-bracket form
 * `[env.production.kv_namespaces]` is an inline-table declaration, which
 * wrangler and `wrangler types` both refuse — `pnpm typecheck` crashes
 * with `ERROR: ...` on the very first run of a fresh scaffold.
 *
 * These tests exercise `generateWranglerToml` directly (no disk / no
 * scaffold roundtrip) so they run in single-digit milliseconds and are
 * safe to guard the CI pipeline.
 */
import { describe, it, expect } from "vitest";
import type { Config, Features } from "../types";
import { generateWranglerToml } from "../generators/wrangler-toml";

const allFeatures: Features = {
  db: true,
  auth: true,
  ui: true,
  admin: true,
  storage: true,
  email: true,
};

function tomlWith(features: Partial<Features>): string {
  const config: Config = {
    projectName: "test-wrangler-env",
    targetDir: "/tmp/test-wrangler-env",
    features: {
      db: false,
      auth: false,
      storage: false,
      email: false,
      ui: false,
      admin: false,
      ...features,
    },
    uiLibrary: null,
  };
  return generateWranglerToml(config);
}

describe("wrangler.toml env bindings use [[...]] array-of-tables (#183)", () => {
  const toml = tomlWith(allFeatures);

  it("emits [env.staging] and [env.production] sections", () => {
    expect(toml).toContain("[env.staging]");
    expect(toml).toContain("[env.production]");
  });

  it("uses [[env.staging.d1_databases]] (NOT [env.staging.d1_databases])", () => {
    expect(toml).toContain("[[env.staging.d1_databases]]");
    expect(toml).toContain("[[env.production.d1_databases]]");
    // The BAD single-bracket form that crashes `wrangler types`.
    expect(toml).not.toMatch(/^\[env\.staging\.d1_databases\]$/m);
    expect(toml).not.toMatch(/^\[env\.production\.d1_databases\]$/m);
  });

  it("uses [[env.*.kv_namespaces]] for auth's CACHE binding", () => {
    expect(toml).toContain("[[env.staging.kv_namespaces]]");
    expect(toml).toContain("[[env.production.kv_namespaces]]");
    expect(toml).not.toMatch(/^\[env\.staging\.kv_namespaces\]$/m);
    expect(toml).not.toMatch(/^\[env\.production\.kv_namespaces\]$/m);
  });

  it("uses [[env.*.r2_buckets]] for storage's UPLOADS binding", () => {
    expect(toml).toContain("[[env.staging.r2_buckets]]");
    expect(toml).toContain("[[env.production.r2_buckets]]");
    expect(toml).not.toMatch(/^\[env\.staging\.r2_buckets\]$/m);
    expect(toml).not.toMatch(/^\[env\.production\.r2_buckets\]$/m);
  });

  it("keeps the local-dev top-level bindings alongside env.* blocks", () => {
    // `wrangler dev` / `pnpm dev` reads the top-level (non-env) section,
    // so that MUST remain even when env.* bindings are added for deploys.
    const lines = toml.split("\n");
    const topLevelD1 = lines.findIndex((l) => l === "[[d1_databases]]");
    const stagingD1 = lines.findIndex(
      (l) => l === "[[env.staging.d1_databases]]",
    );
    expect(topLevelD1).toBeGreaterThanOrEqual(0);
    expect(stagingD1).toBeGreaterThan(topLevelD1);
  });

  it("catches every single-bracket form across the full wrangler.toml", () => {
    // A single regex sweep that would flag ANY regression into the BAD
    // form, even for a new binding type someone adds later without
    // thinking about TOML semantics.
    const singleBracketBad = toml.match(
      /^\[env\.\w+\.(?:d1_databases|r2_buckets|kv_namespaces|durable_objects|queues)\]$/gm,
    );
    expect(singleBracketBad).toBeNull();
  });

  it("never emits env.* sections when the feature is disabled", () => {
    // A db-only scaffold should still emit env.staging/production blocks
    // (for vars at least) but MUST NOT contain kv or r2 binding sections
    // because auth/storage are off.
    const dbOnly = tomlWith({ db: true });
    expect(dbOnly).toContain("[[env.staging.d1_databases]]");
    expect(dbOnly).not.toContain("kv_namespaces");
    expect(dbOnly).not.toContain("r2_buckets");
  });

  it("keeps env.* [vars] tables in sync with the top-level [vars]", () => {
    // Deploy envs need their own copy of APP_URL etc, otherwise wrangler
    // falls back to secrets / fails at build.
    expect(toml).toContain("[env.staging.vars]");
    expect(toml).toContain("[env.production.vars]");
    expect(toml).toContain("APP_URL");
  });
});
