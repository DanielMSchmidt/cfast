import { describe, it, expect } from "vitest";
import { definePlugin } from "../define-plugin";

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
});
