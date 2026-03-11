import { email } from "~/email.server";
import { MagicLinkEmail } from "./templates/magic-link";
import { PostPublishedEmail } from "./templates/post-published";
import { NewCommentEmail } from "./templates/new-comment";
import type { Env } from "~/env";
import { createDbClient } from "~/db/client";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";

export async function sendMagicLinkEmail(_env: Env, emailAddress: string, url: string) {
  await email.send({
    to: emailAddress,
    subject: "Sign in to Team Blog",
    react: MagicLinkEmail({ url }),
  });
}

export async function sendPostPublishedEmail(
  env: Env,
  post: { title: string; slug: string; authorId: string },
) {
  const db = createDbClient(env.DB);
  const author = await db.select().from(users).where(eq(users.id, post.authorId)).get();
  if (!author) return;

  const postUrl = `${env.APP_URL}/posts/${post.slug}`;
  await email.send({
    to: author.email,
    subject: `Your post "${post.title}" has been published!`,
    react: PostPublishedEmail({
      authorName: author.name,
      postTitle: post.title,
      postUrl,
    }),
  });
}

export async function sendNewCommentEmail(
  env: Env,
  post: { id: string; title: string; slug: string; authorId: string },
  commenter: { name: string },
  content: string,
) {
  const db = createDbClient(env.DB);
  const author = await db.select().from(users).where(eq(users.id, post.authorId)).get();
  if (!author) return;

  const postUrl = `${env.APP_URL}/posts/${post.slug}`;
  await email.send({
    to: author.email,
    subject: `New comment on "${post.title}"`,
    react: NewCommentEmail({
      authorName: author.name,
      commenterName: commenter.name,
      postTitle: post.title,
      commentContent: content,
      postUrl,
    }),
  });
}
