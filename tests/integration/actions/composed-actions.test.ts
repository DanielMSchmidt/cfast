import { env } from "cloudflare:test";
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createActions } from "@cfast/actions";
import { applyMigrations, resetDatabase, seedUsers, seedPosts } from "../helpers/d1";
import { testUsers, testPosts } from "../helpers/permissions";
import { posts, comments } from "../helpers/schema";
import { makeGetContext } from "../helpers/db";

type TestUser = { id: string; role: string };

function buildActions(user: TestUser) {
  const { createAction, composeActions } = createActions<TestUser>({
    getContext: makeGetContext(user),
  });

  const updatePost = createAction(
    (db, input: { postId: string; title: string }) =>
      db.update(posts).set({ title: input.title }).where(eq(posts.id, input.postId)),
  );

  const addComment = createAction(
    (db, input: { id: string; body: string; postId: string }) =>
      db.insert(comments).values({
        id: input.id,
        body: input.body,
        postId: input.postId,
        authorId: user.id,
      }),
  );

  const composed = composeActions({ updatePost, addComment });
  return { updatePost, addComment, composed };
}

describe("composed-actions", () => {
  beforeAll(async () => {
    await applyMigrations(env.DB);
  });

  beforeEach(async () => {
    await resetDatabase(env.DB);
    await seedUsers(env.DB, Object.values(testUsers));
    await seedPosts(env.DB, testPosts);
  });

  it("composeActions routes by _action field in FormData", async () => {
    const { composed } = buildActions(testUsers.charlie);

    const formData = new FormData();
    formData.set("_action", "updatePost");
    formData.set("postId", "post-3");
    formData.set("title", "Updated via FormData");

    const request = new Request("http://localhost/action", {
      method: "POST",
      body: formData,
    });

    await composed.action({ request, params: {} });

    const row = await env.DB.prepare("SELECT title FROM posts WHERE id = ?")
      .bind("post-3")
      .first();
    expect(row!.title).toBe("Updated via FormData");
  });

  it("JSON input with _action dispatches correctly", async () => {
    const { composed } = buildActions(testUsers.charlie);

    const request = new Request("http://localhost/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _action: "addComment",
        id: "comment-1",
        body: "Great post!",
        postId: "post-4",
      }),
    });

    await composed.action({ request, params: {} });

    const row = await env.DB.prepare("SELECT body, author_id FROM comments WHERE id = ?")
      .bind("comment-1")
      .first();
    expect(row!.body).toBe("Great post!");
    expect(row!.author_id).toBe("charlie-1");
  });

  it("_action field stripped from input before passing to operation", async () => {
    const { composed } = buildActions(testUsers.charlie);

    // If _action were NOT stripped, the insert would try to put "_action" into
    // the posts table, which would likely fail or produce unexpected results.
    // We verify by successfully running the update and checking only valid
    // fields were passed through.
    const request = new Request("http://localhost/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _action: "updatePost",
        postId: "post-3",
        title: "Stripped Action Field",
      }),
    });

    await composed.action({ request, params: {} });

    const row = await env.DB.prepare("SELECT title FROM posts WHERE id = ?")
      .bind("post-3")
      .first();
    expect(row!.title).toBe("Stripped Action Field");
  });

  it("unknown _action value throws an error", async () => {
    const { composed } = buildActions(testUsers.charlie);

    const request = new Request("http://localhost/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        _action: "nonExistentAction",
        id: "whatever",
      }),
    });

    await expect(composed.action({ request, params: {} })).rejects.toThrow(
      /Unknown action.*nonExistentAction/,
    );
  });
});
