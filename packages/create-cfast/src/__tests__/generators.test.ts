import { describe, it, expect } from "vitest";
import { mergePackageJsons, type PkgFragment } from "../generators/package-json";
import { generateWranglerToml } from "../generators/wrangler-toml";
import { generateEnv } from "../generators/env";
import { generateCfastServer } from "../generators/cfast-server";
import { generateViteConfig } from "../generators/vite-config";
import { generateRootTsx } from "../generators/root-tsx";
import { generateRoutesTs } from "../generators/routes-ts";
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

describe("generateEnv", () => {
  it("always includes APP_URL", () => {
    const result = generateEnv(baseConfig);
    expect(result).toContain("APP_URL");
  });

  it("adds DB binding when db enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, db: true },
    };
    const result = generateEnv(config);
    expect(result).toContain("DB");
    expect(result).toContain('"d1"');
  });

  it("adds MAILGUN when email enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, email: true },
    };
    const result = generateEnv(config);
    expect(result).toContain("MAILGUN_API_KEY");
    expect(result).toContain("MAILGUN_DOMAIN");
  });
});

describe("generateCfastServer", () => {
  it("always imports createApp", () => {
    const result = generateCfastServer(baseConfig);
    expect(result).toContain("createApp");
  });

  it("adds auth plugin when auth enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, auth: true, db: true },
    };
    const result = generateCfastServer(config);
    expect(result).toContain("authPlugin");
    expect(result).toContain("initAuth");
  });

  it("adds db plugin when db enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, db: true },
    };
    const result = generateCfastServer(config);
    expect(result).toContain("dbPlugin");
    expect(result).toContain("createDb");
  });
});

describe("generateViteConfig", () => {
  it("always includes cloudflare and reactRouter plugins", () => {
    const result = generateViteConfig(baseConfig);
    expect(result).toContain("cloudflare");
    expect(result).toContain("reactRouter");
  });

  it("adds optimizeDeps when ui enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, ui: true },
      uiLibrary: "joy" as const,
    };
    const result = generateViteConfig(config);
    expect(result).toContain("optimizeDeps");
    expect(result).toContain("@cfast/ui/joy");
  });
});

describe("generateRootTsx", () => {
  it("generates plain root without ui", () => {
    const result = generateRootTsx(baseConfig);
    expect(result).not.toContain("CssVarsProvider");
    expect(result).toContain("Outlet");
  });

  it("adds Joy UI providers when ui=joy", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, ui: true },
      uiLibrary: "joy" as const,
    };
    const result = generateRootTsx(config);
    expect(result).toContain("CssVarsProvider");
    expect(result).toContain("CssBaseline");
  });

  it("adds AuthClientProvider when auth enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, auth: true, db: true },
    };
    const result = generateRootTsx(config);
    expect(result).toContain("AuthClientProvider");
  });
});

describe("generateRoutesTs", () => {
  it("always includes index route", () => {
    const result = generateRoutesTs(baseConfig);
    expect(result).toContain("index(");
  });

  it("adds auth routes when auth enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, auth: true, db: true },
    };
    const result = generateRoutesTs(config);
    expect(result).toContain("login");
    expect(result).toContain("api/auth/*");
  });

  it("adds admin route when admin enabled", () => {
    const config = {
      ...baseConfig,
      features: {
        ...baseConfig.features,
        admin: true,
        db: true,
        auth: true,
        ui: true,
      },
    };
    const result = generateRoutesTs(config);
    expect(result).toContain("admin");
  });
});
