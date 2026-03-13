import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
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
      <PermissionGate action={action}>
        <div data-testid="content">Visible</div>
      </PermissionGate>,
    );

    expect(screen.getByTestId("content").textContent).toBe("Visible");
  });

  it("renders nothing when invisible", () => {
    const action = mockAction({ permitted: false, invisible: true });

    const { container } = render(
      <PermissionGate action={action}>
        <div>Should not appear</div>
      </PermissionGate>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders fallback when forbidden (not permitted, not invisible)", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    render(
      <PermissionGate
        action={action}
        fallback={<div data-testid="fallback">Read only</div>}
      >
        <div>Hidden</div>
      </PermissionGate>,
    );

    expect(screen.queryByText("Hidden")).toBeNull();
    expect(screen.getByTestId("fallback").textContent).toBe("Read only");
  });

  it("renders nothing when forbidden and no fallback provided", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    const { container } = render(
      <PermissionGate action={action}>
        <div>Hidden</div>
      </PermissionGate>,
    );

    expect(container.innerHTML).toBe("");
  });
});
