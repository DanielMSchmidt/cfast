import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { useActionToast } from "./use-action-toast.js";
import { ToastContext } from "./use-toast.js";
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

describe("useActionToast", () => {
  it("shows success toast when action data appears", () => {
    const mockShow = vi.fn();
    const descriptor = createMockDescriptor(["deletePost"]);

    mockUseActions.mockReturnValue({
      deletePost: () => ({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: false,
        data: { deleted: true },
        error: undefined,
      }),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(ToastContext.Provider, {
        value: { show: mockShow },
        children,
      });

    renderHook(
      () =>
        useActionToast(descriptor, {
          deletePost: { success: "Post deleted" },
        }),
      { wrapper },
    );

    expect(mockShow).toHaveBeenCalledWith({
      message: "Post deleted",
      type: "success",
      description: undefined,
    });
  });
});
