import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, Link, redirect } from "react-router";
import Card from "@mui/joy/Card";
import Typography from "@mui/joy/Typography";
import Table from "@mui/joy/Table";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import Button from "@mui/joy/Button";
import Chip from "@mui/joy/Chip";
import Stack from "@mui/joy/Stack";
import Avatar from "@mui/joy/Avatar";
import Box from "@mui/joy/Box";
import { requireUser, hasRole } from "~/auth.helpers.server";
import type { UserRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { users, roles, posts, auditLogs } from "~/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { RoleChip } from "~/components/RoleChip";

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await requireUser(request, env);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  const db = createDbClient(env.DB);
  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.id, params.id!))
    .get();

  if (!targetUser) {
    throw new Response("User not found", { status: 404 });
  }

  const targetRoles = await db
    .select()
    .from(roles)
    .where(eq(roles.userId, targetUser.id));

  const recentPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      published: posts.published,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.authorId, targetUser.id))
    .orderBy(desc(posts.createdAt))
    .limit(10);

  return {
    targetUser: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      avatarUrl: targetUser.avatarUrl,
      createdAt: targetUser.createdAt,
    },
    targetRoles: targetRoles.map((r) => ({
      id: r.id,
      role: r.role,
      createdAt: r.createdAt,
    })),
    recentPosts,
  };
}

export async function action({ request, context, params }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await requireUser(request, env);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  const db = createDbClient(env.DB);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "assignRole") {
    const role = formData.get("role") as string;

    if (!["admin", "editor", "author"].includes(role)) {
      return { error: "Invalid role" };
    }

    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.userId, params.id!))
      .all();

    if (existingRole.some((r) => r.role === role)) {
      return { error: "User already has this role" };
    }

    await db.insert(roles).values({
      id: nanoid(),
      userId: params.id!,
      role: role as "admin" | "editor" | "author",
      grantedBy: user.id,
    });

    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: user.id,
      action: "assign_role",
      targetType: "user",
      targetId: params.id!,
      metadata: JSON.stringify({ role }),
    });

    return { success: `Role "${role}" assigned successfully` };
  }

  if (_action === "revokeRole") {
    const roleId = formData.get("roleId") as string;

    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .get();

    if (!existingRole) {
      return { error: "Role not found" };
    }

    await db.delete(roles).where(eq(roles.id, roleId));

    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: user.id,
      action: "revoke_role",
      targetType: "user",
      targetId: params.id!,
      metadata: JSON.stringify({ role: existingRole.role }),
    });

    return { success: `Role "${existingRole.role}" revoked successfully` };
  }

  return { error: "Unknown action" };
}

export default function AdminUserDetail() {
  const { targetUser, targetRoles, recentPosts } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          component={Link}
          to="/admin/users"
          variant="plain"
          color="neutral"
          size="sm"
        >
          Back to Users
        </Button>
      </Stack>

      {actionData && "error" in actionData && (
        <Card variant="soft" color="danger">
          <Typography level="body-sm">{actionData.error}</Typography>
        </Card>
      )}

      {actionData && "success" in actionData && (
        <Card variant="soft" color="success">
          <Typography level="body-sm">{actionData.success}</Typography>
        </Card>
      )}

      <Card variant="outlined">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={targetUser.avatarUrl ?? undefined}
            sx={{ width: 64, height: 64 }}
          >
            {targetUser.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography level="h3">{targetUser.name}</Typography>
            <Typography level="body-md" sx={{ color: "neutral.500" }}>
              {targetUser.email}
            </Typography>
            <Typography level="body-sm" sx={{ color: "neutral.400" }}>
              Joined{" "}
              {targetUser.createdAt
                ? new Date(targetUser.createdAt).toLocaleDateString()
                : "N/A"}
            </Typography>
          </Box>
        </Stack>
      </Card>

      <Card variant="outlined">
        <Typography level="title-lg" sx={{ mb: 2 }}>
          Role Management
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Typography level="body-sm" sx={{ mb: 1, fontWeight: "bold" }}>
              Current Roles
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {targetRoles.length > 0 ? (
                targetRoles.map((r) => (
                  <Form method="post" key={r.id}>
                    <input type="hidden" name="_action" value="revokeRole" />
                    <input type="hidden" name="roleId" value={r.id} />
                    <Chip
                      size="sm"
                      variant="soft"
                      color={
                        r.role === "admin"
                          ? "danger"
                          : r.role === "editor"
                            ? "primary"
                            : "success"
                      }
                      endDecorator={
                        <Button
                          type="submit"
                          variant="plain"
                          size="sm"
                          sx={{
                            minWidth: 0,
                            minHeight: 0,
                            p: 0,
                            fontSize: "xs",
                          }}
                        >
                          x
                        </Button>
                      }
                    >
                      {r.role}
                    </Chip>
                  </Form>
                ))
              ) : (
                <Typography level="body-sm" sx={{ color: "neutral.500" }}>
                  No roles assigned (defaults to reader)
                </Typography>
              )}
            </Stack>
          </Box>

          <Form method="post">
            <input type="hidden" name="_action" value="assignRole" />
            <Stack direction="row" spacing={1} alignItems="center">
              <Select
                name="role"
                placeholder="Select a role..."
                sx={{ minWidth: 200 }}
              >
                <Option value="admin">Admin</Option>
                <Option value="editor">Editor</Option>
                <Option value="author">Author</Option>
              </Select>
              <Button type="submit" variant="solid">
                Assign
              </Button>
            </Stack>
          </Form>
        </Stack>
      </Card>

      <Card variant="outlined">
        <Typography level="title-lg" sx={{ mb: 1 }}>
          Recent Posts
        </Typography>
        <Table hoverRow>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {recentPosts.map((post) => (
              <tr key={post.id}>
                <td>
                  <Link to={`/posts/${post.slug}`}>{post.title}</Link>
                </td>
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
                <td colSpan={3}>
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
        <Form method="post" action={`/admin/impersonate/${targetUser.id}`}>
          <Button type="submit" variant="soft" color="warning">
            Impersonate User
          </Button>
        </Form>
      </Card>
    </Stack>
  );
}
