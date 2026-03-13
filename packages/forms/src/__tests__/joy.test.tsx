import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { AutoForm } from "../joy";

describe("Joy UI AutoForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a form with Joy UI components", () => {
    const table = sqliteTable("j1", {
      title: text("title").notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders select for enum fields", () => {
    const table = sqliteTable("j2", {
      status: text("status", { enum: ["draft", "published"] }).notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("renders checkbox for boolean fields", () => {
    const table = sqliteTable("j3", {
      published: integer("published", { mode: "boolean" }).notNull(),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    // Joy Checkbox renders label inline, so check by role
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });
});
