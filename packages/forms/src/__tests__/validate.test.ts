import { describe, it, expect } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { getValidationRules, VALIDATE_SYMBOL } from "../validate";

describe("$validate", () => {
  it("stores and retrieves validation rules on a text column", () => {
    const table = sqliteTable("posts", {
      title: text("title").notNull().$validate({ minLength: 3, maxLength: 200 }),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toEqual({ minLength: 3, maxLength: 200 });
  });

  it("stores and retrieves validation rules on an integer column", () => {
    const table = sqliteTable("test_int", {
      views: integer("views").$validate({ min: 0, max: 10000 }),
    });
    const rules = getValidationRules(table.views);
    expect(rules).toEqual({ min: 0, max: 10000 });
  });

  it("returns undefined for columns without $validate", () => {
    const table = sqliteTable("test_no_val", {
      title: text("title").notNull(),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toBeUndefined();
  });

  it("supports pattern validation", () => {
    const table = sqliteTable("test_pattern", {
      slug: text("slug").$validate({ pattern: /^[a-z0-9-]+$/ }),
    });
    const rules = getValidationRules(table.slug);
    expect(rules).toEqual({ pattern: /^[a-z0-9-]+$/ });
  });

  it("supports custom error message", () => {
    const table = sqliteTable("test_msg", {
      title: text("title").$validate({ minLength: 3, message: "Too short" }),
    });
    const rules = getValidationRules(table.title);
    expect(rules).toEqual({ minLength: 3, message: "Too short" });
  });
});
