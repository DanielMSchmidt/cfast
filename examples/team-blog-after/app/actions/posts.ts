import { redirect } from "react-router";
import { compose } from "@cfast/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createAction } from "~/actions.server";
import { posts, comments } from "~/db/schema";
import { sendPostPublishedEmail, sendNewCommentEmail } from "~/email/send";
import { env } from "~/env";
import { auditLog } from "~/utils.server";

export const deletePost = createAction<
  { postId: string; title: string; slug: string },
  Response
>((db, input, ctx) =>
  compose(
    [
      db.delete(posts).where(eq(posts.id, input.postId)),
      auditLog(db, ctx.user.id, "post.deleted", { type: "post", id: input.postId }, { title: input.title, slug: input.slug }),
    ],
    async (runDelete, runAudit) => {
      await runDelete();
      await runAudit();
      return redirect("/");
    },
  ),
);

export const publishPost = createAction<
  { postId: string; title: string; slug: string; authorId: string },
  { success: boolean; action: "publish" }
>((db, input, ctx) =>
  compose(
    [
      db
        .update(posts)
        .set({ published: true, publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(posts.id, input.postId)),
      auditLog(db, ctx.user.id, "post.published", { type: "post", id: input.postId }, { title: input.title }),
    ],
    async (runUpdate, runAudit) => {
      await runUpdate();
      await runAudit();
      const e = env.get();
      await sendPostPublishedEmail(e, {
        title: input.title,
        slug: input.slug,
        authorId: input.authorId,
      });
      return { success: true, action: "publish" as const };
    },
  ),
);

export const unpublishPost = createAction<
  { postId: string; title: string },
  { success: boolean; action: "unpublish" }
>((db, input, ctx) =>
  compose(
    [
      db
        .update(posts)
        .set({ published: false, updatedAt: new Date() })
        .where(eq(posts.id, input.postId)),
      auditLog(db, ctx.user.id, "post.unpublished", { type: "post", id: input.postId }, { title: input.title }),
    ],
    async (runUpdate, runAudit) => {
      await runUpdate();
      await runAudit();
      return { success: true, action: "unpublish" as const };
    },
  ),
);

export const addComment = createAction<
  {
    postId: string;
    content: string;
    postTitle: string;
    postSlug: string;
    postAuthorId: string;
    postPublished: string;
  },
  { success: boolean; action: "comment" } | { error: string; action: "comment" }
>((db, input, ctx) => {
  const content = input.content?.trim();

  if (input.postPublished !== "true") {
    return {
      permissions: [],
      run: async () => {
        throw new Response("Cannot comment on unpublished posts", {
          status: 400,
        });
      },
    };
  }

  if (!content) {
    return {
      permissions: [],
      run: async () => ({
        error: "Comment content cannot be empty.",
        action: "comment" as const,
      }),
    };
  }

  return compose(
    [
      db.insert(comments).values({
        id: nanoid(),
        postId: input.postId,
        authorId: ctx.user.id,
        content,
      }),
    ],
    async (runInsert) => {
      await runInsert();
      const e = env.get();
      await sendNewCommentEmail(
        e,
        {
          id: input.postId,
          title: input.postTitle,
          slug: input.postSlug,
          authorId: input.postAuthorId,
        },
        { name: ctx.user.name },
        content,
      );
      return { success: true, action: "comment" as const };
    },
  );
});

export const deleteComment = createAction<
  { commentId: string },
  { success: boolean; action: "deleteComment" }
>((db, input) =>
  compose(
    [db.delete(comments).where(eq(comments.id, input.commentId))],
    async (runDelete) => {
      await runDelete();
      return { success: true, action: "deleteComment" as const };
    },
  ),
);
