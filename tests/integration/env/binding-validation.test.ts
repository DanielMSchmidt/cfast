import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { defineEnv, EnvError } from "@cfast/env";

describe("binding-validation", () => {
  it("validates D1 binding via duck-typing (.prepare())", () => {
    const appEnv = defineEnv({
      DB: { type: "d1" },
    });

    expect(() => appEnv.init({ DB: env.DB })).not.toThrow();
    expect(appEnv.get().DB).toBe(env.DB);
  });

  it("validates KV binding via duck-typing (.get() and .put())", () => {
    const appEnv = defineEnv({
      KV: { type: "kv" },
    });

    expect(() => appEnv.init({ KV: env.KV })).not.toThrow();
    expect(appEnv.get().KV).toBe(env.KV);
  });

  it("validates R2 binding via duck-typing (.put() and .head())", () => {
    const appEnv = defineEnv({
      R2: { type: "r2" },
    });

    expect(() => appEnv.init({ R2: env.R2 })).not.toThrow();
    expect(appEnv.get().R2).toBe(env.R2);
  });

  it("missing binding throws EnvError with all failures at once", () => {
    const appEnv = defineEnv({
      DB: { type: "d1" },
      MISSING_KV: { type: "kv" },
      MISSING_SECRET: { type: "secret" },
    });

    try {
      appEnv.init({ DB: env.DB });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EnvError);
      const envErr = err as EnvError;
      // Should report both missing bindings in a single error
      expect(envErr.errors).toHaveLength(2);
      const keys = envErr.errors.map((e) => e.key);
      expect(keys).toContain("MISSING_KV");
      expect(keys).toContain("MISSING_SECRET");
    }
  });

  it("init() is idempotent and retry after failure works", () => {
    const appEnv = defineEnv({
      DB: { type: "d1" },
    });

    // First call succeeds
    appEnv.init({ DB: env.DB });
    const first = appEnv.get();

    // Second call is a no-op (cached)
    appEnv.init({ DB: "not a real db" as unknown as Record<string, unknown> });
    const second = appEnv.get();

    expect(first).toBe(second);
    expect(first.DB).toBe(env.DB);

    // A fresh defineEnv that fails, then retries
    const appEnv2 = defineEnv({
      DB: { type: "d1" },
    });

    expect(() => appEnv2.init({})).toThrow(EnvError);

    // Retry with correct bindings works because failed init doesn't cache
    appEnv2.init({ DB: env.DB });
    expect(appEnv2.get().DB).toBe(env.DB);
  });

  it("var with validate() runs custom validation", () => {
    const appEnv = defineEnv({
      APP_NAME: {
        type: "var",
        validate: (v: string) => v.length > 0,
      },
    });

    appEnv.init({ APP_NAME: "my-app" });
    expect(appEnv.get().APP_NAME).toBe("my-app");
  });

  it("var with failing validate() throws EnvError", () => {
    const appEnv = defineEnv({
      PORT: {
        type: "var",
        validate: (v: string) => /^\d+$/.test(v),
      },
    });

    try {
      appEnv.init({ PORT: "not-a-number" });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EnvError);
      const envErr = err as EnvError;
      expect(envErr.errors).toHaveLength(1);
      expect(envErr.errors[0].key).toBe("PORT");
      expect(envErr.errors[0].message).toContain("failed validation");
    }
  });

  it("secret must be non-empty string", () => {
    const appEnv = defineEnv({
      API_KEY: { type: "secret" },
    });

    // Empty string should fail
    try {
      appEnv.init({ API_KEY: "" });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(EnvError);
      const envErr = err as EnvError;
      expect(envErr.errors[0].key).toBe("API_KEY");
      expect(envErr.errors[0].message).toContain("empty");
    }

    // Valid secret works
    const appEnv2 = defineEnv({
      API_KEY: { type: "secret" },
    });
    appEnv2.init({ API_KEY: "super-secret-value" });
    expect(appEnv2.get().API_KEY).toBe("super-secret-value");
  });
});
