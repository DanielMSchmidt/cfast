import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, Link, useFetcher, redirect } from "react-router";
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
import { getUser, requireUser } from "~/auth.helpers.server";
import { hasRole, hasAnyRole } from "~/permissions";
import type { AuthUser } from "~/permissions";
import { createDbClient } from "~/db/client";
import { posts, users, comments, auditLogs } from "~/db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Header } from "~/components/Header";
import { CommentItem } from "~/components/CommentItem";
import { sendPostPublishedEmail, sendNewCommentEmail } from "~/email/send";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(request, env);
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

  // Cursor-based comments: get URL cursor param
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  let commentQuery = db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
      authorAvatarUrl: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(
      cursor
        ? and(eq(comments.postId, post.id), lt(comments.id, cursor))
        : eq(comments.postId, post.id)
    )
    .orderBy(desc(comments.createdAt))
    .limit(21);

  const rawComments = await commentQuery;

  const hasMore = rawComments.length > 20;
  const displayComments = rawComments.slice(0, 20);
  const nextCursor = hasMore ? displayComments[displayComments.length - 1].id : null;

  const formattedComments = displayComments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt,
    author: {
      id: c.authorId,
      name: c.authorName ?? "Unknown",
      avatarUrl: c.authorAvatarUrl ?? null,
    },
  }));

  return {
    post,
    author: author
      ? { id: author.id, name: author.name, avatarUrl: author.avatarUrl }
      : { id: post.authorId, name: "Unknown", avatarUrl: null },
    comments: formattedComments,
    nextCursor,
    user,
  };
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const db = createDbClient(env.DB);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  if (_action === "delete") {
    const user = await requireUser(request, env);
    const isAuthor = user.id === post.authorId;
    const isAdmin = hasRole(user, "admin");
    if (!isAuthor && !isAdmin) {
      throw new Response("Forbidden", { status: 403 });
    }

    await db.delete(posts).where(eq(posts.id, post.id));

    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: user.id,
      action: "post.deleted",
      targetType: "post",
      targetId: post.id,
      metadata: JSON.stringify({ title: post.title, slug: post.slug }),
    });

    return redirect("/");
  }

  if (_action === "publish") {
    const user = await requireUser(request, env);
    if (!hasAnyRole(user, ["editor", "admin"])) {
      throw new Response("Forbidden", { status: 403 });
    }

    await db
      .update(posts)
      .set({ published: true, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(posts.id, post.id));

    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: user.id,
      action: "post.published",
      targetType: "post",
      targetId: post.id,
      metadata: JSON.stringify({ title: post.title }),
    });

    await sendPostPublishedEmail(env, {
      title: post.title,
      slug: post.slug,
      authorId: post.authorId,
    });

    return { success: true, action: "publish" };
  }

  if (_action === "unpublish") {
    const user = await requireUser(request, env);
    if (!hasAnyRole(user, ["editor", "admin"])) {
      throw new Response("Forbidden", { status: 403 });
    }

    await db
      .update(posts)
      .set({ published: false, updatedAt: new Date() })
      .where(eq(posts.id, post.id));

    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: user.id,
      action: "post.unpublished",
      targetType: "post",
      targetId: post.id,
      metadata: JSON.stringify({ title: post.title }),
    });

    return { success: true, action: "unpublish" };
  }

  if (_action === "comment") {
    const user = await requireUser(request, env);

    if (!post.published) {
      throw new Response("Cannot comment on unpublished posts", { status: 400 });
    }

    const content = (formData.get("content") as string)?.trim();
    if (!content) {
      return { error: "Comment content cannot be empty.", action: "comment" };
    }

    await db.insert(comments).values({
      id: nanoid(),
      postId: post.id,
      authorId: user.id,
      content,
    });

    await sendNewCommentEmail(
      env,
      { id: post.id, title: post.title, slug: post.slug, authorId: post.authorId },
      { name: user.name },
      content
    );

    return { success: true, action: "comment" };
  }

  if (_action === "deleteComment") {
    const user = await requireUser(request, env);
    const commentId = formData.get("commentId") as string;
    if (!commentId) throw new Response("Bad Request", { status: 400 });

    const comment = await db.select().from(comments).where(eq(comments.id, commentId)).get();
    if (!comment) throw new Response("Not Found", { status: 404 });

    const isCommentAuthor = user.id === comment.authorId;
    const isEditorOrAdmin = hasAnyRole(user, ["editor", "admin"]);
    if (!isCommentAuthor && !isEditorOrAdmin) {
      throw new Response("Forbidden", { status: 403 });
    }

    await db.delete(comments).where(eq(comments.id, commentId));

    return { success: true, action: "deleteComment" };
  }

  throw new Response("Bad Request", { status: 400 });
}

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

function useInfiniteComments(
  initialComments: Array<{
    id: string;
    content: string;
    createdAt: Date;
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

  // Reset when initial data changes (e.g. after action)
  useEffect(() => {
    setAllComments(initialComments);
    setCursor(initialCursor);
  }, [initialComments, initialCursor]);

  // Process fetcher data when it arrives
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

  // Intersection observer for infinite scroll
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
  const { post, author, comments: initialComments, nextCursor, user } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const { allComments, hasMore, isLoadingMore, sentinelRef } = useInfiniteComments(
    initialComments,
    nextCursor,
    post.slug
  );

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
              <input type="hidden" name="_action" value="publish" />
              <Button type="submit" color="success" variant="soft" size="sm">
                Publish
              </Button>
            </Form>
          )}
          {canPublish && post.published && (
            <Form method="post">
              <input type="hidden" name="_action" value="unpublish" />
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
              <input type="hidden" name="_action" value="delete" />
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
              <input type="hidden" name="_action" value="comment" />
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
