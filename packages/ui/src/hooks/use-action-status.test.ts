import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useActionStatus } from "./use-action-status.js";
import { createMockDescriptor } from "../__tests__/helpers.js";

// Mock @cfast/actions/client
vi.mock("@cfast/actions/client", () => ({
  useActions: vi.fn(),
}));

import { useActions } from "@cfast/actions/client";
const mockUseActions = vi.mocked(useActions);

afterEach(() => {
  vi.clearAllMocks();
});

describe("useActionStatus", () => {
  it("returns status for the first action when no actionName specified", () => {
    const descriptor = createMockDescriptor(["deletePost"]);
    mockUseActions.mockReturnValue({
      deletePost: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() => useActionStatus(descriptor));

    expect(result.current.permitted).toBe(true);
    expect(result.current.invisible).toBe(false);
    expect(result.current.pending).toBe(false);
  });

  it("returns status for a named action", () => {
    const descriptor = createMockDescriptor(["createPost", "deletePost"]);
    const submitFn = vi.fn();
    mockUseActions.mockReturnValue({
      createPost: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
      deletePost: () => ({
        permitted: false,
        invisible: false,
        reason: "No permission",
        submit: submitFn,
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "deletePost"),
    );

    expect(result.current.permitted).toBe(false);
    expect(result.current.reason).toBe("No permission");
  });

  it("returns invisible status when action not found", () => {
    const descriptor = createMockDescriptor(["createPost"]);
    mockUseActions.mockReturnValue({
      createPost: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() =>
      useActionStatus(descriptor, "nonexistent"),
    );

    expect(result.current.permitted).toBe(false);
    expect(result.current.invisible).toBe(true);
  });

  it("passes input to the action function", () => {
    const descriptor = createMockDescriptor(["deletePost"]);
    const actionFn = vi.fn().mockReturnValue({
      permitted: true,
      invisible: false,
      reason: null,
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });
    mockUseActions.mockReturnValue({ deletePost: actionFn });

    renderHook(() =>
      useActionStatus(descriptor, "deletePost", { postId: "123" }),
    );

    expect(actionFn).toHaveBeenCalledWith({ postId: "123" });
  });

  it("exposes pending state from the action", () => {
    const descriptor = createMockDescriptor(["savePost"]);
    mockUseActions.mockReturnValue({
      savePost: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: true,
        data: undefined,
        error: undefined,
      }),
    });

    const { result } = renderHook(() => useActionStatus(descriptor));

    expect(result.current.pending).toBe(true);
  });
});
