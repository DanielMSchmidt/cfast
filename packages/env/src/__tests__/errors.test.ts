import { describe, it, expect } from "vitest";
import { EnvError } from "../errors";

describe("EnvError", () => {
  it("contains all validation errors", () => {
    const err = new EnvError([
      { key: "DB", message: "Missing required D1 binding 'DB'" },
      { key: "CACHE", message: "Missing required KV binding 'CACHE'" },
    ]);
    expect(err).toBeInstanceOf(Error);
    expect(err.errors).toHaveLength(2);
    expect(err.message).toContain("DB");
    expect(err.message).toContain("CACHE");
  });

  it("has a descriptive message listing all errors", () => {
    const err = new EnvError([
      { key: "X", message: "Missing X" },
    ]);
    expect(err.message).toContain("Missing X");
  });
});
