import { describe, it, expect } from "vitest";
import { compose, composeSequential, composeSequentialCallback } from "../compose";
import { createDb } from "../create-db";
import {
  posts as realPosts,
  auditLogs as realAuditLogs,
  schema as realSchema,
  createMockD1,
  grantsForRole,
} from "./helpers";
import type { Operation } from "../types";

const posts = { _: { name: "posts" } } as any;
const auditLogs = { _: { name: "audit_logs" } } as any;

function mockOp<T>(perms: any[], result: T): Operation<T> {
  return {
    permissions: perms,
    run: async () => result,
  };
}

describe("compose", () => {
  it("merges permissions from all operations", () => {
    const op1 = mockOp([{ action: "update", table: posts }], "updated");
    const op2 = mockOp([{ action: "create", table: auditLogs }], "logged");

    const composed = compose([op1, op2], (run1, run2) => {
      run1({});
      run2({});
    });

    expect(composed.permissions).toEqual([
      { action: "update", table: posts },
      { action: "create", table: auditLogs },
    ]);
  });

  it("deduplicates identical permission descriptors", () => {
    const op1 = mockOp([{ action: "update", table: posts }], "a");
    const op2 = mockOp([{ action: "update", table: posts }], "b");

    const composed = compose([op1, op2], (run1, run2) => {
      run1({});
      run2({});
    });

    expect(composed.permissions).toHaveLength(1);
  });

  it("run() calls the executor with run functions", async () => {
    const op1 = mockOp([{ action: "update", table: posts }], "updated");
    const op2 = mockOp([{ action: "create", table: auditLogs }], "logged");

    const composed = compose([op1, op2], async (run1, run2) => {
      const r1 = await run1({});
      const r2 = await run2({});
      return [r1, r2];
    });

    const result = await composed.run({});
    expect(result).toEqual(["updated", "logged"]);
  });

  it("supports async executors", async () => {
    const op1 = mockOp([], 42);

    const composed = compose([op1], async (run1) => {
      const val = await run1({});
      return (val as number) * 2;
    });

    const result = await composed.run({});
    expect(result).toBe(84);
  });

  it("is nestable — compose of composed operations", () => {
    const op1 = mockOp([{ action: "update", table: posts }], "a");
    const op2 = mockOp([{ action: "create", table: auditLogs }], "b");

    const inner = compose([op1, op2], (r1, r2) => {
      r1({});
      r2({});
    });

    const op3 = mockOp([{ action: "delete", table: posts }], "c");

    const outer = compose([inner, op3], (rInner, r3) => {
      rInner({});
      r3({});
    });

    expect(outer.permissions).toHaveLength(3);
    expect(outer.permissions).toEqual([
      { action: "update", table: posts },
      { action: "create", table: auditLogs },
      { action: "delete", table: posts },
    ]);
  });

  it("handles empty operations array", () => {
    const composed = compose([], () => "done");
    expect(composed.permissions).toEqual([]);
  });
});

describe("composeSequential", () => {
  it("merges permissions from all operations", () => {
    const op1 = mockOp([{ action: "update", table: posts }], "updated");
    const op2 = mockOp([{ action: "create", table: auditLogs }], "logged");
    const composed = composeSequential([op1, op2]);
    expect(composed.permissions).toEqual([
      { action: "update", table: posts },
      { action: "create", table: auditLogs },
    ]);
  });

  it("runs all operations sequentially and returns array of results", async () => {
    const order: string[] = [];
    const op1: Operation<string> = {
      permissions: [],
      run: async () => { order.push("a"); return "first"; },
    };
    const op2: Operation<string> = {
      permissions: [],
      run: async () => { order.push("b"); return "second"; },
    };
    const composed = composeSequential([op1, op2]);
    const result = await composed.run({});
    expect(result).toEqual(["first", "second"]);
    expect(order).toEqual(["a", "b"]);
  });

  it("handles single operation", async () => {
    const op = mockOp([{ action: "create", table: posts }], "only");
    const composed = composeSequential([op]);
    const result = await composed.run({});
    expect(result).toEqual(["only"]);
  });

  it("handles empty operations array", async () => {
    const composed = composeSequential([]);
    expect(composed.permissions).toEqual([]);
    const result = await composed.run({});
    expect(result).toEqual([]);
  });
});

describe("compose — optional run params", () => {
  it("run() works without arguments", async () => {
    const op1 = mockOp([], 42);
    const composed = compose([op1], async (run1) => {
      return await run1();
    });
    const result = await composed.run();
    expect(result).toBe(42);
  });

  it("composeSequential run() works without arguments", async () => {
    const op = mockOp([], "ok");
    const composed = composeSequential([op]);
    const result = await composed.run();
    expect(result).toEqual(["ok"]);
  });
});

describe("composeSequentialCallback", () => {
  it("collects permissions from operations created inside the callback", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema: realSchema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op = composeSequentialCallback(db, async (tx) => {
      const card = await tx.insert(realPosts).values({ title: "New" }).returning().run();
      await tx
        .insert(realAuditLogs)
        .values({
          action: "create",
          targetId: (card as { id: string }).id,
          userId: "editor-1",
        })
        .run();
      return card;
    });

    const perms = await op.permissionsAsync();
    expect(perms).toEqual([
      { action: "create", table: realPosts },
      { action: "create", table: realAuditLogs },
    ]);
  });

  it("supports data dependencies between sequential operations", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema: realSchema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    // The real D1 mock returns null from .first() so the real run can't read
    // back an inserted id. We exercise the data-dependency path purely through
    // the dry-run pass: the callback uses `card?.id` so it survives both phases.
    const op = composeSequentialCallback(db, async (tx) => {
      const card = (await tx
        .insert(realPosts)
        .values({ title: "New" })
        .returning()
        .run()) as { id?: unknown };
      const targetId = String(card?.id ?? "fallback");
      await tx
        .insert(realAuditLogs)
        .values({
          action: "create",
          targetId,
          userId: "editor-1",
        })
        .run();
      return { ok: true };
    });

    const result = await op.run();
    expect(result).toEqual({ ok: true });
    // The dry-run should have populated permissions before the real run executed.
    expect(op.permissions).toEqual([
      { action: "create", table: realPosts },
      { action: "create", table: realAuditLogs },
    ]);
  });

  it("permissions reflect the discovered set after run()", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema: realSchema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op = composeSequentialCallback(db, async (tx) => {
      await tx.insert(realPosts).values({ title: "First" }).run();
      await tx.update(realPosts).set({ published: true }).where(undefined).run();
      return { done: true };
    });

    await op.run();
    expect(op.permissions).toEqual([
      { action: "create", table: realPosts },
      { action: "update", table: realPosts },
    ]);
  });

  it("deduplicates identical permission descriptors", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema: realSchema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op = composeSequentialCallback(db, async (tx) => {
      await tx.insert(realPosts).values({ title: "a" }).run();
      await tx.insert(realPosts).values({ title: "b" }).run();
    });

    const perms = await op.permissionsAsync();
    expect(perms).toHaveLength(1);
    expect(perms[0]).toEqual({ action: "create", table: realPosts });
  });

  it("propagates the callback's return value", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema: realSchema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op = composeSequentialCallback(db, async () => {
      return { hello: "world" };
    });

    const result = await op.run();
    expect(result).toEqual({ hello: "world" });
  });

  it("real run uses the actual db (not the tracking proxy)", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema: realSchema,
      grants: grantsForRole("editor"),
      user: { id: "editor-1" },
      cache: false,
    });

    const op = composeSequentialCallback(db, async (tx) => {
      await tx.insert(realPosts).values({ title: "Real" }).run();
    });

    await op.run();

    // The mock D1 records every prepared statement. The dry-run does not touch
    // D1 (sentinel run), so we expect at least one INSERT from the real run.
    const inserts = d1._calls.filter((c) => /insert\s+into\s+["`]?posts/i.test(c.sql));
    expect(inserts.length).toBeGreaterThanOrEqual(1);
  });

  it("checks permissions on each sub-op at real run time", async () => {
    const db = createDb({
      d1: createMockD1(),
      schema: realSchema,
      grants: grantsForRole("anonymous"),
      user: { id: "anon" },
      cache: false,
    });

    const op = composeSequentialCallback(db, async (tx) => {
      await tx.insert(realPosts).values({ title: "Bad" }).run();
    });

    await expect(op.run()).rejects.toThrow("Cannot create");
  });
});
