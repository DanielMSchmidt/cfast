import { useLoaderData, useActionData, useFetcher } from "react-router";
import { useState, useEffect, useCallback, useRef } from "react";
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
import { useActions, clientDescriptor } from "@cfast/actions/client";
import { ActionForm } from "@cfast/actions/client";
import { ActionButton } from "@cfast/joy";
import { can } from "@cfast/permissions";
import { app } from "~/cfast.server";
import { posts, users, comments } from "~/db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
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
import { getInitials, formatDate } from "~/utils";
import { Link } from "react-router";

const composedClient = clientDescriptor([
  "deletePost",
  "publishPost",
  "unpublishPost",
  "addComment",
  "deleteComment",
]);

export const action = composeActions({
  deletePost,
  publishPost,
  unpublishPost,
  addComment,
  deleteComment,
}).action;

export const loader = app.loader(async (ctx, { params, request }) => {
  const db = ctx.db.raw;
  const cfDb = ctx.db.client;
  const user = ctx.auth.user;
  const grants = ctx.auth.grants;

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  // Permission check: if not published, only allow author/editor/admin
  if (!post.published) {
    if (!user) throw new Response("Not Found", { status: 404 });
    const isAuthor = user.id === post.authorId;
    if (!isAuthor && !can(grants, "update", posts)) {
      throw new Response("Not Found", { status: 404 });
    }
  }

  // Get author info
  const author = await db.select().from(users).where(eq(users.id, post.authorId)).get();

  // Cursor-based comments — use @cfast/db for row-level _can annotations.
  // Anonymous users have no grants, so use unsafe() to bypass permission checks;
  // comments on a published post are publicly visible.
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const commentWhere = cursor
    ? and(eq(comments.postId, post.id), lt(comments.id, cursor))
    : eq(comments.postId, post.id);

  type CommentRow = {
    id: string;
    content: string;
    createdAt: Date;
    authorId: string;
    _can: Record<string, boolean>;
    author: { id: string; name: string; avatarUrl: string | null } | null;
  };

  const commentDb = user ? cfDb : cfDb.unsafe();
  const rawComments = await commentDb.query(comments).findMany({
    where: commentWhere,
    with: { author: true },
    orderBy: desc(comments.createdAt),
    limit: 21,
  }).run() as unknown as CommentRow[];

  const hasMore = rawComments.length > 20;
  const displayComments = rawComments.slice(0, 20);
  const nextCursor = hasMore ? displayComments[displayComments.length - 1].id : null;

  const formattedComments = displayComments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    _can: c._can ?? { read: false, create: false, update: false, delete: false },
    author: {
      id: c.author?.id ?? c.authorId,
      name: c.author?.name ?? "Unknown",
      avatarUrl: c.author?.avatarUrl ?? null,
    },
  }));

  // Pre-compute permission booleans on the server where grants have Drizzle
  // table metadata intact. Grants don't survive serialization (Symbols are lost).
  const isAuthor = user?.id === post.authorId;
  const canEdit = isAuthor || can(grants, "update", posts);
  // Authors can delete own posts (isAuthor check). Editors/admins have
  // unrestricted delete grants (no where clause).
  const canDelete = isAuthor || grants.some(
    (g) => (g.action === "delete" || g.action === "manage") &&
           (g.subject === "all" || !g.where),
  );
  // Publishing is a content-moderation action — requires unrestricted
  // update (editor+), not just "can update own posts" (author).
  const canPublish = grants.some(
    (g) => (g.action === "update" || g.action === "manage") && !g.where,
  );
  const canCreatePost = can(grants, "create", posts);
  const canAdmin = can(grants, "manage", "all");

  return {
    post,
    author: author
      ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl }
      : { id: post.authorId, name: "Unknown", avatarUrl: null },
    comments: formattedComments,
    nextCursor,
    user,
    canEdit,
    canDelete,
    canPublish,
    canCreatePost,
    canAdmin,
  };
});

function useInfiniteComments(
  initialComments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    _can: Record<string, boolean>;
    author: { id: string; name: string; avatarUrl: string | null };
  }>,
  initialCursor: string | null,
  slug: string
) {
  const [allComments, setAllComments] = useState(initialComments);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const fetcher = useFetcher();
  const loadingRef = useRef(false);

  useEffect(() => {
    setAllComments(initialComments);
    setCursor(initialCursor);
  }, [initialComments, initialCursor]);

  useEffect(() => {
    if (fetcher.data && loadingRef.current) {
      const data = fetcher.data as {
        comments: typeof initialComments;
        nextCursor: string | null;
      };
      setAllComments((prev) => [...prev, ...data.comments]);
      setCursor(data.nextCursor);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [fetcher.data]);

  const loadMore = useCallback(() => {
    if (!cursor || isLoadingMore || loadingRef.current) return;
    setIsLoadingMore(true);
    loadingRef.current = true;
    fetcher.load(`/posts/${slug}?cursor=${cursor}`);
  }, [cursor, isLoadingMore, slug, fetcher]);

  const hasMore = cursor !== null;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            loadMore();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasMore, isLoadingMore, loadMore]
  );

  return { allComments, hasMore, isLoadingMore, loadMore, sentinelRef };
}

export default function PostDetail() {
  const {
    post, author, comments: initialComments, nextCursor, user,
    canEdit, canDelete, canPublish, canCreatePost, canAdmin,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as
    | { success: boolean; action: string }
    | { error: string; action: string }
    | undefined;

  const { allComments, hasMore, isLoadingMore, sentinelRef } = useInfiniteComments(
    initialComments,
    nextCursor,
    post.slug
  );

  const [commentContent, setCommentContent] = useState("");
  const actions = useActions(composedClient);

  return (
    <>
      <Header user={user} canCreatePost={canCreatePost} canAdmin={canAdmin} />
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
            <ActionButton
              action={actions.publishPost({ postId: post.id, title: post.title, slug: post.slug, authorId: post.authorId })}
              color="success"
              variant="soft"
              size="sm"
            >
              Publish
            </ActionButton>
          )}
          {canPublish && post.published && (
            <ActionButton
              action={actions.unpublishPost({ postId: post.id, title: post.title })}
              color="warning"
              variant="soft"
              size="sm"
            >
              Unpublish
            </ActionButton>
          )}
          {canDelete && (
            <ActionButton
              action={{
                ...actions.deletePost({ postId: post.id, title: post.title, slug: post.slug }),
                submit: () => {
                  if (confirm("Are you sure you want to delete this post?")) {
                    actions.deletePost({ postId: post.id, title: post.title, slug: post.slug }).submit();
                  }
                },
              }}
              color="danger"
              variant="soft"
              size="sm"
            >
              Delete
            </ActionButton>
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
            <ActionForm
              action={{
                _action: "addComment",
                postId: post.id,
                postTitle: post.title,
                postSlug: post.slug,
                postAuthorId: post.authorId,
                postPublished: String(post.published),
              }}
              method="post"
              onSubmit={() => setCommentContent("")}
            >
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
            </ActionForm>
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
