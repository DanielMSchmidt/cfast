import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form, useSubmit, redirect } from "react-router";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import Alert from "@mui/joy/Alert";
import AspectRatio from "@mui/joy/AspectRatio";
import Box from "@mui/joy/Box";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import FormHelperText from "@mui/joy/FormHelperText";
import Textarea from "@mui/joy/Textarea";
import { requireAuthContext, hasAnyRole } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { createCfDb } from "~/db/cfast.server";
import { compose } from "@cfast/db";
import { posts, auditLogs } from "~/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Header } from "~/components/Header";
import { AutoForm } from "@cfast/forms/joy";
import type { FieldComponentProps } from "@cfast/forms";

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
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);
  const db = createDbClient(env.DB);

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  // Permission: author of post or editor/admin
  const isAuthor = ctx.user.id === post.authorId;
  const isEditorOrAdmin = hasAnyRole(ctx.user, ["editor", "admin"]);
  if (!isAuthor && !isEditorOrAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }

  return { post, user: ctx.user };
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);
  const db = createDbClient(env.DB);

  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

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

    const cfDb = createCfDb(env.DB, ctx);

    const op = compose(
      [
        cfDb.update(posts).set({
          title,
          slug: newSlug,
          content,
          excerpt,
          updatedAt: new Date(),
        }).where(eq(posts.id, post.id)),
        cfDb.insert(auditLogs).values({
          id: nanoid(),
          userId: ctx.user.id,
          action: "post.updated",
          targetType: "post",
          targetId: post.id,
          metadata: JSON.stringify({ title, oldSlug: post.slug, newSlug }),
        }),
      ],
      async (runUpdate, runAudit) => {
        await runUpdate({});
        await runAudit({});
      },
    );

    await op.run({});

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

    const cfDb = createCfDb(env.DB, ctx);
    await cfDb.update(posts).set({ coverImageKey: key, updatedAt: new Date() }).where(eq(posts.id, post.id)).run({});

    return { success: true, action: "uploadCover" };
  }

  if (_action === "removeCover") {
    if (post.coverImageKey) {
      await env.UPLOADS.delete(post.coverImageKey);
    }

    const cfDb = createCfDb(env.DB, ctx);
    await cfDb.update(posts).set({ coverImageKey: null, updatedAt: new Date() }).where(eq(posts.id, post.id)).run({});

    return { success: true, action: "removeCover" };
  }

  throw new Response("Bad Request", { status: 400 });
}

function TextareaField({ name, label, placeholder, required, error, register }: FieldComponentProps) {
  return (
    <FormControl required={required} error={!!error}>
      <FormLabel>{label}</FormLabel>
      <Textarea {...register(name)} placeholder={placeholder} minRows={name === "content" ? 12 : 2} />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}

export default function EditPost() {
  const { post, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();

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

        <Box sx={{ mb: 4 }}>
          <AutoForm
            table={posts}
            mode="edit"
            data={post}
            exclude={["id", "slug", "authorId", "published", "publishedAt", "coverImageKey", "createdAt", "updatedAt"]}
            fields={{
              content: { component: TextareaField },
              excerpt: { component: TextareaField },
            }}
            onSubmit={async (values) => {
              const formData = new FormData();
              formData.set("_action", "update");
              for (const [key, value] of Object.entries(values)) {
                if (value != null) {
                  formData.set(key, String(value));
                }
              }
              submit(formData, { method: "POST" });
            }}
          />
        </Box>

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
