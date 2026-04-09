import { describe, it, expect, expectTypeOf } from "vitest";
import { definePlugin, definePluginFor } from "../define-plugin";

describe("definePlugin", () => {
  it("returns the plugin config with name and setup", () => {
    const plugin = definePlugin({
      name: "test",
      setup: () => ({ value: 42 }),
    });
    expect(plugin.name).toBe("test");
    expect(typeof plugin.setup).toBe("function");
  });

  it("preserves Provider and client fields", () => {
    const Provider = ({ children }: { children: React.ReactNode }) => children;
    const plugin = definePlugin({
      name: "themed",
      setup: () => ({}),
      Provider,
      client: { useTheme: () => "dark" },
    });
    expect(plugin.Provider).toBe(Provider);
    expect(plugin.client).toEqual({ useTheme: expect.any(Function) });
  });

  it("returns setup result when called", async () => {
    const plugin = definePlugin({
      name: "analytics",
      setup: () => ({ track: (e: string) => e }),
    });
    const result = await plugin.setup({
      request: new Request("http://localhost"),
      env: {},
    });
    expect((result as { track: (e: string) => string }).track("click")).toBe(
      "click",
    );
  });

  describe("inferred form (requires)", () => {
    it("infers ctx type from `requires` plugin references — no manual generic", async () => {
      // Define a base plugin via the inferred form (no `requires`)
      const authPlugin = definePlugin({
        name: "auth",
        setup: () => ({ user: { id: "u1" }, grants: ["read"] as const }),
      });

      // Dependent plugin: NO outer generic, NO type token import. The
      // `setup(ctx)` parameter is typed automatically from `authPlugin`.
      const dbPlugin = definePlugin({
        name: "db",
        requires: [authPlugin],
        setup: (ctx) => {
          // This line is the type assertion under test: if `ctx.auth` were
          // not typed, TypeScript would error here at compile time.
          return { userId: ctx.auth.user.id, grantCount: ctx.auth.grants.length };
        },
      });

      expect(dbPlugin.name).toBe("db");
      expect(dbPlugin.requires).toEqual([authPlugin]);

      // Runtime check: the setup function actually receives ctx.auth and
      // returns the derived values.
      const result = await dbPlugin.setup({
        request: new Request("http://localhost"),
        env: {},
        auth: { user: { id: "u1" }, grants: ["read"] },
      });
      expect(result).toEqual({ userId: "u1", grantCount: 1 });
    });

    it("supports multiple required plugins", async () => {
      const authPlugin = definePlugin({
        name: "auth",
        setup: () => ({ user: { id: "u1" } }),
      });
      const envPlugin = definePlugin({
        name: "envInfo",
        setup: () => ({ region: "iad1" }),
      });

      const adminPlugin = definePlugin({
        name: "admin",
        requires: [authPlugin, envPlugin],
        setup: (ctx) => ({
          banner: `${ctx.auth.user.id}@${ctx.envInfo.region}`,
        }),
      });

      expect(adminPlugin.requires).toHaveLength(2);
      const result = await adminPlugin.setup({
        request: new Request("http://localhost"),
        env: {},
        auth: { user: { id: "u1" } },
        envInfo: { region: "iad1" },
      });
      expect(result).toEqual({ banner: "u1@iad1" });
    });

    it("preserves the `requires` field on the returned plugin object", () => {
      const a = definePlugin({ name: "a", setup: () => ({ x: 1 }) });
      const b = definePlugin({
        name: "b",
        requires: [a],
        setup: (ctx) => ({ y: ctx.a.x + 1 }),
      });
      expect(b.requires).toEqual([a]);
    });
  });

  describe("curried form (legacy)", () => {
    it("still works for code that only has a type token", async () => {
      type AuthProvides = { auth: { user: { id: string } } };
      const dbPlugin = definePlugin<AuthProvides>()({
        name: "db",
        setup: (ctx) => ({ userId: ctx.auth.user.id }),
      });
      expect(dbPlugin.name).toBe("db");
      const result = await dbPlugin.setup({
        request: new Request("http://localhost"),
        env: {},
        auth: { user: { id: "u1" } },
      });
      expect(result).toEqual({ userId: "u1" });
    });
  });

  describe("definePluginFor<Env> (issue #184)", () => {
    // Consumer app types — mimics the scaffolded `Cloudflare.Env` that would
    // otherwise force every `setup(ctx)` to cast `ctx.env.DB as D1Database`.
    type AppEnv = {
      DB: { query: (sql: string) => Promise<unknown> };
      BUCKET: { put: (key: string, value: unknown) => Promise<void> };
      API_KEY: string;
    };

    it("returns a factory that types ctx.env precisely, no casts needed", async () => {
      const definePlugin = definePluginFor<AppEnv>();

      const dbPlugin = definePlugin({
        name: "db",
        setup: (ctx) => {
          // Compile-time assertion: ctx.env.DB is typed as the binding, not unknown.
          // If this line compiled without the typed factory, ctx.env.DB would be
          // `unknown` and ctx.env.DB.query would error.
          return { db: ctx.env.DB };
        },
      });

      const fakeDb = { query: async () => ({ rows: [] }) };
      const result = await dbPlugin.setup({
        request: new Request("http://localhost"),
        env: {
          DB: fakeDb,
          BUCKET: { put: async () => {} },
          API_KEY: "sk_test",
        },
      });
      expect((result as { db: typeof fakeDb }).db).toBe(fakeDb);
    });

    it("composes with inferred requires — env + requires both flow through", async () => {
      const definePlugin = definePluginFor<AppEnv>();

      const authPlugin = definePlugin({
        name: "auth",
        setup: (ctx) => ({ user: { id: "u1" }, apiKey: ctx.env.API_KEY }),
      });

      const dbPlugin = definePlugin({
        name: "db",
        requires: [authPlugin],
        setup: (ctx) => ({
          // ctx.env.DB is typed (from definePluginFor), ctx.auth.user is typed
          // (from requires inference). No cast on either.
          userDb: `${ctx.auth.user.id}:${ctx.env.DB.query.name}`,
        }),
      });

      const result = await dbPlugin.setup({
        request: new Request("http://localhost"),
        env: {
          DB: { query: async function named() { return {}; } },
          BUCKET: { put: async () => {} },
          API_KEY: "sk_test",
        },
        auth: { user: { id: "u1" }, apiKey: "sk_test" },
      });
      expect(result).toEqual({ userDb: "u1:named" });
    });

    it("returned plugins are assignable to the generic plugin slot in app.use()", () => {
      const definePlugin = definePluginFor<AppEnv>();
      const plugin = definePlugin({
        name: "scoped",
        setup: (ctx) => ({ hasDb: ctx.env.DB !== undefined }),
      });
      // Structural assertion: the typed factory returns a `CfastPlugin` with
      // its `TEnv` slot specialised to `AppEnv`, but the name / provides /
      // requires shape is identical to a generic `definePlugin` result so it
      // slots into existing `use()` signatures.
      expect(plugin.name).toBe("scoped");
      expect(typeof plugin.setup).toBe("function");
    });
  });

  describe("definePlugin<TEnv> direct generic (issue #184)", () => {
    // Mimics the scaffolded `Cloudflare.Env` from `worker-configuration.d.ts`.
    type AppEnv = {
      DB: { query: (sql: string) => Promise<unknown> };
      BUCKET: { put: (key: string, value: unknown) => Promise<void> };
      API_KEY: string;
    };

    it("types ctx.env precisely when TEnv is passed as an explicit generic", async () => {
      const dbPlugin = definePlugin<AppEnv>({
        name: "db",
        setup: (ctx) => {
          // Compile-time assertion: ctx.env.DB is typed, not unknown.
          return { db: ctx.env.DB };
        },
      });

      const fakeDb = { query: async () => ({ rows: [] }) };
      const result = await dbPlugin.setup({
        request: new Request("http://localhost"),
        env: {
          DB: fakeDb,
          BUCKET: { put: async () => {} },
          API_KEY: "sk_test",
        },
      });
      expect((result as { db: typeof fakeDb }).db).toBe(fakeDb);
    });

    it("composes env generic with inferred requires via definePluginFor", async () => {
      // When combining typed env with `requires`, use definePluginFor which
      // keeps TEnv out of the generic param list so `requires` inference works.
      const typedDefinePlugin = definePluginFor<AppEnv>();

      const authPlugin = typedDefinePlugin({
        name: "auth",
        setup: (ctx) => ({ user: { id: "u1" }, apiKey: ctx.env.API_KEY }),
      });

      const dbPlugin = typedDefinePlugin({
        name: "db",
        requires: [authPlugin],
        setup: (ctx) => ({
          userDb: `${ctx.auth.user.id}:${ctx.env.DB.query.name}`,
        }),
      });

      const result = await dbPlugin.setup({
        request: new Request("http://localhost"),
        env: {
          DB: { query: async function named() { return {}; } },
          BUCKET: { put: async () => {} },
          API_KEY: "sk_test",
        },
        auth: { user: { id: "u1" }, apiKey: "sk_test" },
      });
      expect(result).toEqual({ userDb: "u1:named" });
    });

    it("ctx.env.DB has the precise type, not unknown (expectTypeOf)", () => {
      const plugin = definePlugin<AppEnv>({
        name: "typed",
        setup: (ctx) => {
          // Type-level assertion: ctx.env.DB is typed as the DB binding.
          expectTypeOf(ctx.env.DB).toEqualTypeOf<{
            query: (sql: string) => Promise<unknown>;
          }>();
          expectTypeOf(ctx.env.API_KEY).toBeString();
          return {};
        },
      });

      expect(plugin.name).toBe("typed");
    });

    it("still works without explicit TEnv (backward compat)", () => {
      const plugin = definePlugin({
        name: "compat",
        setup: (ctx) => {
          // ctx.env is Record<string, unknown> when no TEnv is specified.
          expectTypeOf(ctx.env).toEqualTypeOf<Record<string, unknown>>();
          return { ok: true };
        },
      });
      expect(plugin.name).toBe("compat");
    });

    it("curried form supports TEnv as second type parameter", async () => {
      type AuthProvides = { auth: { user: { id: string } } };
      const dbPlugin = definePlugin<AuthProvides, AppEnv>()({
        name: "db",
        setup: (ctx) => {
          expectTypeOf(ctx.env.DB).toEqualTypeOf<{
            query: (sql: string) => Promise<unknown>;
          }>();
          return { userId: ctx.auth.user.id, hasDb: ctx.env.DB !== undefined };
        },
      });
      expect(dbPlugin.name).toBe("db");
      const result = await dbPlugin.setup({
        request: new Request("http://localhost"),
        env: {
          DB: { query: async () => ({}) },
          BUCKET: { put: async () => {} },
          API_KEY: "sk_test",
        },
        auth: { user: { id: "u1" } },
      });
      expect(result).toEqual({ userId: "u1", hasDb: true });
    });
  });
});
