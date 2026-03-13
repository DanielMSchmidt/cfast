import { describe, it, expect } from "vitest";
import { mergePackageJsons, type PkgFragment } from "../generators/package-json";
import { generateWranglerToml } from "../generators/wrangler-toml";
import type { Config } from "../types";

describe("mergePackageJsons", () => {
  it("merges dependencies from multiple fragments", () => {
    const base = {
      name: "test",
      dependencies: { react: "^19.0.0" },
      devDependencies: { typescript: "^5.0.0" },
      scripts: { dev: "vite" },
    };
    const fragments: PkgFragment[] = [
      {
        dependencies: { "drizzle-orm": "^0.45.0" },
        scripts: { "db:generate": "drizzle-kit generate" },
      },
      { dependencies: { "better-auth": "^1.2.0" } },
    ];

    const result = mergePackageJsons(base, fragments);
    expect(result.dependencies!.react).toBe("^19.0.0");
    expect(result.dependencies!["drizzle-orm"]).toBe("^0.45.0");
    expect(result.dependencies!["better-auth"]).toBe("^1.2.0");
    expect(result.scripts!["db:generate"]).toBe("drizzle-kit generate");
    expect(result.scripts!.dev).toBe("vite");
  });

  it("sorts dependencies alphabetically", () => {
    const base = {
      name: "test",
      dependencies: { zod: "^3.0.0", axios: "^1.0.0" },
    };
    const result = mergePackageJsons(base, []);
    const keys = Object.keys(result.dependencies!);
    expect(keys).toEqual(["axios", "zod"]);
  });

  it("produces valid JSON string", () => {
    const base = { name: "test", dependencies: {} };
    const result = mergePackageJsons(base, []);
    expect(() => JSON.parse(JSON.stringify(result))).not.toThrow();
  });
});

const baseConfig: Config = {
  projectName: "test-app",
  targetDir: "/tmp/test-app",
  features: {
    auth: false,
    db: false,
    storage: false,
    email: false,
    ui: false,
    admin: false,
  },
  uiLibrary: null,
};

describe("generateWranglerToml", () => {
  it("generates minimal config without features", () => {
    const result = generateWranglerToml(baseConfig);
    expect(result).toContain('name = "test-app"');
    expect(result).not.toContain("[[d1_databases]]");
    expect(result).not.toContain("[[r2_buckets]]");
  });

  it("adds D1 binding when db is enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, db: true },
    };
    const result = generateWranglerToml(config);
    expect(result).toContain("[[d1_databases]]");
    expect(result).toContain('binding = "DB"');
  });

  it("adds R2 binding when storage is enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, storage: true },
    };
    const result = generateWranglerToml(config);
    expect(result).toContain("[[r2_buckets]]");
    expect(result).toContain('binding = "UPLOADS"');
  });

  it("adds KV binding when auth is enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, auth: true, db: true },
    };
    const result = generateWranglerToml(config);
    expect(result).toContain("[[kv_namespaces]]");
    expect(result).toContain('binding = "CACHE"');
  });

  it("adds MAILGUN vars when email is enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, email: true },
    };
    const result = generateWranglerToml(config);
    expect(result).toContain("MAILGUN_DOMAIN");
  });
});
