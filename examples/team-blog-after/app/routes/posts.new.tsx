import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
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
import { requireAuthContext, hasAnyRole } from "~/auth.helpers.server";
import { createCfDb } from "~/db/cfast.server";
import { compose } from "@cfast/db";
import { posts, auditLogs } from "~/db/schema";
import { nanoid } from "nanoid";
import { Header } from "~/components/Header";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function loader({ request }: LoaderFunctionArgs) {
  const ctx = await requireAuthContext(request);
  if (!hasAnyRole(ctx.user, ["admin", "editor", "author"])) {
    throw redirect("/");
  }
  return { user: ctx.user };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);
  if (!hasAnyRole(ctx.user, ["admin", "editor", "author"])) {
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

  const cfDb = createCfDb(env.DB, ctx);

  const postId = nanoid();

  const op = compose(
    [
      cfDb.insert(posts).values({
        id: postId,
        title,
        slug,
        content,
        excerpt,
        authorId: ctx.user.id,
        published: false,
      }),
      cfDb.unsafe().insert(auditLogs).values({
        id: nanoid(),
        userId: ctx.user.id,
        action: "post.created",
        targetType: "post",
        targetId: postId,
        metadata: JSON.stringify({ title, slug }),
      }),
    ],
    async (runInsertPost, runInsertAudit) => {
      await runInsertPost({});
      await runInsertAudit({});
    },
  );

  await op.run({});

  return redirect(`/posts/${slug}/edit`);
}

export default function NewPost() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  return (
    <>
      <Header user={user} />
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
