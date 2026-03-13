import { describe, it, expect, vi } from "vitest";
import { console as consoleDev } from "../console.js";

describe("console provider", () => {
  it("returns an EmailProvider with name 'console'", () => {
    const provider = consoleDev();
    expect(provider.name).toBe("console");
    expect(typeof provider.send).toBe("function");
  });

  it("logs email details to console", async () => {
    const spy = vi.spyOn(globalThis.console, "log").mockImplementation(() => {});

    const provider = consoleDev();
    await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test Email",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(output).toContain("user@example.com");
    expect(output).toContain("Test Email");

    spy.mockRestore();
  });

  it("returns an id starting with 'console-'", async () => {
    vi.spyOn(globalThis.console, "log").mockImplementation(() => {});

    const provider = consoleDev();
    const result = await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(result.id).toMatch(/^console-/);

    vi.restoreAllMocks();
  });
});
