import { describe, it, expect } from "vitest";
import { getField, getRecordId } from "./record-access";

// ---------------------------------------------------------------------------
// getField
// ---------------------------------------------------------------------------

describe("getField", () => {
  it("returns the property value from a plain object", () => {
    expect(getField({ name: "Alice" }, "name")).toBe("Alice");
  });

  it("returns undefined for a missing key", () => {
    expect(getField({ name: "Alice" }, "age")).toBeUndefined();
  });

  it("returns undefined when obj is null", () => {
    expect(getField(null, "key")).toBeUndefined();
  });

  it("returns undefined when obj is a string (not an object)", () => {
    expect(getField("not-an-object", "key")).toBeUndefined();
  });

  it("returns undefined when obj is a number", () => {
    expect(getField(42, "key")).toBeUndefined();
  });

  it("returns undefined when obj is undefined", () => {
    expect(getField(undefined, "key")).toBeUndefined();
  });

  it("returns undefined when obj is a boolean", () => {
    expect(getField(true, "key")).toBeUndefined();
  });

  it("returns a nested object without further unwrapping", () => {
    const nested = { inner: "value" };
    expect(getField({ data: nested }, "data")).toBe(nested);
  });

  it("returns null for a key whose value is explicitly null", () => {
    expect(getField({ avatarUrl: null }, "avatarUrl")).toBeNull();
  });

  it("returns 0 for a key whose value is 0 (falsy but valid)", () => {
    expect(getField({ count: 0 }, "count")).toBe(0);
  });

  it("returns false for a key whose value is false (falsy but valid)", () => {
    expect(getField({ published: false }, "published")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getRecordId
// ---------------------------------------------------------------------------

describe("getRecordId", () => {
  it("returns a string id", () => {
    expect(getRecordId({ id: "abc-123" })).toBe("abc-123");
  });

  it("returns a numeric id", () => {
    expect(getRecordId({ id: 42 })).toBe(42);
  });

  it("returns 0 when id property is missing", () => {
    expect(getRecordId({ name: "Alice" })).toBe(0);
  });

  it("returns 0 when id is null", () => {
    expect(getRecordId({ id: null })).toBe(0);
  });

  it("returns 0 when id is undefined", () => {
    expect(getRecordId({ id: undefined })).toBe(0);
  });

  it("returns 0 when id is an object", () => {
    expect(getRecordId({ id: { nested: true } })).toBe(0);
  });

  it("returns 0 when id is a boolean", () => {
    expect(getRecordId({ id: true })).toBe(0);
  });

  it("returns 0 when the entire input is null", () => {
    expect(getRecordId(null)).toBe(0);
  });

  it("returns 0 when the entire input is a primitive", () => {
    expect(getRecordId("not-an-object")).toBe(0);
  });

  it("returns the string id '0' (falsy-but-valid string id)", () => {
    expect(getRecordId({ id: "0" })).toBe("0");
  });

  it("returns numeric 0 id (falsy-but-valid numeric id)", () => {
    // id=0 is falsy but typeof 0 === 'number', so it must be returned
    expect(getRecordId({ id: 0 })).toBe(0);
  });
});
