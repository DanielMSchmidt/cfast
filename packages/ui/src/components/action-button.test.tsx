import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { ActionHookResult } from "@cfast/actions/client";

const mockFetcherSubmit = vi.fn();

vi.mock("react-router", () => ({
  useFetcher: () => ({
    state: "idle",
    data: undefined,
    submit: mockFetcherSubmit,
  }),
}));

const { ActionButton } = await import("./action-button.js");

afterEach(() => {
  cleanup();
  mockFetcherSubmit.mockClear();
});

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

  describe("href prop", () => {
    it("renders a link wrapping a button when href is provided and permitted", () => {
      const action = mockAction();

      const { container } = render(
        <ActionButton action={action} href="/documents/new">
          New Document
        </ActionButton>,
      );

      const link = container.querySelector("a");
      expect(link).not.toBeNull();
      expect(link!.getAttribute("href")).toBe("/documents/new");
      expect(screen.getByRole("button").textContent).toBe("New Document");
    });

    it("renders a disabled button when href is provided but not permitted", () => {
      const action = mockAction({ permitted: false, reason: "No permission" });

      const { container } = render(
        <ActionButton action={action} href="/documents/new">
          New Document
        </ActionButton>,
      );

      // No link rendered when disabled
      const link = container.querySelector("a");
      expect(link).toBeNull();

      const button = screen.getByRole("button");
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });

    it("hides when href is provided, not permitted, and whenForbidden=hide", () => {
      const action = mockAction({ permitted: false });

      const { container } = render(
        <ActionButton action={action} href="/documents/new" whenForbidden="hide">
          New Document
        </ActionButton>,
      );

      expect(container.innerHTML).toBe("");
    });
  });

  describe("input prop", () => {
    it("submits form data via fetcher when input is provided", () => {
      const action = mockAction();

      render(
        <ActionButton
          action={action}
          input={{ _action: "deletePost", id: "123" }}
        >
          Delete
        </ActionButton>,
      );

      fireEvent.click(screen.getByRole("button"));

      // Should use the fetcher submit, not the action's submit
      expect(mockFetcherSubmit).toHaveBeenCalledTimes(1);
      const submittedData = mockFetcherSubmit.mock.calls[0][0] as FormData;
      expect(submittedData.get("_action")).toBe("deletePost");
      expect(submittedData.get("id")).toBe("123");
    });

    it("does not include null/undefined values in form data", () => {
      const action = mockAction();

      render(
        <ActionButton
          action={action}
          input={{ _action: "update", name: "test", optional: null }}
        >
          Update
        </ActionButton>,
      );

      fireEvent.click(screen.getByRole("button"));

      const submittedData = mockFetcherSubmit.mock.calls[0][0] as FormData;
      expect(submittedData.get("_action")).toBe("update");
      expect(submittedData.get("name")).toBe("test");
      expect(submittedData.has("optional")).toBe(false);
    });

    it("uses action.submit() when input is not provided", () => {
      const submitFn = vi.fn();
      const action = mockAction({ submit: submitFn });

      render(
        <ActionButton action={action}>Submit</ActionButton>,
      );

      fireEvent.click(screen.getByRole("button"));
      expect(submitFn).toHaveBeenCalled();
      expect(mockFetcherSubmit).not.toHaveBeenCalled();
    });
  });
});
