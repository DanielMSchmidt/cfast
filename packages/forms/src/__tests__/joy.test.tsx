import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { AutoForm } from "../joy";
import { upload } from "../validate";

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

  it("auto-maps upload() columns to the UploadField", () => {
    const table = sqliteTable("j4", {
      imageKey: upload(text("image_key"), {
        filetype: "productImages",
        basePath: "/uploads",
        accept: "image/*",
      }),
    });

    render(<AutoForm table={table} mode="create" onSubmit={vi.fn()} />);
    // The joy upload field writes `data-cfast-upload-field="<filetype>"`
    // onto the outer wrapper so tests can confirm the right component was
    // rendered without poking at MUI Joy internals.
    expect(
      document.querySelector("[data-cfast-upload-field='productImages']"),
    ).toBeInTheDocument();
    // The file input is hidden but must still be reachable from the DOM.
    const input = document.querySelector(
      "input[type='file']",
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input?.accept).toBe("image/*");
  });
});
