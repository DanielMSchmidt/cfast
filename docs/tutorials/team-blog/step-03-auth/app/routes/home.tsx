import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, Link } from "react-router";
import { desc } from "drizzle-orm";
import { env } from "../env.server";
import { getDb } from "../db.server";
import { getUser } from "../auth.server";
import { posts } from "../schema";

export async function loader({ request, context }: LoaderFunctionArgs) {
  env.init((context as Record<string, unknown>).cloudflare as Record<string, unknown>);
  const db = getDb();
  const user = await getUser(request);

  const allPosts = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt));

  return {
    posts: allPosts,
    user: user ? { id: user.id, email: user.email, name: user.name } : null,
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
