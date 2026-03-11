import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";
import { useState } from "react";
import Card from "@mui/joy/Card";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import Typography from "@mui/joy/Typography";
import Stack from "@mui/joy/Stack";
import Alert from "@mui/joy/Alert";
import Divider from "@mui/joy/Divider";
import Box from "@mui/joy/Box";
import { getUser } from "~/auth.helpers.server";
import { authClient } from "~/auth.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) throw redirect("/");
  return {};
}

export default function Login() {
  useLoaderData<typeof loader>();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.magicLink({ email });
      if (result.error) {
        setError(result.error.message ?? "Failed to send magic link.");
      } else {
        setSent(true);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskey() {
    setPasskeyLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.passkey();
      if (result?.error) {
        setError(result.error.message ?? "Passkey sign-in failed.");
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError("Passkey sign-in failed. Please try again.");
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        bgcolor: "background.surface",
      }}
    >
      <Card variant="outlined" sx={{ maxWidth: 400, width: "100%", p: 4 }}>
        <Typography level="h3" sx={{ textAlign: "center", mb: 1 }}>
          Sign In
        </Typography>
        <Typography level="body-sm" sx={{ textAlign: "center", mb: 3, color: "neutral.500" }}>
          Sign in to Team Blog
        </Typography>

        {error && (
          <Alert color="danger" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {sent ? (
          <Alert color="success">
            Check your email for a magic link. Click the link to sign in.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <form onSubmit={handleMagicLink}>
              <Stack spacing={2}>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="lg"
                />
                <Button type="submit" loading={loading} size="lg" fullWidth>
                  Send Magic Link
                </Button>
              </Stack>
            </form>

            <Divider>or</Divider>

            <Button
              variant="outlined"
              color="neutral"
              onClick={handlePasskey}
              loading={passkeyLoading}
              size="lg"
              fullWidth
            >
              Sign in with Passkey
            </Button>
          </Stack>
        )}
      </Card>
    </Box>
  );
}
