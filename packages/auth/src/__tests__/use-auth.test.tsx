// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthClientProvider, useAuth } from "../client/auth-client-provider";
import type { AuthClientInstance } from "../client/types";

function createMockAuthClient(
  overrides: Partial<AuthClientInstance> = {},
): AuthClientInstance {
  return {
    signOut: vi.fn().mockResolvedValue({}),
    passkey: {
      addPasskey: vi.fn().mockResolvedValue({}),
      deletePasskey: vi.fn().mockResolvedValue({}),
    },
    admin: {
      stopImpersonating: vi.fn().mockResolvedValue({}),
    },
    ...overrides,
  };
}

function withProvider(authClient: AuthClientInstance) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthClientProvider authClient={authClient}>
        {children}
      </AuthClientProvider>
    );
  };
}

describe("useAuth", () => {
  it("throws when used outside AuthClientProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within an <AuthClientProvider>",
    );
  });

  it("signOut delegates to authClient.signOut", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider(mockClient),
    });

    await act(() => result.current.signOut());
    expect(mockClient.signOut).toHaveBeenCalled();
  });

  it("registerPasskey delegates to authClient.passkey.addPasskey", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider(mockClient),
    });

    await act(() => result.current.registerPasskey());
    expect(mockClient.passkey!.addPasskey).toHaveBeenCalled();
  });

  it("registerPasskey throws when passkey plugin not configured", async () => {
    const mockClient = createMockAuthClient({ passkey: undefined });
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider(mockClient),
    });

    await expect(act(() => result.current.registerPasskey())).rejects.toThrow(
      "Passkey plugin not configured",
    );
  });

  it("deletePasskey delegates with correct id", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider(mockClient),
    });

    await act(() => result.current.deletePasskey("pk-123"));
    expect(mockClient.passkey!.deletePasskey).toHaveBeenCalledWith({
      id: "pk-123",
    });
  });

  it("stopImpersonating delegates to authClient.admin", async () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider(mockClient),
    });

    await act(() => result.current.stopImpersonating());
    expect(mockClient.admin!.stopImpersonating).toHaveBeenCalled();
  });

  it("stopImpersonating throws when admin plugin not configured", async () => {
    const mockClient = createMockAuthClient({ admin: undefined });
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider(mockClient),
    });

    await expect(
      act(() => result.current.stopImpersonating()),
    ).rejects.toThrow("Admin plugin not configured");
  });

  it("exposes the raw authClient", () => {
    const mockClient = createMockAuthClient();
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider(mockClient),
    });

    expect(result.current.authClient).toBe(mockClient);
  });
});
