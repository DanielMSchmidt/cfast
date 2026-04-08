import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { mergePackageJsons, type PkgFragment } from "../generators/package-json";
import { generateWranglerToml } from "../generators/wrangler-toml";
import { generateEnv } from "../generators/env";
import { generateCfastServer } from "../generators/cfast-server";
import { generateViteConfig } from "../generators/vite-config";
import { generateRootTsx } from "../generators/root-tsx";
import { generateRoutesTs } from "../generators/routes-ts";
import { generateAuthSetup } from "../generators/auth-setup";
import { getTemplatesDir } from "../utils";
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
    // The scaffold uses the consolidated createAppDb factory (#149) instead
    // of inlining createDb in three separate places.
    expect(result).toContain("createAppDb");
  });

  it("exports a single appDb factory shared across cfast.server / admin (#149)", () => {
    // Regression guard for #149: the scaffold must export `appDb` from
    // cfast.server.ts so admin.server.ts can re-use it instead of defining
    // its own createDbForAdmin wrapper. The factory closes over a lazy
    // env getter so the same module-level export works on Workers.
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, db: true, auth: true },
    };
    const result = generateCfastServer(config);
    expect(result).toContain("export const appDb");
    expect(result).toContain("createAppDb({");
    expect(result).toContain("env.get().DB");
    // Plugin setup should consume the shared factory rather than re-deriving
    // its own createDb call.
    expect(result).toMatch(/appDb\(\s*ctx\.auth\.grants/);
  });

  it("casts schema to Record<string, object> (not Record<string, unknown>)", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, db: true },
    };
    const result = generateCfastServer(config);
    expect(result).toContain("Record<string, object>");
    expect(result).not.toContain("Record<string, unknown>");
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
    expect(result).toContain("@cfast/joy");
  });

  it("wires the cfast routes-check plugin", () => {
    const result = generateViteConfig(baseConfig);
    expect(result).toContain(`from "./vite-plugin-cfast-routes"`);
    expect(result).toContain("cfastRoutesCheckPlugin()");
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

  it("emits JSDoc warning that routes are not auto-discovered", () => {
    const result = generateRoutesTs(baseConfig);
    expect(result).toContain("does NOT auto-discover");
    expect(result).toContain("MUST be added here");
    expect(result).toMatch(/\/\*\*[\s\S]*Route registry for this app[\s\S]*\*\//);
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

describe("generateAuthSetup", () => {
  it("uses console.log when email is not enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, auth: true, db: true },
    };
    const result = generateAuthSetup(config);
    expect(result).toContain("createAuth");
    expect(result).toContain("console.log");
    expect(result).not.toContain("emailClient");
  });

  it("uses @cfast/email when email is enabled", () => {
    const config = {
      ...baseConfig,
      features: { ...baseConfig.features, auth: true, db: true, email: true },
    };
    const result = generateAuthSetup(config);
    expect(result).toContain("createAuth");
    expect(result).toContain("emailClient");
    expect(result).toContain("MagicLinkEmail");
    expect(result).not.toContain("console.log");
  });

  it("includes project name in email subject when email enabled", () => {
    const config = {
      ...baseConfig,
      projectName: "my-app",
      features: { ...baseConfig.features, auth: true, db: true, email: true },
    };
    const result = generateAuthSetup(config);
    expect(result).toContain("Sign in to my-app");
  });
});

describe("base template package.json", () => {
  const basePkgPath = path.join(getTemplatesDir(), "base", "package.json");
  const basePkg = JSON.parse(fs.readFileSync(basePkgPath, "utf-8")) as {
    scripts: Record<string, string>;
  };

  // Regression guard for #174: `worker-configuration.d.ts` is gitignored
  // but referenced in tsconfig.cloudflare.json's `include`. A fresh clone
  // therefore fails `tsc -b` until wrangler types are regenerated. Prepend
  // `wrangler types` to the typecheck script so it is idempotent and
  // self-healing on fresh checkouts.
  it("prepends `wrangler types` to typecheck so fresh checkouts self-heal", () => {
    expect(basePkg.scripts.typecheck).toMatch(/^wrangler types &&/);
  });

  it("still runs react-router typegen and tsc -b after wrangler types", () => {
    expect(basePkg.scripts.typecheck).toContain("react-router typegen");
    expect(basePkg.scripts.typecheck).toContain("tsc -b");
  });
});

// Regression guards for the `auth.helpers.server.ts` and `admin.server.ts`
// templates. The scaffold-build tests already prove these files type-check
// and build end-to-end; these tests pin the specific shape we care about
// (#151 and #156) so an accidental revert is caught immediately without
// waiting for the 5-minute e2e pass.
describe("auth overlay template: auth.helpers.server.ts (#151)", () => {
  const helpersPath = path.join(
    getTemplatesDir(),
    "auth",
    "app",
    "auth.helpers.server.ts",
  );
  const source = fs.readFileSync(helpersPath, "utf-8");

  it("caches the auth instance per Request via a WeakMap", () => {
    // The whole point of the fix: subsequent helper calls during one
    // request must reuse a single `AuthInstance` instead of re-running
    // `initAuth()`. A WeakMap<Request, AuthInstance> is the shape we
    // settled on so entries drop automatically with the request.
    expect(source).toMatch(/WeakMap<Request,\s*AuthInstance>/);
  });

  it("exposes `getAuth(request)` and every helper threads the request through", () => {
    expect(source).toMatch(/export function getAuth\(request: Request\)/);
    // None of the downstream helpers should re-run `initAuth()` — they
    // should all go through the cached `getAuth(request)` indirection.
    const bodies = source.slice(source.indexOf("export async function getAuthContext"));
    expect(bodies).toContain("getAuth(request).createContext(request)");
    expect(bodies).toContain("getAuth(request).requireUser(request)");
    // `initAuth` is only called inside the WeakMap cache miss branch.
    const initCallSites = bodies.match(/initAuth\(/g);
    expect(initCallSites).toBeNull();
  });
});

describe("admin overlay template: admin.server.ts (#156)", () => {
  const adminPath = path.join(
    getTemplatesDir(),
    "admin",
    "app",
    "admin.server.ts",
  );
  const source = fs.readFileSync(adminPath, "utf-8");

  it("memoizes the AuthInstance by D1 handle", () => {
    // Every role callback previously re-ran `initAuth()` from scratch.
    // The fix memoizes by the D1 binding so a user-detail view that
    // touches getRoles + setRole + removeRole shares a single instance.
    expect(source).toMatch(/WeakMap<D1Database,\s*AuthInstance>/);
    expect(source).toMatch(/function getAdminAuth\(\)/);
  });

  it("uses the grouped `auth.roles.*` API on the shared instance", () => {
    expect(source).toContain("getAdminAuth().roles.get(userId)");
    expect(source).toContain("getAdminAuth().roles.set(userId, role)");
    expect(source).toContain("getAdminAuth().roles.remove(userId, role)");
    expect(source).toContain("getAdminAuth().roles.setAll(userId, roles)");
  });

  it("does not re-run initAuth() inside each role callback", () => {
    // The regression we are guarding against: a fresh `initAuth(...)`
    // call inside every callback. The only initAuth call should live
    // inside the `getAdminAuth()` cache miss branch.
    const callbacksStart = source.indexOf("const auth: AdminAuthConfig");
    const callbacks = source.slice(callbacksStart);
    expect(callbacks).not.toContain("initAuth({");
  });
});
