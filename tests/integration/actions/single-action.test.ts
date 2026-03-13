import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@cfast/db";
import { resolveGrants, ForbiddenError } from "@cfast/permissions";
import { createActions, checkPermissionStatus } from "@cfast/actions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { permissions, testUsers, testPosts } from "../helpers/permissions";
import { posts, schema } from "../helpers/schema";
import type { Grant } from "@cfast/permissions";
import type { ActionContext } from "@cfast/actions";

type TestUser = { id: string; role: string };

function dbAs(user: TestUser, grants: Grant[]) {
  return createDb({
    d1: env.DB,
    schema,
    grants,
    user: { id: user.id },
    cache: false,
  });
}

function makeGetContext(user: TestUser) {
  const grants = resolveGrants(permissions, [user.role]);
  return async (_args: { request: Request; params: Record<string, string | undefined> }) => ({
    db: dbAs(user, grants),
    user,
    grants,
  });
}

describe("single-action", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("createAction builds Operation from db + input via buildOperation", () => {
    const { createAction } = createActions<TestUser>({
      getContext: makeGetContext(testUsers.charlie),
    });

    const updatePost = createAction(
      (db, input: { postId: string; title: string }, _ctx: ActionContext<TestUser>) =>
        db.update(posts).set({ title: input.title }).where(eq(posts.id, input.postId)),
    );

    // buildOperation should return an Operation with permissions and run
    const grants = resolveGrants(permissions, [testUsers.charlie.role]);
    const db = dbAs(testUsers.charlie, grants);
    const op = updatePost.buildOperation(
      db,
      { postId: "post-3", title: "Updated" },
      { db, user: testUsers.charlie, grants },
    );

    expect(op).toHaveProperty("permissions");
    expect(op).toHaveProperty("run");
    expect(Array.isArray(op.permissions)).toBe(true);
    expect(typeof op.run).toBe("function");
  });

  it("authorized user executes action successfully (Charlie updates own post)", async () => {
    const { createAction } = createActions<TestUser>({
      getContext: makeGetContext(testUsers.charlie),
    });

    const updatePost = createAction(
      (db, input: { postId: string; title: string }) =>
        db.update(posts).set({ title: input.title }).where(eq(posts.id, input.postId)),
    );

    const request = new Request("http://localhost/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: "post-3", title: "Charlie Updated Title" }),
    });

    await updatePost.action({ request, params: {} });

    // Verify the update was applied
    const row = await env.DB.prepare("SELECT title FROM posts WHERE id = ?")
      .bind("post-3")
      .first();
    expect(row!.title).toBe("Charlie Updated Title");
  });

  it("unauthorized user gets ForbiddenError (anon cannot insert)", async () => {
    const { createAction } = createActions<TestUser>({
      getContext: makeGetContext(testUsers.anon),
    });

    const createPost = createAction(
      (db, input: { id: string; title: string; content: string }) =>
        db.insert(posts).values({
          id: input.id,
          title: input.title,
          content: input.content,
          authorId: "anon-1",
          published: false,
        }),
    );

    // Use buildOperation instead of invoking action() to avoid an
    // unhandled-rejection report from the Workers test runtime.
    // The ForbiddenError thrown inside operation.run() surfaces as an
    // unhandled rejection in workerd before Vitest can catch it.
    const grants = resolveGrants(permissions, [testUsers.anon.role]);
    const db = dbAs(testUsers.anon, grants);
    const op = createPost.buildOperation(
      db,
      { id: "post-anon", title: "Anon Post", content: "nope" },
      { db, user: testUsers.anon, grants },
    );

    // The operation itself should throw ForbiddenError when run
    await expect(op.run({})).rejects.toThrow(ForbiddenError);
  });

  it("permissions extracted pre-execution for structural check", () => {
    const { createAction } = createActions<TestUser>({
      getContext: makeGetContext(testUsers.charlie),
    });

    const updatePost = createAction(
      (db, input: { postId: string; title: string }) =>
        db.update(posts).set({ title: input.title }).where(eq(posts.id, input.postId)),
    );

    // Use buildOperation to get the Operation and inspect its permissions
    const grants = resolveGrants(permissions, [testUsers.charlie.role]);
    const db = dbAs(testUsers.charlie, grants);
    const op = updatePost.buildOperation(
      db,
      { postId: "any", title: "any" },
      { db, user: testUsers.charlie, grants },
    );

    // Should contain "update" on "posts"
    expect(op.permissions.length).toBeGreaterThan(0);
    expect(op.permissions[0].action).toBe("update");
  });

  it("checkPermissionStatus returns correct status for admin vs anon", () => {
    const adminGrants = resolveGrants(permissions, ["admin"]);
    const anonGrants = resolveGrants(permissions, ["anonymous"]);

    // admin has grant("manage", "all") so can do anything
    const adminStatus = checkPermissionStatus(adminGrants, [
      { action: "create", table: posts },
    ]);
    expect(adminStatus.permitted).toBe(true);
    expect(adminStatus.invisible).toBe(false);
    expect(adminStatus.reason).toBeNull();

    // anon has only read on posts (with where clause), no create grant
    const anonStatus = checkPermissionStatus(anonGrants, [
      { action: "create", table: posts },
    ]);
    expect(anonStatus.permitted).toBe(false);
    expect(anonStatus.invisible).toBe(true); // all descriptors denied → invisible
    expect(anonStatus.reason).toContain("create");
    expect(anonStatus.reason).toContain("posts");
  });
});
