import { describe, it, expect } from "vitest";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { introspectTable } from "../introspect";
import { v } from "../validate";

describe("introspectTable", () => {
  it("maps text columns to text input", () => {
    const table = sqliteTable("t1", {
      title: text("title").notNull(),
    });
    const fields = introspectTable(table);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({
      name: "title",
      inputType: "text",
      label: "Title",
      required: true,
    });
  });

  it("maps integer columns to number input", () => {
    const table = sqliteTable("t2", {
      views: integer("views"),
    });
    const fields = introspectTable(table);
    expect(fields[0]).toMatchObject({
      name: "views",
      inputType: "number",
      required: false,
    });
  });

  it("maps integer mode=boolean to checkbox", () => {
    const table = sqliteTable("t3", {
      published: integer("published", { mode: "boolean" }).notNull(),
    });
    const fields = introspectTable(table);
    expect(fields[0]).toMatchObject({
      name: "published",
      inputType: "checkbox",
    });
  });

  it("maps text with enum to select", () => {
    const table = sqliteTable("t4", {
      status: text("status", {
        enum: ["draft", "published", "archived"],
      }).notNull(),
    });
    const fields = introspectTable(table);
    expect(fields[0]).toMatchObject({
      name: "status",
      inputType: "select",
      enumValues: ["draft", "published", "archived"],
    });
  });

  it("includes v() rules in validation", () => {
    const table = sqliteTable("t5", {
      title: v(text("title").notNull(), { minLength: 3, maxLength: 200 }),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.validation).toMatchObject({
      minLength: 3,
      maxLength: 200,
    });
  });

  it("derives maxLength from text column length", () => {
    const table = sqliteTable("t6", {
      title: text("title", { length: 255 }).notNull(),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.validation.maxLength).toBe(255);
  });

  it("generates human-readable labels from column names", () => {
    const table = sqliteTable("t7", {
      firstName: text("first_name"),
      createdAt: text("created_at"),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.label).toBe("First Name");
    expect(fields[1]!.label).toBe("Created At");
  });

  it("marks columns with defaults as hasDefault", () => {
    const table = sqliteTable("t8", {
      status: text("status").default("draft"),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.hasDefault).toBe(true);
  });

  it("marks primary key columns", () => {
    const table = sqliteTable("t9", {
      id: integer("id").primaryKey(),
    });
    const fields = introspectTable(table);
    expect(fields[0]!.isPrimaryKey).toBe(true);
  });
});
