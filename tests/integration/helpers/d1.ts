export async function applyMigrations(db: D1Database): Promise<void> {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  ).run();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT, author_id TEXT NOT NULL REFERENCES users(id), published INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  ).run();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, body TEXT NOT NULL, post_id TEXT NOT NULL REFERENCES posts(id), author_id TEXT NOT NULL REFERENCES users(id), created_at INTEGER NOT NULL DEFAULT (unixepoch()))",
  ).run();
}

export async function resetDatabase(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM comments"),
    db.prepare("DELETE FROM posts"),
    db.prepare("DELETE FROM users"),
  ]);
}

export type SeedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type SeedPost = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  published: boolean;
};

export async function seedUsers(
  db: D1Database,
  users: SeedUser[],
): Promise<void> {
  if (users.length === 0) return;
  const stmt = db.prepare("INSERT INTO users (id, email, name, role) VALUES (?, ?, ?, ?)");
  await db.batch(users.map((u) => stmt.bind(u.id, u.email, u.name, u.role)));
}

export async function seedPosts(
  db: D1Database,
  posts: SeedPost[],
): Promise<void> {
  if (posts.length === 0) return;
  const stmt = db.prepare("INSERT INTO posts (id, title, content, author_id, published) VALUES (?, ?, ?, ?, ?)");
  await db.batch(posts.map((p) => stmt.bind(p.id, p.title, p.content, p.authorId, p.published ? 1 : 0)));
}
