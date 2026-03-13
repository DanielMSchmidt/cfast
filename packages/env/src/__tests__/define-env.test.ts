import { describe, it, expect } from "vitest";
import { defineEnv } from "../define-env";
import { EnvError } from "../errors";

function fakeD1() {
  return { prepare: () => {}, dump: () => {}, batch: () => {}, exec: () => {} };
}

function fakeKV() {
  return { get: () => {}, put: () => {}, delete: () => {}, list: () => {} };
}

describe("defineEnv", () => {
  it("returns an object with init and get", () => {
    const env = defineEnv({ DB: { type: "d1" } });
    expect(typeof env.init).toBe("function");
    expect(typeof env.get).toBe("function");
  });

  describe("init", () => {
    it("validates and caches bindings", () => {
      const env = defineEnv({ DB: { type: "d1" } });
      const rawEnv = { DB: fakeD1() };
      env.init(rawEnv);
      const result = env.get();
      expect(result.DB).toBe(rawEnv.DB);
    });

    it("no-ops on subsequent calls", () => {
      const env = defineEnv({ DB: { type: "d1" } });
      const first = { DB: fakeD1() };
      const second = { DB: fakeD1() };
      env.init(first);
      env.init(second);
      expect(env.get().DB).toBe(first.DB);
    });

    it("throws EnvError with all validation failures", () => {
      const env = defineEnv({
        DB: { type: "d1" },
        CACHE: { type: "kv" },
      });
      try {
        env.init({});
        expect.unreachable("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(EnvError);
        expect((e as EnvError).errors).toHaveLength(2);
      }
    });

    it("can retry after a failed init", () => {
      const env = defineEnv({ DB: { type: "d1" } });
      expect(() => env.init({})).toThrow(EnvError);
      const db = fakeD1();
      env.init({ DB: db });
      expect(env.get().DB).toBe(db);
    });
  });

  describe("get", () => {
    it("throws if init was not called", () => {
      const env = defineEnv({ DB: { type: "d1" } });
      expect(() => env.get()).toThrow("env.init()");
    });
  });

  describe("var with defaults", () => {
    it("uses simple string default when value is missing", () => {
      const env = defineEnv({
        LOG_LEVEL: { type: "var", default: "info" },
      });
      env.init({});
      expect(env.get().LOG_LEVEL).toBe("info");
    });

    it("uses provided value over default", () => {
      const env = defineEnv({
        LOG_LEVEL: { type: "var", default: "info" },
      });
      env.init({ LOG_LEVEL: "debug" });
      expect(env.get().LOG_LEVEL).toBe("debug");
    });
  });

  describe("environment-aware defaults", () => {
    it("selects default based on ENVIRONMENT binding", () => {
      const env = defineEnv({
        APP_URL: {
          type: "var",
          default: {
            development: "http://localhost:8787",
            production: "https://myapp.com",
          },
        },
      });
      env.init({ ENVIRONMENT: "production" });
      expect(env.get().APP_URL).toBe("https://myapp.com");
    });

    it("defaults ENVIRONMENT to development", () => {
      const env = defineEnv({
        APP_URL: {
          type: "var",
          default: {
            development: "http://localhost:8787",
            production: "https://myapp.com",
          },
        },
      });
      env.init({});
      expect(env.get().APP_URL).toBe("http://localhost:8787");
    });

    it("errors when environment has no matching default and no value", () => {
      const env = defineEnv({
        APP_URL: {
          type: "var",
          default: {
            production: "https://myapp.com",
          },
        },
      });
      expect(() => env.init({ ENVIRONMENT: "development" })).toThrow(EnvError);
    });

    it("rejects invalid ENVIRONMENT values", () => {
      const env = defineEnv({
        APP_URL: { type: "var", default: "http://localhost" },
      });
      expect(() => env.init({ ENVIRONMENT: "test" })).toThrow(EnvError);
    });

    it("falls back to development when ENVIRONMENT is not a string", () => {
      const env = defineEnv({
        APP_URL: {
          type: "var",
          default: {
            development: "http://localhost:8787",
            production: "https://myapp.com",
          },
        },
      });
      env.init({ ENVIRONMENT: 42 });
      expect(env.get().APP_URL).toBe("http://localhost:8787");
    });
  });

  describe("validate callback", () => {
    it("passes when validate returns true", () => {
      const env = defineEnv({
        LOG_LEVEL: {
          type: "var",
          default: "info",
          validate: (v: string) => ["debug", "info", "warn", "error"].includes(v),
        },
      });
      env.init({});
      expect(env.get().LOG_LEVEL).toBe("info");
    });

    it("fails when validate returns false", () => {
      const env = defineEnv({
        LOG_LEVEL: {
          type: "var",
          validate: (v: string) => ["debug", "info", "warn", "error"].includes(v),
        },
      });
      expect(() => env.init({ LOG_LEVEL: "verbose" })).toThrow(EnvError);
    });
  });

  describe("multiple bindings", () => {
    it("validates and returns all bindings", () => {
      const env = defineEnv({
        DB: { type: "d1" },
        CACHE: { type: "kv" },
        API_KEY: { type: "secret" },
        APP_URL: { type: "var", default: "http://localhost" },
      });
      const db = fakeD1();
      const kv = fakeKV();
      env.init({ DB: db, CACHE: kv, API_KEY: "sk-123" });
      const result = env.get();
      expect(result.DB).toBe(db);
      expect(result.CACHE).toBe(kv);
      expect(result.API_KEY).toBe("sk-123");
      expect(result.APP_URL).toBe("http://localhost");
    });
  });
});
