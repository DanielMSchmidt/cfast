import { useLoaderData, useActionData, Form, redirect } from "react-router";
import { useState } from "react";
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
import { can } from "@cfast/permissions";
import { composeSequential } from "@cfast/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { app } from "~/cfast.server";
import { posts } from "~/db/schema";
import { Header } from "~/components/Header";
import { generateSlug } from "~/utils";
import { auditLog } from "~/utils.server";

export const loader = app.loader(async (ctx, { params }) => {
  const db = ctx.db.raw;
  const user = ctx.auth.user;

  if (!user) throw new Response("Unauthorized", { status: 401 });

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  const isAuthor = user.id === post.authorId;
  if (!isAuthor && !can(ctx.auth.grants, "update", posts)) {
    throw new Response("Forbidden", { status: 403 });
  }

  return { post, user };
});

export const action = app.action(async (ctx, { params }) => {
  const user = ctx.auth.user;
  if (!user) throw new Response("Unauthorized", { status: 401 });

  const db = ctx.db.raw;
  const cfDb = ctx.db.client;

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  const formData = await ctx.request.formData();
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

    await composeSequential([
      cfDb.update(posts).set({
        title,
        slug: newSlug,
        content,
        excerpt,
        updatedAt: new Date(),
      }).where(eq(posts.id, post.id)),
      auditLog(cfDb, user.id, "post.updated", { type: "post", id: post.id }, { title, oldSlug: post.slug, newSlug }),
    ]).run();

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

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Only JPEG, PNG, and WebP images are allowed.", action: "uploadCover" };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File size must be under 10MB.", action: "uploadCover" };
    }

    const key = `covers/${post.id}/${nanoid()}-${file.name}`;
    const env = ctx.env;

    await (env.UPLOADS as R2Bucket).put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    if (post.coverImageKey) {
      await (env.UPLOADS as R2Bucket).delete(post.coverImageKey);
    }

    await cfDb.update(posts).set({ coverImageKey: key, updatedAt: new Date() }).where(eq(posts.id, post.id)).run();

    return { success: true, action: "uploadCover" };
  }

  if (_action === "removeCover") {
    if (post.coverImageKey) {
      await (ctx.env.UPLOADS as R2Bucket).delete(post.coverImageKey);
    }

    await cfDb.update(posts).set({ coverImageKey: null, updatedAt: new Date() }).where(eq(posts.id, post.id)).run();

    return { success: true, action: "removeCover" };
  }

  throw new Response("Bad Request", { status: 400 });
});

export default function EditPost() {
  const { post, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [content, setContent] = useState(post.content);

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
