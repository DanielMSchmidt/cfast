# @cfast/permissions

**Define permissions once. Enforce everywhere. No duplication between what you check and what you execute.**

`@cfast/permissions` is an isomorphic, Drizzle-native permission system that brings application-level row-level security to Cloudflare D1. It draws inspiration from [CASL](https://casl.js.org/)'s `can(action, subject)` mental model but goes further: permissions are not just boolean checks, they're Drizzle `where` clauses that filter data at the query level.

This is the foundation of the cfast permission story. You define your permissions here. `@cfast/db` enforces them as lazy operations. `@cfast/actions` composes them across multi-step workflows. The same permission definitions that guard your database queries also tell your UI which buttons to show — with zero duplication.

## Design Goals

- **Isomorphic.** The same permission definitions work on client and server. No duplication, no drift.
- **Drizzle-native.** Permissions compile down to Drizzle `where` clauses. They don't sit alongside your queries, they *become* your queries.
- **Type-safe.** Roles, actions, and subjects are all type-checked. If you misspell a permission, TypeScript tells you.
- **D1-first.** Cloudflare D1 (SQLite) has no native RLS. This library provides application-level RLS with the same guarantees.
- **Zero boilerplate.** You never write a permission check and then repeat the same logic in your query. The operation *is* the permission declaration.

## API

### `definePermissions(config)`

Creates a permission configuration that can be shared between `@cfast/db` (server-side enforcement) and `@cfast/actions` (client-side introspection).

```typescript
import { definePermissions, grant } from "@cfast/permissions";
import { eq } from "drizzle-orm";
import { posts, comments, users, auditLogs } from "./schema";

export const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,

  grants: {
    anonymous: [
      grant("read", posts, { where: (post) => eq(post.published, true) }),
      grant("read", comments),
    ],

    user: [
      grant("read", posts, { where: (post) => eq(post.published, true) }),
      grant("create", posts),
      grant("update", posts, { where: (post, user) => eq(post.authorId, user.id) }),
      grant("delete", posts, { where: (post, user) => eq(post.authorId, user.id) }),
      grant("create", comments),
      grant("delete", comments, { where: (comment, user) => eq(comment.authorId, user.id) }),
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

**Parameters:**

| Field | Type | Description |
|---|---|---|
| `roles` | `readonly string[]` | All roles in your application, declared with `as const` for type inference. |
| `grants` | `Record<Role, Grant[]>` | A map from role to an array of `grant()` calls. Every role must be represented. |
| `hierarchy` | `Partial<Record<Role, Role[]>>` | Optional. Declares which roles inherit from which. Not every role needs an entry. See [Role Hierarchy](#role-hierarchy). |

**Returns:** A `Permissions` object that you pass to `createDb()` and can import on the client.

### `grant(action, subject, options?)`

Declares that a role can perform `action` on `subject`, optionally restricted by a `where` clause.

**Parameters:**

| Field | Type | Description |
|---|---|---|
| `action` | `"read" \| "create" \| "update" \| "delete" \| "manage"` | The operation being permitted. `"manage"` is shorthand for all four CRUD actions. |
| `subject` | `Table \| "all"` | A Drizzle table reference, or `"all"` to apply to every table. |
| `options.where` | `(columns, user) => SQL \| undefined` | Optional. A Drizzle filter expression that restricts which rows this grant applies to. Compiles to a SQL `WHERE` clause at query time. |

**Action semantics:**

| Action | Maps to | Used by |
|---|---|---|
| `"read"` | `SELECT` queries | `db.query()` — adds the `where` clause to filter results |
| `"create"` | `INSERT` statements | `db.insert()` — boolean check before execution |
| `"update"` | `UPDATE` statements | `db.update()` — boolean check + optional row-level `where` |
| `"delete"` | `DELETE` statements | `db.delete()` — boolean check + optional row-level `where` |
| `"manage"` | All of the above | Shorthand for granting full CRUD access |

**The `where` clause:**

The `where` function receives two arguments:

1. **`row`** — A reference to the table's columns. Use this to build Drizzle filter expressions.
2. **`user`** — The current user object (from `@cfast/auth`). Use this for ownership checks.

```typescript
// Only allow users to update their own posts
grant("update", posts, {
  where: (post, user) => eq(post.authorId, user.id),
});

// Only allow reading published posts
grant("read", posts, {
  where: (post) => eq(post.published, true),
});
```

A `grant` without a `where` clause means the permission applies to all rows:

```typescript
// Editors can read all posts, regardless of published status
grant("read", posts),
```

**How `where` clauses are applied:**

- For `"read"` grants: the `where` clause is automatically appended to every `SELECT` query on that table. If the user has multiple read grants on the same table (e.g., from role hierarchy), they are `OR`'d together.
- For `"update"` and `"delete"` grants: the `where` clause is checked against the target rows. If the mutation affects rows outside the permitted set, a `ForbiddenError` is thrown.
- For `"create"` grants: `where` is not applicable (there's no existing row to filter). Create grants are boolean — you either can or can't.

### `PermissionDescriptor`

The structural representation of a permission requirement. This is what `Operation.permissions` returns (see `@cfast/db`).

```typescript
type PermissionDescriptor = {
  action: "read" | "create" | "update" | "delete" | "manage";
  table: Table;
};
```

Permission descriptors are **structural, not value-dependent**. They describe *what kind* of operation is being performed on *which table*, not *which specific rows*. This is what makes it possible to inspect permissions without providing concrete parameter values.

```typescript
// This operation's permissions can be inspected without knowing the postId:
const updatePost = db.update(posts)
  .set({ published: true })
  .where(eq(posts.id, sql.placeholder("postId")));

updatePost.permissions;
// → [{ action: "update", table: posts }]
// No postId needed to know this requires "update" on "posts"
```

### `checkPermissions(role, permissions, descriptors)`

Checks whether a role satisfies a set of permission descriptors. Returns a result object with details about which permissions passed and which failed.

```typescript
import { checkPermissions } from "@cfast/permissions";

const result = checkPermissions("user", permissions, [
  { action: "update", table: posts },
  { action: "create", table: auditLogs },
]);

result.permitted;  // boolean — true only if ALL descriptors are satisfied
result.denied;     // PermissionDescriptor[] — which ones failed
result.reasons;    // string[] — human-readable reasons for each denial
```

This is the low-level checking function. Most users will never call it directly — `Operation.run()` calls it internally, and `@cfast/actions` uses it to pre-compute `permitted` booleans for the client.

**When you might use it directly:**

- Building custom middleware that needs to check permissions outside of a database operation
- Admin UIs that display permission matrices
- Testing: asserting that a role has the expected permissions

### Role Hierarchy

Roles can inherit from other roles to avoid repetition:

```typescript
export const permissions = definePermissions({
  roles: ["anonymous", "user", "editor", "admin"] as const,

  hierarchy: {
    user: ["anonymous"],       // users can do everything anonymous can
    editor: ["user"],          // editors can do everything users can
    admin: ["editor"],         // admins can do everything editors can
  },

  grants: {
    anonymous: [
      grant("read", posts, { where: (post) => eq(post.published, true) }),
    ],

    // Only define the *additional* permissions per role
    user: [
      grant("create", posts),
      grant("update", posts, { where: (post, user) => eq(post.authorId, user.id) }),
      grant("delete", posts, { where: (post, user) => eq(post.authorId, user.id) }),
    ],

    editor: [
      // Editors inherit "read published" from anonymous (via user),
      // but this unrestricted grant takes precedence
      grant("read", posts),
      grant("update", posts),
      grant("delete", posts),
    ],

    admin: [
      grant("manage", "all"),
    ],
  },
});
```

**Resolution rules:**

1. A role's effective grants = its own grants + all grants from roles it inherits from (recursively).
2. When multiple grants apply to the same action+table, their `where` clauses are `OR`'d. This means a more permissive grant always wins — if an editor inherits `read posts WHERE published = true` from user but also has `read posts` (no filter), the editor sees all posts.
3. `grant("manage", "all")` on any role in the hierarchy means that role can do everything. Period.
4. Circular hierarchies are detected at runtime and throw an `Error` (e.g., `"Circular role hierarchy detected: 'editor' inherits from itself"`).

### `ForbiddenError`

Thrown when a permission check fails during `Operation.run()`.

```typescript
import { ForbiddenError } from "@cfast/permissions";

try {
  await deletePostOp.run({ postId: "abc" });
} catch (err) {
  if (err instanceof ForbiddenError) {
    err.action;      // "delete"
    err.table;       // posts table reference
    err.role;        // "user"
    err.message;     // "Role 'user' cannot delete on 'posts'"
    err.descriptors; // the full list of PermissionDescriptor[] that were checked
  }
}
```

`ForbiddenError` extends `Error`. It has a `toJSON()` method, making it JSON-serializable so it can cross the server/client boundary in action responses.

### `CRUD_ACTIONS`

A readonly array of the four CRUD action strings, useful for iteration:

```typescript
import { CRUD_ACTIONS } from "@cfast/permissions";

CRUD_ACTIONS; // ["read", "create", "update", "delete"]
```

### Client Entrypoint

Import from `@cfast/permissions/client` in client bundles to avoid pulling in server-only code (like `definePermissions`, `grant`, and `checkPermissions`). The client entrypoint exports only types and the `ForbiddenError` class:

```typescript
import { ForbiddenError } from "@cfast/permissions/client";
import type { PermissionAction, CrudAction, PermissionDescriptor, PermissionCheckResult } from "@cfast/permissions/client";
```

## How Permissions Flow Through the System

```
definePermissions()          @cfast/permissions (isomorphic)
        │
        ▼
   createDb({ permissions }) @cfast/db (server)
        │
        ▼
  db.query / db.update / ... returns Operation
        │
        ├─► .permissions     → PermissionDescriptor[]  (structural, no values needed)
        │
        └─► .run(params)     → checkPermissions() → execute via Drizzle prepared statement
                │
                ├─► Success  → returns query results
                └─► Denied   → throws ForbiddenError

  createAction({ operations })  @cfast/actions
        │
        ├─► Server: calls .run() which checks + executes
        └─► Client: server pre-computes .permitted boolean from .permissions
```

### Key insight: permissions are structural

The permission system has two layers:

1. **Structural layer** (`PermissionDescriptor`) — "does this role have *any* grant for `update` on `posts`?" This is what `.permissions` exposes. It can be checked without concrete values and is what the client uses for UI adaptation.

2. **Row-level layer** (`where` clauses) — "does this role's grant for `update` on `posts` include *this specific row*?" This is checked at execution time inside `.run()` when concrete parameter values are available.

The structural layer enables composition and client-side introspection. The row-level layer provides the actual security enforcement.

## Architecture

```
@cfast/permissions (isomorphic, ~3KB)
├── definePermissions()          — configuration
├── grant()                      — grant builder
├── checkPermissions()           — structural permission checking
├── PermissionDescriptor         — structural type
├── ForbiddenError               — error class
├── Role hierarchy resolution    — flattens inherited grants
│
├── Server (used by @cfast/db):
│   └── Compiles where clauses to Drizzle SQL expressions
│
└── Client (used by @cfast/actions):
    └── PermissionDescriptor is JSON-serializable for server→client transfer
```

The isomorphic core has no server-only dependencies. The Drizzle query compilation (turning `where` functions into actual SQL) lives in `@cfast/db`, so the client bundle never includes it.

## Integration

- **`@cfast/db`** — Consumes `permissions` in `createDb()`. Every operation returned by the db is permission-aware. See the `@cfast/db` README for the full Operation API.
- **`@cfast/actions`** — Actions define their operations, and the framework extracts permission descriptors for client-side introspection. See the `@cfast/actions` README.
- **`@cfast/admin`** — Admin CRUD operations go through the same permission system. An admin sees all rows. A moderator sees what the moderator role allows.
