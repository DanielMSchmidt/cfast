# @cfast/permissions

**Define permissions once. Enforce on the server. Reflect in the UI. Compose across actions.**

`@cfast/permissions` is an isomorphic, Drizzle-native permission system that brings application-level row-level security to Cloudflare D1. It draws inspiration from [CASL](https://casl.js.org/)'s `can(action, subject)` mental model but goes further: permissions are not just boolean checks, they're Drizzle `where` clauses that filter data at the query level.

This is the core of the cfast permission story. It works on both client and server, so the same permission definitions that guard your database queries also tell your UI which buttons to show.

## Design Goals

- **Isomorphic.** The same permission definitions work on client and server. No duplication, no drift.
- **Drizzle-native.** Permissions compile down to Drizzle `where` clauses. They don't sit alongside your queries, they *become* your queries.
- **Composable.** Multi-step actions declare the permissions they need. A single check tells you if the user can perform the entire flow.
- **Type-safe.** Roles, actions, and subjects are all type-checked. If you misspell a permission, TypeScript tells you.
- **D1-first.** Cloudflare D1 (SQLite) has no native RLS. This library provides application-level RLS with the same guarantees.

## Planned API

### Defining Permissions

```typescript
import { definePermissions, grant } from "@cfast/permissions";
import { posts, comments, users } from "./schema";

export const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,

  grants: {
    anonymous: [
      grant("read", posts, { where: (post) => post.published === true }),
      grant("read", comments),
    ],

    user: [
      grant("read", posts, { where: (post) => post.published === true }),
      grant("create", posts),
      grant("update", posts, { where: (post, user) => post.authorId === user.id }),
      grant("delete", posts, { where: (post, user) => post.authorId === user.id }),
      grant("create", comments),
      grant("delete", comments, { where: (comment, user) => comment.authorId === user.id }),
    ],

    editor: [
      grant("read", posts),
      grant("update", posts),
      grant("create", posts),
      grant("delete", posts),
      grant("manage", comments),
    ],

    admin: [
      grant("manage", "all"),
    ],
  },
});
```

### Server-Side Enforcement

When used with `@cfast/db`, permissions are automatically injected into queries:

```typescript
// This query automatically adds: WHERE published = true
// for anonymous users, no filter for editors/admins
const visiblePosts = await db.query(posts).findMany();
```

Mutations are guarded too:

```typescript
// Throws ForbiddenError if user doesn't have update permission on this specific row
await db.guarded(posts).update({ title: "New Title" }).where(eq(posts.id, postId));
```

### Client-Side Checks

```typescript
import { usePermissions } from "@cfast/permissions/client";

function PostActions({ post }) {
  const { can } = usePermissions();

  return (
    <div>
      {can("update", posts, post) && <EditButton />}
      {can("delete", posts, post) && <DeleteButton />}
    </div>
  );
}
```

### Composable Permission Checks

The real power: multi-step actions declare their permission requirements, and a single check tells you if the user can do the whole thing.

```typescript
import { defineAction } from "@cfast/permissions";

const publishPostAction = defineAction({
  // This action needs: update the post + create an audit log + send a notification
  requires: (ctx) => [
    ctx.can("update", posts, { where: (p) => p.id === ctx.input.postId }),
    ctx.can("create", auditLogs),
    ctx.can("execute", notifications),
  ],
  async handler(ctx) {
    // If we get here, all three permissions were verified
    await db.guarded(posts).update({ published: true }).where(eq(posts.id, ctx.input.postId));
    await db.guarded(auditLogs).insert({ action: "publish", targetId: ctx.input.postId });
    await sendNotification(ctx.input.postId);
  },
});
```

On the client, this action's permission requirements are introspectable:

```typescript
import { useAction } from "@cfast/permissions/client";

function PublishButton({ postId }) {
  const publish = useAction(publishPostAction, { postId });

  // publish.permitted is false if ANY of the three requirements fail
  // publish.reason tells you which one(s) failed
  return (
    <ActionButton
      action={publish}
      disabled={!publish.permitted}
      hidden={publish.invisible}
    >
      Publish
    </ActionButton>
  );
}
```

### Role Hierarchy

Roles can inherit from other roles to avoid repetition:

```typescript
definePermissions({
  roles: ["anonymous", "user", "editor", "admin"],
  hierarchy: {
    user: ["anonymous"],       // users can do everything anonymous can
    editor: ["user"],          // editors can do everything users can
    admin: ["editor"],         // admins can do everything editors can
  },
  grants: {
    // Only define the *additional* permissions per role
  },
});
```

## Architecture

```
@cfast/permissions (isomorphic core)
├── Permission definitions (shared)
├── Role hierarchy resolution (shared)
├── can() checks (shared)
├── Action composition (shared)
│
├── Server: compiles to Drizzle where clauses (@cfast/db)
└── Client: boolean checks + UI introspection (@cfast/permissions/client)
```

The isomorphic core is ~3KB. It has no server-only dependencies. The Drizzle query compilation lives in `@cfast/db`, so the client bundle never includes it.
