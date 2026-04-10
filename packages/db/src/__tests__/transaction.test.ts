import { describe, it, expect } from "vitest";
import { createDb } from "../create-db";
import { TransactionError } from "../transaction";
import { posts, auditLogs, schema, createMockD1, grantsForRole } from "./helpers";

describe("db.transaction: happy path", () => {
  it("returns TransactionResult with callback value and meta", async () => {
    const db = createDb({ d1: createMockD1(), schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    const txResult = await db.transaction(async () => ({ ok: true, count: 42 }));
    expect(txResult.result).toEqual({ ok: true, count: 42 });
    expect(txResult.meta.changes).toBe(0);
    expect(txResult.meta.writeResults).toEqual([]);
  });

  it("flushes a single write as an atomic batch", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    await db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "Hello", authorId: "editor-1" }).run();
    });
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(1);
    expect(d1._batches[0][0].sql.toLowerCase()).toMatch(/^insert into "posts"/);
  });

  it("flushes multiple writes into one atomic batch", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    await db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "One", authorId: "editor-1" }).run();
      await tx.update(posts).set({ published: true }).where(undefined).run();
      await tx.insert(auditLogs).values({ action: "create", targetId: "p1", userId: "editor-1" }).run();
    });
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(3);
  });

  it("does not issue a batch when no writes were recorded", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    const { result: value, meta } = await db.transaction(async () => "no-writes");
    expect(value).toBe("no-writes");
    expect(meta.changes).toBe(0);
    expect(meta.writeResults).toEqual([]);
    expect(d1._batches).toHaveLength(0);
  });

  it("reads inside the tx execute eagerly against the real db", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    await db.transaction(async (tx) => { await tx.query(posts).findMany().run({}); });
    const selectCalls = d1._calls.filter((c) => /select/i.test(c.sql) && /posts/i.test(c.sql));
    expect(selectCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("db.transaction: rollback on throw", () => {
  it("discards pending writes and rethrows the error", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    await expect(db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "Should rollback", authorId: "editor-1" }).run();
      throw new Error("boom");
    })).rejects.toThrow("boom");
    expect(d1._batches).toHaveLength(0);
  });

  it("propagates the error when the underlying batch flush fails", async () => {
    const d1 = createMockD1();
    d1.batch = async () => { throw new Error("flush failed"); };
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    await expect(db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "x", authorId: "editor-1" }).run();
    })).rejects.toThrow("flush failed");
  });
});

describe("db.transaction: permission enforcement", () => {
  it("refuses the entire transaction when any sub-op lacks permission", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("user"), user: { id: "user-1" }, cache: false });
    await expect(db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "OK", authorId: "user-1" }).run();
      await tx.insert(auditLogs).values({ action: "create", targetId: "p1", userId: "user-1" }).run();
    })).rejects.toThrow();
    expect(d1._batches).toHaveLength(0);
  });
});

describe("db.transaction: nested transactions", () => {
  it("flattens nested tx.transaction() into the parent batch", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    await db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "Outer", authorId: "editor-1" }).run();
      await tx.transaction(async (inner) => {
        await inner.insert(posts).values({ id: "p2", title: "Inner", authorId: "editor-1" }).run();
      });
      await tx.insert(auditLogs).values({ action: "create", targetId: "p1", userId: "editor-1" }).run();
    });
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(3);
  });

  it("nested tx error aborts the entire outer transaction", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    await expect(db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "Outer", authorId: "editor-1" }).run();
      await tx.transaction(async (inner) => {
        await inner.insert(posts).values({ id: "p2", title: "Inner", authorId: "editor-1" }).run();
        throw new Error("nested boom");
      });
    })).rejects.toThrow("nested boom");
    expect(d1._batches).toHaveLength(0);
  });
});

describe("db.transaction: misuse guards", () => {
  it("throws TransactionError when .run() is called after the tx commits", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    let leakedOp: { run: () => Promise<void> } | null = null;
    await db.transaction(async (tx) => {
      leakedOp = tx.insert(posts).values({ id: "p1", title: "ok", authorId: "editor-1" });
      await leakedOp.run();
    });
    await expect(leakedOp!.run()).rejects.toThrow(TransactionError);
  });

  it("throws TransactionError when .run() is called after the tx aborts", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    let leakedOp: { run: () => Promise<void> } | null = null;
    await expect(db.transaction(async (tx) => {
      leakedOp = tx.insert(posts).values({ id: "p1", title: "x", authorId: "editor-1" });
      throw new Error("aborted");
    })).rejects.toThrow("aborted");
    await expect(leakedOp!.run()).rejects.toThrow(TransactionError);
  });
});

describe("db.transaction: meta.changes (#254)", () => {
  it("returns meta.changes and writeResults after a successful flush", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    const { result, meta } = await db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "Hello", authorId: "editor-1" }).run();
      await tx.update(posts).set({ published: true }).where(undefined).run();
      return "done";
    });
    expect(result).toBe("done");
    expect(meta.changes).toBe(2);
    expect(meta.writeResults).toHaveLength(2);
  });

  it("returns zero changes for a read-only transaction", async () => {
    const db = createDb({ d1: createMockD1(), schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    const { meta } = await db.transaction(async () => "read-only");
    expect(meta.changes).toBe(0);
    expect(meta.writeResults).toEqual([]);
  });

  it("exposes per-statement meta in writeResults", async () => {
    const d1 = createMockD1();
    const db = createDb({ d1, schema, grants: grantsForRole("editor"), user: { id: "editor-1" }, cache: false });
    const { meta } = await db.transaction(async (tx) => {
      await tx.insert(posts).values({ id: "p1", title: "One", authorId: "editor-1" }).run();
      await tx.insert(posts).values({ id: "p2", title: "Two", authorId: "editor-1" }).run();
      await tx.insert(auditLogs).values({ action: "create", targetId: "p1", userId: "editor-1" }).run();
    });
    expect(meta.writeResults).toHaveLength(3);
    expect(meta.changes).toBe(3);
  });
});
