import { describe, it, expect, vi } from "vitest";
import { createInsertBuilder, createUpdateBuilder, createDeleteBuilder } from "../mutate-builder";
import { testPermissions, posts, schema, createMockD1 } from "./helpers";
import type { TestUser } from "./helpers";

describe("InsertBuilder", () => {
  it("returns Operation with create permission", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
      table: posts,
      unsafe: false,
    });

    const op = builder.values({ title: "Hello" });
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
    expect(typeof op.run).toBe("function");
  });

  it("returning() returns Operation with create permission", () => {
    const user: TestUser = { id: "user-1", role: "user" };
    const builder = createInsertBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
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
      permissions: testPermissions,
      user: { id: "user-1", role: "anonymous" },
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
      permissions: testPermissions,
      user: { id: "user-1", role: "user" },
      table: posts,
      unsafe: false,
      onMutate,
    });

    await builder.values({ title: "Hello" }).run({});
    expect(onMutate).toHaveBeenCalledWith("posts");
  });
});

describe("UpdateBuilder", () => {
  it("returns Operation with update permission", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const builder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
      table: posts,
      unsafe: false,
    });

    const op = builder.set({ published: true }).where(undefined);
    expect(op.permissions).toEqual([{ action: "update", table: posts }]);
  });

  it("returning() preserves permissions", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const builder = createUpdateBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
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
      permissions: testPermissions,
      user: { id: "user-1", role: "anonymous" },
      table: posts,
      unsafe: true,
    });

    expect(builder.set({}).where(undefined).permissions).toEqual([]);
  });
});

describe("DeleteBuilder", () => {
  it("returns Operation with delete permission", () => {
    const user: TestUser = { id: "user-1", role: "editor" };
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user,
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
      permissions: testPermissions,
      user: { id: "user-1", role: "editor" },
      table: posts,
      unsafe: true,
    });

    expect(builder.where(undefined).permissions).toEqual([]);
  });

  it("returning() preserves permissions", () => {
    const builder = createDeleteBuilder({
      d1: createMockD1(),
      schema,
      permissions: testPermissions,
      user: { id: "user-1", role: "editor" },
      table: posts,
      unsafe: false,
    });

    const op = builder.where(undefined).returning();
    expect(op.permissions).toEqual([{ action: "delete", table: posts }]);
  });
});
