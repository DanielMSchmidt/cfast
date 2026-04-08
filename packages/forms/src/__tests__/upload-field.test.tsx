// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect } from "vitest";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { introspectTable } from "../introspect";
import { upload, getUploadMetadata } from "../validate";
import type { UploadFieldMetadata } from "../types";

describe("upload() helper + introspection", () => {
  it("attaches and reads upload metadata from a text column", () => {
    const metadata: UploadFieldMetadata = {
      filetype: "productImages",
      basePath: "/uploads",
      multiple: true,
      maxFiles: 5,
      accept: "image/*",
    };
    const table = sqliteTable("uf1", {
      id: text("id").primaryKey(),
      imageKey: upload(text("image_key"), metadata),
    });

    // Round-trip: the helper stores metadata on the column's protected
    // config, and `getUploadMetadata` reads it back — that's the contract
    // `introspectTable` relies on.
    expect(getUploadMetadata(table.imageKey)).toEqual(metadata);
  });

  it("promotes upload columns to inputType='upload' during introspection", () => {
    const metadata: UploadFieldMetadata = {
      filetype: "productImages",
      multiple: false,
    };
    const table = sqliteTable("uf2", {
      id: text("id").primaryKey(),
      imageKey: upload(text("image_key"), metadata),
      name: text("name").notNull(),
    });

    const fields = introspectTable(table);
    const imageField = fields.find((f) => f.name === "imageKey");
    const nameField = fields.find((f) => f.name === "name");

    expect(imageField?.inputType).toBe("upload");
    expect(imageField?.upload).toEqual(metadata);
    // Sanity check — normal text columns still resolve to "text".
    expect(nameField?.inputType).toBe("text");
    expect(nameField?.upload).toBeUndefined();
  });

  it("leaves undecorated text columns untouched", () => {
    const table = sqliteTable("uf3", {
      id: text("id").primaryKey(),
      body: text("body"),
    });
    expect(getUploadMetadata(table.body)).toBeUndefined();
    const fields = introspectTable(table);
    expect(fields.find((f) => f.name === "body")?.inputType).toBe("text");
  });
});
