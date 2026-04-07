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

  it("uses D1's native batch() API for atomic execution", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op1 = db.insert(posts).values({ title: "Post 1", authorId: "editor-1" });
    const op2 = db.update(posts).set({ published: true }).where(undefined);
    const op3 = db.insert(auditLogs).values({
      action: "publish",
      targetId: "p1",
      userId: "editor-1",
    });

    await db.batch([op1, op2, op3]).run({});

    // Native batch should be called exactly once with all three statements.
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(3);

    // Each statement should be the right kind.
    const sqls = d1._batches[0].map((s) => s.sql.trim().toLowerCase());
    expect(sqls[0]).toMatch(/^insert into "posts"/);
    expect(sqls[1]).toMatch(/^update "posts"/);
    expect(sqls[2]).toMatch(/^insert into "audit_logs"/);
  });

  it("checks every sub-op's permission upfront before issuing the batch", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("user"), // can create posts but NOT audit logs
      user: { id: "user-1" },
      cache: false,
    });

    const op1 = db.insert(posts).values({ title: "Hello", authorId: "user-1" });
    const op2 = db.insert(auditLogs).values({
      action: "create",
      targetId: "p1",
      userId: "user-1",
    });

    await expect(db.batch([op1, op2]).run({})).rejects.toThrow();
    // The batch should NEVER be issued if the permission check failed.
    expect(d1._batches).toHaveLength(0);
  });

  it("decrement-stock checkout pattern: atomic across multiple updates", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    // Simulate decrementing stock on three product rows + inserting an order.
    const decA = db.update(posts).set({ published: true }).where(undefined);
    const decB = db.update(posts).set({ published: false }).where(undefined);
    const decC = db.update(posts).set({ published: true }).where(undefined);
    const order = db
      .insert(auditLogs)
      .values({ action: "checkout", targetId: "order-1", userId: "editor-1" });

    await db.batch([decA, decB, decC, order]).run({});

    // All four go in a single atomic batch -- D1 will rollback all if any fail.
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(4);
  });

  it("falls back to sequential execution when an op is not batchable", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const realOp = db.insert(posts).values({ title: "Real", authorId: "editor-1" });
    // A user-supplied operation without the BATCHABLE symbol.
    const userOp = {
      permissions: [],
      run: async () => "manual-result",
    };

    await db.batch([realOp, userOp]).run({});

    // Native batch should NOT be called when not all ops are batchable.
    expect(d1._batches).toHaveLength(0);
    // The real insert should still have been issued via prepare().
    const inserts = d1._calls.filter((c) => /insert into "posts"/i.test(c.sql));
    expect(inserts.length).toBeGreaterThanOrEqual(1);
  });

  it("invalidates cache for every mutated table after the batch commits", async () => {
    const invalidated: string[] = [];
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: {
        backend: "cache-api",
        onInvalidate: (tables) => {
          for (const t of tables) invalidated.push(t);
        },
      },
    });

    const op1 = db.insert(posts).values({ title: "Post 1", authorId: "editor-1" });
    const op2 = db.insert(auditLogs).values({
      action: "create",
      targetId: "p1",
      userId: "editor-1",
    });

    await db.batch([op1, op2]).run({});

    expect(invalidated).toContain("posts");
    expect(invalidated).toContain("audit_logs");
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
