import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Table from "@mui/joy/Table";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";
import { requireUser, hasRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { users, posts, comments, roles } from "~/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { redirect } from "react-router";
import { RoleChip } from "~/components/RoleChip";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await requireUser(request, env);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  const db = createDbClient(env.DB);

  const totalUsersResult = await db
    .select({ total: count() })
    .from(users)
    .get();
  const totalUsers = totalUsersResult?.total ?? 0;

  const totalPostsResult = await db
    .select({ total: count() })
    .from(posts)
    .get();
  const totalPosts = totalPostsResult?.total ?? 0;

  const publishedPostsResult = await db
    .select({ total: count() })
    .from(posts)
    .where(eq(posts.published, true))
    .get();
  const publishedPosts = publishedPostsResult?.total ?? 0;

  const totalCommentsResult = await db
    .select({ total: count() })
    .from(comments)
    .get();
  const totalComments = totalCommentsResult?.total ?? 0;

  const recentPosts = await db
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
    .limit(5);

  const recentUsersRaw = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(5);

  const recentUsers = await Promise.all(
    recentUsersRaw.map(async (u) => {
      const userRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.userId, u.id));
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        roles: userRoles.map((r) => r.role),
        createdAt: u.createdAt,
      };
    })
  );

  return {
    totalUsers,
    totalPosts,
    publishedPosts,
    totalComments,
    recentPosts,
    recentUsers,
  };
}

export default function AdminDashboard() {
  const {
    totalUsers,
    totalPosts,
    publishedPosts,
    totalComments,
    recentPosts,
    recentUsers,
  } = useLoaderData<typeof loader>();

  const stats = [
    { label: "Total Users", value: totalUsers },
    { label: "Total Posts", value: totalPosts },
    { label: "Published Posts", value: publishedPosts },
    { label: "Total Comments", value: totalComments },
  ];

  return (
    <Stack spacing={3}>
      <Typography level="h2">Dashboard</Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
        }}
      >
        {stats.map((stat) => (
          <Card key={stat.label} variant="outlined">
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
              {stat.label}
            </Typography>
            <Typography level="h2">{stat.value}</Typography>
          </Card>
        ))}
      </Box>

      <Card variant="outlined">
        <Typography level="title-lg" sx={{ mb: 1 }}>
          Recent Posts
        </Typography>
        <Table hoverRow>
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentPosts.map((post) => (
              <tr key={post.id}>
                <td>
                  <Link to={`/admin/posts`}>{post.title}</Link>
                </td>
                <td>{post.authorName ?? "Unknown"}</td>
                <td>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={post.published ? "success" : "neutral"}
                  >
                    {post.published ? "Published" : "Draft"}
                  </Chip>
                </td>
                <td>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
            {recentPosts.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <Typography
                    level="body-sm"
                    sx={{ textAlign: "center", py: 2, color: "neutral.500" }}
                  >
                    No posts yet
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      <Card variant="outlined">
        <Typography level="title-lg" sx={{ mb: 1 }}>
          Recent Users
        </Typography>
        <Table hoverRow>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Roles</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <Link to={`/admin/users/${u.id}`}>{u.name}</Link>
                </td>
                <td>{u.email}</td>
                <td>
                  <Stack direction="row" spacing={0.5}>
                    {u.roles.map((role) => (
                      <RoleChip key={role} role={role} />
                    ))}
                    {u.roles.length === 0 && <RoleChip role="reader" />}
                  </Stack>
                </td>
                <td>
                  {u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString()
                    : "N/A"}
                </td>
              </tr>
            ))}
            {recentUsers.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <Typography
                    level="body-sm"
                    sx={{ textAlign: "center", py: 2, color: "neutral.500" }}
                  >
                    No users yet
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </Stack>
  );
}
