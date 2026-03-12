// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ListView } from "./list-view.js";

// Mock all child components to isolate ListView logic
vi.mock("./page-container.js", () => ({
  PageContainer: ({ title, actions, children }: { title?: string; actions?: unknown; children: unknown }) => (
    <div data-testid="page-container">
      {title ? <h1>{title}</h1> : null}
      {actions ? <div data-testid="actions-slot">{actions as string}</div> : null}
      {children as string}
    </div>
  ),
}));

vi.mock("./data-table.js", () => ({
  DataTable: ({ data }: { data: { items: unknown[] } }) => (
    <div data-testid="data-table">{`${data.items.length} rows`}</div>
  ),
}));

vi.mock("./filter-bar.js", () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}));

vi.mock("./bulk-action-bar.js", () => ({
  BulkActionBar: ({ selectedCount }: { selectedCount: number }) =>
    selectedCount > 0
      ? <div data-testid="bulk-action-bar">{`${selectedCount} selected`}</div>
      : null,
}));

vi.mock("./empty-state.js", () => ({
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
  ),
}));

vi.mock("./action-button.js", () => ({
  ActionButton: ({ children }: { children: unknown }) => (
    <button data-testid="create-button">{children as string}</button>
  ),
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
      <ListView
        title="Posts"
        data={{ items: [{ id: 1, name: "Test" }] }}
        columns={["name"]}
      />,
    );

    expect(screen.getByText("Posts")).toBeTruthy();
  });

  it("renders DataTable with data", () => {
    render(
      <ListView
        title="Posts"
        data={{ items: [{ id: 1 }, { id: 2 }] }}
        columns={["id"]}
      />,
    );

    expect(screen.getByTestId("data-table")).toBeTruthy();
    expect(screen.getByText("2 rows")).toBeTruthy();
  });

  it("renders EmptyState when no data", () => {
    render(
      <ListView
        title="Posts"
        data={{ items: [], isLoading: false }}
      />,
    );

    expect(screen.getByTestId("empty-state")).toBeTruthy();
  });

  it("renders FilterBar when filters provided", () => {
    render(
      <ListView
        title="Posts"
        data={{ items: [{ id: 1 }] }}
        filters={[{ column: "status", type: "select" as const }]}
      />,
    );

    expect(screen.getByTestId("filter-bar")).toBeTruthy();
  });

  it("renders pagination controls for offset pagination", () => {
    render(
      <ListView
        title="Posts"
        data={{
          items: [{ id: 1 }],
          totalPages: 5,
          currentPage: 2,
          goToPage: vi.fn(),
        }}
        columns={["id"]}
      />,
    );

    expect(screen.getByText("Page 2 of 5")).toBeTruthy();
    expect(screen.getByText("Previous")).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();
  });

  it("renders load more button for cursor pagination", () => {
    const loadMore = vi.fn();
    render(
      <ListView
        title="Posts"
        data={{
          items: [{ id: 1 }],
          hasMore: true,
          loadMore,
        }}
        columns={["id"]}
      />,
    );

    const button = screen.getByText("Load more");
    expect(button).toBeTruthy();
    fireEvent.click(button);
    expect(loadMore).toHaveBeenCalled();
  });

  it("renders create button when createAction provided", () => {
    render(
      <ListView
        title="Posts"
        data={{ items: [{ id: 1 }] }}
        createAction={{ _brand: "ActionClientDescriptor" as const, actionNames: ["create"], permissionsKey: "test" }}
        createLabel="New Post"
      />,
    );

    expect(screen.getByTestId("create-button")).toBeTruthy();
    expect(screen.getByText("New Post")).toBeTruthy();
  });
});
