import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, Link, redirect } from "react-router";
import Table from "@mui/joy/Table";
import Button from "@mui/joy/Button";
import Chip from "@mui/joy/Chip";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Box from "@mui/joy/Box";
import { requireAuthContext, hasRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { createCfDb } from "~/db/cfast.server";
import { compose, parseOffsetParams } from "@cfast/db";
import type { OffsetPage } from "@cfast/db";
import { useOffsetPagination } from "@cfast/pagination";
import { posts, auditLogs } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ConfirmDialog } from "~/components/ConfirmDialog";

type PostItem = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  coverImageKey: string | null;
  createdAt: Date;
  author: { name: string } | null;
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);

  if (!hasRole(ctx.user, "admin")) {
    throw redirect("/");
  }

  const cfDb = createCfDb(env.DB, ctx);
  const params = parseOffsetParams(request, { defaultLimit: 20, maxLimit: 50 });
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";

  const statusCondition =
    status === "published"
      ? eq(posts.published, true)
      : status === "draft"
        ? eq(posts.published, false)
        : undefined;

  const result = await cfDb.query(posts).paginate(params, {
    where: statusCondition,
    orderBy: desc(posts.createdAt),
    with: { author: { columns: { name: true } } },
  }).run({}) as OffsetPage<unknown>;

  return { ...result, status };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);

  if (!hasRole(ctx.user, "admin")) {
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

    const cfDb = createCfDb(env.DB, ctx);

    const op = compose(
      [
        cfDb.unsafe().delete(posts).where(eq(posts.id, postId)),
        cfDb.unsafe().insert(auditLogs).values({
          id: nanoid(),
          userId: ctx.user.id,
          action: "delete_post",
          targetType: "post",
          targetId: postId,
          metadata: JSON.stringify({ title: post.title }),
        }),
      ],
      async (runDelete, runAudit) => {
        await runDelete({});
        await runAudit({});
      },
    );

    await op.run({});

    return { success: "Post deleted successfully" };
  }

  return { error: "Unknown action" };
}

export default function AdminPosts() {
  const { items: postList, total, totalPages, currentPage, goToPage } =
    useOffsetPagination<PostItem>();
  const { status } = useLoaderData() as { status: string };
  const actionData = useActionData<typeof action>();

  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deletePostTitle, setDeletePostTitle] = useState<string>("");

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
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {postList.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.author?.name ?? "Unknown"}</td>
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

      {totalPages > 1 && (
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="neutral"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const maxVisible = 5;
            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            const end = Math.min(totalPages, start + maxVisible - 1);
            start = Math.max(1, end - maxVisible + 1);
            const page = start + i;
            if (page > totalPages) return null;
            return (
              <Button
                key={page}
                variant={page === currentPage ? "solid" : "outlined"}
                color={page === currentPage ? "primary" : "neutral"}
                size="sm"
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outlined"
            color="neutral"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next
          </Button>
        </Stack>
      )}

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
