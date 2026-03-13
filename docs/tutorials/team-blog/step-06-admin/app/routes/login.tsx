import { useState } from "react";
import Container from "@mui/joy/Container";
import Typography from "@mui/joy/Typography";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import Stack from "@mui/joy/Stack";
import Alert from "@mui/joy/Alert";
import { authClient } from "~/auth.client";
import { Header } from "~/components/Header";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await authClient.signIn.magicLink({ email });
    if (result.error) {
      setError(result.error.message ?? "Failed to send magic link.");
    } else {
      setSent(true);
    }
  }

  return (
    <>
      <Header user={null} />
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Typography level="h2" sx={{ mb: 3 }}>
          Sign In
        </Typography>

        {sent ? (
          <Alert color="success">Check your email for a magic link.</Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              {error && <Alert color="danger">{error}</Alert>}
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit">Send Magic Link</Button>
            </Stack>
          </form>
        )}
      </Container>
    </>
  );
}
