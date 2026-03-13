import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { ForbiddenError } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { testUsers, testPosts } from "../helpers/permissions";
import { posts } from "../helpers/schema";
import { dbAs } from "../helpers/db";

describe("query-builder", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("findMany returns all permitted rows", async () => {
    // Editor (Bob) has unrestricted read on posts → sees all
    const db = dbAs(testUsers.bob);
    const op = db.query(posts).findMany();
    const rows = (await op.run({})) as Array<{ id: string }>;

    expect(rows).toHaveLength(5);
    const ids = rows.map((r) => r.id).sort();
    expect(ids).toEqual(["post-1", "post-2", "post-3", "post-4", "post-5"]);
  });

  it("findFirst returns first permitted row", async () => {
    // Charlie (user) can only read published posts
    const db = dbAs(testUsers.charlie);
    const op = db.query(posts).findFirst();
    const row = (await op.run({})) as
      | { id: string; published: boolean }
      | undefined;

    expect(row).toBeDefined();
    expect(row!.published).toBe(true);
  });

  it("insert succeeds for authorized user", async () => {
    // Charlie (user) has grant("create", posts)
    const db = dbAs(testUsers.charlie);
    const op = db.insert(posts).values({
      id: "post-new",
      title: "New Post by Charlie",
      content: "content",
      authorId: "charlie-1",
      published: false,
    });
    await op.run({});

    // Verify directly in D1
    const result = await env.DB.prepare("SELECT * FROM posts WHERE id = ?")
      .bind("post-new")
      .first();
    expect(result).not.toBeNull();
    expect(result!.title).toBe("New Post by Charlie");
  });

  it("insert rejected for unauthorized role", async () => {
    // Anon only has read on posts, no create grant
    const db = dbAs(testUsers.anon);
    const op = db.insert(posts).values({
      id: "post-anon",
      title: "Anon Post",
      content: "nope",
      authorId: "anon-1",
      published: false,
    });

    await expect(op.run({})).rejects.toThrow(ForbiddenError);
  });

  it("update with row-level grant: silent no-match outside permitted set", async () => {
    // Charlie (user) can update posts WHERE authorId = charlie-1
    // Trying to update Alice's post (post-1) → permission filter ensures no rows match
    const db = dbAs(testUsers.charlie);
    const op = db
      .update(posts)
      .set({ title: "Hacked Title" })
      .where(eq(posts.id, "post-1"));
    await op.run({});

    // Verify Alice's post is unchanged
    const result = await env.DB.prepare("SELECT title FROM posts WHERE id = ?")
      .bind("post-1")
      .first();
    expect(result!.title).toBe("Alice Draft");
  });

  it("delete with row-level grant: only deletes own rows", async () => {
    // Charlie (user) can delete posts WHERE authorId = charlie-1
    const db = dbAs(testUsers.charlie);

    // Attempt to delete post-1 (Alice's) → no match due to permission filter
    const op1 = db.delete(posts).where(eq(posts.id, "post-1"));
    await op1.run({});

    // post-1 should still exist
    const alice = await env.DB.prepare("SELECT id FROM posts WHERE id = ?")
      .bind("post-1")
      .first();
    expect(alice).not.toBeNull();

    // Delete post-3 (Charlie's draft) → should succeed
    const op2 = db.delete(posts).where(eq(posts.id, "post-3"));
    await op2.run({});

    const charlie = await env.DB.prepare("SELECT id FROM posts WHERE id = ?")
      .bind("post-3")
      .first();
    expect(charlie).toBeNull();
  });

  it("returning() on insert returns inserted row", async () => {
    const db = dbAs(testUsers.charlie);
    const op = db
      .insert(posts)
      .values({
        id: "post-ret",
        title: "Returning Test",
        content: "content",
        authorId: "charlie-1",
        published: true,
      })
      .returning();

    const row = (await op.run({})) as { id: string; title: string };
    expect(row.id).toBe("post-ret");
    expect(row.title).toBe("Returning Test");
  });
});
