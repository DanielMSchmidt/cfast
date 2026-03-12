import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { PermissionGate } from "./permission-gate.js";
import type { ActionHookResult } from "@cfast/actions/client";

afterEach(cleanup);

function mockAction(overrides: Partial<ActionHookResult> = {}): ActionHookResult {
  return {
    permitted: true,
    invisible: false,
    reason: null,
    submit: vi.fn(),
    pending: false,
    data: undefined,
    error: undefined,
    ...overrides,
  };
}

describe("PermissionGate", () => {
  it("renders children when permitted", () => {
    const action = mockAction();

    render(
      createElement(PermissionGate, {
        action,
        children: createElement("div", { "data-testid": "content" }, "Visible"),
      }),
    );

    expect(screen.getByTestId("content").textContent).toBe("Visible");
  });

  it("renders nothing when invisible", () => {
    const action = mockAction({ permitted: false, invisible: true });

    const { container } = render(
      createElement(PermissionGate, {
        action,
        children: createElement("div", null, "Should not appear"),
      }),
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders fallback when forbidden (not permitted, not invisible)", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    render(
      createElement(PermissionGate, {
        action,
        children: createElement("div", null, "Hidden"),
        fallback: createElement("div", { "data-testid": "fallback" }, "Read only"),
      }),
    );

    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.getByTestId("fallback").textContent).toBe("Read only");
  });

  it("renders nothing when forbidden and no fallback provided", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    const { container } = render(
      createElement(PermissionGate, {
        action,
        children: createElement("div", null, "Hidden"),
      }),
    );

    expect(container.innerHTML).toBe("");
  });
});
