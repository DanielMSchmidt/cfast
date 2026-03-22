import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import Container from "@mui/joy/Container";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Chip from "@mui/joy/Chip";
import Box from "@mui/joy/Box";
import { useActions, clientDescriptor } from "@cfast/actions/client";
import { ActionButton, PermissionGate } from "@cfast/joy";
import { getUser } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { composeActions } from "~/actions.server";
import { deletePost, publishPost, unpublishPost } from "~/actions/posts";
import { posts, users } from "~/db/schema";
import { eq } from "drizzle-orm";
import { Header } from "~/components/Header";

const composed = composeActions({ deletePost, publishPost, unpublishPost });

export const action = composed.action;

const postActions = clientDescriptor(["deletePost", "publishPost", "unpublishPost"]);

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const user = await getUser(request);
  const db = createDbClient(env.DB);

  const postId = params.id;
  if (!postId) throw new Response("Not Found", { status: 404 });

  const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) throw new Response("Not Found", { status: 404 });

  const author = await db.select().from(users).where(eq(users.id, post.authorId)).get();

  return {
    post,
    author: author ? { name: author.name } : { name: "Unknown" },
    user,
  };
}

export default function PostDetail() {
  const { post, author, user } = useLoaderData<typeof loader>();
  const actions = useActions(postActions);

  return (
    <>
      <Header user={user} />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack spacing={2} sx={{ mb: 4 }}>
          {!post.published && (
            <Chip color="warning" variant="soft" size="sm" sx={{ alignSelf: "flex-start" }}>
              Draft
            </Chip>
          )}

          <Typography level="h1">{post.title}</Typography>

          <Typography level="body-sm" sx={{ color: "neutral.500" }}>
            By {author.name}
            {post.publishedAt &&
              ` — ${new Date(post.publishedAt).toLocaleDateString()}`}
          </Typography>
        </Stack>

        {/* Permission-aware action buttons */}
        <PermissionGate action={actions.deletePost({ postId: post.id })}>
          <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
            {!post.published && (
              <ActionButton
                action={actions.publishPost({ postId: post.id })}
                color="success"
                variant="soft"
                size="sm"
              >
                Publish
              </ActionButton>
            )}
            {post.published && (
              <ActionButton
                action={actions.unpublishPost({ postId: post.id })}
                color="warning"
                variant="soft"
                size="sm"
              >
                Unpublish
              </ActionButton>
            )}
            <ActionButton
              action={actions.deletePost({ postId: post.id })}
              color="danger"
              variant="soft"
              size="sm"
            >
              Delete
            </ActionButton>
          </Stack>
        </PermissionGate>

        <Box sx={{ mb: 4 }}>
          <Typography level="body-lg" sx={{ whiteSpace: "pre-wrap" }}>
            {post.content}
          </Typography>
        </Box>

        <Button component={Link} to="/posts" variant="outlined" size="sm">
          Back to Posts
        </Button>
      </Container>
    </>
  );
}
