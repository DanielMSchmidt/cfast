import { describe, it, expect } from "vitest";
import { encodeCursor, decodeCursor } from "../server/cursor";

describe("encodeCursor / decodeCursor", () => {
  it("round-trips a single string value", () => {
    const cursor = encodeCursor(["abc123"]);
    expect(decodeCursor(cursor)).toEqual(["abc123"]);
  });

  it("round-trips multiple values of mixed types", () => {
    const cursor = encodeCursor(["2024-01-01T00:00:00.000Z", "abc123", 42]);
    expect(decodeCursor(cursor)).toEqual([
      "2024-01-01T00:00:00.000Z",
      "abc123",
      42,
    ]);
  });

  it("round-trips an empty array", () => {
    const cursor = encodeCursor([]);
    expect(decodeCursor(cursor)).toEqual([]);
  });

  it("returns null for a null cursor", () => {
    expect(decodeCursor(null)).toBeNull();
  });

  it("returns null for a malformed cursor", () => {
    expect(decodeCursor("not-base64-!!!")).toBeNull();
  });

  it("returns null for valid base64 that is not the expected JSON shape", () => {
    expect(decodeCursor(btoa("hello world"))).toBeNull();
  });

  it("returns null for valid JSON without `v` key", () => {
    expect(decodeCursor(btoa(JSON.stringify({ other: [1, 2] })))).toBeNull();
  });

  it("returns null when `v` is not an array", () => {
    expect(decodeCursor(btoa(JSON.stringify({ v: "scalar" })))).toBeNull();
  });

  it("produces opaque base64 (not raw JSON)", () => {
    const cursor = encodeCursor(["abc"]);
    expect(cursor).not.toContain("abc");
    expect(cursor).not.toContain("[");
  });
});
