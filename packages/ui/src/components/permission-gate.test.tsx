import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { PermissionGate } from "./permission-gate.js";
import { createMockDescriptor } from "../__tests__/helpers.js";

afterEach(cleanup);

// Mock useActionStatus
vi.mock("../hooks/use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useActionStatus } from "../hooks/use-action-status.js";
const mockUseActionStatus = vi.mocked(useActionStatus);

describe("PermissionGate", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when permitted", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: true,
      invisible: false,
      reason: null,
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["editPost"]);
    render(
      createElement(PermissionGate, {
        action: descriptor,
        children: createElement("div", { "data-testid": "content" }, "Visible"),
      }),
    );

    expect(screen.getByTestId("content").textContent).toBe("Visible");
  });

  it("renders nothing when invisible", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: true,
      reason: null,
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["editPost"]);
    const { container } = render(
      createElement(PermissionGate, {
        action: descriptor,
        children: createElement("div", null, "Should not appear"),
      }),
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders fallback when forbidden (not permitted, not invisible)", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["editPost"]);
    render(
      createElement(PermissionGate, {
        action: descriptor,
        children: createElement("div", null, "Hidden"),
        fallback: createElement("div", { "data-testid": "fallback" }, "Read only"),
      }),
    );

    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.getByTestId("fallback").textContent).toBe("Read only");
  });

  it("renders nothing when forbidden and no fallback provided", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["editPost"]);
    const { container } = render(
      createElement(PermissionGate, {
        action: descriptor,
        children: createElement("div", null, "Hidden"),
      }),
    );

    expect(container.innerHTML).toBe("");
  });
});
