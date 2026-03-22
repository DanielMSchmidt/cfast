import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import Container from "@mui/joy/Container";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import Table from "@mui/joy/Table";
import Sheet from "@mui/joy/Sheet";
import { PermissionGate } from "@cfast/joy";
import { getUser } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { posts, users } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header } from "~/components/Header";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(request);
  const db = createDbClient(env.DB);

  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      published: posts.published,
      createdAt: posts.createdAt,
      authorName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(50);

  return { posts: allPosts, user };
}

export default function PostsList() {
  const { posts: postList, user } = useLoaderData<typeof loader>();

  return (
    <>
      <Header user={user} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography level="h2">Posts</Typography>
          {user && (
            <Button component={Link} to="/posts/new" size="sm">
              New Post
            </Button>
          )}
        </Stack>

        {postList.length === 0 ? (
          <Typography level="body-lg" sx={{ textAlign: "center", py: 8, color: "neutral.500" }}>
            No posts yet. Create your first post to get started.
          </Typography>
        ) : (
          <Sheet variant="outlined" sx={{ borderRadius: "md", overflow: "hidden" }}>
            <Table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {postList.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/posts/${post.id}`} style={{ textDecoration: "none" }}>
                        <Typography level="title-sm" sx={{ color: "primary.600" }}>
                          {post.title}
                        </Typography>
                      </Link>
                    </td>
                    <td>
                      <Typography level="body-sm">{post.authorName ?? "Unknown"}</Typography>
                    </td>
                    <td>
                      <Chip
                        size="sm"
                        color={post.published ? "success" : "neutral"}
                        variant="soft"
                      >
                        {post.published ? "Published" : "Draft"}
                      </Chip>
                    </td>
                    <td>
                      <Typography level="body-xs">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Sheet>
        )}
      </Container>
    </>
  );
}
