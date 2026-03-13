interface NewCommentEmailProps {
  authorName: string;
  commenterName: string;
  postTitle: string;
  commentContent: string;
  postUrl: string;
}

export function NewCommentEmail({
  authorName,
  commenterName,
  postTitle,
  commentContent,
  postUrl,
}: NewCommentEmailProps) {
  return (
    <html>
      <head />
      <body style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <p style={{ fontSize: "18px" }}>New comment on your post</p>
          <p>
            Hi {authorName}, {commenterName} commented on your post &quot;{postTitle}&quot;:
          </p>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "12px",
              borderRadius: "6px",
              margin: "16px 0",
            }}
          >
            <p style={{ margin: 0 }}>{commentContent}</p>
          </div>
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
