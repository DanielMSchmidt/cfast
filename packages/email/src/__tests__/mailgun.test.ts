import { describe, it, expect, vi, beforeEach } from "vitest";
import { mailgun } from "../mailgun.js";
import { EmailDeliveryError } from "../errors.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("mailgun", () => {
  const getConfig = () => ({
    apiKey: "test-api-key",
    domain: "mail.example.com",
  });

  it("returns an EmailProvider with name 'mailgun'", () => {
    const provider = mailgun(getConfig);
    expect(provider.name).toBe("mailgun");
    expect(typeof provider.send).toBe("function");
  });

  it("sends email via Mailgun HTTP API", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "<msg-123@mail.example.com>", message: "Queued" }), {
        status: 200,
      }),
    );

    const provider = mailgun(getConfig);
    const result = await provider.send({
      to: "user@example.com",
      from: "App <noreply@mail.example.com>",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(result.id).toBe("<msg-123@mail.example.com>");
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.mailgun.net/v3/mail.example.com/messages");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toContain("Basic ");
  });

  it("includes all fields in FormData body", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "msg-1" }), { status: 200 }),
    );

    const provider = mailgun(getConfig);
    await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test Subject",
      html: "<b>Bold</b>",
      text: "Bold",
    });

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get("to")).toBe("user@example.com");
    expect(body.get("from")).toBe("sender@example.com");
    expect(body.get("subject")).toBe("Test Subject");
    expect(body.get("html")).toBe("<b>Bold</b>");
    expect(body.get("text")).toBe("Bold");
  });

  it("calls config getter lazily at send time", async () => {
    const getter = vi.fn(() => ({
      apiKey: "lazy-key",
      domain: "lazy.example.com",
    }));

    const provider = mailgun(getter);
    // Config getter not called yet
    expect(getter).not.toHaveBeenCalled();

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "msg-1" }), { status: 200 }),
    );

    await provider.send({
      to: "user@example.com",
      from: "sender@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });

    expect(getter).toHaveBeenCalledOnce();
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("lazy.example.com");
  });

  it("throws EmailDeliveryError on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );

    const provider = mailgun(getConfig);

    await expect(
      provider.send({
        to: "user@example.com",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Hi</p>",
        text: "Hi",
      }),
    ).rejects.toThrow(EmailDeliveryError);
  });

  it("includes status code and response body in error", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Bad request: missing 'to'", { status: 400 }),
    );

    const provider = mailgun(getConfig);

    try {
      await provider.send({
        to: "",
        from: "sender@example.com",
        subject: "Test",
        html: "<p>Hi</p>",
        text: "Hi",
      });
      expect.fail("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(EmailDeliveryError);
      const e = error as EmailDeliveryError;
      expect(e.provider).toBe("mailgun");
      expect(e.statusCode).toBe(400);
      expect(e.response).toBe("Bad request: missing 'to'");
    }
  });
});
