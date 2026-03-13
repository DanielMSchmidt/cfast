import { email } from "~/email.server";
import { PostPublishedEmail } from "./templates/post-published";
import type { Env } from "~/env";
import { createDbClient } from "~/db/client";
import { users } from "~/db/schema";
import { eq } from "drizzle-orm";

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
