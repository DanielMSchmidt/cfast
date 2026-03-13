import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@cfast/db";
import { resolveGrants } from "@cfast/permissions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { permissions, testUsers, testPosts } from "../helpers/permissions";
import { posts, schema } from "../helpers/schema";
import type { Grant } from "@cfast/permissions";

function dbAs(user: { id: string; role: string }, grants?: Grant[]) {
  return createDb({
    d1: env.DB,
    schema,
    grants: grants ?? resolveGrants(permissions, [user.role]),
    user: { id: user.id },
    cache: false,
  });
}

describe("row-level-filters", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("read with where grant returns only matching rows", async () => {
    // Charlie (user) has: read posts WHERE published = true
    const db = dbAs(testUsers.charlie);
    const op = db.query(posts).findMany();
    const rows = (await op.run({})) as Array<{ id: string; published: boolean }>;

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.published).toBe(true);
    }
    // There are 3 published posts in seed data
    expect(rows).toHaveLength(3);
  });

  it("anonymous reads only published posts", async () => {
    const db = dbAs(testUsers.anon);
    const op = db.query(posts).findMany();
    const rows = (await op.run({})) as Array<{ id: string; published: boolean }>;

    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.published).toBe(true);
    }
    expect(rows).toHaveLength(3);
  });

  it("multiple grants on same action+table: where clauses ORed", async () => {
    // Manually build grants that have two where clauses for "read" on posts:
    // 1. published = true
    // 2. authorId = charlie
    // The result should be the union (OR) of both.
    const { grant } = await import("@cfast/permissions");
    const customGrants: Grant[] = [
      grant("read", posts, { where: (cols) => eq(cols.published as never, true) }),
      grant("read", posts, {
        where: (cols) => eq(cols.authorId as never, "charlie-1"),
      }),
    ];

    const db = createDb({
      d1: env.DB,
      schema,
      grants: customGrants,
      user: { id: "charlie-1" },
      cache: false,
    });

    const op = db.query(posts).findMany();
    const rows = (await op.run({})) as Array<{
      id: string;
      published: boolean;
      authorId: string;
    }>;

    // Should get: all published (3) + Charlie's draft (1) = 4 unique
    // post-1: Alice Draft (not published, not charlie) -> no
    // post-2: Alice Published (published) -> yes
    // post-3: Charlie Draft (charlie) -> yes
    // post-4: Charlie Published (published + charlie) -> yes
    // post-5: Bob Post (published) -> yes
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      expect(row.published === true || row.authorId === "charlie-1").toBe(true);
    }
  });

  it("unrestricted grant (no where) wins over filtered grants", async () => {
    // Bob (editor) has read posts with no where clause → sees all posts
    const db = dbAs(testUsers.bob);
    const op = db.query(posts).findMany();
    const rows = (await op.run({})) as Array<{ id: string }>;

    // Should see all 5 posts
    expect(rows).toHaveLength(5);
  });

  it("manage grant on 'all' bypasses all filters", async () => {
    // Alice (admin) has manage:all → sees everything
    const db = dbAs(testUsers.alice);
    const op = db.query(posts).findMany();
    const rows = (await op.run({})) as Array<{ id: string }>;

    expect(rows).toHaveLength(5);
  });

  it("permission where AND'd with user-supplied where", async () => {
    // Charlie (user) can only read published posts (where: published=true).
    // If Charlie also adds where: authorId='alice-1', the result should be
    // published=true AND authorId='alice-1' → only post-2 (Alice Published).
    const db = dbAs(testUsers.charlie);
    const op = db.query(posts).findMany({
      where: eq(posts.authorId, "alice-1"),
    });
    const rows = (await op.run({})) as Array<{
      id: string;
      title: string;
      published: boolean;
      authorId: string;
    }>;

    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("Alice Published");
    expect(rows[0].published).toBe(true);
    expect(rows[0].authorId).toBe("alice-1");
  });
});
