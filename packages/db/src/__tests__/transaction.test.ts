import { describe, it, expect } from "vitest";
import { createDb } from "../create-db";
import { TransactionError } from "../transaction";
import {
  posts,
  auditLogs,
  schema,
  createMockD1,
  grantsForRole,
} from "./helpers";

/**
 * Unit tests for `db.transaction()`.
 *
 * These tests exercise the recording-proxy behavior against a mocked D1
 * (`createMockD1`) that records every `prepare()`/`batch()` call. The goal is
 * to verify:
 *
 * 1. Happy path: reads execute eagerly, writes are deferred and flushed as a
 *    single atomic batch when the callback returns.
 * 2. Rollback: if the callback throws, no batch is ever issued.
 * 3. Permission enforcement: failures abort the transaction before any SQL
 *    goes to D1.
 * 4. Nested transactions: flatten into the parent's batch.
 * 5. Misuse: running ops after commit/abort throws a `TransactionError`.
 *
 * End-to-end tests that use miniflare D1 (real SQLite, real concurrency) live
 * in `tests/integration/db-permissions/transaction.test.ts`.
 */

describe("db.transaction: happy path", () => {
  it("returns the callback's return value", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const result = await db.transaction(async () => {
      return { ok: true, count: 42 };
    });

    expect(result).toEqual({ ok: true, count: 42 });
  });

  it("flushes a single write as an atomic batch", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    await db.transaction(async (tx) => {
      await tx
        .insert(posts)
        .values({ id: "p1", title: "Hello", authorId: "editor-1" })
        .run();
    });

    // One native batch containing one statement.
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(1);
    expect(d1._batches[0][0].sql.toLowerCase()).toMatch(/^insert into "posts"/);
  });

  it("flushes multiple writes into one atomic batch", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    await db.transaction(async (tx) => {
      await tx
        .insert(posts)
        .values({ id: "p1", title: "One", authorId: "editor-1" })
        .run();
      await tx.update(posts).set({ published: true }).where(undefined).run();
      await tx
        .insert(auditLogs)
        .values({ action: "create", targetId: "p1", userId: "editor-1" })
        .run();
    });

    // All three writes land in a single atomic batch.
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(3);
    const sqls = d1._batches[0].map((s) => s.sql.toLowerCase());
    expect(sqls[0]).toMatch(/^insert into "posts"/);
    expect(sqls[1]).toMatch(/^update "posts"/);
    expect(sqls[2]).toMatch(/^insert into "audit_logs"/);
  });

  it("does not issue a batch when no writes were recorded", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const value = await db.transaction(async () => {
      // Read-only transaction — no writes recorded.
      return "no-writes";
    });

    expect(value).toBe("no-writes");
    expect(d1._batches).toHaveLength(0);
  });

  it("reads inside the tx execute eagerly against the real db", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    await db.transaction(async (tx) => {
      // This read should touch d1 immediately (not be buffered).
      await tx.query(posts).findMany().run({});
    });

    // The query should have produced at least one prepare() call on d1.
    const selectCalls = d1._calls.filter((c) =>
      /select/i.test(c.sql) && /posts/i.test(c.sql),
    );
    expect(selectCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("db.transaction: rollback on throw", () => {
  it("discards pending writes and rethrows the error", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    await expect(
      db.transaction(async (tx) => {
        await tx
          .insert(posts)
          .values({ id: "p1", title: "Should rollback", authorId: "editor-1" })
          .run();
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    // Critical: the batch must NEVER have been issued.
    expect(d1._batches).toHaveLength(0);
  });

  it("propagates the error when the underlying batch flush fails", async () => {
    // Simulate a flush failure by wrapping the batch() method to throw.
    const d1 = createMockD1();
    d1.batch = async () => {
      throw new Error("flush failed");
    };

    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    await expect(
      db.transaction(async (tx) => {
        await tx
          .insert(posts)
          .values({ id: "p1", title: "x", authorId: "editor-1" })
          .run();
      }),
    ).rejects.toThrow("flush failed");
  });
});

describe("db.transaction: permission enforcement", () => {
  it("refuses the entire transaction when any sub-op lacks permission", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("user"), // can create posts, CANNOT create audit_logs
      user: { id: "user-1" },
      cache: false,
    });

    await expect(
      db.transaction(async (tx) => {
        await tx
          .insert(posts)
          .values({ id: "p1", title: "OK", authorId: "user-1" })
          .run();
        await tx
          .insert(auditLogs)
          .values({ action: "create", targetId: "p1", userId: "user-1" })
          .run();
      }),
    ).rejects.toThrow();

    // No batch should have been issued because permission checks happen
    // upfront before the first statement.
    expect(d1._batches).toHaveLength(0);
  });
});

describe("db.transaction: nested transactions", () => {
  it("flattens nested tx.transaction() into the parent's batch", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    await db.transaction(async (tx) => {
      await tx
        .insert(posts)
        .values({ id: "p1", title: "Outer", authorId: "editor-1" })
        .run();

      await tx.transaction(async (inner) => {
        await inner
          .insert(posts)
          .values({ id: "p2", title: "Inner", authorId: "editor-1" })
          .run();
      });

      await tx
        .insert(auditLogs)
        .values({ action: "create", targetId: "p1", userId: "editor-1" })
        .run();
    });

    // Still exactly one batch, with three statements from both the outer
    // and inner scopes.
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(3);
  });

  it("nested tx error aborts the entire outer transaction", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    await expect(
      db.transaction(async (tx) => {
        await tx
          .insert(posts)
          .values({ id: "p1", title: "Outer", authorId: "editor-1" })
          .run();
        await tx.transaction(async (inner) => {
          await inner
            .insert(posts)
            .values({ id: "p2", title: "Inner", authorId: "editor-1" })
            .run();
          throw new Error("nested boom");
        });
      }),
    ).rejects.toThrow("nested boom");

    // Nothing hits D1 because the outer discards its queue on throw.
    expect(d1._batches).toHaveLength(0);
  });
});

describe("db.transaction: misuse guards", () => {
  it("throws TransactionError when .run() is called after the tx commits", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    // Stash a write-op reference from inside the callback and try to run it
    // AFTER the transaction has already committed. This simulates a caller
    // who leaks the tx handle (e.g. sets it on an outer variable).
    let leakedOp: { run: () => Promise<void> } | null = null;

    await db.transaction(async (tx) => {
      leakedOp = tx
        .insert(posts)
        .values({ id: "p1", title: "ok", authorId: "editor-1" });
      await leakedOp.run();
    });

    // The transaction has committed — further .run() calls must throw.
    await expect(leakedOp!.run()).rejects.toThrow(TransactionError);
  });

  it("throws TransactionError when .run() is called after the tx aborts", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    let leakedOp: { run: () => Promise<void> } | null = null;

    await expect(
      db.transaction(async (tx) => {
        leakedOp = tx
          .insert(posts)
          .values({ id: "p1", title: "x", authorId: "editor-1" });
        throw new Error("aborted");
      }),
    ).rejects.toThrow("aborted");

    // Post-abort: ops should refuse to run.
    await expect(leakedOp!.run()).rejects.toThrow(TransactionError);
  });
});
