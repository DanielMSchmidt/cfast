import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { EmptyState } from "./empty-state.js";
import { createMockDescriptor } from "../__tests__/helpers.js";

afterEach(cleanup);

// Mock useActionStatus
vi.mock("../hooks/use-action-status.js", () => ({
  useActionStatus: vi.fn(),
}));

import { useActionStatus } from "../hooks/use-action-status.js";
const mockUseActionStatus = vi.mocked(useActionStatus);

describe("EmptyState", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and description without createAction", () => {
    render(
      createElement(EmptyState, {
        title: "No posts yet",
        description: "Create your first post.",
      }),
    );
    expect(screen.getByText("No posts yet")).toBeTruthy();
    expect(screen.getByText("Create your first post.")).toBeTruthy();
  });

  it("shows CTA when createAction is permitted", () => {
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

    const descriptor = createMockDescriptor(["createPost"]);
    render(
      createElement(EmptyState, {
        title: "No posts",
        createAction: descriptor,
        createLabel: "New Post",
      }),
    );

    const button = screen.getByText("New Post");
    expect(button).toBeTruthy();
    fireEvent.click(button);
    expect(submitFn).toHaveBeenCalled();
  });

  it("hides CTA when not permitted", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: false,
      reason: "No permission",
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["createPost"]);
    render(
      createElement(EmptyState, {
        title: "No posts",
        description: "Talk to an admin.",
        createAction: descriptor,
        createLabel: "New Post",
      }),
    );

    expect(screen.getByText("No posts")).toBeTruthy();
    expect(screen.getByText("Talk to an admin.")).toBeTruthy();
    expect(screen.queryByText("New Post")).toBeNull();
  });

  it("shows generic message when invisible", () => {
    mockUseActionStatus.mockReturnValue({
      permitted: false,
      invisible: true,
      reason: null,
      submit: vi.fn(),
      pending: false,
      data: undefined,
      error: undefined,
    });

    const descriptor = createMockDescriptor(["createPost"]);
    render(
      createElement(EmptyState, {
        title: "No posts",
        createAction: descriptor,
      }),
    );

    expect(screen.getByText("Nothing here yet")).toBeTruthy();
  });
});
