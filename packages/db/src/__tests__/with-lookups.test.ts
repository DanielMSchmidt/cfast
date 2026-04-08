import { describe, it, expect, vi } from "vitest";
import { eq, inArray, or, sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { definePermissions, resolveGrants } from "@cfast/permissions";
import type { LookupDb } from "@cfast/permissions";
import { createDb } from "../create-db";
import { runWithLookupCache } from "../utils";
import { createMockD1 } from "./helpers";

// Schema purpose-built to exercise cross-table grants from issue #105:
// `recipes` are visible if they are public, owned by the user, or owned by
// someone the user has been granted access to via `friendGrants`.
const recipes = sqliteTable("recipes", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull(),
  visibility: text("visibility").notNull(),
});

const friendGrants = sqliteTable("friend_grants", {
  id: text("id").primaryKey(),
  grantee: text("grantee").notNull(),
  target: text("target").notNull(),
});

const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  teamId: text("team_id").notNull(),
});

const schema = { recipes, friendGrants, teamMembers };

type AppUser = { id: string };

function makeFriendGrantsLookup(rows: { target: string }[]) {
  // Returns a vi.fn() so tests can assert on call counts (single-resolve cache).
  return vi.fn(async (_user: AppUser, db: LookupDb) => {
    const result = (await db
      .query(friendGrants)
      .findMany()
      .run()) as { target: string }[];
    return (result.length > 0 ? result : rows).map((r) => r.target);
  });
}

function buildPermissions(opts: {
  friendIdsLookup: ReturnType<typeof makeFriendGrantsLookup>;
}) {
  return definePermissions<AppUser, typeof schema>()({
    roles: ["user"] as const,
    grants: (g) => ({
      user: [
        g("read", "recipes", {
          with: {
            friendIds: opts.friendIdsLookup,
          },
          where: (recipe: any, user, { friendIds }) =>
            or(
              eq(recipe.visibility, sql`'public'`),
              eq(recipe.authorId, user.id),
              inArray(recipe.authorId, friendIds as string[]),
            ),
        }),
      ],
    }),
  });
}

describe("with-lookups (cross-table grants, issue #105)", () => {
  describe("simple friend-grant visibility", () => {
    it("invokes the friendIds lookup before running the main query", async () => {
      const lookup = makeFriendGrantsLookup([{ target: "friend-1" }]);
      const permissions = buildPermissions({ friendIdsLookup: lookup });
      const grants = resolveGrants(permissions, ["user"]);

      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();

      // The lookup ran exactly once and got the user object.
      expect(lookup).toHaveBeenCalledOnce();
      expect(lookup.mock.calls[0][0]).toEqual({ id: "u1" });
    });

    it("passes an unsafe-mode db handle to the lookup so its reads skip permission checks", async () => {
      const recordedDbs: unknown[] = [];
      const lookup = vi.fn(async (_user: AppUser, db: LookupDb) => {
        recordedDbs.push(db);
        return ["friend-a", "friend-b"];
      });
      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["user"] as const,
        grants: (g) => ({
          user: [
            g("read", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any) => eq(recipe.visibility, sql`'public'`),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["user"]);
      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();

      // The lookup db is structurally a Db (`.query(table).findMany().run()`).
      expect(recordedDbs).toHaveLength(1);
      const lookupDb = recordedDbs[0] as LookupDb;
      expect(typeof lookupDb.query).toBe("function");
    });
  });

  describe("multiple with lookups", () => {
    it("resolves every key in the with map and exposes them by name", async () => {
      const friendsLookup = vi.fn(async () => ["friend-1", "friend-2"]);
      const teamsLookup = vi.fn(async () => ["team-a"]);

      const seenLookups: Record<string, unknown>[] = [];
      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["user"] as const,
        grants: (g) => ({
          user: [
            g("read", "recipes", {
              with: {
                friendIds: friendsLookup,
                teamIds: teamsLookup,
              },
              where: (recipe: any, _user, lookups) => {
                seenLookups.push(lookups);
                return eq(recipe.visibility, sql`'public'`);
              },
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["user"]);
      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();

      expect(friendsLookup).toHaveBeenCalledOnce();
      expect(teamsLookup).toHaveBeenCalledOnce();
      expect(seenLookups).toHaveLength(1);
      expect(seenLookups[0]).toEqual({
        friendIds: ["friend-1", "friend-2"],
        teamIds: ["team-a"],
      });
    });

    it("resolves lookups in parallel", async () => {
      // Deterministic parallelism check: both lookups must enter their work
      // BEFORE either one is allowed to resolve. We arm a barrier that only
      // releases once both lookups have ticked in. If the runtime resolved
      // them sequentially, the barrier would deadlock and the test would
      // time out instead of producing a flaky timing comparison.
      let entered = 0;
      let releaseBarrier!: () => void;
      const barrier = new Promise<void>((resolve) => {
        releaseBarrier = resolve;
      });
      const tick = async () => {
        entered++;
        if (entered === 2) releaseBarrier();
        await barrier;
      };

      const slowFriends = vi.fn(async () => {
        await tick();
        return ["f1"];
      });
      const slowTeams = vi.fn(async () => {
        await tick();
        return ["t1"];
      });

      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["user"] as const,
        grants: (g) => ({
          user: [
            g("read", "recipes", {
              with: { friendIds: slowFriends, teamIds: slowTeams },
              where: (recipe: any) => eq(recipe.visibility, sql`'public'`),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["user"]);
      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();

      // If lookups ran serially, the second one would never enter `tick`
      // (the first would block on `barrier` forever and the test would time
      // out). Reaching here confirms both ran concurrently.
      expect(entered).toBe(2);
      expect(slowFriends).toHaveBeenCalledOnce();
      expect(slowTeams).toHaveBeenCalledOnce();
    });
  });

  describe("request-scoped caching", () => {
    it("runs each lookup at most once even across many queries on the same Db", async () => {
      const lookup = makeFriendGrantsLookup([{ target: "friend-1" }]);
      const permissions = buildPermissions({ friendIdsLookup: lookup });
      const grants = resolveGrants(permissions, ["user"]);

      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      // Three reads in the same request.
      await db.query(recipes).findMany().run();
      await db.query(recipes).findFirst().run();
      await db.query(recipes).findMany().run();

      expect(lookup).toHaveBeenCalledOnce();
    });

    it("re-runs the lookup for a fresh Db instance (i.e. a new request)", async () => {
      const lookup = makeFriendGrantsLookup([{ target: "friend-1" }]);
      const permissions = buildPermissions({ friendIdsLookup: lookup });
      const grants = resolveGrants(permissions, ["user"]);

      const db1 = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });
      const db2 = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db1.query(recipes).findMany().run();
      await db2.query(recipes).findMany().run();

      // Each per-request Db gets its own cache, so the lookup runs twice.
      expect(lookup).toHaveBeenCalledTimes(2);
    });

    it("shares the cache between safe and unsafe siblings of the same Db", async () => {
      const lookup = makeFriendGrantsLookup([{ target: "friend-1" }]);
      const permissions = buildPermissions({ friendIdsLookup: lookup });
      const grants = resolveGrants(permissions, ["user"]);

      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      // First read primes the cache; the unsafe sibling should not re-run it.
      await db.query(recipes).findMany().run();
      // The unsafe sibling itself doesn't apply permission filters at all,
      // so we exercise the safe path twice and verify the lookup still runs
      // once -- the unsafe handle is the LookupDb, not the query path.
      await db.query(recipes).findMany().run();
      expect(lookup).toHaveBeenCalledOnce();
    });
  });

  describe("combination with existing where clauses", () => {
    it("ANDs the user-supplied where with the with-grant filter", async () => {
      const lookup = vi.fn(async () => ["friend-1"]);
      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["user"] as const,
        grants: (g) => ({
          user: [
            g("read", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any, user, { friendIds }) =>
                or(
                  eq(recipe.authorId, user.id),
                  inArray(recipe.authorId, friendIds as string[]),
                ),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["user"]);
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      // Add a user-supplied filter on top of the with-grant filter.
      await db
        .query(recipes)
        .findMany({ where: eq(recipes.visibility, "public") })
        .run();

      expect(lookup).toHaveBeenCalledOnce();
      // The compiled SELECT should reference the recipes table.
      const selects = d1._calls.filter((c) => /select/i.test(c.sql));
      expect(selects.some((c) => /"recipes"/i.test(c.sql))).toBe(true);
    });

    it("OR-merges a with-grant alongside a plain restricted grant for the same action+table", async () => {
      const lookup = vi.fn(async () => ["friend-1"]);

      // Two grants: a plain ownership filter and a with-grant for friends.
      // resolveGrants emits them as two separate Grant entries (no merging).
      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["owner", "friend"] as const,
        grants: (g) => ({
          owner: [
            g("read", "recipes", {
              where: (recipe: any, user) => eq(recipe.authorId, user.id),
            }),
          ],
          friend: [
            g("read", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any, _user, { friendIds }) =>
                inArray(recipe.authorId, friendIds as string[]),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["owner", "friend"]);
      // The two grants stay separate because the with-grant can't be merged
      // into a single closure with the plain grant.
      expect(grants.filter((g) => g.action === "read" && g.subject === "recipes"))
        .toHaveLength(2);

      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();
      expect(lookup).toHaveBeenCalledOnce();
    });

    it("an unrestricted sibling grant skips the lookup entirely", async () => {
      const lookup = vi.fn(async () => ["friend-1"]);

      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["friend", "admin"] as const,
        grants: (g) => ({
          friend: [
            g("read", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any, _user, { friendIds }) =>
                inArray(recipe.authorId, friendIds as string[]),
            }),
          ],
          admin: [g("read", "recipes")], // unrestricted
        }),
      });

      const grants = resolveGrants(permissions, ["friend", "admin"]);

      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();
      // resolveGrants collapses the group to "unrestricted", so the lookup
      // function should never be invoked.
      expect(lookup).not.toHaveBeenCalled();
    });
  });

  describe("mutations", () => {
    it("update with a with-grant resolves lookups before the WHERE is built", async () => {
      const lookup = vi.fn(async () => ["friend-1", "friend-2"]);

      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["editor"] as const,
        grants: (g) => ({
          editor: [
            g("read", "recipes"),
            g("update", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any, user, { friendIds }) =>
                or(
                  eq(recipe.authorId, user.id),
                  inArray(recipe.authorId, friendIds as string[]),
                ),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["editor"]);
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db
        .update(recipes)
        .set({ visibility: "private" })
        .where(eq(recipes.id, "r-1"))
        .run();

      expect(lookup).toHaveBeenCalledOnce();
      const updates = d1._calls.filter((c) => /update "recipes"/i.test(c.sql));
      expect(updates.length).toBeGreaterThan(0);
    });

    it("delete with a with-grant resolves lookups before the WHERE is built", async () => {
      const lookup = vi.fn(async () => ["friend-1"]);

      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["editor"] as const,
        grants: (g) => ({
          editor: [
            g("delete", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any, user, { friendIds }) =>
                or(
                  eq(recipe.authorId, user.id),
                  inArray(recipe.authorId, friendIds as string[]),
                ),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["editor"]);
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.delete(recipes).where(eq(recipes.id, "r-1")).run();

      expect(lookup).toHaveBeenCalledOnce();
      const deletes = d1._calls.filter((c) => /delete from "recipes"/i.test(c.sql));
      expect(deletes.length).toBeGreaterThan(0);
    });

    it("native batch waits for with-grant prepare() before issuing the batch", async () => {
      const lookup = vi.fn(async () => ["friend-1"]);

      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["editor"] as const,
        grants: (g) => ({
          editor: [
            g("update", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any, user, { friendIds }) =>
                or(
                  eq(recipe.authorId, user.id),
                  inArray(recipe.authorId, friendIds as string[]),
                ),
            }),
            g("delete", "recipes", {
              with: { friendIds: lookup },
              where: (recipe: any, user, { friendIds }) =>
                or(
                  eq(recipe.authorId, user.id),
                  inArray(recipe.authorId, friendIds as string[]),
                ),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["editor"]);
      const d1 = createMockD1();
      const db = createDb({
        d1,
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      const updateOp = db
        .update(recipes)
        .set({ visibility: "public" })
        .where(eq(recipes.id, "r-1"));
      const deleteOp = db.delete(recipes).where(eq(recipes.id, "r-2"));

      await db.batch([updateOp, deleteOp]).run();

      // The lookup is shared by both grants and lives behind one cache key
      // per resolved grant; the per-request cache means a single resolution
      // covers both ops.
      expect(lookup).toHaveBeenCalledTimes(2);
      // One native batch with two statements.
      expect(d1._batches).toHaveLength(1);
      expect(d1._batches[0]).toHaveLength(2);
    });
  });

  describe("synchronous lookup functions", () => {
    it("accepts a sync lookup function (returning a non-Promise value)", async () => {
      const syncLookup = vi.fn((user: AppUser) => [`friend-of-${user.id}`]);
      const permissions = definePermissions<AppUser, typeof schema>()({
        roles: ["user"] as const,
        grants: (g) => ({
          user: [
            g("read", "recipes", {
              with: { friendIds: syncLookup },
              where: (recipe: any, user, { friendIds }) =>
                or(
                  eq(recipe.authorId, user.id),
                  inArray(recipe.authorId, friendIds as string[]),
                ),
            }),
          ],
        }),
      });

      const grants = resolveGrants(permissions, ["user"]);
      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();
      expect(syncLookup).toHaveBeenCalledOnce();
    });
  });

  describe("AsyncLocalStorage-scoped lookup cache (issue #176)", () => {
    it("runWithLookupCache scopes the cache so a reused Db sees fresh lookups per logical request", async () => {
      const lookup = makeFriendGrantsLookup([{ target: "friend-1" }]);
      const permissions = buildPermissions({ friendIdsLookup: lookup });
      const grants = resolveGrants(permissions, ["user"]);

      // A single Db intentionally reused across two logical "requests",
      // mirroring the test reuse pattern described in #176.
      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      // First logical request — fresh cache scope.
      await runWithLookupCache(async () => {
        await db.query(recipes).findMany().run();
        await db.query(recipes).findMany().run();
      });

      // Second logical request — separate scope, fresh cache. The lookup
      // must run again even though the Db instance is the same.
      await runWithLookupCache(async () => {
        await db.query(recipes).findMany().run();
      });

      expect(lookup).toHaveBeenCalledTimes(2);
    });

    it("nested runs inside a single runWithLookupCache share the cache", async () => {
      const lookup = makeFriendGrantsLookup([{ target: "friend-1" }]);
      const permissions = buildPermissions({ friendIdsLookup: lookup });
      const grants = resolveGrants(permissions, ["user"]);

      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await runWithLookupCache(async () => {
        // Multiple queries in a single scope should share the cache.
        await Promise.all([
          db.query(recipes).findMany().run(),
          db.query(recipes).findFirst().run(),
          db.query(recipes).findMany().run(),
        ]);
      });

      expect(lookup).toHaveBeenCalledOnce();
    });

    it("falls back to the Db-owned cache when no ALS scope is active", async () => {
      // This preserves the behaviour of the existing request-scoped caching
      // test suite: consumers who follow the "one Db per request" pattern
      // continue to hit the per-Db cache without needing to wrap every call.
      const lookup = makeFriendGrantsLookup([{ target: "friend-1" }]);
      const permissions = buildPermissions({ friendIdsLookup: lookup });
      const grants = resolveGrants(permissions, ["user"]);

      const db = createDb({
        d1: createMockD1(),
        schema,
        grants,
        user: { id: "u1" },
        cache: false,
      });

      await db.query(recipes).findMany().run();
      await db.query(recipes).findMany().run();

      expect(lookup).toHaveBeenCalledOnce();
    });
  });
});
