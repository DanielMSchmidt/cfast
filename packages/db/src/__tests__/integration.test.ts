import { describe, it, expect } from "vitest";
import { createDb } from "../create-db";
import { compose } from "../compose";
import { posts, auditLogs, schema, createMockD1, grantsForRole } from "./helpers";

describe("integration: permission enforcement", () => {
  it("anonymous cannot create posts", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: { id: "anon" },
      cache: false,
    });

    const op = db.insert(posts).values({ title: "Hack", authorId: "anon" });
    expect(op.permissions).toEqual([{ action: "create", table: posts }]);
    await expect(op.run({})).rejects.toThrow("Cannot create");
  });

  it("user can create posts", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("user"),
      user: { id: "user-1" },
      cache: false,
    });

    const op = db.insert(posts).values({ title: "Hello", authorId: "user-1" });
    await expect(op.run({})).resolves.not.toThrow();
  });

  it("anonymous cannot delete posts", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: { id: "anon" },
      cache: false,
    });

    const op = db.delete(posts).where(undefined);
    await expect(op.run({})).rejects.toThrow("Cannot delete");
  });

  it("editor can delete posts", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op = db.delete(posts).where(undefined);
    await expect(op.run({})).resolves.not.toThrow();
  });

  it("admin can do anything", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("admin"),
      user: { id: "admin-1" },
      cache: false,
    });

    await expect(
      db.insert(posts).values({ title: "Admin Post", authorId: "admin-1" }).run({}),
    ).resolves.not.toThrow();
    await expect(db.delete(posts).where(undefined).run({})).resolves.not.toThrow();
    await expect(
      db
        .insert(auditLogs)
        .values({ action: "test", targetId: "t1", userId: "admin-1" })
        .run({}),
    ).resolves.not.toThrow();
  });

  it("unsafe bypasses all permission checks", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: { id: "anon" },
      cache: false,
    });

    const op = db.unsafe().insert(posts).values({ title: "System", authorId: "system" });
    expect(op.permissions).toEqual([]);
    await expect(op.run({})).resolves.not.toThrow();
  });

  it("unsafe delete also bypasses", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: { id: "anon" },
      cache: false,
    });

    const op = db.unsafe().delete(posts).where(undefined);
    expect(op.permissions).toEqual([]);
    await expect(op.run({})).resolves.not.toThrow();
  });
});

describe("integration: compose", () => {
  it("merges permissions from composed operations", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const updateOp = db.update(posts).set({ published: true }).where(undefined);
    const auditOp = db
      .insert(auditLogs)
      .values({ action: "publish", targetId: "p1", userId: "editor-1" });

    const workflow = compose([updateOp, auditOp], async (doUpdate, doAudit) => {
      await doUpdate({});
      await doAudit({});
      return { done: true };
    });

    expect(workflow.permissions).toEqual([
      { action: "update", table: posts },
      { action: "create", table: auditLogs },
    ]);
  });

  it("composed operation can be run", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const updateOp = db.update(posts).set({ published: true }).where(undefined);
    const auditOp = db
      .insert(auditLogs)
      .values({ action: "publish", targetId: "p1", userId: "editor-1" });

    const workflow = compose([updateOp, auditOp], async (doUpdate, doAudit) => {
      await doUpdate({});
      await doAudit({});
      return { done: true };
    });

    const result = await workflow.run({});
    expect(result).toEqual({ done: true });
  });
});

describe("integration: batch", () => {
  it("merges permissions from all operations", () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op1 = db.insert(posts).values({ title: "Post 1", authorId: "editor-1" });
    const op2 = db
      .insert(auditLogs)
      .values({ action: "create", targetId: "p1", userId: "editor-1" });

    const batchOp = db.batch([op1, op2]);
    expect(batchOp.permissions).toHaveLength(2);
  });

  it("batch can be run", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op1 = db.insert(posts).values({ title: "Post 1", authorId: "editor-1" });
    const op2 = db
      .insert(auditLogs)
      .values({ action: "create", targetId: "p1", userId: "editor-1" });

    const batchOp = db.batch([op1, op2]);
    await expect(batchOp.run({})).resolves.not.toThrow();
  });
});

describe("integration: null user", () => {
  it("null user treated as having no grants", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: [],
      user: null,
      cache: false,
    });

    // no grants means read will fail permission check
    const readOp = db.query(posts).findMany();
    expect(readOp.permissions).toEqual([{ action: "read", table: posts }]);

    // no grants means cannot create
    await expect(
      db.insert(posts).values({ title: "Nope", authorId: "x" }).run({}),
    ).rejects.toThrow();
  });
});
