// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { ListView } from "./list-view.js";

// Mock all child components to isolate ListView logic
vi.mock("./page-container.js", () => ({
  PageContainer: ({ title, actions, children }: { title?: string; actions?: unknown; children: unknown }) =>
    createElement("div", { "data-testid": "page-container" },
      title ? createElement("h1", null, title) : null,
      actions ? createElement("div", { "data-testid": "actions-slot" }, actions as string) : null,
      children as string,
    ),
}));

vi.mock("./data-table.js", () => ({
  DataTable: ({ data }: { data: { items: unknown[] } }) =>
    createElement("div", { "data-testid": "data-table" }, `${data.items.length} rows`),
}));

vi.mock("./filter-bar.js", () => ({
  FilterBar: () => createElement("div", { "data-testid": "filter-bar" }),
}));

vi.mock("./bulk-action-bar.js", () => ({
  BulkActionBar: ({ selectedCount }: { selectedCount: number }) =>
    selectedCount > 0
      ? createElement("div", { "data-testid": "bulk-action-bar" }, `${selectedCount} selected`)
      : null,
}));

vi.mock("./empty-state.js", () => ({
  EmptyState: ({ title }: { title: string }) =>
    createElement("div", { "data-testid": "empty-state" }, title),
}));

vi.mock("./action-button.js", () => ({
  ActionButton: ({ children }: { children: unknown }) =>
    createElement("button", { "data-testid": "create-button" }, children as string),
}));

vi.mock("react-router", () => ({
  useSearchParams: () => [new URLSearchParams()],
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/test" }),
}));

afterEach(cleanup);

describe("ListView", () => {
  it("renders title in PageContainer", () => {
    render(
      createElement(ListView, {
        title: "Posts",
        data: { items: [{ id: 1, name: "Test" }] },
        columns: ["name"],
      }),
    );

    expect(screen.getByText("Posts")).toBeTruthy();
  });

  it("renders DataTable with data", () => {
    render(
      createElement(ListView, {
        title: "Posts",
        data: { items: [{ id: 1 }, { id: 2 }] },
        columns: ["id"],
      }),
    );

    expect(screen.getByTestId("data-table")).toBeTruthy();
    expect(screen.getByText("2 rows")).toBeTruthy();
  });

  it("renders EmptyState when no data", () => {
    render(
      createElement(ListView, {
        title: "Posts",
        data: { items: [], isLoading: false },
      }),
    );

    expect(screen.getByTestId("empty-state")).toBeTruthy();
  });

  it("renders FilterBar when filters provided", () => {
    render(
      createElement(ListView, {
        title: "Posts",
        data: { items: [{ id: 1 }] },
        filters: [{ column: "status", type: "select" as const }],
      }),
    );

    expect(screen.getByTestId("filter-bar")).toBeTruthy();
  });

  it("renders pagination controls for offset pagination", () => {
    render(
      createElement(ListView, {
        title: "Posts",
        data: {
          items: [{ id: 1 }],
          totalPages: 5,
          currentPage: 2,
          goToPage: vi.fn(),
        },
        columns: ["id"],
      }),
    );

    expect(screen.getByText("Page 2 of 5")).toBeTruthy();
    expect(screen.getByText("Previous")).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();
  });

  it("renders load more button for cursor pagination", () => {
    const loadMore = vi.fn();
    render(
      createElement(ListView, {
        title: "Posts",
        data: {
          items: [{ id: 1 }],
          hasMore: true,
          loadMore,
        },
        columns: ["id"],
      }),
    );

    const button = screen.getByText("Load more");
    expect(button).toBeTruthy();
    fireEvent.click(button);
    expect(loadMore).toHaveBeenCalled();
  });

  it("renders create button when createAction provided", () => {
    render(
      createElement(ListView, {
        title: "Posts",
        data: { items: [{ id: 1 }] },
        createAction: { _brand: "ActionClientDescriptor" as const, actionNames: ["create"], permissionsKey: "test" },
        createLabel: "New Post",
      }),
    );

    expect(screen.getByTestId("create-button")).toBeTruthy();
    expect(screen.getByText("New Post")).toBeTruthy();
  });
});
