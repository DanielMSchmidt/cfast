import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { resolveGrants } from "@cfast/permissions";
import { createActions } from "@cfast/actions";
import type { ActionPermissionsMap } from "@cfast/actions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { permissions, testUsers, testPosts } from "../helpers/permissions";
import { posts } from "../helpers/schema";
import { dbAs } from "../helpers/db";

type TestUser = { id: string; role: string };

describe("loader-integration", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("loader() injects _actionPermissions with correct permitted/invisible status", async () => {
    // Build a composed set with an admin context to check permissions reporting.
    // We test two users: admin (permitted) and anon (not permitted, invisible).

    // --- Admin context: should be permitted ---
    const adminGrants = resolveGrants(permissions, [testUsers.alice.role]);
    const { createAction, composeActions } = createActions<TestUser>({
      getContext: async () => ({
        db: dbAs(testUsers.alice, adminGrants),
        user: testUsers.alice,
        grants: adminGrants,
      }),
    });

    const createPost = createAction(
      (db, input: { id: string; title: string }) =>
        db.insert(posts).values({
          id: input.id,
          title: input.title,
          content: "",
          authorId: "alice-1",
          published: false,
        }),
    );

    const updatePost = createAction(
      (db, input: { postId: string; title: string }) =>
        db.update(posts).set({ title: input.title }).where(eq(posts.id, input.postId)),
    );

    const composed = composeActions({ createPost, updatePost });

    const adminWrappedLoader = composed.loader(async () => ({
      greeting: "hello",
    }));

    const adminRequest = new Request("http://localhost/page");
    const adminResult = await adminWrappedLoader({ request: adminRequest, params: {} });

    // Loader data is preserved
    expect(adminResult.greeting).toBe("hello");

    // _actionPermissions is injected
    expect(adminResult._actionPermissions).toBeDefined();
    const adminPerms = adminResult._actionPermissions as ActionPermissionsMap;

    // Admin has grant("manage", "all") → both actions should be permitted
    expect(adminPerms["createPost"]).toBeDefined();
    expect(adminPerms["createPost"].permitted).toBe(true);
    expect(adminPerms["createPost"].invisible).toBe(false);

    expect(adminPerms["updatePost"]).toBeDefined();
    expect(adminPerms["updatePost"].permitted).toBe(true);
    expect(adminPerms["updatePost"].invisible).toBe(false);

    // --- Anon context: should NOT be permitted, and invisible ---
    const anonGrants = resolveGrants(permissions, [testUsers.anon.role]);
    const anonActions = createActions<TestUser>({
      getContext: async () => ({
        db: dbAs(testUsers.anon, anonGrants),
        user: testUsers.anon,
        grants: anonGrants,
      }),
    });

    const anonCreatePost = anonActions.createAction(
      (db, input: { id: string; title: string }) =>
        db.insert(posts).values({
          id: input.id,
          title: input.title,
          content: "",
          authorId: "anon-1",
          published: false,
        }),
    );

    // Use a single-action loader for anon
    const anonWrappedLoader = anonCreatePost.loader(async () => ({
      greeting: "hey anon",
    }));

    const anonRequest = new Request("http://localhost/page");
    const anonResult = await anonWrappedLoader({ request: anonRequest, params: {} });

    expect(anonResult.greeting).toBe("hey anon");
    expect(anonResult._actionPermissions).toBeDefined();

    const anonPerms = anonResult._actionPermissions as ActionPermissionsMap;
    // There's one action entry (the action_N id)
    const anonPermValues = Object.values(anonPerms);
    expect(anonPermValues.length).toBe(1);

    // Anon has no "create" grant on posts → not permitted, invisible (all descriptors denied)
    const anonCreateStatus = anonPermValues[0];
    expect(anonCreateStatus.permitted).toBe(false);
    expect(anonCreateStatus.invisible).toBe(true);
    expect(anonCreateStatus.reason).toContain("create");
  });
});
