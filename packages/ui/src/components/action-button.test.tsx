import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
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

    render(createElement(ActionButton, { action, children: "Delete" }));

    const button = screen.getByRole("button");
    expect(button.textContent).toBe("Delete");

    fireEvent.click(button);
    expect(submitFn).toHaveBeenCalled();
  });

  it("hides button when invisible", () => {
    const action = mockAction({ permitted: false, invisible: true });

    const { container } = render(
      createElement(ActionButton, { action, children: "Delete" }),
    );

    expect(container.innerHTML).toBe("");
  });

  it("hides button when forbidden and whenForbidden=hide", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    const { container } = render(
      createElement(ActionButton, {
        action,
        whenForbidden: "hide",
        children: "Delete",
      }),
    );

    expect(container.innerHTML).toBe("");
  });

  it("disables button when forbidden and whenForbidden=disable (default)", () => {
    const action = mockAction({ permitted: false, reason: "No permission" });

    render(createElement(ActionButton, { action, children: "Delete" }));

    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows loading state when pending", () => {
    const action = mockAction({ pending: true });

    render(createElement(ActionButton, { action, children: "Delete" }));

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
      createElement(ActionButton, {
        action,
        whenForbidden: "show",
        children: "Delete",
      }),
    );

    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(button);
    expect(submitFn).toHaveBeenCalled();
  });
});
