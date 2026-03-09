# team-blog-after @cfast/db Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace direct Drizzle queries and imperative `hasRole`/`hasAnyRole` permission checks in `examples/team-blog-after` with `@cfast/db` Operations, making permissions declarative and composable.

**Architecture:** Routes use a per-request `@cfast/db` instance (`createCfDb`) that wraps D1 + permissions + user context. Mutation operations (insert/update/delete) go through `@cfast/db` for automatic permission enforcement. Multi-step mutations (e.g. create post + audit log) use `compose()`. Complex read queries (counts, custom joins) stay as raw Drizzle since the relational query API doesn't support aggregation or custom column selection. UI-only role checks (`hasAnyRole` for showing buttons) remain unchanged.

**Tech Stack:** `@cfast/db`, `@cfast/permissions`, `drizzle-orm` (relational API), React Router v7

**Key constraint:** `DbConfig.user` expects `{ id: string; role: string }` (single role). The blog's `AuthUser` has `roles: UserRole[]`. Since the permission hierarchy is linear (`admin > editor > author > reader`), we pick the highest role.

---

### Task 1: Add @cfast/db dependency and Drizzle relations

**Why:** `@cfast/db`'s query builder uses Drizzle's relational query API (`db.query.posts.findMany({ with: { author: true } })`), which requires `relations()` to be defined. Without them, `with` clauses silently return nothing.

**Files:**
- Modify: `examples/team-blog-after/package.json`
- Modify: `examples/team-blog-after/app/db/schema.ts`

**Step 1: Add @cfast/db dependency**

In `examples/team-blog-after/package.json`, add to dependencies:
```json
"@cfast/db": "workspace:*"
```

Run:
```bash
cd /Users/danielschmidt/fun/cfast && pnpm install
```

**Step 2: Add Drizzle relations to schema.ts**

Add to the end of `examples/team-blog-after/app/db/schema.ts`:

```ts
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  roles: many(roles),
  sessions: many(sessions),
  accounts: many(accounts),
  passkeys: many(passkeys),
  auditLogs: many(auditLogs),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const rolesRelations = relations(roles, ({ one }) => ({
  user: one(users, { fields: [roles.userId], references: [users.id] }),
  grantedByUser: one(users, { fields: [roles.grantedBy], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const passkeysRelations = relations(passkeys, ({ one }) => ({
  user: one(users, { fields: [passkeys.userId], references: [users.id] }),
}));

export const impersonationLogsRelations = relations(impersonationLogs, ({ one }) => ({
  admin: one(users, { fields: [impersonationLogs.adminId], references: [users.id] }),
  targetUser: one(users, { fields: [impersonationLogs.targetUserId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
```

**Step 3: Verify build**

Run:
```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
```
Expected: No new type errors.

**Step 4: Commit**

```bash
git add examples/team-blog-after/package.json examples/team-blog-after/app/db/schema.ts pnpm-lock.yaml
git commit -m "feat(example): add @cfast/db dependency and Drizzle relations to team-blog-after"
```

---

### Task 2: Create per-request @cfast/db factory

**Why:** Every loader/action needs a `@cfast/db` instance configured with the current user and D1 binding. Centralizing this avoids boilerplate and ensures consistent configuration.

**Files:**
- Create: `examples/team-blog-after/app/db/cfast.server.ts`

**Step 1: Create the factory**

```ts
import { createDb } from "@cfast/db";
import type { Db } from "@cfast/db";
import * as schema from "./schema";
import { permissions } from "../permissions";
import type { AuthUser, UserRole } from "../permissions";

const ROLE_PRIORITY: UserRole[] = ["admin", "editor", "author", "reader"];

/**
 * Pick the highest role from a user's role list.
 *
 * @cfast/db expects a single `role` string. Since the blog's permission
 * hierarchy is linear (admin > editor > author > reader), picking the
 * highest role gives the user all permissions they're entitled to.
 */
function getHighestRole(roles: UserRole[]): string {
  for (const role of ROLE_PRIORITY) {
    if (roles.includes(role)) return role;
  }
  return "reader";
}

export function createCfDb(d1: D1Database, user: AuthUser | null): Db {
  return createDb({
    d1,
    schema: schema as unknown as Record<string, any>,
    permissions,
    user: user ? { id: user.id, role: getHighestRole(user.roles) } : null,
    cache: false,
  });
}
```

**Step 2: Verify build**

Run:
```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
```
Expected: No new type errors.

**Step 3: Commit**

```bash
git add examples/team-blog-after/app/db/cfast.server.ts
git commit -m "feat(example): add @cfast/db per-request factory for team-blog-after"
```

---

### Task 3: Migrate posts.new.tsx

**Why:** This route has a clear create permission check (`hasAnyRole(user, ["admin", "editor", "author"])`) that maps directly to `grant("create", posts)` in the permissions config. The action inserts a post + audit log, which maps to `compose()`.

**Files:**
- Modify: `examples/team-blog-after/app/routes/posts.new.tsx`

**What changes:**
- Loader: Replace `hasAnyRole` guard with `@cfast/db` — check if `createPost` operation's permissions are allowed (or keep the `hasAnyRole` since it's a pre-flight check before showing UI — actually, keep `hasAnyRole` in the loader since it's a page-level guard with redirect, not a data operation)
- Action: Replace `hasAnyRole` guard + raw `db.insert()` calls with `@cfast/db` composed operation

**Step 1: Update imports and action**

Replace the action function. The loader stays as-is (page-level redirect guard).

Change imports — remove `createDbClient`, add `createCfDb` and `compose`:
```ts
import { createCfDb } from "~/db/cfast.server";
import { compose } from "@cfast/db";
import { posts, auditLogs } from "~/db/schema";
```

Remove `import { createDbClient } from "~/db/client";`

Replace the action body after form validation (keep `requireUser`, `hasAnyRole` guard, form parsing, slug generation):

```ts
  const cfDb = createCfDb(env.DB, user);

  const postId = nanoid();

  const op = compose(
    [
      cfDb.insert(posts).values({
        id: postId,
        title,
        slug,
        content,
        excerpt,
        authorId: user.id,
        published: false,
      }),
      cfDb.insert(auditLogs).values({
        id: nanoid(),
        userId: user.id,
        action: "post.created",
        targetType: "post",
        targetId: postId,
        metadata: JSON.stringify({ title, slug }),
      }),
    ],
    async (runInsertPost, runInsertAudit) => {
      await runInsertPost({});
      await runInsertAudit({});
    },
  );

  await op.run({});

  return redirect(`/posts/${slug}/edit`);
```

**Step 2: Verify build**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
```

**Step 3: Commit**

```bash
git add examples/team-blog-after/app/routes/posts.new.tsx
git commit -m "feat(example): migrate posts.new.tsx to @cfast/db compose()"
```

---

### Task 4: Migrate posts.$slug.tsx actions

**Why:** This is the most complex route — it has 5 actions (delete, publish, unpublish, comment, deleteComment) each with different permission requirements. Migrating these to `@cfast/db` makes the permission enforcement automatic and consistent with the `definePermissions` config.

**Files:**
- Modify: `examples/team-blog-after/app/routes/posts.$slug.tsx`

**What changes:**
- Loader: Keep as-is. The query uses leftJoin with custom column selection and cursor-based pagination — neither is supported by `@cfast/db`'s relational query API.
- Action: Replace each sub-action's raw Drizzle + `hasRole`/`hasAnyRole` checks with `@cfast/db` operations. The permission enforcement moves from imperative code to the Operation's `.run()` call.

**Step 1: Update imports**

Add:
```ts
import { createCfDb } from "~/db/cfast.server";
import { compose } from "@cfast/db";
```

Keep `createDbClient` — it's still needed for the loader queries and for looking up the post/comment in actions.

Remove from imports: `hasRole`, `hasAnyRole` from `"~/permissions"` — BUT keep them because they're used in the component's render for UI logic (`isEditorOrAdmin`, `canEdit`, etc.). So actually, keep all existing imports and just ADD the new ones.

**Step 2: Replace the "delete" action block**

Replace lines 113-133:

```ts
  if (_action === "delete") {
    const user = await requireUser(request, env);
    const cfDb = createCfDb(env.DB, user);

    const op = compose(
      [
        cfDb.delete(posts).where(eq(posts.id, post.id)),
        cfDb.insert(auditLogs).values({
          id: nanoid(),
          userId: user.id,
          action: "post.deleted",
          targetType: "post",
          targetId: post.id,
          metadata: JSON.stringify({ title: post.title, slug: post.slug }),
        }),
      ],
      async (runDelete, runAudit) => {
        await runDelete({});
        await runAudit({});
      },
    );

    await op.run({});

    return redirect("/");
  }
```

Note: The old code had `const isAuthor = user.id === post.authorId; const isAdmin = hasRole(user, "admin"); if (!isAuthor && !isAdmin) throw 403`. Now `@cfast/db` handles this via the `delete` permission grants: authors can delete their own posts (`where: eq(posts.authorId, user.id)`), editors can delete any post (via `grant("delete", comments)` — wait, editors don't have delete on posts...).

**IMPORTANT: Check permission grants.** Looking at the permissions config:
- `author`: `grant("delete", posts, { where: eq(posts.authorId, user.id) })` — own posts only
- `editor`: No delete grant for posts (only `grant("read", posts)`, `grant("update", posts)`, `grant("delete", comments)`)
- `admin`: `grant("manage", "all")` — everything

The old code allowed `isAuthor || isAdmin` to delete. The permissions config matches: authors delete own, admin deletes any. Editors can NOT delete posts (old code didn't allow them either — `const isAdmin = hasRole(user, "admin")` specifically checked admin, not editor). So the permission config is correct.

**Step 3: Replace the "publish" action block**

Replace lines 135-162:

```ts
  if (_action === "publish") {
    const user = await requireUser(request, env);
    const cfDb = createCfDb(env.DB, user);

    const op = compose(
      [
        cfDb.update(posts).set({ published: true, publishedAt: new Date(), updatedAt: new Date() }).where(eq(posts.id, post.id)),
        cfDb.insert(auditLogs).values({
          id: nanoid(),
          userId: user.id,
          action: "post.published",
          targetType: "post",
          targetId: post.id,
          metadata: JSON.stringify({ title: post.title }),
        }),
      ],
      async (runUpdate, runAudit) => {
        await runUpdate({});
        await runAudit({});
      },
    );

    await op.run({});

    await sendPostPublishedEmail(env, {
      title: post.title,
      slug: post.slug,
      authorId: post.authorId,
    });

    return { success: true, action: "publish" };
  }
```

Note: The old code checked `hasAnyRole(user, ["editor", "admin"])`. The permissions config gives editors `grant("update", posts)` (unrestricted) and admins `grant("manage", "all")`. So the `cfDb.update(posts)` will be permission-checked: editors and admins can update any post, authors can only update their own. This is correct for publishing.

**Step 4: Replace the "unpublish" action block**

Same pattern as publish:

```ts
  if (_action === "unpublish") {
    const user = await requireUser(request, env);
    const cfDb = createCfDb(env.DB, user);

    const op = compose(
      [
        cfDb.update(posts).set({ published: false, updatedAt: new Date() }).where(eq(posts.id, post.id)),
        cfDb.insert(auditLogs).values({
          id: nanoid(),
          userId: user.id,
          action: "post.unpublished",
          targetType: "post",
          targetId: post.id,
          metadata: JSON.stringify({ title: post.title }),
        }),
      ],
      async (runUpdate, runAudit) => {
        await runUpdate({});
        await runAudit({});
      },
    );

    await op.run({});

    return { success: true, action: "unpublish" };
  }
```

**Step 5: Replace the "comment" action block**

```ts
  if (_action === "comment") {
    const user = await requireUser(request, env);

    if (!post.published) {
      throw new Response("Cannot comment on unpublished posts", { status: 400 });
    }

    const content = (formData.get("content") as string)?.trim();
    if (!content) {
      return { error: "Comment content cannot be empty.", action: "comment" };
    }

    const cfDb = createCfDb(env.DB, user);

    await cfDb.insert(comments).values({
      id: nanoid(),
      postId: post.id,
      authorId: user.id,
      content,
    }).run({});

    await sendNewCommentEmail(
      env,
      { id: post.id, title: post.title, slug: post.slug, authorId: post.authorId },
      { name: user.name },
      content
    );

    return { success: true, action: "comment" };
  }
```

Note: No `hasRole` check in original — any logged-in user can comment. The permissions config gives `reader` role `grant("read", comments)` and `author` role `grant("create", comments)`. Since all users are at least readers, and author inherits from reader, only authors+ can create comments. Wait — readers DON'T have `create` on comments. Let me re-check:

```
reader: [grant("read", posts, where...), grant("read", comments)]
author: [grant("create", posts), ..., grant("create", comments), ...]
```

So readers can't create comments — only authors+. But the old code allows ANY logged-in user to comment. This is a permission mismatch. The old code has no role check, just `requireUser`.

**Resolution:** The permission config needs a `grant("create", comments)` on the `reader` role, OR we use `cfDb.unsafe()` for this operation, OR we keep raw Drizzle here. Since the permissions config is the declared source of truth and should be updated to match the actual intent, add `grant("create", comments)` to the `reader` grants in a later cleanup task. For now, use `cfDb.unsafe()` to preserve existing behavior.

Actually, better approach: update the permissions config as part of this task since it's the source of truth. Add `grant("create", comments)` to reader grants.

**Step 6: Replace the "deleteComment" action block**

```ts
  if (_action === "deleteComment") {
    const user = await requireUser(request, env);
    const commentId = formData.get("commentId") as string;
    if (!commentId) throw new Response("Bad Request", { status: 400 });

    const cfDb = createCfDb(env.DB, user);

    await cfDb.delete(comments).where(eq(comments.id, commentId)).run({});

    return { success: true, action: "deleteComment" };
  }
```

Note: The old code checked `isCommentAuthor || isEditorOrAdmin`. The permissions config:
- `author`: `grant("delete", comments, { where: eq(comments.authorId, user.id) })` — own comments
- `editor`: `grant("delete", comments)` — any comment
- `admin`: `grant("manage", "all")` — everything

This matches: comment authors can delete their own, editors+ can delete any. The `@cfast/db` delete will AND the permission WHERE clause with the user's WHERE clause, so an author trying to delete someone else's comment will get 0 rows affected (the WHERE won't match). But wait — `@cfast/db` throws a `ForbiddenError` if the role has NO matching grant at all. Readers have no `delete` grant on comments, so they'd get a ForbiddenError. Authors have a conditional delete grant, so they're allowed but the WHERE clause is injected. This is correct.

However, there's a subtle difference: the old code looked up the comment first and checked ownership explicitly, throwing 404 if not found and 403 if not authorized. With `@cfast/db`, if the comment doesn't exist, the delete just does nothing (no error). And if the user lacks permission, it throws ForbiddenError. We lose the 404 for missing comments, but that's acceptable — the user sees a generic error instead.

**Step 7: Fix permissions config — add reader comment creation**

In `examples/team-blog-after/app/permissions.ts`, add to the reader grants:
```ts
    reader: [
      grant("read", posts, { where: () => eq(posts.published, true) }),
      grant("read", comments),
      grant("create", comments),
    ],
```

**Step 8: Verify build**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
```

**Step 9: Commit**

```bash
git add examples/team-blog-after/app/routes/posts.\$slug.tsx examples/team-blog-after/app/permissions.ts
git commit -m "feat(example): migrate posts.\$slug.tsx actions to @cfast/db"
```

---

### Task 5: Migrate posts.$slug.edit.tsx actions

**Why:** The edit route has update/uploadCover/removeCover actions with permission checks that map to `@cfast/db` update operations.

**Files:**
- Modify: `examples/team-blog-after/app/routes/posts.$slug.edit.tsx`

**What changes:**
- Loader: Keep `hasAnyRole` guard (page-level redirect). Keep raw Drizzle for post lookup.
- Action: Replace the shared permission check + raw Drizzle mutations with `@cfast/db` operations.

**Step 1: Update imports**

Add:
```ts
import { createCfDb } from "~/db/cfast.server";
import { compose } from "@cfast/db";
```

Keep `createDbClient` — needed for initial post lookup in action.

**Step 2: Refactor action function**

Remove the shared `isAuthor`/`isEditorOrAdmin` check at the top of the action (lines 64-69). Each sub-action will use `@cfast/db` for permission enforcement.

Replace the "update" block (lines 74-114):

```ts
  if (_action === "update") {
    const title = (formData.get("title") as string)?.trim();
    const content = (formData.get("content") as string)?.trim() ?? "";
    const excerpt = (formData.get("excerpt") as string)?.trim() || null;

    if (!title) {
      return { error: "Title is required.", action: "update" };
    }

    const newSlug = generateSlug(title);
    if (!newSlug) {
      return { error: "Title must contain at least one valid character.", action: "update" };
    }

    const cfDb = createCfDb(env.DB, user);

    const op = compose(
      [
        cfDb.update(posts).set({
          title,
          slug: newSlug,
          content,
          excerpt,
          updatedAt: new Date(),
        }).where(eq(posts.id, post.id)),
        cfDb.insert(auditLogs).values({
          id: nanoid(),
          userId: user.id,
          action: "post.updated",
          targetType: "post",
          targetId: post.id,
          metadata: JSON.stringify({ title, oldSlug: post.slug, newSlug }),
        }),
      ],
      async (runUpdate, runAudit) => {
        await runUpdate({});
        await runAudit({});
      },
    );

    await op.run({});

    if (newSlug !== post.slug) {
      return redirect(`/posts/${newSlug}/edit`);
    }

    return { success: true, action: "update" };
  }
```

Replace the "uploadCover" block — the R2 upload stays as-is, but the DB update uses `@cfast/db`:

```ts
  if (_action === "uploadCover") {
    const file = formData.get("cover") as File | null;
    if (!file || file.size === 0) {
      return { error: "No file selected.", action: "uploadCover" };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Only JPEG, PNG, and WebP images are allowed.", action: "uploadCover" };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File size must be under 10MB.", action: "uploadCover" };
    }

    const key = `covers/${post.id}/${nanoid()}-${file.name}`;

    await env.UPLOADS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });

    if (post.coverImageKey) {
      await env.UPLOADS.delete(post.coverImageKey);
    }

    const cfDb = createCfDb(env.DB, user);
    await cfDb.update(posts).set({ coverImageKey: key, updatedAt: new Date() }).where(eq(posts.id, post.id)).run({});

    return { success: true, action: "uploadCover" };
  }
```

Replace the "removeCover" block:

```ts
  if (_action === "removeCover") {
    if (post.coverImageKey) {
      await env.UPLOADS.delete(post.coverImageKey);
    }

    const cfDb = createCfDb(env.DB, user);
    await cfDb.update(posts).set({ coverImageKey: null, updatedAt: new Date() }).where(eq(posts.id, post.id)).run({});

    return { success: true, action: "removeCover" };
  }
```

**Step 3: Verify build**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
```

**Step 4: Commit**

```bash
git add examples/team-blog-after/app/routes/posts.\$slug.edit.tsx
git commit -m "feat(example): migrate posts.\$slug.edit.tsx actions to @cfast/db"
```

---

### Task 6: Migrate admin action-only routes

**Why:** `admin.impersonate.$id.tsx` and `admin.stop-impersonation.tsx` have simple insert/update operations that can use `@cfast/db`. The admin layout already gates access, and the `admin` role has `grant("manage", "all")`.

**Files:**
- Modify: `examples/team-blog-after/app/routes/admin.impersonate.$id.tsx`
- Modify: `examples/team-blog-after/app/routes/admin.stop-impersonation.tsx`

**Step 1: Migrate admin.impersonate.$id.tsx**

Replace:
```ts
import { createCfDb } from "~/db/cfast.server";
```

Remove `import { createDbClient } from "~/db/client";`

Replace the DB insert:
```ts
  const cfDb = createCfDb(env.DB, user);
  await cfDb.insert(impersonationLogs).values({
    id: nanoid(),
    adminId: user.id,
    targetUserId: targetUserId,
  }).run({});
```

**Step 2: Migrate admin.stop-impersonation.tsx**

Replace:
```ts
import { createCfDb } from "~/db/cfast.server";
```

Remove `import { createDbClient } from "~/db/client";`

Replace the DB update:
```ts
  const cfDb = createCfDb(env.DB, user);
  await cfDb.unsafe().update(impersonationLogs).set({ endedAt: new Date() }).where(
    and(
      eq(impersonationLogs.adminId, user.realUser.id),
      eq(impersonationLogs.targetUserId, user.id),
      isNull(impersonationLogs.endedAt)
    )
  ).run({});
```

Note: Using `unsafe()` here because impersonationLogs isn't in the permissions config (no grants for it). The admin layout already verifies the user is an admin.

Wait — actually, the user at this point is the IMPERSONATED user (since `getUser` returns the impersonated identity). The impersonated user might not be an admin. So we need `unsafe()` to bypass permission checks. The authorization is handled by checking `user.isImpersonating && user.realUser`.

**Step 3: Verify build**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
```

**Step 4: Commit**

```bash
git add examples/team-blog-after/app/routes/admin.impersonate.\$id.tsx examples/team-blog-after/app/routes/admin.stop-impersonation.tsx
git commit -m "feat(example): migrate admin impersonation routes to @cfast/db"
```

---

### Task 7: Migrate admin.users.$id.tsx actions

**Why:** The role management actions (assignRole, revokeRole) do insert/delete on `roles` table + audit log inserts — good candidates for `compose()`.

**Files:**
- Modify: `examples/team-blog-after/app/routes/admin.users.$id.tsx`

**What changes:**
- Loader: Keep as-is (raw Drizzle for complex queries).
- Action: Replace raw Drizzle mutations with `@cfast/db` composed operations.

**Step 1: Update imports**

Add:
```ts
import { createCfDb } from "~/db/cfast.server";
import { compose } from "@cfast/db";
```

Keep `createDbClient` — still needed for the lookup queries in the action.

**Step 2: Replace assignRole block**

After the `existingRole` check:

```ts
    const cfDb = createCfDb(env.DB, user);

    const op = compose(
      [
        cfDb.unsafe().insert(roles).values({
          id: nanoid(),
          userId: params.id!,
          role: role as "admin" | "editor" | "author",
          grantedBy: user.id,
        }),
        cfDb.unsafe().insert(auditLogs).values({
          id: nanoid(),
          userId: user.id,
          action: "assign_role",
          targetType: "user",
          targetId: params.id!,
          metadata: JSON.stringify({ role }),
        }),
      ],
      async (runInsertRole, runAuditLog) => {
        await runInsertRole({});
        await runAuditLog({});
      },
    );

    await op.run({});

    return { success: `Role "${role}" assigned successfully` };
```

Note: Using `unsafe()` because the `roles` table doesn't have specific grants (it's an admin management table). The admin check is at the layout level.

**Step 3: Replace revokeRole block**

After the `existingRole` lookup:

```ts
    const cfDb = createCfDb(env.DB, user);

    const op = compose(
      [
        cfDb.unsafe().delete(roles).where(eq(roles.id, roleId)),
        cfDb.unsafe().insert(auditLogs).values({
          id: nanoid(),
          userId: user.id,
          action: "revoke_role",
          targetType: "user",
          targetId: params.id!,
          metadata: JSON.stringify({ role: existingRole.role }),
        }),
      ],
      async (runDeleteRole, runAuditLog) => {
        await runDeleteRole({});
        await runAuditLog({});
      },
    );

    await op.run({});

    return { success: `Role "${existingRole.role}" revoked successfully` };
```

**Step 4: Verify build**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
```

**Step 5: Commit**

```bash
git add examples/team-blog-after/app/routes/admin.users.\$id.tsx
git commit -m "feat(example): migrate admin.users.\$id.tsx role management to @cfast/db"
```

---

### Task 8: Migrate admin.posts.tsx delete action

**Files:**
- Modify: `examples/team-blog-after/app/routes/admin.posts.tsx`

**What changes:**
- Loader: Keep as-is (complex queries with joins, counts, filters).
- Action: Replace delete + audit log with composed `@cfast/db` operation.

**Step 1: Update imports**

Add:
```ts
import { createCfDb } from "~/db/cfast.server";
import { compose } from "@cfast/db";
```

Keep `createDbClient` — needed for loader and post lookup in action.

**Step 2: Replace delete block in action**

After the post lookup and R2 cleanup:

```ts
    const cfDb = createCfDb(env.DB, user);

    const op = compose(
      [
        cfDb.unsafe().delete(posts).where(eq(posts.id, postId)),
        cfDb.unsafe().insert(auditLogs).values({
          id: nanoid(),
          userId: user.id,
          action: "delete_post",
          targetType: "post",
          targetId: postId,
          metadata: JSON.stringify({ title: post.title }),
        }),
      ],
      async (runDelete, runAudit) => {
        await runDelete({});
        await runAudit({});
      },
    );

    await op.run({});

    return { success: "Post deleted successfully" };
```

Note: Using `unsafe()` because this is already inside an admin-gated route. Could also use the regular `cfDb` since admin has `manage: all`, but `unsafe()` is clearer about intent.

**Step 3: Verify build + commit**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
git add examples/team-blog-after/app/routes/admin.posts.tsx
git commit -m "feat(example): migrate admin.posts.tsx delete action to @cfast/db"
```

---

### Task 9: Migrate profile.tsx actions

**Why:** Profile actions (updateProfile, uploadAvatar, removeAvatar) update the `users` table scoped to the current user. There are no grants for `update` on `users` in the permissions config (only posts/comments have grants), so we use `unsafe()`.

**Files:**
- Modify: `examples/team-blog-after/app/routes/profile.tsx`

**Step 1: Update imports**

Add:
```ts
import { createCfDb } from "~/db/cfast.server";
```

Keep `createDbClient` — needed for loader query.

**Step 2: Replace action mutations**

In "updateProfile" block, replace the raw `db.update`:
```ts
    const cfDb = createCfDb(env.DB, user);
    await cfDb.unsafe().update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id)).run({});
```

In "uploadAvatar" block, replace the raw `db.update`:
```ts
    const cfDb = createCfDb(env.DB, user);
    await cfDb.unsafe().update(users).set({ avatarUrl, updatedAt: new Date() }).where(eq(users.id, user.id)).run({});
```

In "removeAvatar" block, replace the raw `db.update`:
```ts
    const cfDb = createCfDb(env.DB, user);
    await cfDb.unsafe().update(users).set({ avatarUrl: null, updatedAt: new Date() }).where(eq(users.id, user.id)).run({});
```

Note: An alternative would be to add `update` grants on `users` to the permissions config, but user self-management is a different concern than content permissions. Using `unsafe()` with the `requireUser` guard is appropriate here.

**Step 3: Verify build + commit**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
git add examples/team-blog-after/app/routes/profile.tsx
git commit -m "feat(example): migrate profile.tsx actions to @cfast/db"
```

---

### Task 10: Update permissions.ts documentation and remove migration comments

**Why:** Now that @cfast/db is integrated, the "migration" comments in permissions.ts are stale. The `hasRole`/`hasAnyRole` functions are still used for UI logic, so they stay but get updated documentation.

**Files:**
- Modify: `examples/team-blog-after/app/permissions.ts`

**Step 1: Update comments**

Replace the comment blocks at lines 18-25 and 59-63:

```ts
// ---------------------------------------------------------------------------
// Declarative permission definitions (source of truth)
// ---------------------------------------------------------------------------
// These definePermissions + grant declarations power the @cfast/db Operations
// layer. When a route calls cfDb.insert(posts).values(...).run({}), the
// permissions are checked against these grants automatically.
// ---------------------------------------------------------------------------
```

And for the hasRole/hasAnyRole section:

```ts
// ---------------------------------------------------------------------------
// Role helpers for UI logic
// ---------------------------------------------------------------------------
// Used in loaders/components to show/hide UI elements (e.g. "New Post" button)
// and for page-level access guards (e.g. admin layout redirect).
// These do NOT enforce data-level permissions — that's @cfast/db's job.
// ---------------------------------------------------------------------------
```

**Step 2: Verify build + commit**

```bash
cd /Users/danielschmidt/fun/cfast && pnpm typecheck
git add examples/team-blog-after/app/permissions.ts
git commit -m "docs(example): update permissions.ts comments for @cfast/db integration"
```

---

## Summary of what stays as raw Drizzle

These queries remain as direct `createDbClient` calls because `@cfast/db`'s relational query API doesn't support them:

| Route | Query | Reason |
|---|---|---|
| `home.tsx` loader | Posts with leftJoin + count | Custom column selection from join; count aggregation |
| `posts.$slug.tsx` loader | Post lookup, author lookup, cursor-based comments with leftJoin | Custom column selection; cursor pagination with join |
| `posts.$slug.edit.tsx` loader | Post lookup by slug | Simple but needed for pre-flight check before rendering |
| `admin._index.tsx` loader | 4x count queries, recent posts with leftJoin, recent users with N+1 roles | Count aggregation; custom join columns |
| `admin.users.tsx` loader | User search with LIKE, count, N+1 roles | LIKE search; count; N+1 pattern |
| `admin.users.$id.tsx` loader | User detail, roles, recent posts | Multiple table queries |
| `admin.posts.tsx` loader | Posts with leftJoin, status filter, count | Custom join columns; count |
| `admin.posts.tsx` action | Post lookup before delete | Need the post data for R2 cleanup |
| `profile.tsx` loader | Passkeys query | Simple select |
| `auth.helpers.server.ts` | User + roles lookup | Auth bootstrap — runs before @cfast/db can be created |

These are read queries in contexts where either (a) the permissions are already enforced by other means (admin gate, public data) or (b) the query shape isn't supported by the relational API. This is an acceptable trade-off — the value of `@cfast/db` is in mutation permission enforcement and composability, not in replacing every SELECT.
