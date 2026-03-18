import { describe, it, expect } from "vitest";
import { compose, composeSequential } from "../compose";
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
