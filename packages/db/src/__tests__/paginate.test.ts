import { describe, it, expect } from "vitest";
import {
  parseCursorParams,
  parseOffsetParams,
  encodeCursor,
  decodeCursor,
} from "../paginate";
import { createQueryBuilder } from "../query-builder";
import { posts, schema, createMockD1, grantsForRole } from "./helpers";

describe("parseCursorParams", () => {
  it("parses cursor and limit from URL", () => {
    const req = new Request("https://example.com/posts?cursor=abc123&limit=10");
    const result = parseCursorParams(req);
    expect(result).toEqual({ type: "cursor", cursor: "abc123", limit: 10 });
  });

  it("returns null cursor when not provided", () => {
    const req = new Request("https://example.com/posts");
    const result = parseCursorParams(req);
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 20 });
  });

  it("uses defaultLimit", () => {
    const req = new Request("https://example.com/posts");
    const result = parseCursorParams(req, { defaultLimit: 50 });
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 50 });
  });

  it("clamps limit to maxLimit", () => {
    const req = new Request("https://example.com/posts?limit=999");
    const result = parseCursorParams(req, { maxLimit: 50 });
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 50 });
  });

  it("clamps limit to 1 minimum", () => {
    const req = new Request("https://example.com/posts?limit=0");
    const result = parseCursorParams(req);
    expect(result).toEqual({ type: "cursor", cursor: null, limit: 1 });
  });
});

describe("parseOffsetParams", () => {
  it("parses page and limit from URL", () => {
    const req = new Request("https://example.com/posts?page=3&limit=10");
    const result = parseOffsetParams(req);
    expect(result).toEqual({ type: "offset", page: 3, limit: 10 });
  });

  it("defaults to page 1", () => {
    const req = new Request("https://example.com/posts");
    const result = parseOffsetParams(req);
    expect(result).toEqual({ type: "offset", page: 1, limit: 20 });
  });

  it("clamps page to 1 minimum", () => {
    const req = new Request("https://example.com/posts?page=-5");
    const result = parseOffsetParams(req);
    expect(result).toEqual({ type: "offset", page: 1, limit: 20 });
  });

  it("uses defaultLimit and maxLimit", () => {
    const req = new Request("https://example.com/posts?limit=200");
    const result = parseOffsetParams(req, { defaultLimit: 25, maxLimit: 50 });
    expect(result).toEqual({ type: "offset", page: 1, limit: 50 });
  });
});

describe("cursor encoding", () => {
  it("encodes column values as base64 JSON", () => {
    const cursor = encodeCursor(["2026-01-01", "post-123"]);
    expect(typeof cursor).toBe("string");
    const decoded = decodeCursor(cursor);
    expect(decoded).toEqual(["2026-01-01", "post-123"]);
  });

  it("handles single column", () => {
    const cursor = encodeCursor(["post-123"]);
    expect(decodeCursor(cursor)).toEqual(["post-123"]);
  });

  it("handles numeric values", () => {
    const cursor = encodeCursor([42, "abc"]);
    expect(decodeCursor(cursor)).toEqual([42, "abc"]);
  });

  it("returns null for null/invalid cursor", () => {
    expect(decodeCursor(null)).toBeNull();
    expect(decodeCursor("not-valid-base64-json!!!")).toBeNull();
  });
});

describe("QueryBuilder.paginate", () => {
  it("returns an Operation with read permissions for cursor params", () => {
    const qb = createQueryBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = qb.paginate(
      { type: "cursor", cursor: null, limit: 10 },
      { cursorColumns: [posts.id] },
    );
    expect(op.permissions).toEqual([{ action: "read", table: posts }]);
    expect(typeof op.run).toBe("function");
  });

  it("returns an Operation with read permissions for offset params", () => {
    const qb = createQueryBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = qb.paginate(
      { type: "offset", page: 1, limit: 10 },
    );
    expect(op.permissions).toEqual([{ action: "read", table: posts }]);
    expect(typeof op.run).toBe("function");
  });

  it("returns empty permissions when unsafe", () => {
    const qb = createQueryBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: true,
    });

    const op = qb.paginate(
      { type: "cursor", cursor: null, limit: 10 },
      { cursorColumns: [posts.id] },
    );
    expect(op.permissions).toEqual([]);
  });

  it("throws when table not found in schema", async () => {
    const unknownTable = posts; // use posts but with empty schema
    const qb = createQueryBuilder({
      d1: createMockD1(),
      schema: {},
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: unknownTable,
      unsafe: true,
    });

    const op = qb.paginate(
      { type: "cursor", cursor: null, limit: 10 },
      { cursorColumns: [posts.id] },
    );
    await expect(op.run({})).rejects.toThrow("Table not found in schema");
  });
});
