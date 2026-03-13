interface MagicLinkEmailProps {
  url: string;
}

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <html>
      <head />
      <body style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <p style={{ fontSize: "18px" }}>Sign in to Team Blog</p>
          <p>Click the link below to sign in. This link expires in 10 minutes.</p>
          <a
            href={url}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#0070f3",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            Sign In
          </a>
          <hr />
          <p style={{ color: "#666", fontSize: "12px" }}>
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  );
}
