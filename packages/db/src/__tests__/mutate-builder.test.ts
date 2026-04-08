import { describe, it, expect, vi } from "vitest";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "../mutate-builder";
import { posts, schema, createMockD1, grantsForRole, lookupTestConfig } from "./helpers";

describe("InsertBuilder", () => {
  it("returns Operation with create permission", () => {
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
      table: posts,
      unsafe: false,
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
    });

    // .returning().run() should also work without params.
    await expect(
      builder.values({ title: "Hello" }).returning().run(),
    ).resolves.not.toThrow();
  });

  it(".run() params are optional for query, mutate and returning paths (#150)", async () => {
    // Regression guard for #150: the entire Operation.run() surface must
    // accept zero arguments so callers aren't forced to pass an empty
    // placeholder object when they don't use `sql.placeholder()`.
    const insertBuilder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      table: posts,
      unsafe: false,
      ...lookupTestConfig(),
    });
    const updateBuilder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      table: posts,
      unsafe: false,
      ...lookupTestConfig(),
    });
    const deleteBuilder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      table: posts,
      unsafe: false,
      ...lookupTestConfig(),
    });

    // Every mutate variant (.run() and .returning().run()) must work with
    // zero args. Typescript will fail the build if `run()` requires params.
    await expect(
      insertBuilder.values({ title: "A" }).run(),
    ).resolves.toBeUndefined();
    await expect(
      insertBuilder.values({ title: "B" }).returning().run(),
    ).resolves.not.toThrow();
    await expect(
      updateBuilder.set({ title: "C" }).where(undefined).run(),
    ).resolves.toBeUndefined();
    await expect(
      updateBuilder.set({ title: "D" }).where(undefined).returning().run(),
    ).resolves.not.toThrow();
    await expect(deleteBuilder.where(undefined).run()).resolves.toBeUndefined();
    await expect(
      deleteBuilder.where(undefined).returning().run(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
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
      ...lookupTestConfig(),
    });

    await expect(builder.where(undefined).run()).resolves.toBeUndefined();
  });
});
