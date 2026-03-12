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
});
