import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { createApp, definePlugin, CfastPluginError, CfastConfigError } from "@cfast/core";
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

describe("error-handling", () => {
  it("plugin throw during setup() is wrapped in CfastPluginError", async () => {
    const broken = definePlugin({
      name: "broken",
      setup: () => {
        throw new Error("connection refused");
      },
    });

    const app = makeApp();
    const chained = app.use(broken);

    try {
      await chained.context(makeRequest());
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(CfastPluginError);
      const pluginError = e as CfastPluginError;
      expect(pluginError.pluginName).toBe("broken");
      expect(pluginError.message).toContain("connection refused");
      expect(pluginError.cause).toBeInstanceOf(Error);
      expect((pluginError.cause as Error).message).toBe("connection refused");
    }
  });

  it("config validation errors surface as CfastConfigError", () => {
    const p1 = definePlugin({ name: "same", setup: () => ({}) });
    const p2 = definePlugin({ name: "same", setup: () => ({}) });
    const app = makeApp();

    try {
      app.use(p1).use(p2);
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(CfastConfigError);
      const configError = e as CfastConfigError;
      expect(configError.name).toBe("CfastConfigError");
      expect(configError.message).toContain("same");
      expect(configError.message).toContain("unique");
    }
  });
});
