import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, Link } from "react-router";
import { useState } from "react";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Textarea from "@mui/joy/Textarea";
import AspectRatio from "@mui/joy/AspectRatio";
import Alert from "@mui/joy/Alert";
import Box from "@mui/joy/Box";
import Avatar from "@mui/joy/Avatar";
import Divider from "@mui/joy/Divider";
import Chip from "@mui/joy/Chip";
import { getAuthContext } from "~/auth.helpers.server";
import { hasRole, hasAnyRole } from "~/permissions";
import { createDbClient } from "~/db/client";
import { createCfDb } from "~/db/cfast.server";
import { parseCursorParams } from "@cfast/db";
import type { CursorPage } from "@cfast/db";
import { useInfiniteScroll } from "@cfast/pagination";
import { posts, users, comments } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { Header } from "~/components/Header";
import { CommentItem } from "~/components/CommentItem";
import { composeActions } from "~/actions.server";
import {
  deletePost,
  publishPost,
  unpublishPost,
  addComment,
  deleteComment,
} from "~/actions/posts";

type CommentType = {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string; avatarUrl: string | null };
};

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const authCtx = await getAuthContext(request);
  const user = authCtx.user;
  const db = createDbClient(env.DB);

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  // Permission check: if not published, only allow author/editor/admin
  if (!post.published) {
    if (!user) throw new Response("Not Found", { status: 404 });
    const isAuthor = user.id === post.authorId;
    const isEditorOrAdmin = hasAnyRole(user, ["editor", "admin"]);
    if (!isAuthor && !isEditorOrAdmin) {
      throw new Response("Not Found", { status: 404 });
    }
  }

  // Get author info
  const author = await db.select().from(users).where(eq(users.id, post.authorId)).get();

  // Cursor-based comments using @cfast/db pagination
  const cursorParams = parseCursorParams(request, { defaultLimit: 20 });
  const cfDb = createCfDb(env.DB, authCtx);

  const commentResult = await cfDb.query(comments).paginate(cursorParams, {
    where: eq(comments.postId, post.id),
    orderBy: desc(comments.createdAt),
    cursorColumns: [comments.id],
    orderDirection: "desc",
    with: { author: { columns: { id: true, name: true, avatarUrl: true } } },
  }).run({}) as CursorPage<unknown>;

  return {
    post,
    author: author
      ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl }
      : { id: post.authorId, name: "Unknown", avatarUrl: null },
    items: commentResult.items,
    nextCursor: commentResult.nextCursor,
    user,
  };
}

const composed = composeActions({
  deletePost,
  publishPost,
  unpublishPost,
  addComment,
  deleteComment,
});

export const action = composed.action;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostDetail() {
  const { post, author, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as
    | { success: boolean; action: string }
    | { error: string; action: string }
    | undefined;

  const { items: allComments, sentinelRef, hasMore, isLoading: isLoadingMore } =
    useInfiniteScroll<CommentType>();

  const [commentContent, setCommentContent] = useState("");

  const isAuthor = user?.id === post.authorId;
  const isEditorOrAdmin = user ? hasAnyRole(user, ["editor", "admin"]) : false;
  const isAdmin = user ? hasRole(user, "admin") : false;
  const canEdit = isAuthor || isEditorOrAdmin;
  const canDelete = isAuthor || isAdmin;
  const canPublish = isEditorOrAdmin;

  return (
    <>
      <Header user={user} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Post Header */}
        <Stack spacing={2} sx={{ mb: 4 }}>
          {!post.published && (
            <Chip color="warning" variant="soft" size="sm">
              Draft
            </Chip>
          )}

          <Typography level="h1">{post.title}</Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={author.avatarUrl ?? undefined} size="md">
              {getInitials(author.name)}
            </Avatar>
            <Stack>
              <Typography level="title-sm">{author.name}</Typography>
              {post.publishedAt && (
                <Typography level="body-xs" sx={{ color: "neutral.500" }}>
                  {formatDate(post.publishedAt)}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>

        {/* Cover Image */}
        {post.coverImageKey && (
          <AspectRatio ratio="16/9" sx={{ mb: 4, borderRadius: "md", overflow: "hidden" }}>
            <img src={`/api/file/${post.coverImageKey}`} alt={post.title} />
          </AspectRatio>
        )}

        {/* Post Content */}
        <Box sx={{ mb: 4 }}>
          <Typography level="body-lg" sx={{ whiteSpace: "pre-wrap" }}>
            {post.content}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
          {canEdit && (
            <Button component={Link} to={`/posts/${post.slug}/edit`} variant="outlined" size="sm">
              Edit
            </Button>
          )}
          {canPublish && !post.published && (
            <Form method="post">
              <input type="hidden" name="_action" value="publishPost" />
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="title" value={post.title} />
              <input type="hidden" name="slug" value={post.slug} />
              <input type="hidden" name="authorId" value={post.authorId} />
              <Button type="submit" color="success" variant="soft" size="sm">
                Publish
              </Button>
            </Form>
          )}
          {canPublish && post.published && (
            <Form method="post">
              <input type="hidden" name="_action" value="unpublishPost" />
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="title" value={post.title} />
              <Button type="submit" color="warning" variant="soft" size="sm">
                Unpublish
              </Button>
            </Form>
          )}
          {canDelete && (
            <Form method="post" onSubmit={(e) => {
              if (!confirm("Are you sure you want to delete this post?")) {
                e.preventDefault();
              }
            }}>
              <input type="hidden" name="_action" value="deletePost" />
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="title" value={post.title} />
              <input type="hidden" name="slug" value={post.slug} />
              <Button type="submit" color="danger" variant="soft" size="sm">
                Delete
              </Button>
            </Form>
          )}
        </Stack>

        <Divider sx={{ my: 4 }} />

        {/* Comments Section */}
        <Typography level="h3" sx={{ mb: 3 }}>
          Comments
        </Typography>

        {/* Comment Form */}
        {user && post.published && (
          <Box sx={{ mb: 3 }}>
            {actionData && "error" in actionData && actionData.action === "comment" && (
              <Alert color="danger" sx={{ mb: 2 }}>
                {actionData.error}
              </Alert>
            )}
            <Form method="post" onSubmit={() => setCommentContent("")}>
              <input type="hidden" name="_action" value="addComment" />
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="postTitle" value={post.title} />
              <input type="hidden" name="postSlug" value={post.slug} />
              <input type="hidden" name="postAuthorId" value={post.authorId} />
              <input type="hidden" name="postPublished" value={String(post.published)} />
              <Stack spacing={2}>
                <Textarea
                  name="content"
                  placeholder="Write a comment..."
                  minRows={3}
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  required
                />
                <Button type="submit" size="sm" sx={{ alignSelf: "flex-end" }}>
                  Post Comment
                </Button>
              </Stack>
            </Form>
          </Box>
        )}

        {!user && post.published && (
          <Alert variant="outlined" color="neutral" sx={{ mb: 3 }}>
            <Link to="/login">Sign in</Link> to leave a comment.
          </Alert>
        )}

        {/* Comment List */}
        <Stack spacing={2}>
          {allComments.length === 0 ? (
            <Typography level="body-sm" sx={{ color: "neutral.500", textAlign: "center", py: 4 }}>
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            allComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} user={user} />
            ))
          )}
        </Stack>

        {/* Infinite scroll sentinel */}
        {hasMore && (
          <Box ref={sentinelRef} sx={{ py: 2, textAlign: "center" }}>
            {isLoadingMore ? (
              <Typography level="body-sm" sx={{ color: "neutral.500" }}>
                Loading more comments...
              </Typography>
            ) : (
              <Button variant="plain" size="sm" onClick={() => {}}>
                Loading...
              </Button>
            )}
          </Box>
        )}
      </Container>
    </>
  );
}
