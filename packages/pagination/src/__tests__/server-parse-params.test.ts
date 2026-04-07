import { describe, it, expect } from "vitest";
import {
  parseCursorParams,
  parseOffsetParams,
} from "../server/parse-params";

function makeRequest(url: string): Request {
  return new Request(url);
}

describe("parseCursorParams", () => {
  it("returns null cursor and default limit when params are missing", () => {
    const result = parseCursorParams(makeRequest("https://app.test/recipes"));
    expect(result).toEqual({ cursor: null, limit: 20 });
  });

  it("reads cursor and limit from the URL", () => {
    const result = parseCursorParams(
      makeRequest("https://app.test/recipes?cursor=abc&limit=5"),
    );
    expect(result).toEqual({ cursor: "abc", limit: 5 });
  });

  it("uses defaultLimit when limit is missing", () => {
    const result = parseCursorParams(
      makeRequest("https://app.test/recipes?cursor=abc"),
      { defaultLimit: 50 },
    );
    expect(result.limit).toBe(50);
  });

  it("clamps limit to maxLimit", () => {
    const result = parseCursorParams(
      makeRequest("https://app.test/recipes?limit=9999"),
      { maxLimit: 100 },
    );
    expect(result.limit).toBe(100);
  });

  it("clamps limit to a minimum of 1", () => {
    const result = parseCursorParams(
      makeRequest("https://app.test/recipes?limit=-5"),
    );
    expect(result.limit).toBe(1);
  });

  it("falls back to defaultLimit when limit is non-numeric", () => {
    const result = parseCursorParams(
      makeRequest("https://app.test/recipes?limit=abc"),
      { defaultLimit: 25 },
    );
    expect(result.limit).toBe(25);
  });

  it("destructures cleanly into { cursor, limit }", () => {
    const { cursor, limit } = parseCursorParams(
      makeRequest("https://app.test/recipes?cursor=xyz&limit=10"),
    );
    expect(cursor).toBe("xyz");
    expect(limit).toBe(10);
  });
});

describe("parseOffsetParams", () => {
  it("returns page=1 and default limit when params are missing", () => {
    const result = parseOffsetParams(makeRequest("https://app.test/recipes"));
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it("reads page and limit from the URL", () => {
    const result = parseOffsetParams(
      makeRequest("https://app.test/recipes?page=3&limit=10"),
    );
    expect(result).toEqual({ page: 3, limit: 10 });
  });

  it("clamps page to a minimum of 1", () => {
    const result = parseOffsetParams(
      makeRequest("https://app.test/recipes?page=0"),
    );
    expect(result.page).toBe(1);
  });

  it("clamps limit to maxLimit", () => {
    const result = parseOffsetParams(
      makeRequest("https://app.test/recipes?limit=500"),
      { maxLimit: 50 },
    );
    expect(result.limit).toBe(50);
  });

  it("uses defaultLimit when limit is missing", () => {
    const result = parseOffsetParams(
      makeRequest("https://app.test/recipes?page=2"),
      { defaultLimit: 25 },
    );
    expect(result.limit).toBe(25);
  });
});
