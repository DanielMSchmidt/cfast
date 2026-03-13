// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { AuthProvider, useCurrentUser, useLoginPath } from "../client/auth-provider";
import type { AuthUser } from "../types";

const testUser: AuthUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  roles: ["editor"],
};

function withProvider(user: AuthUser | null, loginPath?: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider user={user} loginPath={loginPath}>
        {children}
      </AuthProvider>
    );
  };
}

describe("AuthProvider", () => {
  it("provides user via useCurrentUser", () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: withProvider(testUser),
    });

    expect(result.current).toEqual(testUser);
  });

  it("returns null for anonymous users", () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: withProvider(null),
    });

    expect(result.current).toBeNull();
  });

  it("provides default loginPath", () => {
    const { result } = renderHook(() => useLoginPath(), {
      wrapper: withProvider(null),
    });

    expect(result.current).toBe("/login");
  });

  it("provides custom loginPath", () => {
    const { result } = renderHook(() => useLoginPath(), {
      wrapper: withProvider(null, "/sign-in"),
    });

    expect(result.current).toBe("/sign-in");
  });

  it("throws when useCurrentUser is used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useCurrentUser());
    }).toThrow("useCurrentUser must be used within an <AuthProvider>");
  });

  it("throws when useLoginPath is used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useLoginPath());
    }).toThrow("useLoginPath must be used within an <AuthProvider>");
  });
});
