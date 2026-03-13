import { useState, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Link, redirect } from "react-router";
import Table from "@mui/joy/Table";
import Button from "@mui/joy/Button";
import Chip from "@mui/joy/Chip";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import type { Env } from "~/env";
import { requireUser, hasRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { posts, users, auditLogs } from "~/db/schema";
import { eq, desc, asc, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Pagination } from "~/components/Pagination";
import { ConfirmDialog } from "~/components/ConfirmDialog";
import { useToast } from "~/components/ToastProvider";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  const db = createDbClient(env.DB);
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const status = url.searchParams.get("status") ?? "all";
  const sortColumn = url.searchParams.get("sort") ?? "createdAt";
  const sortOrder = url.searchParams.get("order") ?? "desc";
  const offset = (page - 1) * limit;

  const statusCondition =
    status === "published"
      ? eq(posts.published, true)
      : status === "draft"
        ? eq(posts.published, false)
        : undefined;

  const sortableColumns = {
    title: posts.title,
    createdAt: posts.createdAt,
  } as const;

  const column = sortableColumns[sortColumn as keyof typeof sortableColumns] ?? posts.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;

  const postList = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      published: posts.published,
      coverImageKey: posts.coverImageKey,
      createdAt: posts.createdAt,
      authorName: users.name,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .where(statusCondition)
    .orderBy(orderFn(column))
    .limit(limit)
    .offset(offset);

  const totalResult = await db
    .select({ total: count() })
    .from(posts)
    .where(statusCondition)
    .get();
  const total = totalResult?.total ?? 0;

  return { posts: postList, total, page, limit, status, sort: sortColumn, order: sortOrder };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);

  if (!hasRole(user, "admin")) {
    throw redirect("/");
  }

  const db = createDbClient(env.DB);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "delete") {
    const postId = formData.get("postId") as string;

    const post = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .get();

    if (!post) {
      return { error: "Post not found" };
    }

    if (post.coverImageKey) {
      await env.UPLOADS.delete(post.coverImageKey);
    }

    await db.delete(posts).where(eq(posts.id, postId));

    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: user.id,
      action: "delete_post",
      targetType: "post",
      targetId: postId,
      metadata: JSON.stringify({ title: post.title }),
    });

    return { success: "Post deleted successfully" };
  }

  return { error: "Unknown action" };
}

function SortHeader({
  column,
  label,
  currentSort,
  currentOrder,
  baseUrl,
}: {
  column: string;
  label: string;
  currentSort: string;
  currentOrder: string;
  baseUrl: string;
}) {
  const isActive = currentSort === column;
  const nextOrder = isActive && currentOrder === "asc" ? "desc" : "asc";
  const url = new URL(baseUrl, "http://localhost");
  url.searchParams.set("sort", column);
  url.searchParams.set("order", nextOrder);
  const href = `${url.pathname}?${url.searchParams.toString()}`;

  return (
    <th>
      <Link to={href} style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}>
        {label} {isActive ? (currentOrder === "asc" ? "\u2191" : "\u2193") : ""}
      </Link>
    </th>
  );
}

export default function AdminPosts() {
  const { posts: postList, total, page, limit, status, sort, order } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const totalPages = Math.ceil(total / limit);

  const { addToast } = useToast();
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deletePostTitle, setDeletePostTitle] = useState<string>("");

  useEffect(() => {
    if (!actionData) return;
    if ("success" in actionData) {
      addToast("Post deleted successfully.");
    } else if ("error" in actionData) {
      addToast(actionData.error, "error");
    }
  }, [actionData, addToast]);

  const filterUrl =
    status !== "all" ? `/admin/posts?status=${status}` : "/admin/posts";

  return (
    <Stack spacing={3}>
      <Typography level="h2">Posts</Typography>

      {actionData && "error" in actionData && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: "sm",
            bgcolor: "danger.softBg",
            color: "danger.plainColor",
          }}
        >
          <Typography level="body-sm">{actionData.error}</Typography>
        </Box>
      )}

      {actionData && "success" in actionData && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: "sm",
            bgcolor: "success.softBg",
            color: "success.plainColor",
          }}
        >
          <Typography level="body-sm">{actionData.success}</Typography>
        </Box>
      )}

      <Stack direction="row" spacing={1}>
        <Button
          component={Link}
          to="/admin/posts"
          variant={status === "all" ? "solid" : "outlined"}
          color={status === "all" ? "primary" : "neutral"}
          size="sm"
        >
          All
        </Button>
        <Button
          component={Link}
          to="/admin/posts?status=published"
          variant={status === "published" ? "solid" : "outlined"}
          color={status === "published" ? "primary" : "neutral"}
          size="sm"
        >
          Published
        </Button>
        <Button
          component={Link}
          to="/admin/posts?status=draft"
          variant={status === "draft" ? "solid" : "outlined"}
          color={status === "draft" ? "primary" : "neutral"}
          size="sm"
        >
          Drafts
        </Button>
      </Stack>

      <Typography level="body-sm" sx={{ color: "neutral.500" }}>
        {total} post{total !== 1 ? "s" : ""} found
      </Typography>

      <Box sx={{ overflowX: "auto" }}>
        <Table hoverRow>
          <thead>
            <tr>
              <SortHeader column="title" label="Title" currentSort={sort} currentOrder={order} baseUrl={filterUrl} />
              <th>Author</th>
              <th>Status</th>
              <SortHeader column="createdAt" label="Created" currentSort={sort} currentOrder={order} baseUrl={filterUrl} />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {postList.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
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
                <td>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={Link}
                      to={`/posts/${post.slug}`}
                      size="sm"
                      variant="outlined"
                    >
                      View
                    </Button>
                    <Button
                      component={Link}
                      to={`/posts/${post.slug}/edit`}
                      size="sm"
                      variant="outlined"
                      color="primary"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="soft"
                      color="danger"
                      onClick={() => {
                        setDeletePostId(post.id);
                        setDeletePostTitle(post.title);
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </td>
              </tr>
            ))}
            {postList.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <Typography
                    level="body-sm"
                    sx={{ textAlign: "center", py: 2, color: "neutral.500" }}
                  >
                    No posts found
                  </Typography>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Box>

      <Pagination currentPage={page} totalPages={totalPages} baseUrl={filterUrl} />

      <ConfirmDialog
        open={deletePostId !== null}
        onClose={() => setDeletePostId(null)}
        onConfirm={() => {
          if (deletePostId) {
            const form = document.createElement("form");
            form.method = "post";
            form.style.display = "none";

            const actionInput = document.createElement("input");
            actionInput.name = "_action";
            actionInput.value = "delete";
            form.appendChild(actionInput);

            const idInput = document.createElement("input");
            idInput.name = "postId";
            idInput.value = deletePostId;
            form.appendChild(idInput);

            document.body.appendChild(form);
            form.submit();
          }
        }}
        title="Delete Post"
        message={`Are you sure you want to delete "${deletePostTitle}"? This action cannot be undone.`}
      />
    </Stack>
  );
}
