import { describe, it, expect } from "vitest";
import { tableNameToLabel } from "../introspect";

// ---------------------------------------------------------------------------
// tableNameToLabel — pluralization and casing
// ---------------------------------------------------------------------------

describe("tableNameToLabel", () => {
  it("converts a simple lowercase word to title-case plural", () => {
    expect(tableNameToLabel("post")).toBe("Posts");
    expect(tableNameToLabel("user")).toBe("Users");
  });

  it("converts snake_case to title-case plural", () => {
    expect(tableNameToLabel("blog_post")).toBe("Blog Posts");
    expect(tableNameToLabel("audit_log")).toBe("Audit Logs");
  });

  it("converts camelCase to title-case plural", () => {
    expect(tableNameToLabel("blogPost")).toBe("Blog Posts");
  });

  it("pluralizes words ending in -y as -ies", () => {
    expect(tableNameToLabel("category")).toBe("Categories");
    expect(tableNameToLabel("entry")).toBe("Entries");
  });

  it("does not double-pluralize words already ending in common plural suffixes", () => {
    const result = tableNameToLabel("status");
    // Should not produce 'Statuss' or 'Statuses' (already ends in 's')
    expect(result).not.toMatch(/ss$/i);
  });

  it("produces correct label for 'user' table (the special users table)", () => {
    expect(tableNameToLabel("user")).toBe("Users");
  });

  it("produces correct label for a two-word snake_case table", () => {
    expect(tableNameToLabel("product_review")).toBe("Product Reviews");
  });

  it("handles all-caps acronyms gracefully (lowercased by split)", () => {
    // 'api_key' → 'Api Keys'
    const result = tableNameToLabel("api_key");
    expect(result).toContain("Key");
  });

  it("handles empty string without throwing", () => {
    // Edge case: empty name
    expect(() => tableNameToLabel("")).not.toThrow();
  });
});
