import { describe, it, expect, vi } from "vitest";
import { createEmailClient } from "../create-email-client.js";
import type { EmailProvider } from "../types.js";

function createMockProvider(): EmailProvider & { lastMessage: unknown } {
  const provider: EmailProvider & { lastMessage: unknown } = {
    name: "mock",
    lastMessage: null,
    send: vi.fn(async (message) => {
      provider.lastMessage = message;
      return { id: "mock-123" };
    }),
  };
  return provider;
}

// Simple React element for testing (no react-email components needed)
function TestEmail({ name }: { name: string }) {
  return <div>Hello {name}</div>;
}

describe("createEmailClient", () => {
  it("returns an object with send method", () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "test@example.com" });
    expect(typeof client.send).toBe("function");
  });

  it("renders react element to HTML and passes to provider", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "test@example.com" });

    await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
    });

    expect(provider.send).toHaveBeenCalledOnce();
    const message = provider.lastMessage as Record<string, unknown>;
    expect(message.to).toBe("user@example.com");
    expect(message.from).toBe("test@example.com");
    expect(message.subject).toBe("Test");
    expect(typeof message.html).toBe("string");
    expect((message.html as string)).toContain("Hello");
    expect((message.html as string)).toContain("World");
    expect(typeof message.text).toBe("string");
  });

  it("uses from getter when from is a function", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({
      provider,
      from: () => "lazy@example.com",
    });

    await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
    });

    const message = provider.lastMessage as Record<string, unknown>;
    expect(message.from).toBe("lazy@example.com");
  });

  it("allows overriding from per-send", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "default@example.com" });

    await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
      from: "override@example.com",
    });

    const message = provider.lastMessage as Record<string, unknown>;
    expect(message.from).toBe("override@example.com");
  });

  it("returns the provider result", async () => {
    const provider = createMockProvider();
    const client = createEmailClient({ provider, from: "test@example.com" });

    const result = await client.send({
      to: "user@example.com",
      subject: "Test",
      react: <TestEmail name="World" />,
    });

    expect(result).toEqual({ id: "mock-123" });
  });

  it("propagates provider errors", async () => {
    const provider: EmailProvider = {
      name: "failing",
      send: async () => {
        throw new Error("Provider failed");
      },
    };
    const client = createEmailClient({ provider, from: "test@example.com" });

    await expect(
      client.send({
        to: "user@example.com",
        subject: "Test",
        react: <TestEmail name="World" />,
      }),
    ).rejects.toThrow("Provider failed");
  });
});
