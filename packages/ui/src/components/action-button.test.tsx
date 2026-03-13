import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ActionButton } from "./action-button.js";
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

describe("ActionButton", () => {
  it("renders button and calls submit on click when permitted", () => {
    const submitFn = vi.fn();
    const action = mockAction({ submit: submitFn });

    render(<ActionButton action={action}>Delete</ActionButton>);

    const button = screen.getByRole("button");
    expect(button.textContent).toBe("Delete");

    fireEvent.click(button);
    expect(submitFn).toHaveBeenCalled();
  });

  it("hides button when invisible", () => {
    const action = mockAction({ permitted: false, invisible: true });

    const { container } = render(
      <ActionButton action={action}>Delete</ActionButton>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("hides button when forbidden and whenForbidden=hide", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    const { container } = render(
      <ActionButton action={action} whenForbidden="hide">
        Delete
      </ActionButton>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("disables button when forbidden and whenForbidden=disable (default)", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    render(<ActionButton action={action}>Delete</ActionButton>);

    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows loading state when pending", () => {
    const action = mockAction({ pending: true });

    render(<ActionButton action={action}>Delete</ActionButton>);

    // Headless default button shows "Loading..." when loading
    expect(screen.getByRole("button").textContent).toBe("Loading...");
  });

  it("shows button when forbidden and whenForbidden=show", () => {
    const submitFn = vi.fn();
    const action = mockAction({
      permitted: false,
      reason: "No permission",
      submit: submitFn,
    });

    render(
      <ActionButton action={action} whenForbidden="show">
        Delete
      </ActionButton>,
    );

    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(button);
    expect(submitFn).toHaveBeenCalled();
  });
});
