import { describe, it, expect, vi } from "vitest";
import {
  defineInput,
  InvalidInputError,
  z,
} from "../input-schema.js";
import { createActions } from "../create-actions.js";
import type { Db } from "@cfast/db";
import type { ActionContext, RequestArgs } from "../types.js";
import { createMockOperation, createFormDataRequest, createJsonRequest } from "./helpers.js";

describe("z.number", () => {
  it("parses numeric strings", () => {
    const result = z.number().parse("42");
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it("parses native numbers", () => {
    const result = z.number().parse(3.14);
    expect(result).toEqual({ ok: true, value: 3.14 });
  });

  it("rejects NaN-producing strings", () => {
    // The whole reason this module exists: Number("not a number") === NaN.
    const result = z.number().parse("not a number");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/finite/);
  });

  it("rejects native NaN", () => {
    const result = z.number().parse(NaN);
    expect(result.ok).toBe(false);
  });

  it("rejects Infinity", () => {
    const result = z.number().parse(Infinity);
    expect(result.ok).toBe(false);
  });

  it("rejects whitespace-only strings (would coerce to 0 via Number())", () => {
    const result = z.number().parse("   ");
    expect(result.ok).toBe(false);
  });

  it("rejects missing values", () => {
    expect(z.number().parse(undefined).ok).toBe(false);
    expect(z.number().parse(null).ok).toBe(false);
    expect(z.number().parse("").ok).toBe(false);
  });

  it("rejects non-string non-number inputs", () => {
    expect(z.number().parse({}).ok).toBe(false);
    expect(z.number().parse([]).ok).toBe(false);
    expect(z.number().parse(true).ok).toBe(false);
  });
});

describe("z.integer", () => {
  it("accepts whole numbers", () => {
    expect(z.integer().parse("42")).toEqual({ ok: true, value: 42 });
    expect(z.integer().parse(0)).toEqual({ ok: true, value: 0 });
    expect(z.integer().parse(-7)).toEqual({ ok: true, value: -7 });
  });

  it("rejects fractional values", () => {
    const result = z.integer().parse("3.14");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/integer/);
  });

  it("rejects NaN", () => {
    expect(z.integer().parse("nope").ok).toBe(false);
  });
});

describe("z.string", () => {
  it("accepts strings", () => {
    expect(z.string().parse("hello")).toEqual({ ok: true, value: "hello" });
  });

  it("rejects missing values", () => {
    expect(z.string().parse(undefined).ok).toBe(false);
    expect(z.string().parse("").ok).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(z.string().parse(42).ok).toBe(false);
    expect(z.string().parse({}).ok).toBe(false);
  });
});

describe("z.boolean", () => {
  it("accepts native booleans", () => {
    expect(z.boolean().parse(true)).toEqual({ ok: true, value: true });
    expect(z.boolean().parse(false)).toEqual({ ok: true, value: false });
  });

  it("accepts form-typical strings", () => {
    expect(z.boolean().parse("true")).toEqual({ ok: true, value: true });
    expect(z.boolean().parse("false")).toEqual({ ok: true, value: false });
    expect(z.boolean().parse("on")).toEqual({ ok: true, value: true });
    expect(z.boolean().parse("off")).toEqual({ ok: true, value: false });
    expect(z.boolean().parse("1")).toEqual({ ok: true, value: true });
    expect(z.boolean().parse("0")).toEqual({ ok: true, value: false });
  });

  it("rejects garbage strings (no silent coercion)", () => {
    expect(z.boolean().parse("yes").ok).toBe(false);
    expect(z.boolean().parse("Y").ok).toBe(false);
  });
});

describe("z.optional / z.nullable", () => {
  it("optional returns undefined for missing", () => {
    const f = z.optional(z.number());
    expect(f.parse(undefined)).toEqual({ ok: true, value: undefined });
    expect(f.parse("")).toEqual({ ok: true, value: undefined });
  });

  it("optional still validates present values", () => {
    const f = z.optional(z.number());
    expect(f.parse("42")).toEqual({ ok: true, value: 42 });
    expect(f.parse("nope").ok).toBe(false);
  });

  it("nullable returns null for missing", () => {
    const f = z.nullable(z.string());
    expect(f.parse(null)).toEqual({ ok: true, value: null });
  });
});

describe("z.custom", () => {
  it("returns the parsed value when the callback succeeds", () => {
    const slug = z.custom<string>((raw) => {
      if (typeof raw !== "string") throw new Error("must be a string");
      if (!/^[a-z0-9-]+$/.test(raw)) throw new Error("must be slug-safe");
      return raw;
    });
    expect(slug.parse("hello-world")).toEqual({ ok: true, value: "hello-world" });
  });

  it("captures thrown errors as field-level messages", () => {
    const slug = z.custom<string>((raw) => {
      if (typeof raw !== "string") throw new Error("must be a string");
      throw new Error("nope");
    });
    const result = slug.parse("anything");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("nope");
  });
});

describe("defineInput", () => {
  it("returns a typed object on success", () => {
    const parse = defineInput({
      title: z.string(),
      position: z.integer(),
      pinned: z.optional(z.boolean()),
    });

    const result = parse({ title: "Hello", position: "3", pinned: "true" });
    expect(result).toEqual({ title: "Hello", position: 3, pinned: true });
  });

  it("throws InvalidInputError with field-keyed errors on failure", () => {
    const parse = defineInput({
      title: z.string(),
      position: z.integer(),
    });

    let caught: unknown;
    try {
      parse({ title: "", position: "not a number" });
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeInstanceOf(InvalidInputError);
    const err = caught as InvalidInputError;
    expect(err.errors).toHaveProperty("title");
    expect(err.errors).toHaveProperty("position");
    expect(err.message).toContain("title:");
    expect(err.message).toContain("position:");
  });

  it("collects ALL errors before throwing (not just the first)", () => {
    // Better DX than fail-fast: form-level error displays should show
    // every problematic field at once.
    const parse = defineInput({
      a: z.string(),
      b: z.number(),
      c: z.boolean(),
    });

    let caught: InvalidInputError | undefined;
    try {
      parse({});
    } catch (e) {
      caught = e as InvalidInputError;
    }

    expect(caught).toBeDefined();
    expect(Object.keys(caught!.errors)).toEqual(["a", "b", "c"]);
  });
});

describe("createAction with input schema", () => {
  function makeGetContext() {
    return async (_args: RequestArgs) => ({
      db: {} as Db,
      user: { id: "user-1" },
      grants: [],
    });
  }

  it("rejects NaN-producing form fields before invoking the handler (#159)", async () => {
    const handlerFn = vi.fn(
      (
        _db: Db,
        _input: { position: number },
        _ctx: ActionContext<{ id: string }>,
      ) => createMockOperation({ ok: true }),
    );

    const { createAction } = createActions({ getContext: makeGetContext() });
    const moveCard = createAction({
      input: defineInput({ position: z.integer() }),
      handler: handlerFn,
    });

    const request = createFormDataRequest({ position: "not a number" });
    await expect(moveCard.action({ request, params: {} })).rejects.toBeInstanceOf(
      InvalidInputError,
    );
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it("passes parsed numeric input through to the handler", async () => {
    const handlerFn = vi.fn(
      (
        _db: Db,
        _input: { position: number },
        _ctx: ActionContext<{ id: string }>,
      ) => createMockOperation({ ok: true }),
    );

    const { createAction } = createActions({ getContext: makeGetContext() });
    const moveCard = createAction({
      input: defineInput({ position: z.integer() }),
      handler: handlerFn,
    });

    const request = createJsonRequest({ position: 7 });
    await moveCard.action({ request, params: {} });

    expect(handlerFn).toHaveBeenCalledOnce();
    // The handler receives the parsed (number) value, not the raw string.
    const receivedInput = handlerFn.mock.calls[0][1];
    expect(receivedInput).toEqual({ position: 7 });
    expect(typeof receivedInput.position).toBe("number");
  });

  it("legacy positional createAction(fn) form still works", async () => {
    const handlerFn = vi.fn(
      (
        _db: Db,
        _input: { title: string },
        _ctx: ActionContext<{ id: string }>,
      ) => createMockOperation({ ok: true }),
    );

    const { createAction } = createActions({ getContext: makeGetContext() });
    const create = createAction(handlerFn);

    const request = createJsonRequest({ title: "Hello" });
    await create.action({ request, params: {} });
    expect(handlerFn).toHaveBeenCalledOnce();
  });
});
