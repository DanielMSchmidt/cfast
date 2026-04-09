import { describe, it, expect } from "vitest";
import { CfastPluginError, CfastConfigError } from "../errors";

// ---------------------------------------------------------------------------
// CfastPluginError
// ---------------------------------------------------------------------------

describe("CfastPluginError", () => {
  it("stores the pluginName", () => {
    const err = new CfastPluginError("auth", new Error("down"));
    expect(err.pluginName).toBe("auth");
  });

  it("stores the original Error as cause", () => {
    const cause = new Error("original");
    const err = new CfastPluginError("db", cause);
    expect(err.cause).toBe(cause);
  });

  it("stores a non-Error cause verbatim", () => {
    const err = new CfastPluginError("cache", 42);
    expect(err.cause).toBe(42);
  });

  it("includes the plugin name in the message", () => {
    const err = new CfastPluginError("db", new Error("timeout"));
    expect(err.message).toContain("db");
  });

  it("includes the cause message when cause is an Error", () => {
    const err = new CfastPluginError("db", new Error("timeout"));
    expect(err.message).toContain("timeout");
  });

  it("stringifies a non-Error cause into the message", () => {
    const err = new CfastPluginError("cache", 42);
    expect(err.message).toContain("42");
  });

  it("stringifies null cause", () => {
    const err = new CfastPluginError("plugin", null);
    expect(err.message).toContain("null");
  });

  it("stringifies object cause", () => {
    const err = new CfastPluginError("plugin", { code: "ERR" });
    expect(err.message).toBeDefined();
  });

  it("sets name to 'CfastPluginError'", () => {
    const err = new CfastPluginError("x", new Error());
    expect(err.name).toBe("CfastPluginError");
  });

  it("is an instance of Error", () => {
    const err = new CfastPluginError("x", new Error());
    expect(err).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// CfastConfigError
// ---------------------------------------------------------------------------

describe("CfastConfigError", () => {
  it("stores the provided message", () => {
    const err = new CfastConfigError("duplicate plugin");
    expect(err.message).toBe("duplicate plugin");
  });

  it("sets name to 'CfastConfigError'", () => {
    const err = new CfastConfigError("bad config");
    expect(err.name).toBe("CfastConfigError");
  });

  it("is an instance of Error", () => {
    const err = new CfastConfigError("oops");
    expect(err).toBeInstanceOf(Error);
  });

  it("is catchable as a plain Error", () => {
    expect(() => {
      throw new CfastConfigError("config error");
    }).toThrow("config error");
  });
});

// ---------------------------------------------------------------------------
// createApp — CfastPluginError passthrough (already-wrapped errors must not be
// double-wrapped)
// ---------------------------------------------------------------------------

describe("createApp — CfastPluginError passthrough", async () => {
  const { createApp } = await import("../create-app");
  const { definePlugin } = await import("../define-plugin");
  const { definePermissions } = await import("@cfast/permissions");

  const permissions = definePermissions({
    roles: ["reader"] as const,
    grants: { reader: [] },
  });
  const envSchema = { API_KEY: { type: "secret" as const } };

  it("does not double-wrap a CfastPluginError thrown by a plugin", async () => {
    const innerError = new CfastPluginError("inner", new Error("original"));
    const plugin = definePlugin({
      name: "passthrough",
      setup: () => {
        throw innerError;
      },
    });

    const app = createApp({ env: envSchema, permissions }).use(plugin);
    app.init({ API_KEY: "sk-test" });

    try {
      await app.context(new Request("http://localhost"));
      expect.unreachable("should have thrown");
    } catch (e) {
      // Must be the SAME instance (not wrapped again)
      expect(e).toBe(innerError);
      expect((e as CfastPluginError).pluginName).toBe("inner");
    }
  });

  it("wraps a plain Error from a plugin in CfastPluginError", async () => {
    const plugin = definePlugin({
      name: "broken",
      setup: () => {
        throw new Error("plain error");
      },
    });

    const app = createApp({ env: envSchema, permissions }).use(plugin);
    app.init({ API_KEY: "sk-test" });

    await expect(app.context(new Request("http://localhost"))).rejects.toBeInstanceOf(
      CfastPluginError,
    );
  });
});

// ---------------------------------------------------------------------------
// createApp — loader and action error propagation
// ---------------------------------------------------------------------------

describe("createApp — loader/action error propagation", async () => {
  const { createApp } = await import("../create-app");
  const { definePermissions } = await import("@cfast/permissions");

  const permissions = definePermissions({
    roles: ["reader"] as const,
    grants: { reader: [] },
  });
  const envSchema = { API_KEY: { type: "secret" as const } };

  it("loader propagates errors thrown by the inner function without wrapping", async () => {
    const app = createApp({ env: envSchema, permissions });
    app.init({ API_KEY: "sk-test" });

    const loader = app.loader(async () => {
      throw new TypeError("loader exploded");
    });

    await expect(
      loader({ request: new Request("http://localhost"), params: {}, context: {} }),
    ).rejects.toThrow("loader exploded");
  });

  it("action propagates errors thrown by the inner function without wrapping", async () => {
    const app = createApp({ env: envSchema, permissions });
    app.init({ API_KEY: "sk-test" });

    const action = app.action(async () => {
      throw new RangeError("action exploded");
    });

    await expect(
      action({
        request: new Request("http://localhost", { method: "POST" }),
        params: {},
        context: {},
      }),
    ).rejects.toThrow("action exploded");
  });
});
