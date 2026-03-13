import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { createApp, definePlugin } from "@cfast/core";
import { EnvError } from "@cfast/env";
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

function makeRequest(url = "http://localhost") {
  return new Request(url);
}

describe("app-helpers", () => {
  it("app.init(rawEnv) validates env and is idempotent", () => {
    const app = createApp({ env: envSchema, permissions });
    const rawEnv = env as unknown as Record<string, unknown>;

    // First init succeeds
    app.init(rawEnv);
    const env1 = app.env();
    expect(env1.DB).toBeDefined();
    expect(env1.KV).toBeDefined();

    // Second init is a no-op — same values returned
    app.init(rawEnv);
    const env2 = app.env();
    expect(env2).toBe(env1);
  });

  it("app.init with missing binding throws EnvError", () => {
    const schemaWithExtra = {
      DB: { type: "d1" as const },
      KV: { type: "kv" as const },
      MISSING_BUCKET: { type: "r2" as const },
    };
    const app = createApp({ env: schemaWithExtra, permissions });

    expect(() => app.init(env as unknown as Record<string, unknown>)).toThrow(
      EnvError,
    );

    try {
      app.init(env as unknown as Record<string, unknown>);
      expect.unreachable("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(EnvError);
      const envError = e as EnvError;
      expect(envError.errors.length).toBeGreaterThan(0);
      expect(envError.errors[0].key).toBe("MISSING_BUCKET");
    }
  });

  it("app.loader() builds context and calls handler", async () => {
    const plugin = definePlugin({
      name: "db",
      setup: () => ({ query: () => "result" }),
    });

    const app = createApp({ env: envSchema, permissions }).use(plugin);
    app.init(env as unknown as Record<string, unknown>);

    const loader = app.loader(async (ctx, args) => {
      return {
        data: ctx.db.query(),
        url: args.request.url,
        hasEnv: ctx.env.DB !== undefined,
      };
    });

    const result = await loader({
      request: makeRequest("http://localhost/posts"),
      params: { id: "123" },
      context: {},
    });

    expect(result.data).toBe("result");
    expect(result.url).toBe("http://localhost/posts");
    expect(result.hasEnv).toBe(true);
  });
});
