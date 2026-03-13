import { useState } from "react";
import type { ReactNode } from "react";
import type { LoginPageProps } from "./types";

function DefaultLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 400, width: "100%", padding: 32 }}>
        {children}
      </div>
    </div>
  );
}

function DefaultEmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <input
      type="email"
      placeholder="you@example.com"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
    />
  );
}

function DefaultMagicLinkButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{ width: "100%", padding: 8 }}
    >
      {loading ? "Sending..." : "Send Magic Link"}
    </button>
  );
}

function DefaultPasskeyButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{ width: "100%", padding: 8 }}
    >
      {loading ? "Verifying..." : "Sign in with Passkey"}
    </button>
  );
}

function DefaultSuccessMessage({ email }: { email: string }) {
  return (
    <div role="status">
      Check your email ({email}) for a magic link to sign in.
    </div>
  );
}

function DefaultErrorMessage({ error }: { error: string }) {
  return (
    <div role="alert" style={{ color: "red" }}>
      {error}
    </div>
  );
}

export function LoginPage({
  authClient,
  components = {},
  title = "Sign In",
  subtitle,
  onSuccess,
}: LoginPageProps) {
  const Layout = components.Layout ?? DefaultLayout;
  const EmailInput = components.EmailInput ?? DefaultEmailInput;
  const MagicLinkBtn = components.MagicLinkButton ?? DefaultMagicLinkButton;
  const PasskeyBtn = components.PasskeyButton ?? DefaultPasskeyButton;
  const SuccessMsg = components.SuccessMessage ?? DefaultSuccessMessage;
  const ErrorMsg = components.ErrorMessage ?? DefaultErrorMessage;

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  async function handleMagicLink() {
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
        onSuccess?.();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasskey() {
    setPasskeyLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.passkey?.();
      if (result?.error) {
        setError(result.error.message ?? "Passkey sign-in failed.");
      } else {
        onSuccess?.();
      }
    } catch {
      setError("Passkey sign-in failed. Please try again.");
    } finally {
      setPasskeyLoading(false);
    }
  }

  return (
    <Layout>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}

      {error && <ErrorMsg error={error} />}

      {sent ? (
        <SuccessMsg email={email} />
      ) : (
        <div>
          <EmailInput value={email} onChange={setEmail} />
          <div style={{ marginTop: 8 }}>
            <MagicLinkBtn onClick={handleMagicLink} loading={loading} />
          </div>
          {authClient?.signIn?.passkey && (
            <div style={{ marginTop: 8 }}>
              <PasskeyBtn onClick={handlePasskey} loading={passkeyLoading} />
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
