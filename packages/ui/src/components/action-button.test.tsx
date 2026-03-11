import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { ActionButton } from "./action-button.js";
import { createMockDescriptor } from "../__tests__/helpers.js";

afterEach(cleanup);

// Mock useActionStatus
vi.mock("../hooks/use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useActionStatus } from "../hooks/use-action-status.js";
const mockUseActionStatus = vi.mocked(useActionStatus);

describe("ActionButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders button and calls submit on click when permitted", () => {
    const submitFn = vi.fn();
    mockUseActionStatus.mockReturnValue({
      permitted: true,
      invisible: false,
      reason: null,
      submit: submitFn,
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["deletePost"]);
    render(
      createElement(ActionButton, {
        action: descriptor,
        children: "Delete",
      }),
    );

    const button = screen.getByRole("button");
    expect(button.textContent).toBe("Delete");

    fireEvent.click(button);
    expect(submitFn).toHaveBeenCalled();
  });

  it("hides button when invisible", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: true,
      reason: null,
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["deletePost"]);
    const { container } = render(
      createElement(ActionButton, {
        action: descriptor,
        children: "Delete",
      }),
    );

    expect(container.innerHTML).toBe("");
  });

  it("hides button when forbidden and whenForbidden=hide", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["deletePost"]);
    const { container } = render(
      createElement(ActionButton, {
        action: descriptor,
        whenForbidden: "hide",
        children: "Delete",
      }),
    );

    expect(container.innerHTML).toBe("");
  });

  it("disables button when forbidden and whenForbidden=disable (default)", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["deletePost"]);
    render(
      createElement(ActionButton, {
        action: descriptor,
        children: "Delete",
      }),
    );

    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(true);
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

    const descriptor = createMockDescriptor(["deletePost"]);
    render(
      createElement(ActionButton, {
        action: descriptor,
        children: "Delete",
      }),
    );

    // Headless default button shows "Loading..." when loading
    expect(screen.getByRole("button").textContent).toBe("Loading...");
  });

  it("shows button when forbidden and whenForbidden=show", () => {
    const submitFn = vi.fn();
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "No permission",
      submit: submitFn,
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["deletePost"]);
    render(
      createElement(ActionButton, {
        action: descriptor,
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
