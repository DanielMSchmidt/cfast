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
import { can } from "@cfast/permissions";
import { composeSequential } from "@cfast/db";
import { nanoid } from "nanoid";
import { app } from "~/cfast.server";
import { posts } from "~/db/schema";
import { Header } from "~/components/Header";
import { generateSlug } from "~/utils";
import { auditLog } from "~/utils.server";

export const loader = app.loader(async (ctx) => {
  if (!ctx.auth.user) throw redirect("/login");
  const grants = ctx.auth.grants;
  if (!can(grants, "create", posts)) throw redirect("/");
  return {
    user: ctx.auth.user,
    canCreatePost: true, // guard above ensures this
    canAdmin: can(grants, "manage", "all"),
  };
});

export const action = app.action(async (ctx, { request }) => {
  const user = ctx.auth.user;
  if (!user || !can(ctx.auth.grants, "create", posts)) {
    throw redirect("/");
  }

  const formData = await request.formData();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim() ?? "";
  const excerpt = (formData.get("excerpt") as string)?.trim() || null;

  if (!title) {
    return { error: "Title is required." };
  }

  const slug = generateSlug(title);
  if (!slug) {
    return { error: "Title must contain at least one valid character." };
  }

  const db = ctx.db.client;
  const postId = nanoid();

  await composeSequential([
    db.insert(posts).values({
      id: postId,
      title,
      slug,
      content,
      excerpt,
      authorId: user.id,
      published: false,
    }),
    auditLog(db, user.id, "post.created", { type: "post", id: postId }, { title, slug }),
  ]).run();

  return redirect(`/posts/${slug}/edit`);
});

export default function NewPost() {
  const { user, canCreatePost, canAdmin } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  return (
    <>
      <Header user={user} canCreatePost={canCreatePost} canAdmin={canAdmin} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography level="h2" sx={{ mb: 3 }}>
          New Post
        </Typography>

        {actionData && "error" in actionData && (
          <Alert color="danger" sx={{ mb: 2 }}>
            {actionData.error}
          </Alert>
        )}

        <Form method="post">
          <Stack spacing={3}>
            <FormControl required>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                placeholder="Enter post title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                size="lg"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Excerpt</FormLabel>
              <Textarea
                name="excerpt"
                placeholder="A brief summary of your post..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                minRows={2}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Content</FormLabel>
              <Textarea
                name="content"
                placeholder="Write your post content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                minRows={12}
              />
            </FormControl>

            <Button type="submit" size="lg" sx={{ alignSelf: "flex-start" }}>
              Create Post
            </Button>
          </Stack>
        </Form>
      </Container>
    </>
  );
}
