import { describe, it, expect } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { v, getValidationRules } from "../validate";

describe("v() and getValidationRules", () => {
  it("stores and retrieves validation rules on a text column", () => {
    const table = sqliteTable("posts", {
      title: v(text("title").notNull(), { minLength: 3, maxLength: 200 }),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toEqual({ minLength: 3, maxLength: 200 });
  });

  it("stores and retrieves validation rules on an integer column", () => {
    const table = sqliteTable("test_int", {
      views: v(integer("views"), { min: 0, max: 10000 }),
    });
    const rules = getValidationRules(table.views);
    expect(rules).toEqual({ min: 0, max: 10000 });
  });

  it("returns undefined for columns without validation", () => {
    const table = sqliteTable("test_no_val", {
      title: text("title").notNull(),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toBeUndefined();
  });

  it("supports pattern validation", () => {
    const table = sqliteTable("test_pattern", {
      slug: v(text("slug"), { pattern: /^[a-z0-9-]+$/ }),
    });
    const rules = getValidationRules(table.slug);
    expect(rules).toEqual({ pattern: /^[a-z0-9-]+$/ });
  });

  it("supports custom error message", () => {
    const table = sqliteTable("test_msg", {
      title: v(text("title"), { minLength: 3, message: "Too short" }),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toEqual({ minLength: 3, message: "Too short" });
  });
});
