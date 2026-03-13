import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { createApp, definePlugin, CfastConfigError } from "@cfast/core";
import { definePermissions } from "@cfast/permissions";

const envSchema = {
  DB: { type: "d1" as const },
  KV: { type: "kv" as const },
};

const permissions = definePermissions({
  roles: ["viewer", "admin"] as const,
  grants: (grant) => ({
    viewer: [grant("read", "all")],
    admin: [grant("manage", "all")],
  }),
});

function makeApp() {
  const app = createApp({ env: envSchema, permissions });
  app.init(env as unknown as Record<string, unknown>);
  return app;
}

function makeRequest(url = "http://localhost") {
  return new Request(url);
}

describe("plugin-chain", () => {
  it("plugins run in registration order via app.context()", async () => {
    const order: string[] = [];

    const pluginA = definePlugin({
      name: "alpha",
      setup: () => {
        order.push("alpha");
        return { id: "a" };
      },
    });
    const pluginB = definePlugin({
      name: "beta",
      setup: () => {
        order.push("beta");
        return { id: "b" };
      },
    });
    const pluginC = definePlugin({
      name: "gamma",
      setup: () => {
        order.push("gamma");
        return { id: "c" };
      },
    });

    const app = makeApp();
    const chained = app.use(pluginA).use(pluginB).use(pluginC);
    await chained.context(makeRequest());

    expect(order).toEqual(["alpha", "beta", "gamma"]);
  });

  it("each plugin receives prior plugins output in ctx", async () => {
    const first = definePlugin({
      name: "first",
      setup: () => ({ fromFirst: 42 }),
    });

    type FirstProvides = { first: { fromFirst: number } };
    const second = definePlugin<FirstProvides>()({
      name: "second",
      setup: (ctx) => ({ doubled: ctx.first.fromFirst * 2 }),
    });

    const app = makeApp();
    const chained = app.use(first).use(second);
    const ctx = await chained.context(makeRequest());

    expect(ctx.first.fromFirst).toBe(42);
    expect(ctx.second.doubled).toBe(84);
  });

  it("duplicate plugin names throw CfastConfigError", () => {
    const p1 = definePlugin({ name: "dup", setup: () => ({}) });
    const p2 = definePlugin({ name: "dup", setup: () => ({}) });
    const app = makeApp();

    expect(() => app.use(p1).use(p2)).toThrow(CfastConfigError);
    expect(() => app.use(p1).use(p2)).toThrow(/duplicate/i);
  });
});
