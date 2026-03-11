import { describe, it, expect } from "vitest";
import { createDb } from "../create-db";
import { posts, auditLogs, schema, createMockD1, grantsForRole } from "./helpers";

describe("createDb", () => {
  it("returns a Db instance with all methods", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
    });

    expect(typeof db.query).toBe("function");
    expect(typeof db.insert).toBe("function");
    expect(typeof db.update).toBe("function");
    expect(typeof db.delete).toBe("function");
    expect(typeof db.unsafe).toBe("function");
    expect(typeof db.batch).toBe("function");
    expect(db.cache).toBeDefined();
    expect(typeof db.cache.invalidate).toBe("function");
  });

  it("db.query(table) returns a query builder", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
    });

    const qb = db.query(posts);
    expect(typeof qb.findMany).toBe("function");
    expect(typeof qb.findFirst).toBe("function");
  });

  it("db.query(table).findMany() returns Operation with permissions", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
    });

    const op = db.query(posts).findMany();
    expect(op.permissions).toEqual([{ action: "read", table: posts }]);
  });

  it("db.insert(table).values() returns Operation with permissions", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
    });

    const op = db.insert(posts).values({ title: "Hello" });
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
  });

  it("db.update(table).set().where() returns Operation", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
    });

    const op = db.update(posts).set({ published: true }).where(undefined);
    expect(op.permissions).toEqual([{ action: "update", table: posts }]);
  });

  it("db.delete(table).where() returns Operation", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
    });

    const op = db.delete(posts).where(undefined);
    expect(op.permissions).toEqual([{ action: "delete", table: posts }]);
  });

  it("db.unsafe() returns a Db with empty permissions on operations", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: { id: "user-1" },
    });

    const unsafeDb = db.unsafe();
    const op = unsafeDb.query(posts).findMany();
    expect(op.permissions).toEqual([]);
  });

  it("db.batch() merges permissions from all operations", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
    });

    const op1 = db.insert(posts).values({ title: "Post 1" });
    const op2 = db.insert(auditLogs).values({ action: "create" });

    const batchOp = db.batch([op1, op2]);
    expect(batchOp.permissions).toEqual([
      { action: "create", table: posts },
      { action: "create", table: auditLogs },
    ]);
  });

  it("db.batch() deduplicates permissions", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
    });

    const op1 = db.insert(posts).values({ title: "Post 1" });
    const op2 = db.insert(posts).values({ title: "Post 2" });

    const batchOp = db.batch([op1, op2]);
    expect(batchOp.permissions).toHaveLength(1);
  });

  it("accepts cache: false to disable caching", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: [],
      user: null,
      cache: false,
    });

    expect(typeof db.query).toBe("function");
  });
});
