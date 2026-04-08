import { describe, it, expect } from "vitest";
import { createDb, createAppDb } from "../create-db";
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

  it("db.batch([]) is a no-op that resolves to an empty array", async () => {
    const d1 = createMockD1();
    const db = createDb({
      d1,
      schema,
      grants: grantsForRole("editor"),
      user: { id: "user-1" },
      cache: false,
    });

    const batchOp = db.batch([]);
    // Empty batch has no permission requirements.
    expect(batchOp.permissions).toEqual([]);

    // `.run()` and `.run({})` both resolve cleanly without touching D1.
    await expect(batchOp.run()).resolves.toEqual([]);
    await expect(batchOp.run({})).resolves.toEqual([]);

    // No SQL and no native batch call were issued.
    expect(d1._calls).toHaveLength(0);
    expect(d1._batches).toHaveLength(0);
  });

  it("db.batch([]) is a no-op even without any grants", async () => {
    // Regression guard: the empty-batch fast path must run BEFORE the
    // permission check, otherwise callers have to hand-check `ops.length`
    // even though they had no work to do.
    const db = createDb({
      d1: createMockD1(),
      schema,
      grants: grantsForRole("anonymous"),
      user: null,
      cache: false,
    });

    await expect(db.batch([]).run()).resolves.toEqual([]);
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

describe("createAppDb (#149)", () => {
  // The whole motivation for createAppDb is consolidating the three
  // near-identical createDb factories that every cfast app duplicated
  // (cfast.server.ts dbPlugin, admin.server.ts createDbForAdmin, and
  // ad-hoc route handlers). These tests pin the factory's surface so
  // future refactors don't accidentally change the contract that
  // @cfast/admin's `db` field and `@cfast/core`'s `dbPlugin` rely on.

  it("returns a (grants, user) => Db factory bound to the app constants", () => {
    const d1 = createMockD1();
    const appDb = createAppDb({ d1, schema, cache: false });

    expect(typeof appDb).toBe("function");

    const editorDb = appDb(grantsForRole("editor"), { id: "editor-1" });
    const userDb = appDb(grantsForRole("user"), { id: "user-1" });

    // Each call returns a fresh Db -- factories must NEVER share state
    // between requests because grants are baked into the closure.
    expect(editorDb).not.toBe(userDb);
    expect(typeof editorDb.query).toBe("function");
    expect(typeof userDb.insert).toBe("function");
  });

  it("each call applies the per-request grants", async () => {
    // Smoke test: an anonymous user cannot insert into posts but a user can.
    // This is the same permission-check semantic as bare createDb -- the only
    // difference is the call shape.
    const appDb = createAppDb({ d1: createMockD1(), schema, cache: false });

    const anonDb = appDb(grantsForRole("anonymous"), { id: "anon" });
    await expect(
      anonDb.insert(posts).values({ title: "Hack", authorId: "anon" }).run(),
    ).rejects.toThrow("Cannot create");

    const userDb = appDb(grantsForRole("user"), { id: "user-1" });
    await expect(
      userDb
        .insert(posts)
        .values({ title: "Hello", authorId: "user-1" })
        .run(),
    ).resolves.not.toThrow();
  });

  it("accepts a lazy `() => D1Database` getter for Workers env bindings", () => {
    // On Workers, env.DB is only available per-request -- the lazy form
    // lets createAppDb() be called once at module-load time even though
    // the binding isn't materialized until the first request reaches the
    // app. The getter is invoked on every factory call.
    let getterCalls = 0;
    const realD1 = createMockD1();
    const lazyD1 = () => {
      getterCalls += 1;
      return realD1;
    };

    const appDb = createAppDb({ d1: lazyD1, schema, cache: false });
    // No factory calls yet -> getter never invoked.
    expect(getterCalls).toBe(0);

    appDb(grantsForRole("editor"), { id: "editor-1" });
    expect(getterCalls).toBe(1);

    appDb(grantsForRole("user"), { id: "user-1" });
    expect(getterCalls).toBe(2);
  });

  it("structurally matches @cfast/admin's CreateDbFn shape", () => {
    // Pin the contract: appDb must be assignable to (grants, user) => Db
    // because that's exactly the shape @cfast/admin's `db` field expects.
    // If this signature ever drifts the demo apps stop working.
    const appDb = createAppDb({
      d1: createMockD1(),
      schema,
      cache: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const adminDbField: (
      grants: ReturnType<typeof grantsForRole>,
      user: { id: string } | null,
    ) => ReturnType<typeof createDb> = appDb;
    expect(typeof adminDbField).toBe("function");
  });

  it("uses auditLogs from the same shared schema", () => {
    // Sanity check that the schema closure is shared across factory calls
    // -- regression guard for the case where someone refactors the
    // factory to deep-clone or otherwise reset internal state per call.
    const appDb = createAppDb({
      d1: createMockD1(),
      schema,
      cache: false,
    });
    const db = appDb(grantsForRole("editor"), { id: "editor-1" });
    const op = db.insert(auditLogs).values({
      action: "test",
      targetId: "t1",
      userId: "editor-1",
    });
    expect(op.permissions).toEqual([{ action: "create", table: auditLogs }]);
  });
});
