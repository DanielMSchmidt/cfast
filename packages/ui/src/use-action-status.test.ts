import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useActionStatus } from "./use-action-status.js";
import type { ClientDescriptor } from "@cfast/actions";

// Mock @cfast/actions/client
vi.mock("@cfast/actions/client", () => ({
  useActions: vi.fn(),
}));

import { useActions } from "@cfast/actions/client";

const mockUseActions = vi.mocked(useActions);

const descriptor: ClientDescriptor = {
  _brand: "ActionClientDescriptor",
  actionNames: ["publish", "delete"] as const,
  permissionsKey: "posts",
};

describe("useActionStatus", () => {
  it("returns status for a single action by name", () => {
    const mockSubmit = vi.fn();
    mockUseActions.mockReturnValue({
      publish: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      }),
      delete: () => ({
        permitted: false,
        invisible: true,
        reason: "No delete permission",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "publish"),
    );

    expect(result.current.permitted).toBe(true);
    expect(result.current.invisible).toBe(false);
    expect(result.current.reason).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("returns invisible status for forbidden action", () => {
    mockUseActions.mockReturnValue({
      publish: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
      delete: () => ({
        permitted: false,
        invisible: true,
        reason: "No delete permission",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "delete"),
    );

    expect(result.current.permitted).toBe(false);
    expect(result.current.invisible).toBe(true);
    expect(result.current.reason).toBe("No delete permission");
  });

  it("calls submit with input when submit is invoked", () => {
    const mockSubmit = vi.fn();
    mockUseActions.mockReturnValue({
      publish: (input) => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: () => mockSubmit(input),
        pending: false,
        data: undefined,
        error: undefined,
      }),
      delete: () => ({
        permitted: false,
        invisible: true,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "publish", { postId: "123" }),
    );

    result.current.submit();
    expect(mockSubmit).toHaveBeenCalledWith({ postId: "123" });
  });
});
