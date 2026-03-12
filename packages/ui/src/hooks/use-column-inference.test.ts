// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useColumnInference } from "./use-column-inference.js";

function makeMockTable() {
  return {
    id: { dataType: "number", name: "id", notNull: true },
    name: { dataType: "string", name: "name", notNull: true },
    email: { dataType: "string", name: "email" },
    createdAt: { dataType: "date", name: "created_at" },
    isActive: { dataType: "boolean", name: "is_active" },
    // Non-column properties should be ignored
    tableName: "users",
  };
}

describe("useColumnInference", () => {
  it("returns empty array when table is undefined", () => {
    const { result } = renderHook(() => useColumnInference(undefined));
    expect(result.current).toEqual([]);
  });

  it("infers columns from Drizzle table metadata", () => {
    const table = makeMockTable();
    const { result } = renderHook(() => useColumnInference(table));

    // Should include columns with dataType + name, skip non-column entries
    const keys = result.current.map((c) => c.key);
    expect(keys).toContain("id");
    expect(keys).toContain("name");
    expect(keys).toContain("email");
    expect(keys).toContain("createdAt");
    expect(keys).toContain("isActive");
    expect(keys).not.toContain("tableName"); // string, not a column object
  });

  it("generates labels from camelCase keys", () => {
    const table = makeMockTable();
    const { result } = renderHook(() => useColumnInference(table));

    const createdAt = result.current.find((c) => c.key === "createdAt");
    expect(createdAt?.label).toBe("Created At");

    const isActive = result.current.find((c) => c.key === "isActive");
    expect(isActive?.label).toBe("Is Active");
  });

  it("filters to specified columns", () => {
    const table = makeMockTable();
    const { result } = renderHook(() =>
      useColumnInference(table, ["name", "email"]),
    );

    const keys = result.current.map((c) => c.key);
    expect(keys).toEqual(["name", "email"]);
  });

  it("preserves column order from subset", () => {
    const table = makeMockTable();
    const { result } = renderHook(() =>
      useColumnInference(table, ["email", "name"]),
    );

    const keys = result.current.map((c) => c.key);
    expect(keys).toEqual(["email", "name"]);
  });

  it("assigns field components to each inferred column", () => {
    const table = makeMockTable();
    const { result } = renderHook(() => useColumnInference(table));

    for (const col of result.current) {
      expect(col.field).toBeDefined();
      expect(typeof col.field).toBe("function");
    }
  });

  it("marks all columns as sortable", () => {
    const table = makeMockTable();
    const { result } = renderHook(() => useColumnInference(table));

    for (const col of result.current) {
      expect(col.sortable).toBe(true);
    }
  });
});
