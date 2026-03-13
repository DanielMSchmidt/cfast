interface PostPublishedEmailProps {
  authorName: string;
  postTitle: string;
  postUrl: string;
}

export function PostPublishedEmail({ authorName, postTitle, postUrl }: PostPublishedEmailProps) {
  return (
    <html>
      <head />
      <body style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <p style={{ fontSize: "18px" }}>Your post has been published!</p>
          <p>
            Hi {authorName}, your post &quot;{postTitle}&quot; has been published by an editor.
          </p>
          <a
            href={postUrl}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#0070f3",
              color: "#fff",
              borderRadius: "6px",
              textDecoration: "none",
            }}
          >
            View Post
          </a>
          <hr />
          <p style={{ color: "#666", fontSize: "12px" }}>Team Blog</p>
        </div>
      </body>
    </html>
  );
}
