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
import FormHelperText from "@mui/joy/FormHelperText";
import Alert from "@mui/joy/Alert";
import type { Env } from "~/env";
import { requireUser, hasAnyRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
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

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);
  if (!hasAnyRole(user, ["admin", "editor", "author"])) {
    throw redirect("/");
  }
  return { user };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);
  if (!hasAnyRole(user, ["admin", "editor", "author"])) {
    throw redirect("/");
  }

  const db = createDbClient(env.DB);
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

  const postId = nanoid();

  await db.insert(posts).values({
    id: postId,
    title,
    slug,
    content,
    excerpt,
    authorId: user.id,
    published: false,
  });

  await db.insert(auditLogs).values({
    id: nanoid(),
    userId: user.id,
    action: "post.created",
    targetType: "post",
    targetId: postId,
    metadata: JSON.stringify({ title, slug }),
  });

  return redirect(`/posts/${slug}/edit`);
}

type FieldErrors = {
  title?: string;
  excerpt?: string;
};

export default function NewPost() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(field: string, value: string): string | undefined {
    if (field === "title") {
      if (!value.trim()) return "Title is required.";
      if (value.trim().length < 3) return "Title must be at least 3 characters.";
      if (value.trim().length > 200) return "Title must be under 200 characters.";
    }
    if (field === "excerpt") {
      if (value.length > 300) return "Excerpt must be under 300 characters.";
    }
    return undefined;
  }

  function handleBlur(field: string, value: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const titleError = validate("title", title);
    const excerptError = validate("excerpt", excerpt);
    const newErrors: FieldErrors = {};
    if (titleError) newErrors.title = titleError;
    if (excerptError) newErrors.excerpt = excerptError;

    if (Object.keys(newErrors).length > 0) {
      e.preventDefault();
      setErrors(newErrors);
      setTouched({ title: true, excerpt: true });
    }
  }

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

        <Form method="post" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <FormControl required error={touched.title && !!errors.title}>
              <FormLabel>Title</FormLabel>
              <Input
                name="title"
                placeholder="Enter post title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (touched.title) {
                    setErrors((prev) => ({ ...prev, title: validate("title", e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur("title", title)}
                size="lg"
              />
              {touched.title && errors.title && (
                <FormHelperText sx={{ color: "danger.plainColor" }}>{errors.title}</FormHelperText>
              )}
            </FormControl>

            {title.trim() && (
              <Typography level="body-xs" sx={{ color: "neutral.500", mt: -2 }}>
                Slug preview: {generateSlug(title)}
              </Typography>
            )}

            <FormControl error={touched.excerpt && !!errors.excerpt}>
              <FormLabel>Excerpt</FormLabel>
              <Textarea
                name="excerpt"
                placeholder="A brief summary of your post..."
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  if (touched.excerpt) {
                    setErrors((prev) => ({ ...prev, excerpt: validate("excerpt", e.target.value) }));
                  }
                }}
                onBlur={() => handleBlur("excerpt", excerpt)}
                minRows={2}
              />
              {touched.excerpt && errors.excerpt && (
                <FormHelperText sx={{ color: "danger.plainColor" }}>{errors.excerpt}</FormHelperText>
              )}
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
