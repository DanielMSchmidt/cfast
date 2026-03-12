// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { DataTable } from "./data-table.js";

vi.mock("../plugin.js", () => ({
  useComponent: (slot: string) => {
    switch (slot) {
      case "table":
        return ({ children }: { children: unknown }) =>
          <table data-testid="table">{children as string}</table>;
      case "tableHead":
        return ({ children }: { children: unknown }) =>
          <thead>{children as string}</thead>;
      case "tableBody":
        return ({ children }: { children: unknown }) =>
          <tbody>{children as string}</tbody>;
      case "tableRow":
        return ({ children, onClick }: { children: unknown; onClick?: () => void }) =>
          <tr onClick={onClick}>{children as string}</tr>;
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
        }) => {
          const Tag = header ? "th" : "td";
          return (
            <Tag
              onClick={sortable ? onSort : undefined}
              data-sort-dir={sortDirection ?? undefined}
            >
              {children as string}
            </Tag>
          );
        };
      default:
        return ({ children }: { children: unknown }) =>
          <div>{children as string}</div>;
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
      <DataTable
        data={sampleData}
        columns={["name", "email"]}
      />,
    );

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("alice@example.com")).toBeTruthy();
  });

  it("renders empty message when no data", () => {
    render(
      <DataTable
        data={{ items: [], isLoading: false }}
        columns={["name"]}
        emptyMessage="Nothing here"
      />,
    );

    expect(screen.getByText("Nothing here")).toBeTruthy();
  });

  it("normalizes string column shorthands to ColumnDef", () => {
    render(
      <DataTable
        data={sampleData}
        columns={["name"]}
      />,
    );

    // Shorthand "name" → label "Name"
    expect(screen.getByText("Name")).toBeTruthy();
  });

  it("supports column objects", () => {
    render(
      <DataTable
        data={sampleData}
        columns={[{ key: "name", label: "Full Name", sortable: false }]}
      />,
    );

    expect(screen.getByText("Full Name")).toBeTruthy();
  });

  it("renders checkboxes when selectable", () => {
    render(
      <DataTable
        data={sampleData}
        columns={["name"]}
        selectable
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(2);
  });

  it("calls onRowClick when row is clicked", () => {
    const onRowClick = vi.fn();
    render(
      <DataTable
        data={sampleData}
        columns={["name"]}
        onRowClick={onRowClick}
      />,
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
      <DataTable
        data={data}
        columns={["name"]}
        selectable
        getRowId={(row: unknown) => (row as Record<string, unknown>).uuid as string}
      />,
    );

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(2);
  });
});
