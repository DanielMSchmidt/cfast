import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { testUsers, testPosts } from "../helpers/permissions";
import { posts } from "../helpers/schema";
import { dbAs } from "../helpers/db";

describe("unsafe-and-batch", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("db.unsafe() skips permission checks and WHERE injection", async () => {
    // Anon normally only sees published posts (3).
    // With unsafe(), all permission filters are skipped → sees all 5.
    const db = dbAs(testUsers.anon);
    const unsafeDb = db.unsafe();

    const op = unsafeDb.query(posts).findMany();
    const rows = (await op.run({})) as Array<{ id: string }>;

    expect(rows).toHaveLength(5);

    // Verify permissions array is empty for unsafe operations
    expect(op.permissions).toEqual([]);
  });

  it("db.batch() runs operations sequentially with permission checks", async () => {
    // Bob (editor) has full CRUD on posts.
    // Batch: insert a new post, then query all posts.
    const db = dbAs(testUsers.bob);

    const insertOp = db.insert(posts).values({
      id: "post-batch",
      title: "Batch Post",
      content: "batch content",
      authorId: "bob-1",
      published: true,
    });

    const queryOp = db.query(posts).findMany();

    const batchOp = db.batch([insertOp, queryOp]);

    // batch merges permissions from both operations
    expect(batchOp.permissions.length).toBeGreaterThan(0);

    const results = (await batchOp.run({})) as [void, Array<{ id: string }>];

    // First result is void (insert), second is the query result
    // The query runs after insert, so it should see the new post
    const queryResult = results[1];
    expect(queryResult).toHaveLength(6);
    expect(queryResult.map((r) => r.id)).toContain("post-batch");
  });
});
