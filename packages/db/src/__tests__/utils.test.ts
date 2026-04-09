import { describe, it, expect } from "vitest";
import {
  deduplicateDescriptors,
  combineWhere,
  makePermissions,
} from "../utils";

// ---------------------------------------------------------------------------
// Drizzle-name mock helpers
// ---------------------------------------------------------------------------

function makeTable(name: string) {
  return { [Symbol.for("drizzle:Name")]: name } as never;
}

const postsA = makeTable("posts");
const postsB = makeTable("posts"); // same name, different object
const comments = makeTable("comments");

// ---------------------------------------------------------------------------
// deduplicateDescriptors
// ---------------------------------------------------------------------------

describe("deduplicateDescriptors", () => {
  it("returns empty array for empty input", () => {
    expect(deduplicateDescriptors([])).toEqual([]);
  });

  it("returns a single descriptor unchanged", () => {
    const d = [{ action: "read" as const, table: postsA }];
    expect(deduplicateDescriptors(d)).toHaveLength(1);
  });

  it("removes duplicate with identical action and table name (different object reference)", () => {
    const descriptors = [
      { action: "read" as const, table: postsA },
      { action: "read" as const, table: postsB },
    ];
    const result = deduplicateDescriptors(descriptors);
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe("read");
  });

  it("keeps two descriptors with different actions on the same table", () => {
    const descriptors = [
      { action: "read" as const, table: postsA },
      { action: "create" as const, table: postsA },
    ];
    expect(deduplicateDescriptors(descriptors)).toHaveLength(2);
  });

  it("keeps two descriptors with the same action on different tables", () => {
    const descriptors = [
      { action: "read" as const, table: postsA },
      { action: "read" as const, table: comments },
    ];
    expect(deduplicateDescriptors(descriptors)).toHaveLength(2);
  });

  it("preserves insertion order (first occurrence is kept)", () => {
    const first = { action: "create" as const, table: postsA };
    const second = { action: "read" as const, table: comments };
    const duplicate = { action: "create" as const, table: postsB }; // postsB same name as postsA

    const result = deduplicateDescriptors([first, second, duplicate]);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(first);
    expect(result[1]).toBe(second);
  });

  it("deduplicates 10 identical descriptors to 1", () => {
    const descriptors = Array.from({ length: 10 }, () => ({
      action: "delete" as const,
      table: postsA,
    }));
    expect(deduplicateDescriptors(descriptors)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// combineWhere
// (Tests the branching logic without needing real Drizzle SQL objects)
// ---------------------------------------------------------------------------

describe("combineWhere", () => {
  it("returns undefined when both conditions are undefined", () => {
    expect(combineWhere(undefined, undefined)).toBeUndefined();
  });

  it("calls getSQL on permFilter when userCondition is undefined", () => {
    const mockSql = { getSQL: () => Symbol("sql") };
    const result = combineWhere(undefined, mockSql as never);
    // combineWhere calls permFilter.getSQL() and returns it
    expect(result).toBeDefined();
  });

  it("calls getSQL on userCondition when permFilter is undefined", () => {
    const mockSql = { getSQL: () => Symbol("sql") };
    const result = combineWhere(mockSql as never, undefined);
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// makePermissions
// ---------------------------------------------------------------------------

describe("makePermissions", () => {
  it("returns empty array when unsafe is true", () => {
    expect(makePermissions(true, "read", postsA)).toEqual([]);
  });

  it("returns a single descriptor when unsafe is false", () => {
    const result = makePermissions(false, "delete", postsA);
    expect(result).toHaveLength(1);
    expect(result[0]!.action).toBe("delete");
    expect(result[0]!.table).toBe(postsA);
  });

  it("wraps the correct action for each CRUD operation", () => {
    for (const action of ["read", "create", "update", "delete", "manage"] as const) {
      const result = makePermissions(false, action, postsA);
      expect(result[0]!.action).toBe(action);
    }
  });
});
