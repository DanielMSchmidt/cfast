import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import { getUser } from "~/auth.helpers.server";
import { hasAnyRole } from "~/permissions";
import { createDbClient } from "~/db/client";
import { posts, users } from "~/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { Header } from "~/components/Header";
import { PostCard } from "~/components/PostCard";
import { Pagination } from "~/components/Pagination";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(request, env);
  const db = createDbClient(env.DB);

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "10", 10)));
  const offset = (page - 1) * limit;

  const publishedPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImageKey: posts.coverImageKey,
      publishedAt: posts.publishedAt,
      authorName: users.name,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ total: count() })
    .from(posts)
    .where(eq(posts.published, true))
    .get();

  const total = totalResult?.total ?? 0;

  const formattedPosts = publishedPosts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImageKey: p.coverImageKey,
    publishedAt: p.publishedAt,
    author: {
      name: p.authorName ?? "Unknown",
      avatarUrl: p.authorAvatarUrl ?? null,
    },
  }));

  return { posts: formattedPosts, total, page, limit, user };
}

export default function Home() {
  const { posts: postList, total, page, limit, user } = useLoaderData<typeof loader>();
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Header user={user} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography level="h2">Latest Posts</Typography>
          {user && hasAnyRole(user, ["admin", "editor", "author"]) && (
            <Button component={Link} to="/posts/new">
              New Post
            </Button>
          )}
        </Stack>

        {postList.length === 0 ? (
          <Typography level="body-lg" sx={{ textAlign: "center", py: 8, color: "neutral.500" }}>
            No posts yet. Check back later!
          </Typography>
        ) : (
          <Stack spacing={2}>
            {postList.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </Stack>
        )}

        <Pagination currentPage={page} totalPages={totalPages} baseUrl="/" />
      </Container>
    </>
  );
}
