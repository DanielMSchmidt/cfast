import { describe, it, expect } from "vitest";
import { createApp } from "../create-app";
import { definePlugin } from "../define-plugin";
import { definePermissions } from "@cfast/permissions";
import { CfastPluginError, CfastConfigError } from "../errors";

const envSchema = {
  API_KEY: { type: "secret" as const },
};

const permissions = definePermissions({
  roles: ["reader", "editor"] as const,
  grants: (grant) => ({
    reader: [grant("read", "all")],
    editor: [grant("read", "all"), grant("create", "all")],
  }),
});

function makeRequest(url = "http://localhost") {
  return new Request(url);
}

describe("createApp", () => {
  describe("init and env", () => {
    it("delegates init to @cfast/env", () => {
      const app = createApp({ env: envSchema, permissions });
      app.init({ API_KEY: "sk-test" });
      expect(app.env().API_KEY).toBe("sk-test");
    });

    it("throws if env() called before init()", () => {
      const app = createApp({ env: envSchema, permissions });
      expect(() => app.env()).toThrow("env.init()");
    });

    it("exposes permissions on the app object", () => {
      const app = createApp({ env: envSchema, permissions });
      expect(app.permissions).toBe(permissions);
    });
  });

  describe("use", () => {
    it("rejects duplicate plugin names", () => {
      const p1 = definePlugin({ name: "auth", setup: () => ({}) });
      const p2 = definePlugin({ name: "auth", setup: () => ({}) });
      const app = createApp({ env: envSchema, permissions });
      expect(() => app.use(p1).use(p2)).toThrow(CfastConfigError);
      expect(() => app.use(p1).use(p2)).toThrow(/duplicate/i);
    });

    it("returns a new app instance (immutable chain)", () => {
      const app = createApp({ env: envSchema, permissions });
      const p = definePlugin({ name: "a", setup: () => ({}) });
      const app2 = app.use(p);
      expect(app2).not.toBe(app);
    });
  });

  describe("context", () => {
    it("returns env in the context", async () => {
      const app = createApp({ env: envSchema, permissions });
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.env.API_KEY).toBe("sk-test");
    });

    it("runs plugin setup and namespaces result", async () => {
      const plugin = definePlugin({
        name: "greeter",
        setup: () => ({ hello: "world" }),
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.greeter.hello).toBe("world");
    });

    it("passes prior plugin results to subsequent plugins", async () => {
      const first = definePlugin({
        name: "first",
        setup: () => ({ value: 1 }),
      });

      type FirstProvides = { first: { value: number } };
      const second = definePlugin<FirstProvides>()({
        name: "second",
        setup: (ctx) => ({ doubled: ctx.first.value * 2 }),
      });

      const app = createApp({ env: envSchema, permissions })
        .use(first)
        .use(second);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.second.doubled).toBe(2);
    });

    it("passes request and env to plugin setup", async () => {
      const plugin = definePlugin({
        name: "echo",
        setup: (ctx) => ({
          url: ctx.request.url,
          hasEnv: typeof ctx.env === "object",
        }),
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest("http://example.com/test"));
      expect(ctx.echo.url).toBe("http://example.com/test");
      expect(ctx.echo.hasEnv).toBe(true);
    });

    it("handles async plugin setup", async () => {
      const plugin = definePlugin({
        name: "async",
        setup: async () => {
          return { ready: true };
        },
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const ctx = await app.context(makeRequest());
      expect(ctx.async.ready).toBe(true);
    });

    it("wraps plugin errors in CfastPluginError", async () => {
      const plugin = definePlugin({
        name: "broken",
        setup: () => {
          throw new Error("D1 binding not found");
        },
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      try {
        await app.context(makeRequest());
        expect.unreachable("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(CfastPluginError);
        expect((e as CfastPluginError).pluginName).toBe("broken");
      }
    });
  });

  describe("loader and action", () => {
    it("loader passes context and route args", async () => {
      const plugin = definePlugin({
        name: "db",
        setup: () => ({ query: () => "result" }),
      });
      const app = createApp({ env: envSchema, permissions }).use(plugin);
      app.init({ API_KEY: "sk-test" });
      const loader = app.loader(async (ctx, args) => {
        return { data: ctx.db.query(), url: args.request.url };
      });
      const result = await loader({
        request: makeRequest("http://localhost/posts"),
        params: {},
        context: {},
      });
      expect(result.data).toBe("result");
      expect(result.url).toBe("http://localhost/posts");
    });

    it("action passes context and route args", async () => {
      const app = createApp({ env: envSchema, permissions });
      app.init({ API_KEY: "sk-test" });
      const action = app.action(async (_ctx, args) => {
        return { method: args.request.method };
      });
      const result = await action({
        request: new Request("http://localhost", { method: "POST" }),
        params: {},
        context: {},
      });
      expect(result.method).toBe("POST");
    });
  });
});
