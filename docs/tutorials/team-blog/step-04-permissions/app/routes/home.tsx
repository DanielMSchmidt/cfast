import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { env } from "../env.server";
import { getCfDb } from "../db.server";
import { getAuthContext } from "../auth.server";
import { posts } from "../schema";

export async function loader({ request, context }: LoaderFunctionArgs) {
  env.init((context as Record<string, unknown>).cloudflare as Record<string, unknown>);
  const authCtx = await getAuthContext(request);

  // createDb uses the user's grants to automatically filter posts.
  // A reader only sees published posts. An editor sees all posts.
  const db = getCfDb(
    authCtx.grants,
    authCtx.user ? { id: authCtx.user.id } : null,
  );

  const visiblePosts = await db.query(posts).findMany({
    orderBy: (cols: Record<string, unknown>, { desc }: { desc: (col: unknown) => unknown }) => desc(cols.createdAt),
  }).run({}) as Array<{ id: string; title: string; content: string; createdAt: string }>;

  return {
    posts: visiblePosts,
    user: authCtx.user
      ? { id: authCtx.user.id, email: authCtx.user.email, name: authCtx.user.name }
      : null,
  };
}

export default function Home() {
  const { posts: postList, user } = useLoaderData<typeof loader>();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "48rem", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>Team Blog</h1>
        <nav>
          {user ? (
            <span>Signed in as {user.email}</span>
          ) : (
            <Link to="/login">Sign In</Link>
          )}
        </nav>
      </header>

      {postList.length === 0 ? (
        <p style={{ color: "#666" }}>No posts yet. Check back later!</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {postList.map((post) => (
            <li key={post.id} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
              <h2 style={{ margin: "0 0 0.5rem" }}>{post.title}</h2>
              <p style={{ margin: 0, color: "#444" }}>{post.content}</p>
              <small style={{ color: "#888" }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
