import { describe, it, expect, vi } from "vitest";
import { createAuthRouteHandlers } from "../route-handlers";
import type { AuthInstance } from "../types";

describe("createAuthRouteHandlers", () => {
  it("returns loader and action functions", () => {
    const mockAuth = { handler: vi.fn() } as unknown as AuthInstance;
    const { loader, action } = createAuthRouteHandlers(() => mockAuth);

    expect(typeof loader).toBe("function");
    expect(typeof action).toBe("function");
  });

  it("loader forwards request to auth.handler", async () => {
    const mockResponse = new Response("ok");
    const mockHandler = vi.fn().mockResolvedValue(mockResponse);
    const mockAuth = { handler: mockHandler } as unknown as AuthInstance;
    const { loader } = createAuthRouteHandlers(() => mockAuth);

    const request = new Request("https://example.com/auth/callback");
    const result = await loader({ request });

    expect(mockHandler).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it("action forwards request to auth.handler", async () => {
    const mockResponse = new Response("ok");
    const mockHandler = vi.fn().mockResolvedValue(mockResponse);
    const mockAuth = { handler: mockHandler } as unknown as AuthInstance;
    const { action } = createAuthRouteHandlers(() => mockAuth);

    const request = new Request("https://example.com/auth/signin", {
      method: "POST",
    });
    const result = await action({ request });

    expect(mockHandler).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });

  it("calls getAuth lazily on each request", async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response("ok"));
    const getAuth = vi.fn(() => ({ handler: mockHandler }) as unknown as AuthInstance);
    const { loader } = createAuthRouteHandlers(getAuth);

    expect(getAuth).not.toHaveBeenCalled();

    await loader({ request: new Request("https://example.com/auth/callback") });
    expect(getAuth).toHaveBeenCalledTimes(1);

    await loader({ request: new Request("https://example.com/auth/callback") });
    expect(getAuth).toHaveBeenCalledTimes(2);
  });
});
