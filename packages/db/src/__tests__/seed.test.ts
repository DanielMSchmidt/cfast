import { describe, it, expect } from "vitest";
import { defineSeed } from "../seed";
import { createDb } from "../create-db";
import {
  posts,
  comments,
  auditLogs,
  schema,
  createMockD1,
  grantsForRole,
} from "./helpers";

describe("defineSeed", () => {
  it("exposes a frozen entry list in declaration order", () => {
    const seed = defineSeed({
      entries: [
        { table: posts, rows: [{ id: "p-1", title: "A", authorId: "u-1" }] },
        { table: comments, rows: [{ id: "c-1", postId: "p-1", body: "ok", authorId: "u-1" }] },
      ],
    });

    expect(seed.entries).toHaveLength(2);
    expect(seed.entries[0]!.table).toBe(posts);
    expect(seed.entries[1]!.table).toBe(comments);
    // Frozen: attempting to push should throw in strict mode.
    expect(() => {
      (seed.entries as unknown as SeedEntryLike[]).push({
        table: auditLogs,
        rows: [],
      });
    }).toThrow();
  });

  it("inserts rows for each entry via db.unsafe().insert()", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      // Deliberately pass grants that would REJECT inserts on `posts` so the
      // test proves that `defineSeed` is routing through `.unsafe()`. If the
      // helper ever regresses to the safe Db, this test fails with a
      // permission error instead of silently passing.
      grants: grantsForRole("anonymous"),
      user: null,
    });

    const seed = defineSeed({
      entries: [
        {
          table: posts,
          rows: [
            { id: "p-1", title: "Hello", authorId: "u-1" },
            { id: "p-2", title: "World", authorId: "u-1" },
          ],
        },
      ],
    });

    await seed.run(db);

    // The mock D1 records every `prepare(...).bind(...)` call — the batch
    // path used by `.batch([...]).run({})` flows through the same prepare
    // pipeline, so we can assert each row hit D1.
    const insertCalls = d1._calls.filter((c) =>
      c.sql.toLowerCase().includes("insert into"),
    );
    expect(insertCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("skips entries with an empty `rows` array instead of crashing", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("anonymous"),
      user: null,
    });

    const seed = defineSeed({
      entries: [
        { table: posts, rows: [] },
        { table: comments, rows: [] },
      ],
    });

    await seed.run(db);
    // No inserts should have been issued at all.
    expect(
      d1._calls.filter((c) => c.sql.toLowerCase().includes("insert into"))
        .length,
    ).toBe(0);
  });

  it("uses db.batch() when an entry has multiple rows", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("anonymous"),
      user: null,
    });

    const seed = defineSeed({
      entries: [
        {
          table: posts,
          rows: [
            { id: "p-1", title: "A", authorId: "u-1" },
            { id: "p-2", title: "B", authorId: "u-1" },
            { id: "p-3", title: "C", authorId: "u-1" },
          ],
        },
      ],
    });

    await seed.run(db);
    // The mock D1 records every `batch([...])` invocation in `_batches`.
    // A single entry with 3 rows should produce exactly one batch with 3
    // prepared statements.
    expect(d1._batches).toHaveLength(1);
    expect(d1._batches[0]).toHaveLength(3);
  });

  it("runs single-row entries via .run({}) instead of .batch()", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("anonymous"),
      user: null,
    });

    const seed = defineSeed({
      entries: [
        {
          table: posts,
          rows: [{ id: "p-solo", title: "Solo", authorId: "u-1" }],
        },
      ],
    });

    await seed.run(db);
    // A single-row entry should skip `batch()` to avoid the empty-tuple
    // Drizzle edge case, so `_batches` stays empty.
    expect(d1._batches).toHaveLength(0);
    // The row still hit D1 via the non-batch path.
    expect(
      d1._calls.filter((c) => c.sql.toLowerCase().includes("insert into"))
        .length,
    ).toBe(1);
  });
});

type SeedEntryLike = { table: unknown; rows: readonly unknown[] };
