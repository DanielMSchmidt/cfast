import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import { compose } from "@cfast/db";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { testUsers, testPosts } from "../helpers/permissions";
import { posts, comments } from "../helpers/schema";
import { dbAs } from "../helpers/db";

describe("compose", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("compose merges permission descriptors from both operations", () => {
    const db = dbAs(testUsers.bob);

    const postsOp = db.query(posts).findMany();
    const commentsOp = db.query(comments).findMany();

    const composed = compose([postsOp, commentsOp], async (runPosts, runComments) => {
      const p = await runPosts({});
      const c = await runComments({});
      return { posts: p, comments: c };
    });

    // Should have permission descriptors for both tables
    expect(composed.permissions).toHaveLength(2);
    const actions = composed.permissions.map((p) => p.action);
    expect(actions).toContain("read");
  });

  it("compose executor receives run functions and returns combined result", async () => {
    const db = dbAs(testUsers.bob);

    const postsOp = db.query(posts).findMany();

    const composed = compose([postsOp], async (runPosts) => {
      const allPosts = (await runPosts({})) as Array<{ id: string; title: string }>;
      return {
        count: allPosts.length,
        titles: allPosts.map((p) => p.title),
      };
    });

    const result = await composed.run({});
    expect(result.count).toBe(5);
    expect(result.titles).toContain("Alice Draft");
    expect(result.titles).toContain("Bob Post");
  });
});
