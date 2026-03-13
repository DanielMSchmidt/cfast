import { nanoid } from "nanoid";

interface SeedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: number;
  createdAt: number;
  updatedAt: number;
}

interface SeedRole {
  id: string;
  userId: string;
  role: string;
  grantedBy: string | null;
  createdAt: number;
}

interface SeedPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImageKey: string | null;
  authorId: string;
  published: number;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

interface SeedComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: number;
}

const now = Math.floor(Date.now() / 1000);
const dayAgo = now - 86400;
const weekAgo = now - 604800;

// Users
export const adminUser: SeedUser = {
  id: "user-admin-001",
  email: "admin@example.com",
  name: "Admin User",
  avatarUrl: null,
  emailVerified: 1,
  createdAt: weekAgo,
  updatedAt: weekAgo,
};

export const editorUser: SeedUser = {
  id: "user-editor-001",
  email: "editor@example.com",
  name: "Editor User",
  avatarUrl: null,
  emailVerified: 1,
  createdAt: weekAgo,
  updatedAt: weekAgo,
};

export const authorUser: SeedUser = {
  id: "user-author-001",
  email: "author@example.com",
  name: "Author User",
  avatarUrl: null,
  emailVerified: 1,
  createdAt: weekAgo,
  updatedAt: weekAgo,
};

export const readerUser: SeedUser = {
  id: "user-reader-001",
  email: "reader@example.com",
  name: "Reader User",
  avatarUrl: null,
  emailVerified: 1,
  createdAt: weekAgo,
  updatedAt: weekAgo,
};

export const allUsers = [adminUser, editorUser, authorUser, readerUser];

// Roles
export const seedRoles: SeedRole[] = [
  { id: nanoid(), userId: adminUser.id, role: "admin", grantedBy: null, createdAt: weekAgo },
  { id: nanoid(), userId: editorUser.id, role: "editor", grantedBy: adminUser.id, createdAt: weekAgo },
  { id: nanoid(), userId: authorUser.id, role: "author", grantedBy: adminUser.id, createdAt: weekAgo },
];

// Posts
export const publishedPost: SeedPost = {
  id: "post-published-001",
  title: "Getting Started with Cloudflare Workers",
  slug: "getting-started-with-cloudflare-workers",
  content:
    "Cloudflare Workers provide a serverless execution environment that allows you to create entirely new applications or augment existing ones without configuring or maintaining infrastructure.\n\nIn this post, we'll explore the basics of building applications with Workers and why they're becoming a popular choice for modern web development.",
  excerpt: "Learn the basics of building serverless applications with Cloudflare Workers.",
  coverImageKey: null,
  authorId: authorUser.id,
  published: 1,
  publishedAt: dayAgo,
  createdAt: weekAgo,
  updatedAt: dayAgo,
};

export const draftPost: SeedPost = {
  id: "post-draft-001",
  title: "Advanced Drizzle ORM Patterns",
  slug: "advanced-drizzle-orm-patterns",
  content: "Draft content about Drizzle ORM patterns that hasn't been published yet.",
  excerpt: "Exploring advanced patterns with Drizzle ORM.",
  coverImageKey: null,
  authorId: authorUser.id,
  published: 0,
  publishedAt: null,
  createdAt: dayAgo,
  updatedAt: dayAgo,
};

export const editorPost: SeedPost = {
  id: "post-editor-001",
  title: "Best Practices for React Router v7",
  slug: "best-practices-for-react-router-v7",
  content: "React Router v7 introduces many new features for building modern web applications.",
  excerpt: "Discover the best practices for React Router v7.",
  coverImageKey: null,
  authorId: editorUser.id,
  published: 1,
  publishedAt: dayAgo,
  createdAt: weekAgo,
  updatedAt: dayAgo,
};

export const allPosts = [publishedPost, draftPost, editorPost];

// Comments
export const seedComments: SeedComment[] = [
  {
    id: "comment-001",
    postId: publishedPost.id,
    authorId: readerUser.id,
    content: "Great article! Very helpful for getting started.",
    createdAt: dayAgo,
  },
  {
    id: "comment-002",
    postId: publishedPost.id,
    authorId: editorUser.id,
    content: "Nice writeup. Consider adding a section about environment variables.",
    createdAt: now - 43200,
  },
  {
    id: "comment-003",
    postId: editorPost.id,
    authorId: authorUser.id,
    content: "This is really useful, thanks for sharing!",
    createdAt: dayAgo,
  },
];

const escapeSQL = (s: string) => s.replace(/'/g, "''").replace(/\n/g, "' || char(10) || '");

// Full seed SQL including users (for use when not using Better Auth API)
export function generateSeedSQL(): string {
  const statements: string[] = [];

  for (const u of allUsers) {
    statements.push(
      `INSERT OR IGNORE INTO users (id, email, name, avatar_url, email_verified, created_at, updated_at) VALUES ('${u.id}', '${u.email}', '${u.name}', ${u.avatarUrl ? `'${u.avatarUrl}'` : "NULL"}, ${u.emailVerified}, ${u.createdAt}, ${u.updatedAt});`
    );
  }

  statements.push(...generateDataSQL());
  return statements.join("\n");
}

// Seed SQL for roles, posts, comments (assumes users already exist)
export function generateDataSQL(): string[] {
  const statements: string[] = [];

  for (const r of seedRoles) {
    statements.push(
      `INSERT INTO roles (id, user_id, role, granted_by, created_at) VALUES ('${r.id}', '${r.userId}', '${r.role}', ${r.grantedBy ? `'${r.grantedBy}'` : "NULL"}, ${r.createdAt});`
    );
  }

  for (const p of allPosts) {
    statements.push(
      `INSERT INTO posts (id, title, slug, content, excerpt, cover_image_key, author_id, published, published_at, created_at, updated_at) VALUES ('${p.id}', '${escapeSQL(p.title)}', '${p.slug}', '${escapeSQL(p.content)}', ${p.excerpt ? `'${escapeSQL(p.excerpt)}'` : "NULL"}, ${p.coverImageKey ? `'${p.coverImageKey}'` : "NULL"}, '${p.authorId}', ${p.published}, ${p.publishedAt ?? "NULL"}, ${p.createdAt}, ${p.updatedAt});`
    );
  }

  for (const c of seedComments) {
    statements.push(
      `INSERT INTO comments (id, post_id, author_id, content, created_at) VALUES ('${c.id}', '${c.postId}', '${c.authorId}', '${escapeSQL(c.content)}', ${c.createdAt});`
    );
  }

  return statements;
}
