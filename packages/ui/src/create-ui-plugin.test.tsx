import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createUIPlugin } from "./create-ui-plugin.js";
import type { ClientDescriptor } from "@cfast/actions";
import type {
  ButtonRenderProps,
  TooltipRenderProps,
  ConfirmDialogRenderProps,
} from "./types.js";

vi.mock("./use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useActionStatus } from "./use-action-status.js";

const mockUseActionStatus = vi.mocked(useActionStatus);

// Minimal test components
function TestButton({ onClick, disabled, loading, children }: ButtonRenderProps) {
  return (
    <button onClick={onClick} disabled={disabled} data-loading={loading}>
      {children}
    </button>
  );
}

function TestTooltip({ content, children }: TooltipRenderProps) {
  return (
    <div data-tooltip={content}>
      {children}
    </div>
  );
}

function TestConfirmDialog({ open, onConfirm, onCancel, message }: ConfirmDialogRenderProps) {
  if (!open) return null;
  return (
    <div role="dialog">
      <p>{message}</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}

const plugin = createUIPlugin({
  Button: TestButton,
  Tooltip: TestTooltip,
  ConfirmDialog: TestConfirmDialog,
});

const descriptor: ClientDescriptor = {
  _brand: "ActionClientDescriptor",
  actionNames: ["publish"] as const,
  permissionsKey: "posts",
};

describe("createUIPlugin", () => {
  describe("ActionButton", () => {
    it("renders enabled button when permitted", () => {
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
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button).toBeDefined();
      expect(button.getAttribute("disabled")).toBeNull();
    });

    it("renders nothing when invisible (default whenForbidden=disable hides invisible)", () => {
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
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      expect(container.innerHTML).toBe("");
    });

    it("renders disabled button with tooltip when not permitted but not invisible", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: false,
        reason: "Missing editor role",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button.getAttribute("disabled")).toBe("");
      expect(button.closest("[data-tooltip]")?.getAttribute("data-tooltip")).toBe(
        "Missing editor role",
      );
    });

    it("calls submit on click when permitted", () => {
      const mockSubmit = vi.fn();
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      expect(mockSubmit).toHaveBeenCalledOnce();
    });

    it("shows loading state when pending", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: vi.fn(),
        pending: true,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton action={descriptor} actionName="publish">
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button.getAttribute("data-loading")).toBe("true");
      expect(button.getAttribute("disabled")).toBe("");
    });

    it("whenForbidden=hide returns null for non-permitted", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: false,
        reason: "Missing role",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      const { container } = render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          whenForbidden="hide"
        >
          Publish
        </plugin.ActionButton>,
      );

      expect(container.innerHTML).toBe("");
    });

    it("whenForbidden=show renders enabled button even without permission", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: false,
        reason: "Missing role",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          whenForbidden="show"
        >
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button.getAttribute("disabled")).toBeNull();
    });

    it("whenForbidden=show renders button even when invisible", () => {
      mockUseActionStatus.mockReturnValue({
        permitted: false,
        invisible: true,
        reason: "No permission at all",
        submit: vi.fn(),
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          whenForbidden="show"
        >
          Publish
        </plugin.ActionButton>,
      );

      const button = screen.getByRole("button", { name: "Publish" });
      expect(button).toBeDefined();
      expect(button.getAttribute("disabled")).toBeNull();
    });

    it("shows confirmation dialog before submitting", () => {
      const mockSubmit = vi.fn();
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          confirmation="Are you sure?"
        >
          Publish
        </plugin.ActionButton>,
      );

      // Click button — should open dialog, not submit
      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      expect(mockSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeDefined();
      expect(screen.getByText("Are you sure?")).toBeDefined();

      // Confirm — should submit
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
      expect(mockSubmit).toHaveBeenCalledOnce();
    });

    it("cancelling confirmation dialog does not submit", () => {
      const mockSubmit = vi.fn();
      mockUseActionStatus.mockReturnValue({
        permitted: true,
        invisible: false,
        reason: null,
        submit: mockSubmit,
        pending: false,
        data: undefined,
        error: undefined,
      });

      render(
        <plugin.ActionButton
          action={descriptor}
          actionName="publish"
          confirmation="Are you sure?"
        >
          Publish
        </plugin.ActionButton>,
      );

      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });
});
