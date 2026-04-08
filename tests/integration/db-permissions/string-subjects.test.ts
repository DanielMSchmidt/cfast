import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@cfast/db";
import {
  definePermissions,
  resolveGrants,
  PermissionRegistrationError,
} from "@cfast/permissions";
import {
  applyMigrations,
  resetDatabase,
  seedUsers,
  seedPosts,
  seedPostVersions,
} from "../helpers/d1";
import { testUsers, testPosts } from "../helpers/permissions";
import { posts, postVersions, schema } from "../helpers/schema";

/**
 * Behavioral regression tests for cfast issues #146, #175, #177.
 *
 * These tests cover the D3 dual-resolution fix: a grant declared with a
 * **string** subject (JS key or SQL name) must resolve to the exact same
 * Drizzle table reference the schema uses, so that:
 *
 *  1. Simple row-level WHERE clauses apply (#146).
 *  2. Drizzle relational `with: { nested: true }` queries on the root
 *     table apply the root-table filter correctly without the nested
 *     query silently returning empty results (#175).
 *  3. Both camelCase JS keys (`"postVersions"`) and snake_case SQL names
 *     (`"post_versions"`) resolve interchangeably (#177).
 */

type AppUser = { id: string; roles: readonly string[] };

describe("string-form grants with runtime schema resolution", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
    await seedPostVersions(env.DB, [
      { id: "pv-1", postId: "post-4", revision: 1, body: "v1 of post-4" },
      { id: "pv-2", postId: "post-4", revision: 2, body: "v2 of post-4" },
      { id: "pv-3", postId: "post-1", revision: 1, body: "v1 of post-1" },
    ]);
  });

  function dbWith(grantsArray: Parameters<typeof createDb>[0]["grants"]) {
    return createDb({
      d1: env.DB,
      schema,
      grants: grantsArray,
      user: { id: "charlie-1" },
      cache: false,
    });
  }

  it("#146: JS-key string subject applies a simple where clause", async () => {
    // Charlie (user) reads only published posts.
    const permissions = definePermissions<AppUser, typeof schema>({ schema })({
      roles: ["user"] as const,
      grants: (grant) => ({
        user: [
          grant("read", "posts", {
            where: (cols) => eq(cols.published as never, true),
          }),
        ],
      }),
    });

    const grants = resolveGrants(permissions, ["user"]);
    // The string resolved to the real `posts` table reference — the grant's
    // subject IS the schema's posts object, not a shadow.
    expect(grants[0].subject).toBe(posts);

    const db = dbWith(grants);
    const rows = (await db
      .query(posts)
      .findMany()
      .run({})) as Array<{ published: boolean }>;

    expect(rows.length).toBe(3);
    for (const row of rows) expect(row.published).toBe(true);
  });

  it("#177: SQL-name string subject ('post_versions') resolves the same as the JS key", async () => {
    // `postVersions` is camelCase in the schema but `post_versions` in SQL.
    // Before the fix, only `"postVersions"` was accepted at the type level.
    const permissions = definePermissions<AppUser, typeof schema>({ schema })({
      roles: ["user"] as const,
      grants: (grant) => ({
        user: [
          grant("read", "post_versions"),
          grant("read", "posts"),
        ],
      }),
    });

    const grants = resolveGrants(permissions, ["user"]);
    const pvGrant = grants.find(
      (g) => g.subject === postVersions,
    );
    expect(pvGrant).toBeDefined();

    const db = dbWith(grants);
    const rows = (await db
      .query(postVersions)
      .findMany()
      .run({})) as Array<{ id: string }>;

    expect(rows).toHaveLength(3);
    const ids = rows.map((r) => r.id).sort();
    expect(ids).toEqual(["pv-1", "pv-2", "pv-3"]);
  });

  it("JS-key and SQL-name string subjects resolve to the SAME reference", async () => {
    const permissions = definePermissions<AppUser, typeof schema>({ schema })({
      roles: ["user"] as const,
      grants: (grant) => ({
        user: [
          grant("read", "postVersions"),
          grant("read", "post_versions"),
        ],
      }),
    });

    // Both grants must resolve to the exact same reference so resolveGrants
    // can merge them. If they were different (shadow) objects, the merge
    // wouldn't collapse them.
    const merged = resolveGrants(permissions, ["user"]);
    expect(merged).toHaveLength(1);
    expect(merged[0].subject).toBe(postVersions);
  });

  it("#175: relational `with` query on root table applies the root filter via string subject", async () => {
    // THIS is the core regression. Before the fix, a grant stored against
    // a non-schema (shadow) reference for "posts" could match the root
    // query by name, but the where-clause received the real columns (so
    // simple queries worked) — and a nested relational `with` lookup on
    // `versions` silently worked too because Drizzle uses the schema.
    //
    // The real breakage mode was: permission filter runs on the root
    // table, nested with uses the schema separately. If the grant had a
    // shadow reference, resolve-grants grouped it under a different key
    // from an object-form grant on the same table, so the two grants
    // DIDN'T merge and one of them leaked. This test locks in that
    // unified resolution keeps them merged.
    const permissions = definePermissions<AppUser, typeof schema>({ schema })({
      roles: ["user"] as const,
      grants: (grant) => ({
        user: [
          // Restricted string grant: only Charlie's posts.
          grant("read", "posts", {
            where: (cols, user) => eq(cols.authorId as never, user.id),
          }),
          // Object-form grant on the same table: only published posts.
          // Without runtime resolution, these would live under separate
          // grouping keys in resolveGrants; with the fix, both subjects
          // point to the same reference and the where clauses are OR'd.
          grant("read", posts, {
            where: (cols) => eq(cols.published as never, true),
          }),
          // Unrestricted read on the nested relation so `with` can load.
          grant("read", "post_versions"),
        ],
      }),
    });

    const grants = resolveGrants(permissions, ["user"]);
    const db = createDb({
      d1: env.DB,
      schema,
      grants,
      user: { id: "charlie-1" },
      cache: false,
    });

    // Run a relational query with `with: { versions: true }`. The root
    // permission filter must apply (Charlie's own posts OR published
    // posts), AND the nested relation must load its rows.
    const rows = (await db
      .query(posts)
      .findMany({ with: { versions: true } })
      .run({})) as Array<{
      id: string;
      authorId: string;
      published: boolean;
      versions: Array<{ id: string }>;
    }>;

    // Expected rows under the OR merge:
    //   post-1 Alice Draft       (not Charlie, not published) -> NO
    //   post-2 Alice Published   (published)                  -> yes
    //   post-3 Charlie Draft     (Charlie)                    -> yes
    //   post-4 Charlie Published (both)                       -> yes
    //   post-5 Bob Published     (published)                  -> yes
    expect(rows).toHaveLength(4);
    const ids = rows.map((r) => r.id).sort();
    expect(ids).toEqual(["post-2", "post-3", "post-4", "post-5"]);
    for (const r of rows) {
      expect(r.authorId === "charlie-1" || r.published === true).toBe(true);
    }

    // Relational `with` loaded: post-4 has two versions, post-1 isn't in
    // the result (so its pv-3 version never surfaces).
    const postFour = rows.find((r) => r.id === "post-4");
    expect(postFour).toBeDefined();
    expect(postFour!.versions).toHaveLength(2);
    const versionIds = postFour!.versions.map((v) => v.id).sort();
    expect(versionIds).toEqual(["pv-1", "pv-2"]);

    const postThree = rows.find((r) => r.id === "post-3");
    expect(postThree!.versions).toHaveLength(0);
  });

  it("unknown string subjects throw PermissionRegistrationError at startup", () => {
    expect(() =>
      definePermissions<AppUser, typeof schema>({ schema })({
        roles: ["user"] as const,
        grants: (grant) => ({
          // Typo — cast to never to bypass the compile-time constraint
          // (this test exercises the runtime throw path).
          user: [grant("read", "psots" as never)],
        }),
      }),
    ).toThrow(PermissionRegistrationError);
  });

  it("backwards-compat: direct form without schema still compiles and runs", async () => {
    // Importing from the shared helpers' `definePermissions` usage (direct
    // object form) is the legacy path — it must keep working unchanged.
    const { grant } = await import("@cfast/permissions");
    const legacy = definePermissions({
      roles: ["user"] as const,
      grants: {
        user: [
          grant("read", posts, {
            where: (cols) => eq(cols.published as never, true),
          }),
        ],
      },
    });
    const db = dbWith(resolveGrants(legacy, ["user"]));
    const rows = (await db
      .query(posts)
      .findMany()
      .run({})) as Array<{ published: boolean }>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.published).toBe(true);
  });

  it("backwards-compat: curried <User>() form without schema still works with object subjects", async () => {
    // The curried form without a schema argument is the legacy "typed
    // user only" shape. Strings are stored opaquely; object subjects keep
    // working the same as before.
    const legacy = definePermissions<AppUser>()({
      roles: ["user"] as const,
      grants: (grant) => ({
        user: [
          grant("read", posts, {
            where: (cols, user) => eq(cols.authorId as never, user.id),
          }),
        ],
      }),
    });
    const db = dbWith(resolveGrants(legacy, ["user"]));
    const rows = (await db
      .query(posts)
      .findMany()
      .run({})) as Array<{ authorId: string }>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.authorId).toBe("charlie-1");
  });
});
