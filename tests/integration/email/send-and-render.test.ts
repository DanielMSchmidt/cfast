import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { createEmailClient } from "@cfast/email";
import type { EmailMessage, EmailProvider } from "@cfast/email";

describe("send-and-render", () => {
  it("email.send() renders React to HTML and delivers via custom provider", async () => {
    let captured: EmailMessage | null = null;

    const provider: EmailProvider = {
      name: "test",
      async send(message: EmailMessage) {
        captured = message;
        return { id: "test-123" };
      },
    };

    const client = createEmailClient({
      provider,
      from: "noreply@example.com",
    });

    const result = await client.send({
      to: "user@example.com",
      subject: "Welcome",
      react: createElement("div", null, "Hello World"),
    });

    expect(result.id).toBe("test-123");
    expect(captured).not.toBeNull();
    expect(captured!.to).toBe("user@example.com");
    expect(captured!.from).toBe("noreply@example.com");
    expect(captured!.subject).toBe("Welcome");
    expect(captured!.html).toContain("Hello World");
    expect(captured!.text).toContain("Hello World");
  });

  it("console provider logs and returns { id: 'console-...' }", async () => {
    // Import the console provider from the email package
    const { console: consoleProvider } = await import("@cfast/email/console");

    const provider = consoleProvider();

    const client = createEmailClient({
      provider,
      from: "noreply@example.com",
    });

    const consoleSpy = vi.spyOn(globalThis.console, "log");

    const result = await client.send({
      to: "user@example.com",
      subject: "Test Email",
      react: createElement("p", null, "Test content"),
    });

    expect(result.id).toMatch(/^console-/);
    expect(consoleSpy).toHaveBeenCalled();
    const logOutput = consoleSpy.mock.calls
      .map((call) => String(call[0]))
      .join("\n");
    expect(logOutput).toContain("user@example.com");

    consoleSpy.mockRestore();
  });

  it("lazy from getter called at send time, not initialization", async () => {
    let fromCallCount = 0;

    const provider: EmailProvider = {
      name: "test",
      async send() {
        return { id: "test-456" };
      },
    };

    const client = createEmailClient({
      provider,
      from: () => {
        fromCallCount++;
        return "dynamic@example.com";
      },
    });

    // from getter should not have been called during initialization
    expect(fromCallCount).toBe(0);

    await client.send({
      to: "user@example.com",
      subject: "Test",
      react: createElement("span", null, "Hi"),
    });

    // from getter should be called exactly once at send time
    expect(fromCallCount).toBe(1);
  });
});
