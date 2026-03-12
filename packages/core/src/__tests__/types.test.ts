import { describe, it, expect } from "vitest";
import { CfastPluginError, CfastConfigError } from "../errors";

describe("CfastPluginError", () => {
  it("wraps cause with plugin name", () => {
    const cause = new Error("D1 binding not found");
    const err = new CfastPluginError("db", cause);
    expect(err.message).toBe('Plugin "db" setup failed: D1 binding not found');
    expect(err.pluginName).toBe("db");
    expect(err.cause).toBe(cause);
  });

  it("handles non-Error cause", () => {
    const err = new CfastPluginError("auth", "string error");
    expect(err.message).toBe('Plugin "auth" setup failed: string error');
  });
});

describe("CfastConfigError", () => {
  it("sets name and message", () => {
    const err = new CfastConfigError("duplicate plugin");
    expect(err.name).toBe("CfastConfigError");
    expect(err.message).toBe("duplicate plugin");
  });
});
