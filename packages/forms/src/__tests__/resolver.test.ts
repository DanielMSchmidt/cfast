import { describe, it, expect } from "vitest";
import { buildResolver } from "../resolver";
import type { FieldDefinition } from "../types";

function makeField(overrides: Partial<FieldDefinition> = {}): FieldDefinition {
  return {
    name: "title",
    inputType: "text",
    label: "Title",
    required: false,
    hasDefault: false,
    isPrimaryKey: false,
    validation: {},
    ...overrides,
  };
}

describe("buildResolver", () => {
  it("returns no errors for valid data", async () => {
    const resolver = buildResolver([makeField({ required: true })]);
    const result = await resolver({ title: "Hello" }, undefined, {} as never);
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ title: "Hello" });
  });

  it("returns error for missing required field", async () => {
    const resolver = buildResolver([makeField({ required: true })]);
    const result = await resolver({}, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/required/i);
  });

  it("validates minLength", async () => {
    const resolver = buildResolver([
      makeField({ validation: { minLength: 3 } }),
    ]);
    const result = await resolver({ title: "ab" }, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/at least 3/);
  });

  it("validates maxLength", async () => {
    const resolver = buildResolver([
      makeField({ validation: { maxLength: 5 } }),
    ]);
    const result = await resolver({ title: "toolong" }, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/at most 5/);
  });

  it("validates min for numbers", async () => {
    const resolver = buildResolver([
      makeField({
        name: "views",
        inputType: "number",
        validation: { min: 0 },
      }),
    ]);
    const result = await resolver({ views: -1 }, undefined, {} as never);
    expect(result.errors.views).toBeDefined();
  });

  it("validates max for numbers", async () => {
    const resolver = buildResolver([
      makeField({
        name: "views",
        inputType: "number",
        validation: { max: 100 },
      }),
    ]);
    const result = await resolver({ views: 101 }, undefined, {} as never);
    expect(result.errors.views).toBeDefined();
  });

  it("validates pattern", async () => {
    const resolver = buildResolver([
      makeField({ validation: { pattern: /^[a-z]+$/ } }),
    ]);
    const result = await resolver({ title: "UPPER" }, undefined, {} as never);
    expect(result.errors.title).toBeDefined();
    expect(result.errors.title!.message).toMatch(/pattern/i);
  });

  it("uses custom message when provided", async () => {
    const resolver = buildResolver([
      makeField({
        required: true,
        validation: { message: "Please enter a title" },
      }),
    ]);
    const result = await resolver({}, undefined, {} as never);
    expect(result.errors.title!.message).toBe("Please enter a title");
  });

  it("skips validation for empty optional fields", async () => {
    const resolver = buildResolver([
      makeField({ required: false, validation: { minLength: 3 } }),
    ]);
    const result = await resolver({}, undefined, {} as never);
    expect(result.errors).toEqual({});
  });
});
