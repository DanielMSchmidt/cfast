import { describe, it, expect } from "vitest";
import { toJSON } from "../json";

describe("toJSON", () => {
  it("converts Date fields to ISO strings in a plain object", () => {
    const date = new Date("2025-01-15T10:30:00.000Z");
    const row = { id: "1", title: "Hello", createdAt: date, count: 42 };
    const result = toJSON(row);

    expect(result).toEqual({
      id: "1",
      title: "Hello",
      createdAt: "2025-01-15T10:30:00.000Z",
      count: 42,
    });
    expect(typeof result.createdAt).toBe("string");
  });

  it("converts Date fields in an array of objects", () => {
    const rows = [
      { id: "1", createdAt: new Date("2025-01-01T00:00:00Z") },
      { id: "2", createdAt: new Date("2025-06-15T12:00:00Z") },
    ];
    const result = toJSON(rows);

    expect(result).toEqual([
      { id: "1", createdAt: "2025-01-01T00:00:00.000Z" },
      { id: "2", createdAt: "2025-06-15T12:00:00.000Z" },
    ]);
  });

  it("handles nested objects", () => {
    const row = {
      id: "1",
      author: {
        name: "Alice",
        joinedAt: new Date("2024-01-01T00:00:00Z"),
      },
    };
    const result = toJSON(row);

    expect(result).toEqual({
      id: "1",
      author: {
        name: "Alice",
        joinedAt: "2024-01-01T00:00:00.000Z",
      },
    });
  });

  it("handles a single Date value", () => {
    const date = new Date("2025-03-20T08:00:00Z");
    expect(toJSON(date)).toBe("2025-03-20T08:00:00.000Z");
  });

  it("passes through primitives unchanged", () => {
    expect(toJSON("hello")).toBe("hello");
    expect(toJSON(42)).toBe(42);
    expect(toJSON(true)).toBe(true);
    expect(toJSON(null)).toBe(null);
    expect(toJSON(undefined)).toBe(undefined);
  });

  it("handles empty arrays and objects", () => {
    expect(toJSON([])).toEqual([]);
    expect(toJSON({})).toEqual({});
  });

  it("handles objects without Date fields (no-op)", () => {
    const row = { id: "1", title: "Hello", count: 42 };
    expect(toJSON(row)).toEqual(row);
  });

  it("handles nested arrays", () => {
    const data = {
      posts: [
        { id: "1", createdAt: new Date("2025-01-01T00:00:00Z") },
      ],
    };
    const result = toJSON(data);
    expect(result.posts[0].createdAt).toBe("2025-01-01T00:00:00.000Z");
  });
});
