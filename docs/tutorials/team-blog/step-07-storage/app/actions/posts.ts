import { redirect } from "react-router";
import { compose } from "@cfast/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAction } from "~/actions.server";
import { posts } from "~/db/schema";

// --- Create Post ---

export const createPost = createAction<
  { title: string; slug: string; content: string; excerpt: string | null },
  Response
>((db, input, ctx) => {
  const postId = nanoid();
  return compose(
    [
      db.insert(posts).values({
        id: postId,
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        authorId: ctx.user.id,
        published: false,
      }),
    ],
    async (runInsert) => {
      await runInsert({});
      return redirect(`/posts/${input.slug}`);
    },
  );
});

// --- Publish Post ---

export const publishPost = createAction<
  { postId: string },
  { success: boolean }
>((db, input) =>
  compose(
    [
      db
        .update(posts)
        .set({ published: true, publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(posts.id, input.postId)),
    ],
    async (runUpdate) => {
      await runUpdate({});
      return { success: true };
    },
  ),
);

// --- Unpublish Post ---

export const unpublishPost = createAction<
  { postId: string },
  { success: boolean }
>((db, input) =>
  compose(
    [
      db
        .update(posts)
        .set({ published: false, updatedAt: new Date() })
        .where(eq(posts.id, input.postId)),
    ],
    async (runUpdate) => {
      await runUpdate({});
      return { success: true };
    },
  ),
);

// --- Delete Post ---

export const deletePost = createAction<
  { postId: string },
  Response
>((db, input) =>
  compose(
    [db.delete(posts).where(eq(posts.id, input.postId))],
    async (runDelete) => {
      await runDelete({});
      return redirect("/posts");
    },
  ),
);
