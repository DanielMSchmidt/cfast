// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../client/use-auth";

describe("useAuth", () => {
  it("returns signOut function", () => {
    const mockAuthClient = { signOut: vi.fn().mockResolvedValue({}) };
    const { result } = renderHook(() => useAuth(mockAuthClient));
    expect(typeof result.current.signOut).toBe("function");
  });

  it("signOut calls authClient.signOut", async () => {
    const mockSignOut = vi.fn().mockResolvedValue({});
    const mockAuthClient = { signOut: mockSignOut };
    const { result } = renderHook(() => useAuth(mockAuthClient));

    await act(() => result.current.signOut());

    expect(mockSignOut).toHaveBeenCalled();
  });
});
