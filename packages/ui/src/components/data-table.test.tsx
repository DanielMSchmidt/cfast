// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { createElement } from "react";
import { DataTable } from "./data-table.js";

vi.mock("../plugin.js", () => ({
  useComponent: (slot: string) => {
    switch (slot) {
      case "table":
        return ({ children }: { children: unknown }) =>
          createElement("table", { "data-testid": "table" }, children as string);
      case "tableHead":
        return ({ children }: { children: unknown }) =>
          createElement("thead", null, children as string);
      case "tableBody":
        return ({ children }: { children: unknown }) =>
          createElement("tbody", null, children as string);
      case "tableRow":
        return ({ children, onClick }: { children: unknown; onClick?: () => void }) =>
          createElement("tr", { onClick }, children as string);
      case "tableCell":
        return ({
          children,
          header,
          sortable,
          sortDirection,
          onSort,
        }: {
          children: unknown;
          header?: boolean;
          sortable?: boolean;
          sortDirection?: string | null;
          onSort?: () => void;
        }) =>
          createElement(
            header ? "th" : "td",
            {
              onClick: sortable ? onSort : undefined,
              "data-sort-dir": sortDirection ?? undefined,
            },
            children as string,
          );
      default:
        return ({ children }: { children: unknown }) =>
          createElement("div", null, children as string);
    }
  },
}));

afterEach(cleanup);

const sampleData = {
  items: [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 2, name: "Bob", email: "bob@example.com" },
  ],
  isLoading: false,
};

describe("DataTable", () => {
  it("renders rows from data", () => {
    render(
      createElement(DataTable, {
        data: sampleData,
        columns: ["name", "email"],
      }),
    );

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("alice@example.com")).toBeTruthy();
  });

  it("renders empty message when no data", () => {
    render(
      createElement(DataTable, {
        data: { items: [], isLoading: false },
        columns: ["name"],
        emptyMessage: "Nothing here",
      }),
    );

    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it("normalizes string column shorthands to ColumnDef", () => {
    render(
      createElement(DataTable, {
        data: sampleData,
        columns: ["name"],
      }),
    );

    // Shorthand "name" → label "Name"
    expect(screen.getByText("Name")).toBeTruthy();
  });

  it("supports column objects", () => {
    render(
      createElement(DataTable, {
        data: sampleData,
        columns: [{ key: "name", label: "Full Name", sortable: false }],
      }),
    );

    expect(screen.getByText("Full Name")).toBeTruthy();
  });

  it("renders checkboxes when selectable", () => {
    render(
      createElement(DataTable, {
        data: sampleData,
        columns: ["name"],
        selectable: true,
      }),
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(2);
  });

  it("calls onRowClick when row is clicked", () => {
    const onRowClick = vi.fn();
    render(
      createElement(DataTable, {
        data: sampleData,
        columns: ["name"],
        onRowClick,
      }),
    );

    fireEvent.click(screen.getByText("Alice"));
    expect(onRowClick).toHaveBeenCalledWith(sampleData.items[0]);
  });

  it("uses custom getRowId", () => {
    const data = {
      items: [
        { uuid: "abc", name: "Alice" },
        { uuid: "def", name: "Bob" },
      ],
      isLoading: false,
    };

    render(
      createElement(DataTable, {
        data,
        columns: ["name"],
        selectable: true,
        getRowId: (row: unknown) => (row as Record<string, unknown>).uuid as string,
      }),
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(2);
  });
});
