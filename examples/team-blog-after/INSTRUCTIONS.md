# Build Instructions: Team Blog Platform (Without cfast)

This document is a complete, self-contained specification for building a team blog platform on Cloudflare Workers with React Router, Drizzle ORM, Better Auth, Mailgun, and MUI Joy UI. **Do not use any `@cfast/*` packages.** The entire point of this app is to show how much manual work is required without cfast.

Read this document fully before writing any code. Do not ask clarifying questions — everything you need is here.

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Environment & Bindings](#2-environment--bindings)
3. [Database Schema](#3-database-schema)
4. [Authentication](#4-authentication)
5. [Permission System](#5-permission-system)
6. [Routes & Pages](#6-routes--pages)
7. [File Uploads](#7-file-uploads)
8. [Email](#8-email)
9. [Admin Panel](#9-admin-panel)
10. [UI Components](#10-ui-components)
11. [File Structure](#11-file-structure)
12. [Implementation Order](#12-implementation-order)

---

## 1. Project Setup

### Stack

| Concern | Technology |
|---|---|
| Runtime | Cloudflare Workers |
| Framework | React Router v7 (file-based routing, SSR on Workers) |
| Database | Cloudflare D1 via Drizzle ORM |
| Auth | Better Auth with magic email + passkeys |
| Email | Mailgun HTTP API + react-email for templates |
| UI | MUI Joy UI |
| Language | TypeScript (strict mode) |

### Initialization

1. Scaffold with `npx create-react-router@latest before --template cloudflare` (or equivalent for React Router v7 on CF Workers). If this command does not work, scaffold manually by creating a React Router v7 project configured for Cloudflare Workers.
2. Install dependencies:
   ```
   pnpm add drizzle-orm better-auth @mui/joy @mui/material @emotion/react @emotion/styled @react-email/components
   pnpm add -D drizzle-kit @cloudflare/workers-types wrangler
   ```
3. Configure `wrangler.toml` with:
   - A D1 database binding named `DB`
   - An R2 bucket binding named `UPLOADS`
   - A KV namespace binding named `CACHE`

### wrangler.toml

```toml
name = "team-blog-before"
compatibility_date = "2025-12-01"

[vars]
APP_URL = "http://localhost:8787"

[[d1_databases]]
binding = "DB"
database_name = "team-blog"
database_id = "local"

[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "team-blog-uploads"

[[kv_namespaces]]
binding = "CACHE"
id = "local"
```

### drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
```

### Environment Type

Create `app/env.ts`:

```typescript
export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  CACHE: KVNamespace;
  APP_URL: string;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
}
```

This type must be manually kept in sync with `wrangler.toml`. There is no validation — if a binding is missing, it crashes at runtime. This is intentional (it's a pain point cfast solves).

---

## 2. Environment & Bindings

### How env flows through the app

React Router on Cloudflare Workers provides the raw `env` object through the `context` parameter in loaders and actions. You must manually type-cast it everywhere:

```typescript
export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  // use env.DB, env.UPLOADS, etc.
}
```

This cast appears in **every single loader and action**. There is no centralized validation. If `MAILGUN_API_KEY` is missing from `.dev.vars`, you find out when the first email send fails.

### .dev.vars

```
MAILGUN_API_KEY=your-sandbox-key
MAILGUN_DOMAIN=sandbox1234.mailgun.org
```

---

## 3. Database Schema

Create `app/db/schema.ts` with these tables. Use Drizzle's SQLite column types.

### Users Table

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // nanoid or uuid
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### Sessions Table

Better Auth manages this but you need to define it in Drizzle for the schema to be complete:

```typescript
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### Accounts Table

Better Auth needs this for the magic link / passkey providers:

```typescript
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### Verifications Table

Better Auth needs this for magic link token verification:

```typescript
export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### Passkeys Table

```typescript
export const passkeys = sqliteTable("passkeys", {
  id: text("id").primaryKey(),
  name: text("name"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  counter: integer("counter").notNull().default(0),
  deviceType: text("device_type"),
  backedUp: integer("backed_up", { mode: "boolean" }).default(false),
  transports: text("transports"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
```

### Roles Table

```typescript
export const roles = sqliteTable("roles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "editor", "author"] }).notNull(),
  grantedBy: text("granted_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

Users without any row in the roles table are "readers" (authenticated but no special role).

### Posts Table

```typescript
export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt"),
  coverImageKey: text("cover_image_key"), // R2 object key
  authorId: text("author_id").notNull().references(() => users.id),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### Comments Table

```typescript
export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### Impersonation Log Table

```typescript
export const impersonationLogs = sqliteTable("impersonation_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull().references(() => users.id),
  targetUserId: text("target_user_id").notNull().references(() => users.id),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  endedAt: integer("ended_at", { mode: "timestamp" }),
});
```

### Audit Log Table

```typescript
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // "create_post", "update_post", "delete_post", "publish_post", "assign_role", etc.
  targetType: text("target_type").notNull(), // "post", "comment", "user"
  targetId: text("target_id").notNull(),
  metadata: text("metadata"), // JSON string with extra context
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### Database Client Helper

Create `app/db/client.ts`:

```typescript
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDbClient(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
```

---

## 4. Authentication

### Better Auth Setup

Create `app/auth.server.ts`. Configure Better Auth with:

- **Database adapter**: Drizzle with D1
- **Email & password**: Disabled (we only use magic link + passkeys)
- **Magic link**: Enabled, sends via Mailgun (see Email section)
- **Passkeys**: Enabled with WebAuthn
- **Session**: Stored in the `sessions` table, 30-day expiry

Consult the Better Auth documentation for the exact configuration API. The auth instance must be created per-request because it needs the D1 binding from the Worker env.

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { passkey } from "better-auth/plugins/passkey";
import { createDbClient } from "./db/client";
import type { Env } from "./env";
import { sendMagicLinkEmail } from "./email/send";

export function createAuth(env: Env) {
  const db = createDbClient(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(env, email, url);
        },
      }),
      passkey({
        rpName: "Team Blog",
        rpId: new URL(env.APP_URL).hostname,
        origin: env.APP_URL,
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
    },
  });
}
```

### Auth Client

Create `app/auth.client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), passkeyClient()],
});
```

### Auth Helpers

Create `app/auth.helpers.server.ts` with helper functions that are used across loaders/actions:

```typescript
import { redirect } from "react-router";
import type { Env } from "./env";
import { createAuth } from "./auth.server";
import { createDbClient } from "./db/client";
import { roles } from "./db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "admin" | "editor" | "author" | "reader";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  roles: UserRole[];
}

// Get the current user or null
export async function getUser(request: Request, env: Env): Promise<AuthUser | null> {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;

  const db = createDbClient(env.DB);
  const userRoles = await db.select().from(roles).where(eq(roles.userId, session.user.id));

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatarUrl: session.user.image ?? null,
    roles: userRoles.length > 0 ? userRoles.map((r) => r.role) : ["reader"],
  };
}

// Get the current user or redirect to login
export async function requireUser(request: Request, env: Env): Promise<AuthUser> {
  const user = await getUser(request, env);
  if (!user) throw redirect("/login");
  return user;
}

// Check if user has a specific role
export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (user.roles.includes("admin")) return true; // admin has all roles
  return user.roles.includes(role);
}

// Check if user has any of the specified roles
export function hasAnyRole(user: AuthUser, checkRoles: UserRole[]): boolean {
  return checkRoles.some((role) => hasRole(user, role));
}
```

### Impersonation

Impersonation is implemented manually (not a Better Auth feature). It works via a KV-stored mapping:

- When admin starts impersonation: store `impersonation:{adminSessionId} -> targetUserId` in KV
- Modify `getUser()` to check for an impersonation entry. If found, load the target user instead but attach an `isImpersonating: true` flag and `impersonatedBy: adminId` to the returned user.
- When admin stops impersonation: delete the KV entry

Add to `AuthUser`:
```typescript
export interface AuthUser {
  // ...existing fields
  isImpersonating?: boolean;
  impersonatedBy?: string;
  realUser?: { id: string; name: string }; // The admin's actual identity
}
```

Update `getUser()` to check for impersonation:
```typescript
// After getting the real session user, check KV for impersonation
const impersonationTarget = await env.CACHE.get(`impersonation:${session.session.id}`);
if (impersonationTarget) {
  // Load the target user instead
  const targetUser = await db.select().from(users).where(eq(users.id, impersonationTarget)).get();
  if (targetUser) {
    const targetRoles = await db.select().from(roles).where(eq(roles.userId, targetUser.id));
    return {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      avatarUrl: targetUser.avatarUrl,
      roles: targetRoles.length > 0 ? targetRoles.map((r) => r.role) : ["reader"],
      isImpersonating: true,
      impersonatedBy: session.user.id,
      realUser: { id: session.user.id, name: session.user.name },
    };
  }
}
```

---

## 5. Permission System

There is no centralized permission system. Permissions are checked inline in every loader, every action, and every component. This is the core pain point.

### Server-Side Permission Rules

These rules must be manually enforced in every loader/action. There is no shared permission definition. Each route implements its own checks:

**Posts — Read:**
- Anonymous / reader: can see posts where `published = true`
- Author: can see published posts + own drafts (`published = true OR authorId = user.id`)
- Editor / admin: can see all posts

**Posts — Create:**
- Author, editor, admin: can create posts
- The `authorId` is always set to the creating user's ID

**Posts — Update:**
- Author: can update only own posts (`authorId = user.id`)
- Editor / admin: can update any post

**Posts — Delete:**
- Author: can delete only own posts
- Admin: can delete any post
- Editor: CANNOT delete posts (only edit/publish)

**Posts — Publish/Unpublish:**
- Editor / admin: can publish/unpublish any post
- Author: CANNOT publish own posts (must be approved by editor)

**Comments — Read:**
- Anyone: can read comments on published posts
- Author of the post: can read comments on own drafts
- Editor / admin: can read comments on any post

**Comments — Create:**
- Any authenticated user (reader, author, editor, admin): can comment on published posts

**Comments — Delete:**
- Comment author: can delete own comments
- Editor / admin: can delete any comment

**Users — Read:**
- Admin: can see all users
- Others: can see own profile only

**Users — Update:**
- Admin: can update any user
- Others: can update own profile only

**Roles — Assign:**
- Admin: can assign any role (admin, editor, author)
- Editor: can assign "author" role only
- Others: cannot assign roles

**Roles — Revoke:**
- Same rules as assign

**Impersonation:**
- Admin only

### Client-Side Permission Checks

Every component that shows/hides UI based on permissions must duplicate these checks. There is no shared system. Components receive the user object and manually check roles:

```typescript
// This pattern repeats dozens of times across the app
{hasRole(user, "editor") && <PublishButton />}
{(hasRole(user, "admin") || post.authorId === user.id) && <EditButton />}
{(hasRole(user, "admin") || post.authorId === user.id) && <DeleteButton />}
```

For multi-step operations (e.g., "can the user publish this post?"), permission checks must be done separately for each step and combined manually. There is no way to declare "this action requires permissions A, B, C" and check them all at once.

---

## 6. Routes & Pages

### Route Structure

```
app/routes/
├── _index.tsx                    # Home — published post list (offset pagination)
├── login.tsx                     # Login — magic email + passkey
├── auth.$.tsx                    # Better Auth catch-all API route
├── posts.$slug.tsx               # Post detail — content + comments (infinite scroll)
├── posts.new.tsx                 # Create post (author+ only)
├── posts.$slug.edit.tsx          # Edit post with image upload
├── profile.tsx                   # Edit own profile + avatar + passkeys
├── admin.tsx                     # Admin layout
├── admin._index.tsx              # Admin dashboard
├── admin.users.tsx               # Admin user list
├── admin.users.$id.tsx           # Admin user detail + role management
├── admin.posts.tsx               # Admin all posts list
├── admin.impersonate.$id.tsx     # Start impersonation (action only)
├── admin.stop-impersonation.tsx  # Stop impersonation (action only)
└── api.upload.tsx                # File upload API endpoint
```

### Route Details

#### `_index.tsx` — Home Page

**Loader:**
1. Cast `context.cloudflare.env as Env`
2. Optionally get user via `getUser(request, env)` (not required, page is public)
3. Parse `?page=1&limit=10` from URL search params (offset-based pagination)
4. Query posts: `SELECT * FROM posts WHERE published = true ORDER BY published_at DESC LIMIT ? OFFSET ?`
5. Count total: `SELECT COUNT(*) FROM posts WHERE published = true`
6. Join author name for each post (separate query or join)
7. Return `{ posts, total, page, limit, user }`

**Component:**
- Render a list of post cards (title, excerpt, author name, published date, cover image)
- Render offset pagination controls (Previous / Next / Page numbers)
- If user is logged in, show "New Post" button if they have author+ role
- Header with login/logout and user avatar

#### `login.tsx` — Login Page

**Loader:**
- If user is already authenticated, redirect to `/`

**Action:**
- Handle magic link form submission: call `auth.api.signInMagicLink({ email })`
- Return `{ sent: true }` on success to show "Check your email" message

**Component:**
- Email input + "Send Magic Link" button
- "Sign in with Passkey" button (calls `authClient.signIn.passkey()` on client)
- After form submission, show "Check your email for a magic link" message
- Style with Joy UI Card, Input, Button

#### `auth.$.tsx` — Better Auth API Route

This is a catch-all route that forwards requests to Better Auth's API handler:

```typescript
import { createAuth } from "~/auth.server";
import type { Env } from "~/env";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const auth = createAuth(env);
  return auth.handler(request);
}

export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const auth = createAuth(env);
  return auth.handler(request);
}
```

#### `posts.$slug.tsx` — Post Detail

**Loader:**
1. Get env, optionally get user
2. Find post by slug: `SELECT * FROM posts WHERE slug = ?`
3. **Permission check**: If post is not published:
   - If no user → 404
   - If user is the author → allow
   - If user is editor/admin → allow
   - Otherwise → 404
4. Load first page of comments (cursor-based, 20 per page): `SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC LIMIT 21` (fetch 21 to know if there's a next page)
5. Join author info for each comment
6. Join post author info
7. Return `{ post, author, comments, nextCursor, user }`

**Action (multi-action with manual switch):**

This route has FOUR actions on one page. Implement with a hidden `_action` form field and a switch statement:

```typescript
export async function action({ request, context, params }: ActionFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const user = await requireUser(request, env);
  const form = await request.formData();
  const actionType = form.get("_action") as string;

  switch (actionType) {
    case "delete": {
      // Permission check: admin or own post
      const post = await db.select().from(posts).where(eq(posts.slug, params.slug)).get();
      if (!post) throw new Response("Not found", { status: 404 });
      if (!hasRole(user, "admin") && post.authorId !== user.id) {
        throw new Response("Forbidden", { status: 403 });
      }
      await db.delete(posts).where(eq(posts.id, post.id));
      // Audit log
      await db.insert(auditLogs).values({
        id: nanoid(),
        userId: user.id,
        action: "delete_post",
        targetType: "post",
        targetId: post.id,
      });
      return redirect("/");
    }
    case "publish": {
      // Permission check: editor or admin only
      if (!hasAnyRole(user, ["editor", "admin"])) {
        throw new Response("Forbidden", { status: 403 });
      }
      const post = await db.select().from(posts).where(eq(posts.slug, params.slug)).get();
      if (!post) throw new Response("Not found", { status: 404 });
      await db.update(posts).set({ published: true, publishedAt: new Date() }).where(eq(posts.id, post.id));
      // Audit log
      await db.insert(auditLogs).values({ /* ... */ });
      // Send email to author
      await sendPostPublishedEmail(env, post);
      return { success: true };
    }
    case "unpublish": {
      // Permission check: editor or admin only
      if (!hasAnyRole(user, ["editor", "admin"])) {
        throw new Response("Forbidden", { status: 403 });
      }
      // ... same pattern
    }
    case "comment": {
      // Permission check: any authenticated user can comment on published posts
      const post = await db.select().from(posts).where(eq(posts.slug, params.slug)).get();
      if (!post?.published) throw new Response("Cannot comment on unpublished post", { status: 403 });
      const content = form.get("content") as string;
      if (!content?.trim()) return { error: "Comment cannot be empty" };
      await db.insert(comments).values({
        id: nanoid(),
        postId: post.id,
        authorId: user.id,
        content: content.trim(),
      });
      // Send email to post author about new comment
      await sendNewCommentEmail(env, post, user, content);
      return { success: true };
    }
    case "deleteComment": {
      const commentId = form.get("commentId") as string;
      const comment = await db.select().from(comments).where(eq(comments.id, commentId)).get();
      if (!comment) throw new Response("Not found", { status: 404 });
      // Permission check: comment author or editor/admin
      if (comment.authorId !== user.id && !hasAnyRole(user, ["editor", "admin"])) {
        throw new Response("Forbidden", { status: 403 });
      }
      await db.delete(comments).where(eq(comments.id, commentId));
      return { success: true };
    }
    default:
      throw new Response("Invalid action", { status: 400 });
  }
}
```

**Component:**
- Post content (title, cover image, content, author, date)
- Action buttons at the top based on permissions:
  - Edit button: visible if user is author of this post OR editor/admin
  - Delete button: visible if user is author of this post OR admin
  - Publish/Unpublish button: visible if user is editor/admin
  - Each button wraps a `<form>` with a hidden `_action` field. **This is ugly and repetitive — that's the point.**
- Comment section:
  - Comment form (textarea + submit) — visible only if user is authenticated and post is published
  - Comment list with infinite scroll:
    - Load initial 20 comments from loader data
    - "Load more" button that fetches next page via a resource route or URL param `?cursor=...`
    - Each comment shows: author name, avatar, content, date
    - Delete button on comment: visible if user is comment author or editor/admin
- **Infinite scroll implementation**: Must manually use `useFetcher` to load more comments, accumulate them in React state, track the cursor, and handle loading/error states. This is verbose (~40-50 lines of hook logic).

#### `posts.new.tsx` — Create Post

**Loader:**
1. Get env, require user
2. **Permission check**: must be author, editor, or admin. If not, redirect to `/`.
3. Return `{ user }`

**Action:**
1. Require user, check author+ role
2. Parse form data: title, content, excerpt
3. Generate slug from title (lowercase, replace spaces with hyphens, strip special chars)
4. Insert post with `published: false`
5. Insert audit log
6. Redirect to `/posts/:slug/edit` (so they can add a cover image)

**Component:**
- Manually built form with Joy UI components:
  - Title: `<Input />` with label
  - Excerpt: `<Textarea />` with label
  - Content: `<Textarea />` (larger) with label
  - Submit button
- All validation is manual (check required fields, show error messages)

#### `posts.$slug.edit.tsx` — Edit Post

**Loader:**
1. Get env, require user
2. Find post by slug
3. **Permission check**: must be author of this post OR editor/admin. Otherwise 403.
4. Return `{ post, user }`

**Action (multi-action with manual switch):**
- `_action: "update"` — Update post fields (title, content, excerpt)
  - Permission check: author of post or editor/admin
  - Regenerate slug if title changed
  - Update `updatedAt`
  - Insert audit log
- `_action: "uploadCover"` — Handle cover image upload
  - Permission check: same as update
  - See File Uploads section for R2 upload logic
  - Update post's `coverImageKey`
- `_action: "removeCover"` — Remove cover image
  - Permission check: same as update
  - Delete R2 object
  - Set `coverImageKey` to null

**Component:**
- Pre-filled form with all post fields
- Cover image section:
  - If cover exists: show preview image + "Remove" button
  - File input for uploading new cover image
  - Upload progress is NOT shown (too complex without a library — just submit and wait)
- Save button
- Each section is a separate `<form>` with its own `_action` — three forms on one page. This is clunky.

#### `profile.tsx` — User Profile

**Loader:**
1. Require user
2. Return `{ user }`

**Action (multi-action):**
- `_action: "updateProfile"` — Update name
- `_action: "uploadAvatar"` — Upload avatar to R2, update `avatarUrl`
- `_action: "removeAvatar"` — Delete avatar from R2, set `avatarUrl` to null

**Component:**
- Profile edit form (name input, email shown but not editable)
- Avatar section (preview, upload, remove)
- Passkey management section:
  - List registered passkeys (name, created date)
  - "Add Passkey" button (calls `authClient.passkey.addPasskey()`)
  - "Remove" button per passkey
  - This section uses client-side Better Auth calls, not form submissions

#### `admin.tsx` — Admin Layout

**Loader:**
1. Require user
2. **Permission check**: must be admin. Redirect to `/` if not.
3. Return `{ user }`

**Component:**
- Admin layout wrapper with sidebar navigation:
  - Dashboard
  - Users
  - Posts
- Shows impersonation banner if `user.isImpersonating`:
  - "Viewing as {user.name}" + "Stop Impersonating" button
- Renders `<Outlet />`

#### `admin._index.tsx` — Admin Dashboard

**Loader:**
1. Require admin
2. Query counts:
   - Total users: `SELECT COUNT(*) FROM users`
   - Total posts: `SELECT COUNT(*) FROM posts`
   - Published posts: `SELECT COUNT(*) FROM posts WHERE published = true`
   - Total comments: `SELECT COUNT(*) FROM comments`
3. Query recent posts (last 5)
4. Query recent users (last 5)
5. Return all counts + recent items

**Component:**
- Stat cards (total users, total posts, published posts, total comments)
- Recent posts table (title, author, status, date)
- Recent users table (name, email, roles, joined date)
- All styled with Joy UI Table, Card, Typography

#### `admin.users.tsx` — Admin User List

**Loader:**
1. Require admin
2. Parse `?page=1&limit=20&search=` from URL
3. Query users with offset pagination
4. If search param: filter by name or email LIKE
5. Join roles for each user
6. Count total
7. Return `{ users, total, page, limit, search }`

**Component:**
- Search input
- User table: name, email, roles (as chips/badges), joined date, actions
- Actions column: "View" link, "Impersonate" button
- Offset pagination controls (Previous/Next/Page numbers)

#### `admin.users.$id.tsx` — Admin User Detail

**Loader:**
1. Require admin
2. Find user by ID, load their roles
3. Load their recent posts (last 10)
4. Return `{ targetUser, targetRoles, recentPosts }`

**Action (multi-action):**
- `_action: "assignRole"` — Add a role to the user
  - Validate the role is valid (admin, editor, author)
  - Check role doesn't already exist
  - Insert into roles table
  - Insert audit log
- `_action: "revokeRole"` — Remove a role
  - Delete from roles table
  - Insert audit log

**Component:**
- User info card (name, email, avatar, joined date)
- Role management:
  - Current roles shown as removable chips
  - Dropdown to add a new role + "Assign" button
  - Each role chip has an "X" to revoke
- Recent posts by this user (table)
- "Impersonate" button

#### `admin.impersonate.$id.tsx` — Start Impersonation

**Action only (no component):**
1. Require admin
2. Get the admin's session ID
3. Store `impersonation:{sessionId} -> targetUserId` in KV with 1 hour TTL
4. Insert impersonation log
5. Redirect to `/`

#### `admin.stop-impersonation.tsx` — Stop Impersonation

**Action only (no component):**
1. Get user (who is currently being impersonated)
2. The `realUser` field on AuthUser tells us the admin's identity
3. Get the admin's session and delete the KV impersonation entry
4. Update impersonation log with `endedAt`
5. Redirect to `/admin`

#### `admin.posts.tsx` — Admin All Posts

**Loader:**
1. Require admin
2. Parse `?page=1&limit=20&status=all` (status: all, published, draft)
3. Query all posts with offset pagination, optional status filter
4. Join author name
5. Count total
6. Return `{ posts, total, page, limit, status }`

**Component:**
- Filter tabs: All / Published / Drafts
- Posts table: title, author, status (published/draft), created, updated
- Actions: "View", "Edit", "Delete"
- Delete uses a form with `_action: "delete"` + confirmation dialog
- Offset pagination controls

**Action:**
- `_action: "delete"` — Delete a post (admin only)
  - Delete from DB, delete cover image from R2 if exists
  - Insert audit log
  - Return to same page

#### `api.upload.tsx` — File Upload Endpoint

See File Uploads section.

---

## 7. File Uploads

### Upload Endpoint

Create `app/routes/api.upload.tsx` as a resource route (no component, action only).

**Action:**
1. Require authenticated user
2. Parse the `type` query param: "cover" or "avatar"
3. Validate based on type:
   - **cover**: accept `image/jpeg`, `image/png`, `image/webp`. Max 10MB.
   - **avatar**: accept `image/jpeg`, `image/png`, `image/webp`. Max 2MB.
4. Read the file from the multipart form data using `request.formData()`
5. Validate MIME type by checking the file's `type` property
6. Validate file size by checking `file.size`
7. Generate R2 key:
   - cover: `covers/{postId}/{nanoid()}-{filename}`
   - avatar: `avatars/{userId}/{nanoid()}-{filename}`
8. Upload to R2: `env.UPLOADS.put(key, file.stream(), { httpMetadata: { contentType: file.type } })`
9. Return `{ key, url: "/api/file/" + key }`

### Serving Files

Create `app/routes/api.file.$.tsx`:

**Loader:**
1. Get the key from the catch-all param
2. Fetch from R2: `env.UPLOADS.get(key)`
3. If not found → 404
4. Return the R2 object body with appropriate content-type and cache headers

### Important Details

- There is NO multipart upload for large files. R2's `put()` is used directly, which works for files up to 100MB but provides no progress indication.
- There is NO client-side file validation before upload. The user selects a file, submits the form, and finds out it was too large only after the server rejects it.
- There is NO upload progress bar. The form submits and the user waits.
- File size validation on the server uses `file.size` from `FormData`, which requires the entire file to be buffered in memory first. For large files this is wasteful.
- There is no content-type verification beyond trusting the browser's `file.type`. A user could rename a `.exe` to `.jpg` and the MIME check would only catch it if the browser correctly identifies it.

All of these limitations are things `@cfast/storage` solves.

---

## 8. Email

### Mailgun Client

Create `app/email/mailgun.ts`:

```typescript
import type { Env } from "~/env";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(env: Env, options: SendEmailOptions) {
  const form = new FormData();
  form.append("from", `Team Blog <noreply@${env.MAILGUN_DOMAIN}>`);
  form.append("to", options.to);
  form.append("subject", options.subject);
  form.append("html", options.html);
  if (options.text) form.append("text", options.text);

  const response = await fetch(
    `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
      },
      body: form,
    }
  );

  if (!response.ok) {
    console.error("Mailgun error:", await response.text());
    throw new Error("Failed to send email");
  }
}
```

### Email Templates

Create react-email templates in `app/email/templates/`:

#### `magic-link.tsx`

```tsx
import { Html, Head, Body, Container, Text, Link, Hr } from "@react-email/components";

interface MagicLinkEmailProps {
  url: string;
}

export function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "sans-serif", padding: "20px" }}>
        <Container>
          <Text style={{ fontSize: "18px" }}>Sign in to Team Blog</Text>
          <Text>Click the link below to sign in. This link expires in 10 minutes.</Text>
          <Link href={url} style={{ display: "inline-block", padding: "12px 24px", backgroundColor: "#0070f3", color: "#fff", borderRadius: "6px", textDecoration: "none" }}>
            Sign In
          </Link>
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>If you didn't request this, you can safely ignore this email.</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

#### `post-published.tsx`

Notify the author when their post is published by an editor:

```tsx
interface PostPublishedEmailProps {
  authorName: string;
  postTitle: string;
  postUrl: string;
}

export function PostPublishedEmail({ authorName, postTitle, postUrl }: PostPublishedEmailProps) {
  // ... standard react-email template
  // "Hi {authorName}, your post '{postTitle}' has been published!"
  // Link to the published post
}
```

#### `new-comment.tsx`

Notify the post author when someone comments:

```tsx
interface NewCommentEmailProps {
  authorName: string;
  commenterName: string;
  postTitle: string;
  commentContent: string;
  postUrl: string;
}

export function NewCommentEmail({ authorName, commenterName, postTitle, commentContent, postUrl }: NewCommentEmailProps) {
  // "Hi {authorName}, {commenterName} commented on your post '{postTitle}'"
  // Show comment preview
  // Link to the post
}
```

### Email Send Functions

Create `app/email/send.ts`:

```typescript
import { render } from "@react-email/components";
import { sendEmail } from "./mailgun";
import { MagicLinkEmail } from "./templates/magic-link";
import { PostPublishedEmail } from "./templates/post-published";
import { NewCommentEmail } from "./templates/new-comment";
import type { Env } from "~/env";

export async function sendMagicLinkEmail(env: Env, email: string, url: string) {
  const html = await render(MagicLinkEmail({ url }));
  await sendEmail(env, { to: email, subject: "Sign in to Team Blog", html });
}

export async function sendPostPublishedEmail(env: Env, post: { title: string; slug: string; authorId: string }) {
  // Look up author email
  // Render template
  // Send email
}

export async function sendNewCommentEmail(env: Env, post: any, commenter: any, content: string) {
  // Look up post author email
  // Render template
  // Send email
}
```

Note: Every email send function must independently look up user data and construct URLs. There is no shared email client abstraction. The Mailgun API details are baked in. If you wanted to switch to Resend, you'd modify `mailgun.ts` and hope nothing breaks.

---

## 9. Admin Panel

The admin panel is built entirely by hand. Every table view, every form, every CRUD operation. There is no generation from schema.

### Admin Layout (`admin.tsx`)

- Joy UI sidebar with navigation links: Dashboard, Users, Posts
- Main content area with `<Outlet />`
- If `user.isImpersonating`, show a fixed banner at the top:
  - Yellow background
  - "You are viewing as {user.name} ({user.email})"
  - "Stop Impersonating" button (submits to `/admin/stop-impersonation`)

### Admin Dashboard (`admin._index.tsx`)

- 4 stat cards in a grid (Joy UI Card):
  - Total Users
  - Total Posts
  - Published Posts
  - Total Comments
- Recent Posts table (Joy UI Table)
- Recent Users table (Joy UI Table)

### Admin Users List (`admin.users.tsx`)

This is a full hand-built data table with:
- Search input that submits as a GET form (updates URL search param)
- Joy UI Table with columns: Name, Email, Roles, Joined, Actions
- Roles displayed as Joy UI Chip components
- Actions: "View" (link to detail), "Impersonate" (form button)
- Offset pagination with Previous/Next buttons and page info text

The entire pagination logic (parsing page/limit from URL, calculating total pages, generating links) is written inline in this route.

### Admin User Detail (`admin.users.$id.tsx`)

- User info section (Card with name, email, avatar, joined date)
- Role management section:
  - Current roles as Chip components with delete (X) button
  - Each delete button is a form: `<form method="post"><input type="hidden" name="_action" value="revokeRole" /><input type="hidden" name="role" value="editor" /><button type="submit">X</button></form>`
  - "Add role" row: Select dropdown + "Assign" button, also a form
  - Permission check inline: editor/admin roles can only be assigned by admin
- Recent posts section: simple table of user's posts
- Impersonate button: form that posts to `/admin/impersonate/{userId}`

### Admin Posts List (`admin.posts.tsx`)

- Filter tabs: All / Published / Drafts (links that set `?status=` URL param)
- Joy UI Table: Title, Author, Status (Chip: green=published, gray=draft), Created, Actions
- Actions: "View" (link), "Edit" (link), "Delete" (form with confirmation)
- Delete confirmation: use a Joy UI Modal that opens on click, contains a form that submits the delete
- Offset pagination

---

## 10. UI Components

### Shared Components

Create these in `app/components/`:

#### `Header.tsx`
- App logo/name on the left
- Navigation: Home
- Right side:
  - If not logged in: "Login" button
  - If logged in: User avatar (or initials) + dropdown menu (Profile, Admin if admin, Logout)
  - If logged in + author+: "New Post" button
- If impersonating: yellow bar above header

#### `PostCard.tsx`
- Used on the home page in the post list
- Cover image (if exists), title, excerpt, author name + avatar, published date
- Joy UI Card component

#### `CommentItem.tsx`
- Author avatar + name
- Comment content
- Date
- Delete button (only if user is comment author or editor/admin)
  - This requires passing the `user` object down and doing inline permission check

#### `Pagination.tsx`
- Reusable offset pagination component
- Props: `currentPage`, `totalPages`, `baseUrl`
- Renders: Previous button, page numbers, Next button
- Each page number is a link: `<Link to="{baseUrl}?page={n}">`
- This is ~50 lines of manual pagination UI logic

#### `RoleChip.tsx`
- Renders a role as a colored Joy UI Chip
- admin = red, editor = blue, author = green, reader = gray

#### `ImpersonationBanner.tsx`
- Fixed yellow bar at top of page
- "Viewing as {name}" + "Stop" button
- Only rendered if `user.isImpersonating`

#### `ConfirmDialog.tsx`
- Joy UI Modal for delete confirmations
- Props: `open`, `onClose`, `onConfirm`, `title`, `message`

### No Shared Permission Components

There is NO `ActionButton` or `PermissionGate` component. Every permission check is inline:

```tsx
// This pattern is scattered across the entire app:
{user && (hasRole(user, "admin") || post.authorId === user.id) && (
  <form method="post">
    <input type="hidden" name="_action" value="delete" />
    <Button color="danger" type="submit">Delete</Button>
  </form>
)}
```

Repeat this for every action on every page. The permission logic is duplicated between the server (where it's enforced) and the client (where it's used for UI rendering). There is no single source of truth.

---

## 11. File Structure

```
examples/before/
├── app/
│   ├── auth.client.ts
│   ├── auth.helpers.server.ts
│   ├── auth.server.ts
│   ├── components/
│   │   ├── ConfirmDialog.tsx
│   │   ├── Header.tsx
│   │   ├── ImpersonationBanner.tsx
│   │   ├── Pagination.tsx
│   │   ├── PostCard.tsx
│   │   ├── CommentItem.tsx
│   │   └── RoleChip.tsx
│   ├── db/
│   │   ├── client.ts
│   │   └── schema.ts
│   ├── email/
│   │   ├── mailgun.ts
│   │   ├── send.ts
│   │   └── templates/
│   │       ├── magic-link.tsx
│   │       ├── new-comment.tsx
│   │       └── post-published.tsx
│   ├── env.ts
│   ├── root.tsx
│   └── routes/
│       ├── _index.tsx
│       ├── admin._index.tsx
│       ├── admin.impersonate.$id.tsx
│       ├── admin.posts.tsx
│       ├── admin.stop-impersonation.tsx
│       ├── admin.tsx
│       ├── admin.users.$id.tsx
│       ├── admin.users.tsx
│       ├── api.file.$.tsx
│       ├── api.upload.tsx
│       ├── auth.$.tsx
│       ├── login.tsx
│       ├── posts.$slug.edit.tsx
│       ├── posts.$slug.tsx
│       ├── posts.new.tsx
│       └── profile.tsx
├── drizzle/
│   └── (migrations generated by drizzle-kit)
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── wrangler.toml
└── .dev.vars
```

---

## 12. Implementation Order

Build the app in this exact order. Each step should produce a working (if incomplete) app:

### Phase 1: Foundation
1. **Project scaffolding** — Initialize React Router on CF Workers, install all deps, configure `wrangler.toml`
2. **Database schema** — Create all tables in `app/db/schema.ts`, create the Drizzle client helper
3. **Generate migrations** — Run `drizzle-kit generate` then apply with `wrangler d1 migrations apply DB --local`
4. **Environment types** — Create `app/env.ts`

### Phase 2: Auth
5. **Better Auth server** — Create `app/auth.server.ts` with magic link + passkey config
6. **Better Auth client** — Create `app/auth.client.ts`
7. **Auth helpers** — Create `app/auth.helpers.server.ts` with `getUser`, `requireUser`, `hasRole`
8. **Auth API route** — Create `app/routes/auth.$.tsx`
9. **Login page** — Create `app/routes/login.tsx` with magic link form + passkey button
10. **Root layout** — Set up `app/root.tsx` with Joy UI ThemeProvider (use the default Joy UI theme) and basic HTML structure

### Phase 3: Core Pages
11. **Header component** — Build `Header.tsx` with login/logout/avatar dropdown
12. **Home page** — Build `_index.tsx` with post list + offset pagination
13. **Post card component** — Build `PostCard.tsx`
14. **Pagination component** — Build `Pagination.tsx`
15. **Create post page** — Build `posts.new.tsx` (hand-written form)
16. **Post detail page** — Build `posts.$slug.tsx` with the 5-action switch statement
17. **Edit post page** — Build `posts.$slug.edit.tsx` with three forms

### Phase 4: Comments & Infinite Scroll
18. **Comment item component** — Build `CommentItem.tsx`
19. **Infinite scroll for comments** — Implement manual cursor-based loading with `useFetcher`, state accumulation, and "Load more" button in `posts.$slug.tsx`. This requires:
    - A resource route or search param to load more comments
    - Client-side state to accumulate loaded comments
    - Cursor tracking
    - Loading state management
    - This will be approximately 40-60 lines of client-side logic

### Phase 5: File Uploads
20. **Upload endpoint** — Build `api.upload.tsx` with R2 upload + validation
21. **File serving** — Build `api.file.$.tsx` to serve R2 files
22. **Integrate cover image upload** in edit post page
23. **Profile page** — Build `profile.tsx` with avatar upload + passkey management

### Phase 6: Email
24. **Mailgun client** — Build `email/mailgun.ts`
25. **Email templates** — Build all three react-email templates
26. **Email send functions** — Build `email/send.ts`
27. **Wire up emails** — Add email sends to: magic link auth, post published action, new comment action

### Phase 7: Admin Panel
28. **Admin layout** — Build `admin.tsx` with sidebar + permission check
29. **Admin dashboard** — Build `admin._index.tsx` with stat cards + recent tables
30. **Admin users list** — Build `admin.users.tsx` with search + pagination
31. **Admin user detail** — Build `admin.users.$id.tsx` with role management
32. **Admin posts list** — Build `admin.posts.tsx` with filter tabs + delete
33. **Role chip component** — Build `RoleChip.tsx`

### Phase 8: Impersonation
34. **Impersonation start** — Build `admin.impersonate.$id.tsx`
35. **Impersonation stop** — Build `admin.stop-impersonation.tsx`
36. **Impersonation banner** — Build `ImpersonationBanner.tsx`
37. **Update `getUser()`** — Add impersonation check logic
38. **Wire banner** into `Header.tsx` and `admin.tsx`

### Phase 9: Polish
39. **Confirm dialog** — Build `ConfirmDialog.tsx`, wire into delete actions
40. **Error handling** — Add error boundaries to routes
41. **Loading states** — Add loading indicators to forms
42. **Audit logging** — Ensure all mutations write to audit_logs table

---

## Style & Quality Notes

- Use Joy UI components consistently: `Button`, `Input`, `Textarea`, `Card`, `Table`, `Chip`, `Modal`, `Typography`, `Sheet`, `Stack`, `Grid`, `Divider`, `Avatar`, `IconButton`, `Dropdown`, `Menu`, `MenuItem`, `CircularProgress`
- Use `nanoid` for generating IDs (install `nanoid` package)
- Use `drizzle-orm` query builder syntax (not raw SQL)
- Every loader must cast `context.cloudflare.env as Env` — yes, this is repetitive, leave it
- Every action with multiple operations must use the `_action` + switch pattern — yes, this is ugly, leave it
- Every permission check is inline — no abstraction, no shared `canDo()` helper beyond `hasRole()`. The point is to show the duplication.
- Keep the code clean and well-organized within each file, but DO NOT try to reduce the boilerplate. The verbosity is the point.
- Comments in the code are fine but don't add "TODO: use cfast" or similar — the code should stand on its own as a real app.

---

## What This App Demonstrates (Pain Points)

When we later build the "after" version with cfast, these are the pain points that disappear:

1. **`env as Env` cast in every route** → `@cfast/env` validates once at startup
2. **Permission checks duplicated in every loader, action, and component** → `@cfast/permissions` defines once, enforces everywhere
3. **No row-level filtering on queries** → `@cfast/db` auto-applies permission-based where clauses
4. **`_action` switch statements** → `@cfast/actions` gives named, typed actions
5. **Hand-written forms for every entity** → `@cfast/forms` generates from schema
6. **Manual pagination logic in every list** → `@cfast/pagination` provides hooks
7. **Manual infinite scroll implementation** → `@cfast/pagination` provides `useInfiniteScroll`
8. **Manual R2 upload with no progress/validation** → `@cfast/storage` handles it
9. **Direct Mailgun API calls** → `@cfast/email` with plugin provider
10. **Entire admin panel built by hand** → `@cfast/admin` generates from schema
11. **Permission checks in UI are disconnected from server** → `@cfast/ui` ActionButton introspects permissions
12. **Impersonation built from scratch with KV** → `@cfast/auth` has it built in
13. **No query caching** → `@cfast/db` caches with permission-aware keys
14. **Role management UI built from scratch** → `@cfast/admin` includes it
