import { describe, it, expect } from "vitest";
import { fieldForColumn } from "../field-for-column.js";
import { DateField } from "../date-field.js";
import { BooleanField } from "../boolean-field.js";
import { NumberField } from "../number-field.js";
import { TextField } from "../text-field.js";
import { EmailField } from "../email-field.js";
import { JsonField } from "../json-field.js";

describe("fieldForColumn", () => {
  it("maps timestamp to DateField", () => {
    expect(fieldForColumn({ dataType: "timestamp", name: "createdAt" })).toBe(DateField);
  });

  it("maps boolean to BooleanField", () => {
    expect(fieldForColumn({ dataType: "boolean", name: "published" })).toBe(BooleanField);
  });

  it("maps integer to NumberField", () => {
    expect(fieldForColumn({ dataType: "integer", name: "count" })).toBe(NumberField);
  });

  it("maps real to NumberField", () => {
    expect(fieldForColumn({ dataType: "real", name: "price" })).toBe(NumberField);
  });

  it("maps email column name to EmailField", () => {
    expect(fieldForColumn({ dataType: "text", name: "email" })).toBe(EmailField);
  });

  it("maps json to JsonField", () => {
    expect(fieldForColumn({ dataType: "json", name: "metadata" })).toBe(JsonField);
  });

  it("defaults to TextField for text type", () => {
    expect(fieldForColumn({ dataType: "text", name: "title" })).toBe(TextField);
  });
});
