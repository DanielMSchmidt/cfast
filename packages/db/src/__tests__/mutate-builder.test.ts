import { describe, it, expect, vi } from "vitest";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "../mutate-builder";
import { posts, schema, createMockD1, grantsForRole } from "./helpers";

describe("InsertBuilder", () => {
  it("returns Operation with create permission", () => {
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = builder.values({ title: "Hello" });
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
    expect(typeof op.run).toBe("function");
  });

  it("returning() returns Operation with create permission", () => {
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = builder.values({ title: "Hello" }).returning();
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
    expect(typeof op.run).toBe("function");
  });

  it("empty permissions when unsafe", () => {
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: { id: "user-1" },
      table: posts,
      unsafe: true,
    });

    expect(builder.values({ title: "Hello" }).permissions).toEqual([]);
  });

  it("calls onMutate after successful run", async () => {
    const onMutate = vi.fn();
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
      onMutate,
    });

    await builder.values({ title: "Hello" }).run({});
    expect(onMutate).toHaveBeenCalledWith("posts");
  });

  it("supports the single-op shorthand: .values().run() with no args", async () => {
    const onMutate = vi.fn();
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
      onMutate,
    });

    // Single insert with no compose() and no params object.
    await expect(
      builder.values({ title: "Hello" }).run(),
    ).resolves.toBeUndefined();
    expect(onMutate).toHaveBeenCalledWith("posts");
  });

  it("supports the single-op shorthand for .returning().run() with no args", async () => {
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    // .returning().run() should also work without params.
    await expect(
      builder.values({ title: "Hello" }).returning().run(),
    ).resolves.not.toThrow();
  });
});

describe("UpdateBuilder", () => {
  it("returns Operation with update permission", () => {
    const builder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = builder.set({ published: true }).where(undefined);
    expect(op.permissions).toEqual([{ action: "update", table: posts }]);
  });

  it("returning() preserves permissions", () => {
    const builder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = builder.set({ published: true }).where(undefined).returning();
    expect(op.permissions).toEqual([{ action: "update", table: posts }]);
  });

  it("empty permissions when unsafe", () => {
    const builder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: { id: "user-1" },
      table: posts,
      unsafe: true,
    });

    expect(builder.set({}).where(undefined).permissions).toEqual([]);
  });

  it("supports single-op shorthand: .set().where().run() with no args", async () => {
    const builder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    await expect(
      builder.set({ published: true }).where(undefined).run(),
    ).resolves.toBeUndefined();
  });
});

describe("DeleteBuilder", () => {
  it("returns Operation with delete permission", () => {
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = builder.where(undefined);
    expect(op.permissions).toEqual([{ action: "delete", table: posts }]);
  });

  it("empty permissions when unsafe", () => {
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: true,
    });

    expect(builder.where(undefined).permissions).toEqual([]);
  });

  it("returning() preserves permissions", () => {
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    const op = builder.where(undefined).returning();
    expect(op.permissions).toEqual([{ action: "delete", table: posts }]);
  });

  it("supports single-op shorthand: .where().run() with no args", async () => {
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
    });

    await expect(builder.where(undefined).run()).resolves.toBeUndefined();
  });
});
