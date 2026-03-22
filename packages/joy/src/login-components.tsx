import type { ReactNode } from "react";
import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import Alert from "@mui/joy/Alert";
import Divider from "@mui/joy/Divider";

function Layout({ children }: { children: ReactNode }) {
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
        {children}
      </Card>
    </Box>
  );
}

function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <Input
      type="email"
      placeholder="you@example.com"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      size="lg"
    />
  );
}

function MagicLinkButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      size="lg"
      fullWidth
    >
      Send Magic Link
    </Button>
  );
}

function PasskeyButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <>
      <Divider>or</Divider>
      <Button
        variant="outlined"
        color="neutral"
        onClick={onClick}
        loading={loading}
        size="lg"
        fullWidth
      >
        Sign in with Passkey
      </Button>
    </>
  );
}

function SuccessMessage({ email }: { email: string }) {
  return (
    <Alert color="success">
      Check your email ({email}) for a magic link. Click the link to sign in.
    </Alert>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return (
    <Alert color="danger" sx={{ mb: 2 }}>
      {error}
    </Alert>
  );
}

/**
 * Joy UI slot components for `<LoginPage>` from `@cfast/auth/client`.
 *
 * Usage:
 * ```tsx
 * import { LoginPage } from "@cfast/auth/client";
 * import { joyLoginComponents } from "@cfast/joy";
 *
 * <LoginPage authClient={authClient} components={joyLoginComponents} />
 * ```
 *
 * Override individual slots while keeping the rest:
 * ```tsx
 * <LoginPage components={{ ...joyLoginComponents, Layout: MyLayout }} />
 * ```
 */
export const joyLoginComponents = {
  Layout,
  EmailInput,
  MagicLinkButton,
  PasskeyButton,
  SuccessMessage,
  ErrorMessage,
};
