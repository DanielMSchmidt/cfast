import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, redirect } from "react-router";
import { useState, useEffect } from "react";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Textarea from "@mui/joy/Textarea";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Alert from "@mui/joy/Alert";
import AspectRatio from "@mui/joy/AspectRatio";
import Box from "@mui/joy/Box";
import type { Env } from "~/env";
import { requireUser, hasAnyRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { posts, auditLogs } from "~/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Header } from "~/components/Header";
import { useToast } from "~/components/ToastProvider";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);
  const db = createDbClient(env.DB);

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  // Permission: author of post or editor/admin
  const isAuthor = user.id === post.authorId;
  const isEditorOrAdmin = hasAnyRole(user, ["editor", "admin"]);
  if (!isAuthor && !isEditorOrAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  return { post, user };
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);
  const db = createDbClient(env.DB);

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  // Permission: author of post or editor/admin
  const isAuthor = user.id === post.authorId;
  const isEditorOrAdmin = hasAnyRole(user, ["editor", "admin"]);
  if (!isAuthor && !isEditorOrAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "update") {
    const title = (formData.get("title") as string)?.trim();
    const content = (formData.get("content") as string)?.trim() ?? "";
    const excerpt = (formData.get("excerpt") as string)?.trim() || null;

    if (!title) {
      return { error: "Title is required.", action: "update" };
    }

    const newSlug = generateSlug(title);
    if (!newSlug) {
      return { error: "Title must contain at least one valid character.", action: "update" };
    }

    await db
      .update(posts)
      .set({
        title,
        slug: newSlug,
        content,
        excerpt,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, post.id));

    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: user.id,
      action: "post.updated",
      targetType: "post",
      targetId: post.id,
      metadata: JSON.stringify({ title, oldSlug: post.slug, newSlug }),
    });

    // Redirect to new slug if it changed
    if (newSlug !== post.slug) {
      return redirect(`/posts/${newSlug}/edit`);
    }

    return { success: true, action: "update" };
  }

  if (_action === "uploadCover") {
    const file = formData.get("cover") as File | null;
    if (!file || file.size === 0) {
      return { error: "No file selected.", action: "uploadCover" };
    }

    // Validate MIME type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Only JPEG, PNG, and WebP images are allowed.", action: "uploadCover" };
    }

    // Validate size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File size must be under 10MB.", action: "uploadCover" };
    }

    const key = `covers/${post.id}/${nanoid()}-${file.name}`;

    await env.UPLOADS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    // Delete old cover if exists
    if (post.coverImageKey) {
      await env.UPLOADS.delete(post.coverImageKey);
    }

    await db
      .update(posts)
      .set({ coverImageKey: key, updatedAt: new Date() })
      .where(eq(posts.id, post.id));

    return { success: true, action: "uploadCover" };
  }

  if (_action === "removeCover") {
    if (post.coverImageKey) {
      await env.UPLOADS.delete(post.coverImageKey);
    }

    await db
      .update(posts)
      .set({ coverImageKey: null, updatedAt: new Date() })
      .where(eq(posts.id, post.id));

    return { success: true, action: "removeCover" };
  }

  throw new Response("Bad Request", { status: 400 });
}

export default function EditPost() {
  const { post, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { addToast } = useToast();
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [content, setContent] = useState(post.content);

  useEffect(() => {
    if (!actionData) return;
    if ("success" in actionData) {
      switch (actionData.action) {
        case "update":
          addToast("Post updated successfully!");
          break;
        case "uploadCover":
          addToast("Cover image uploaded!");
          break;
        case "removeCover":
          addToast("Cover image removed.", "warning");
          break;
      }
    } else if ("error" in actionData) {
      addToast(actionData.error, "error");
    }
  }, [actionData, addToast]);

  return (
    <>
      <Header user={user} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography level="h2" sx={{ mb: 3 }}>
          Edit Post
        </Typography>

        {/* Update Form */}
        {actionData && "error" in actionData && actionData.action === "update" && (
          <Alert color="danger" sx={{ mb: 2 }}>
            {actionData.error}
          </Alert>
        )}
        {actionData && "success" in actionData && actionData.action === "update" && (
          <Alert color="success" sx={{ mb: 2 }}>
            Post updated successfully.
          </Alert>
        )}

        <Form method="post">
          <input type="hidden" name="_action" value="update" />
          <Stack spacing={3} sx={{ mb: 4 }}>
            <FormControl required>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="lg"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Excerpt</FormLabel>
              <Textarea
                name="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                minRows={2}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Content</FormLabel>
              <Textarea
                name="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                minRows={12}
              />
            </FormControl>

            <Button type="submit" size="lg" sx={{ alignSelf: "flex-start" }}>
              Save Changes
            </Button>
          </Stack>
        </Form>

        {/* Cover Image Section */}
        <Typography level="h3" sx={{ mb: 2 }}>
          Cover Image
        </Typography>

        {actionData && "error" in actionData && actionData.action === "uploadCover" && (
          <Alert color="danger" sx={{ mb: 2 }}>
            {actionData.error}
          </Alert>
        )}
        {actionData && "success" in actionData && actionData.action === "uploadCover" && (
          <Alert color="success" sx={{ mb: 2 }}>
            Cover image uploaded successfully.
          </Alert>
        )}
        {actionData && "success" in actionData && actionData.action === "removeCover" && (
          <Alert color="success" sx={{ mb: 2 }}>
            Cover image removed.
          </Alert>
        )}

        {post.coverImageKey && (
          <Box sx={{ mb: 2 }}>
            <AspectRatio ratio="16/9" sx={{ maxWidth: 600, borderRadius: "md", overflow: "hidden" }}>
              <img src={`/api/file/${post.coverImageKey}`} alt="Cover" />
            </AspectRatio>
          </Box>
        )}

        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <Form method="post" encType="multipart/form-data">
            <input type="hidden" name="_action" value="uploadCover" />
            <Stack direction="row" spacing={1} alignItems="center">
              <Input
                type="file"
                name="cover"
                slotProps={{
                  input: {
                    accept: "image/jpeg,image/png,image/webp",
                  },
                }}
              />
              <Button type="submit" variant="outlined" size="sm">
                Upload Cover
              </Button>
            </Stack>
          </Form>

          {post.coverImageKey && (
            <Form method="post">
              <input type="hidden" name="_action" value="removeCover" />
              <Button type="submit" variant="soft" color="danger" size="sm">
                Remove Cover
              </Button>
            </Form>
          )}
        </Stack>
      </Container>
    </>
  );
}
