import { describe, it, expect } from "vitest";
import {
  parseCursorParams,
  parseOffsetParams,
  encodeCursor,
  decodeCursor,
} from "../paginate";

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
