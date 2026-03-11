import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "./permission-gate.js";
import type { ClientDescriptor } from "@cfast/actions";

vi.mock("./use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useActionStatus } from "./use-action-status.js";

const mockUseActionStatus = vi.mocked(useActionStatus);

const descriptor: ClientDescriptor = {
  _brand: "ActionClientDescriptor",
  actionNames: ["edit"] as const,
  permissionsKey: "posts",
};


describe("PermissionGate", () => {
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

    render(
      <PermissionGate action={descriptor} actionName="edit">
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(screen.getByText("Edit Panel")).toBeDefined();
  });

  it("renders nothing when invisible and no fallback", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: true,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const { container } = render(
      <PermissionGate action={descriptor} actionName="edit">
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders fallback when invisible", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: true,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    render(
      <PermissionGate
        action={descriptor}
        actionName="edit"
        fallback={<div>Upgrade Required</div>}
      >
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(screen.getByText("Upgrade Required")).toBeDefined();
    expect(screen.queryByText("Edit Panel")).toBeNull();
  });

  it("renders fallback when not permitted (partial permissions)", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "Missing some permissions",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    render(
      <PermissionGate
        action={descriptor}
        actionName="edit"
        fallback={<div>Insufficient Permissions</div>}
      >
        <div>Edit Panel</div>
      </PermissionGate>,
    );

    expect(screen.getByText("Insufficient Permissions")).toBeDefined();
    expect(screen.queryByText("Edit Panel")).toBeNull();
  });
});
