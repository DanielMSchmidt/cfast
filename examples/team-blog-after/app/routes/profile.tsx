import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useActionData, Form } from "react-router";
import { useState } from "react";
import Container from "@mui/joy/Container";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Button from "@mui/joy/Button";
import Input from "@mui/joy/Input";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Alert from "@mui/joy/Alert";
import Avatar from "@mui/joy/Avatar";
import Card from "@mui/joy/Card";
import List from "@mui/joy/List";
import ListItem from "@mui/joy/ListItem";
import ListItemContent from "@mui/joy/ListItemContent";
import { useAuth } from "@cfast/auth/client";
import { requireAuthContext } from "~/auth.helpers.server";
import { createDbClient } from "~/db/client";
import { createCfDb } from "~/db/cfast.server";
import { users, passkeys } from "~/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Header } from "~/components/Header";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);
  const db = createDbClient(env.DB);

  const userPasskeys = await db
    .select({
      id: passkeys.id,
      name: passkeys.name,
      createdAt: passkeys.createdAt,
    })
    .from(passkeys)
    .where(eq(passkeys.userId, ctx.user.id));

  return { user: ctx.user, passkeys: userPasskeys };
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env;
  const ctx = await requireAuthContext(request);
  const formData = await request.formData();
  const _action = formData.get("_action") as string;

  if (_action === "updateProfile") {
    const name = (formData.get("name") as string)?.trim();
    if (!name) {
      return { error: "Name is required.", action: "updateProfile" };
    }

    const cfDb = createCfDb(env.DB, ctx);
    await cfDb.unsafe().update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, ctx.user.id)).run({});

    return { success: true, action: "updateProfile" };
  }

  if (_action === "uploadAvatar") {
    const file = formData.get("avatar") as File | null;
    if (!file || file.size === 0) {
      return { error: "No file selected.", action: "uploadAvatar" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Only JPEG, PNG, and WebP images are allowed.", action: "uploadAvatar" };
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File size must be under 2MB.", action: "uploadAvatar" };
    }

    const key = `avatars/${ctx.user.id}/${nanoid()}-${file.name}`;

    await env.UPLOADS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    if (ctx.user.avatarUrl && !ctx.user.avatarUrl.startsWith("http")) {
      const oldKey = ctx.user.avatarUrl!.replace("/api/file/", "");
      await env.UPLOADS.delete(oldKey);
    }

    const avatarUrl = `/api/file/${key}`;

    const cfDb = createCfDb(env.DB, ctx);
    await cfDb.unsafe().update(users).set({ avatarUrl, updatedAt: new Date() }).where(eq(users.id, ctx.user.id)).run({});

    return { success: true, action: "uploadAvatar" };
  }

  if (_action === "removeAvatar") {
    if (ctx.user.avatarUrl && !ctx.user.avatarUrl.startsWith("http")) {
      const key = ctx.user.avatarUrl!.replace("/api/file/", "");
      await env.UPLOADS.delete(key);
    }

    const cfDb = createCfDb(env.DB, ctx);
    await cfDb.unsafe().update(users).set({ avatarUrl: null, updatedAt: new Date() }).where(eq(users.id, ctx.user.id)).run({});

    return { success: true, action: "removeAvatar" };
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

export default function Profile() {
  const { user, passkeys: userPasskeys } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { registerPasskey, deletePasskey } = useAuth();
  const [name, setName] = useState(user.name);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [passkeySuccess, setPasskeySuccess] = useState<string | null>(null);

  async function handleAddPasskey() {
    setPasskeyLoading(true);
    setPasskeyError(null);
    setPasskeySuccess(null);
    try {
      const result = await registerPasskey();
      if (result?.error) {
        setPasskeyError(result.error.message ?? "Failed to add passkey.");
      } else {
        setPasskeySuccess("Passkey added successfully. Reload to see it in the list.");
      }
    } catch {
      setPasskeyError("Failed to add passkey. Please try again.");
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function handleDeletePasskey(passkeyId: string) {
    if (!confirm("Are you sure you want to remove this passkey?")) return;
    try {
      const result = await deletePasskey(passkeyId);
      if (result?.error) {
        setPasskeyError(result.error.message ?? "Failed to remove passkey.");
      } else {
        window.location.reload();
      }
    } catch {
      setPasskeyError("Failed to remove passkey.");
    }
  }

  return (
    <>
      <Header user={user} />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography level="h2" sx={{ mb: 3 }}>
          Profile
        </Typography>

        {/* Avatar Section */}
        <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography level="title-lg" sx={{ mb: 2 }}>
            Avatar
          </Typography>

          {actionData && "error" in actionData && actionData.action === "uploadAvatar" && (
            <Alert color="danger" sx={{ mb: 2 }}>
              {actionData.error}
            </Alert>
          )}
          {actionData && "success" in actionData && actionData.action === "uploadAvatar" && (
            <Alert color="success" sx={{ mb: 2 }}>
              Avatar updated successfully.
            </Alert>
          )}
          {actionData && "success" in actionData && actionData.action === "removeAvatar" && (
            <Alert color="success" sx={{ mb: 2 }}>
              Avatar removed.
            </Alert>
          )}

          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 2 }}>
            <Avatar
              src={user.avatarUrl ?? undefined}
              size="lg"
              sx={{ "--Avatar-size": "80px" }}
            >
              {getInitials(user.name)}
            </Avatar>

            <Stack spacing={1}>
              <Form method="post" encType="multipart/form-data">
                <input type="hidden" name="_action" value="uploadAvatar" />
                <Stack direction="row" spacing={1} alignItems="center">
                  <Input
                    type="file"
                    name="avatar"
                    size="sm"
                    slotProps={{
                      input: {
                        accept: "image/jpeg,image/png,image/webp",
                      },
                    }}
                  />
                  <Button type="submit" variant="outlined" size="sm">
                    Upload
                  </Button>
                </Stack>
              </Form>

              {user.avatarUrl && (
                <Form method="post">
                  <input type="hidden" name="_action" value="removeAvatar" />
                  <Button type="submit" variant="soft" color="danger" size="sm">
                    Remove Avatar
                  </Button>
                </Form>
              )}
            </Stack>
          </Stack>
        </Card>

        {/* Profile Form */}
        <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography level="title-lg" sx={{ mb: 2 }}>
            Profile Information
          </Typography>

          {actionData && "error" in actionData && actionData.action === "updateProfile" && (
            <Alert color="danger" sx={{ mb: 2 }}>
              {actionData.error}
            </Alert>
          )}
          {actionData && "success" in actionData && actionData.action === "updateProfile" && (
            <Alert color="success" sx={{ mb: 2 }}>
              Profile updated successfully.
            </Alert>
          )}

          <Form method="post">
            <input type="hidden" name="_action" value="updateProfile" />
            <Stack spacing={2}>
              <FormControl required>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={user.email} disabled />
              </FormControl>

              <Button type="submit" sx={{ alignSelf: "flex-start" }}>
                Update Profile
              </Button>
            </Stack>
          </Form>
        </Card>

        {/* Passkey Management */}
        <Card variant="outlined" sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography level="title-lg">Passkeys</Typography>
            <Button
              onClick={handleAddPasskey}
              loading={passkeyLoading}
              size="sm"
            >
              Add Passkey
            </Button>
          </Stack>

          {passkeyError && (
            <Alert color="danger" sx={{ mb: 2 }}>
              {passkeyError}
            </Alert>
          )}
          {passkeySuccess && (
            <Alert color="success" sx={{ mb: 2 }}>
              {passkeySuccess}
            </Alert>
          )}

          {userPasskeys.length === 0 ? (
            <Typography level="body-sm" sx={{ color: "neutral.500" }}>
              No passkeys registered. Add one for passwordless sign-in.
            </Typography>
          ) : (
            <List>
              {userPasskeys.map((pk) => (
                <ListItem
                  key={pk.id}
                  endAction={
                    <Button
                      variant="soft"
                      color="danger"
                      size="sm"
                      onClick={() => handleDeletePasskey(pk.id)}
                    >
                      Remove
                    </Button>
                  }
                >
                  <ListItemContent>
                    <Typography level="title-sm">
                      {pk.name ?? "Passkey"}
                    </Typography>
                    {pk.createdAt && (
                      <Typography level="body-xs" sx={{ color: "neutral.500" }}>
                        Added {new Date(pk.createdAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </ListItemContent>
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      </Container>
    </>
  );
}
