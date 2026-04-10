import { Link } from "react-router";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { can } from "@cfast/permissions";
import { cfastJson } from "@cfast/actions";
import { useCfastLoader } from "@cfast/actions/client";
import { ActionButton } from "@cfast/joy";
import { app } from "~/cfast.server";
import { posts, users } from "~/db/schema";
import * as schema from "~/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { Header } from "~/components/Header";
import { PostCard } from "~/components/PostCard";
import { Pagination } from "~/components/Pagination";

export const loader = app.loader(async (ctx, { request }) => {
  const db = ctx.db.raw;
  const user = ctx.auth.user;
  const grants = ctx.auth.grants;

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

  return {
    ...cfastJson(grants, schema, { posts: formattedPosts }),
    total,
    page,
    limit,
    user,
    // Server-side booleans still needed for Header (which doesn't use useCfastLoader)
    canCreatePost: can(grants, "create", posts),
    canAdmin: can(grants, "manage", "all"),
  };
});

export default function Home() {
  const data = useCfastLoader<typeof loader>();
  const { posts: postList, total, page, limit, user, canCreatePost, canAdmin } = data;
  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Header user={user} canCreatePost={canCreatePost} canAdmin={canAdmin} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography level="h2">Latest Posts</Typography>
          {user && canCreatePost && (
            <ActionButton
              action={{ permitted: canCreatePost, invisible: false, reason: null, submit: () => {}, pending: false, data: undefined, error: undefined }}
              href="/posts/new"
            >
              New Post
            </ActionButton>
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
