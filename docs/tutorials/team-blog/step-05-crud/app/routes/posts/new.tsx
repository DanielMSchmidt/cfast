import type { ActionFunctionArgs } from "react-router";
import { useActionData, redirect } from "react-router";
import Container from "@mui/joy/Container";
import Typography from "@mui/joy/Typography";
import Alert from "@mui/joy/Alert";
import { AutoForm } from "@cfast/forms/joy";
import { requireAuthContext } from "~/auth.helpers.server";
import { createCfDb } from "~/db/cfast.server";
import { posts } from "~/db/schema";
import { nanoid } from "nanoid";
import { Header } from "~/components/Header";
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

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
  return { user: ctx.user };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);

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

  await cfDb
    .insert(posts)
    .values({
      id: postId,
      title,
      slug,
      content,
      excerpt,
      authorId: ctx.user.id,
      published: false,
    })
    .run({});

  return redirect(`/posts/${postId}`);
}

export default function NewPost() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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

        <AutoForm
          table={posts}
          mode="create"
          fields={{
            id: { hidden: true },
            authorId: { hidden: true },
            slug: { hidden: true },
            published: { hidden: true },
            publishedAt: { hidden: true },
            createdAt: { hidden: true },
            updatedAt: { hidden: true },
            title: { label: "Title", placeholder: "Enter post title..." },
            excerpt: { label: "Excerpt", placeholder: "A brief summary..." },
            content: { label: "Content", placeholder: "Write your post content..." },
          }}
          exclude={["id", "authorId", "slug", "published", "publishedAt", "createdAt", "updatedAt"]}
          onSubmit={() => {}}
        />
      </Container>
    </>
  );
}
