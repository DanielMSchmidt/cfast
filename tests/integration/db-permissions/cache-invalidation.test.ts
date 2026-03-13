import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { testUsers, testPosts } from "../helpers/permissions";
import { posts } from "../helpers/schema";
import { dbAs } from "../helpers/db";

describe("cache-invalidation", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("repeated read returns same data", async () => {
    // With cache enabled, two identical reads should return the same data
    const hits: string[] = [];
    const misses: string[] = [];
    const db = dbAs(testUsers.bob, undefined, {
      backend: "cache-api",
      onHit: (key) => hits.push(key),
      onMiss: (key) => misses.push(key),
    });

    const op1 = db.query(posts).findMany();
    const rows1 = (await op1.run({})) as Array<{ id: string }>;

    const op2 = db.query(posts).findMany();
    const rows2 = (await op2.run({})) as Array<{ id: string }>;

    // Both should return the same 5 rows
    expect(rows1).toHaveLength(5);
    expect(rows2).toHaveLength(5);
    expect(rows1.map((r) => r.id).sort()).toEqual(
      rows2.map((r) => r.id).sort(),
    );
  });

  it("mutation invalidates cache for that table", async () => {
    const db = dbAs(testUsers.bob, undefined, { backend: "cache-api" });

    // First read → cache miss, populates cache
    const op1 = db.query(posts).findMany();
    const rows1 = (await op1.run({})) as Array<{ id: string }>;
    expect(rows1).toHaveLength(5);

    // Insert a new post (Bob has create permission)
    const insertOp = db.insert(posts).values({
      id: "post-cached",
      title: "Cached Post",
      content: "content",
      authorId: "bob-1",
      published: true,
    });
    await insertOp.run({});

    // After mutation, cache should be invalidated. Re-query should reflect new data.
    const op2 = db.query(posts).findMany();
    const rows2 = (await op2.run({})) as Array<{ id: string }>;
    expect(rows2).toHaveLength(6);
    expect(rows2.map((r) => r.id)).toContain("post-cached");
  });

  it("cache: false per-query skips cache", async () => {
    const db = dbAs(testUsers.bob, undefined, { backend: "cache-api" });

    // Query with cache: false — should bypass cache entirely
    const op = db.query(posts).findMany({ cache: false });
    const rows = (await op.run({})) as Array<{ id: string }>;

    expect(rows).toHaveLength(5);
  });

  it("manual cache invalidation via db.cache.invalidate()", async () => {
    const db = dbAs(testUsers.bob, undefined, { backend: "cache-api" });

    // First read to populate cache
    const op1 = db.query(posts).findMany();
    await op1.run({});

    // Manually invalidate the posts table
    await db.cache.invalidate({ tables: ["posts"] });

    // Insert directly via D1 (bypassing db layer — no auto-invalidation)
    await env.DB.prepare(
      "INSERT INTO posts (id, title, content, author_id, published) VALUES (?, ?, ?, ?, ?)",
    )
      .bind("post-manual", "Manual Post", "content", "bob-1", 1)
      .run();

    // Re-query should see the new row since cache was manually invalidated
    const op2 = db.query(posts).findMany();
    const rows = (await op2.run({})) as Array<{ id: string }>;
    expect(rows).toHaveLength(6);
    expect(rows.map((r) => r.id)).toContain("post-manual");
  });

  it("cache key includes role: different roles get isolated cache", async () => {
    // Bob (editor) and Charlie (user) should have separate cache entries
    // because the permission filters differ, resulting in different queries.
    const dbBob = dbAs(testUsers.bob, undefined, { backend: "cache-api" });
    const dbCharlie = dbAs(testUsers.charlie, undefined, { backend: "cache-api" });

    const bobOp = dbBob.query(posts).findMany();
    const bobRows = (await bobOp.run({})) as Array<{ id: string }>;

    const charlieOp = dbCharlie.query(posts).findMany();
    const charlieRows = (await charlieOp.run({})) as Array<{ id: string }>;

    // Bob sees all 5, Charlie sees only published (3)
    expect(bobRows).toHaveLength(5);
    expect(charlieRows).toHaveLength(3);
  });
});
