// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { BulkActionBar } from "./bulk-action-bar.js";

vi.mock("../plugin.js", () => ({
  useComponent: () =>
    ({ children, onClick }: { children: unknown; onClick?: () => void }) =>
      <button onClick={onClick}>{children as string}</button>,
}));

afterEach(cleanup);

describe("BulkActionBar", () => {
  it("renders nothing when no rows selected", () => {
    const { container } = render(
      <BulkActionBar
        selectedCount={0}
        actions={[]}
        onAction={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("shows selected count", () => {
    render(
      <BulkActionBar
        selectedCount={3}
        actions={[]}
        onAction={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(screen.getByText("3 selected")).toBeTruthy();
  });

  it("renders action buttons", () => {
    render(
      <BulkActionBar
        selectedCount={2}
        actions={[
          { label: "Delete" },
          { label: "Archive" },
        ]}
        onAction={vi.fn()}
        onClearSelection={vi.fn()}
      />,
    );

    expect(screen.getByText("Delete")).toBeTruthy();
    expect(screen.getByText("Archive")).toBeTruthy();
  });

  it("calls onAction when action button clicked", () => {
    const onAction = vi.fn();
    const action = { label: "Delete" };

    render(
      <BulkActionBar
        selectedCount={2}
        actions={[action]}
        onAction={onAction}
        onClearSelection={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Delete"));
    expect(onAction).toHaveBeenCalledWith(action);
  });

  it("calls onClearSelection when Clear clicked", () => {
    const onClearSelection = vi.fn();

    render(
      <BulkActionBar
        selectedCount={2}
        actions={[]}
        onAction={vi.fn()}
        onClearSelection={onClearSelection}
      />,
    );

    fireEvent.click(screen.getByText("Clear"));
    expect(onClearSelection).toHaveBeenCalled();
  });
});
