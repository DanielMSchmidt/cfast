# Permissions Redesign: Lazy Operation-Based API

## Problem

The current design has duplication between permission declaration and execution:

```ts
// Current: declare permissions separately from the operations that need them
const publishPost = createAction({
  requires: (ctx) => [
    ctx.can("update", posts, { where: (p) => p.id === ctx.input.postId }),
    ctx.can("create", auditLogs),
  ],
  handler: async (input, ctx) => {
    await db.guarded(posts).update({ published: true }).where(eq(posts.id, input.postId));
    await db.guarded(auditLogs).insert({ action: "publish", targetId: input.postId });
  },
});
```

`db.guarded()` and `ctx.can()` express the same intent twice. The permission requirements and the actual DB operations are defined in separate places, leading to drift and boilerplate.

## Design

### Core Idea

A secured db returns lazy `Operation` objects instead of promises. An `Operation` carries both its permission requirements and its execution logic. Permissions are structural (table + action) and can be inspected without concrete parameter values.

### The `Operation` Type

```ts
type PermissionDescriptor = {
  action: "read" | "create" | "update" | "delete" | "manage";
  table: Table;
};

type Operation<TParams extends Record<string, unknown>, TResult> = {
  permissions: PermissionDescriptor[];
  run: (params: TParams) => Promise<TResult>;
};
```

- `.permissions` — declarative list of what this operation requires. Available immediately, no params needed.
- `.run(params)` — binds parameters, checks permissions against the current user, throws `ForbiddenError` if denied, then executes via Drizzle prepared statements.

### Creating Operations

The secured db wraps Drizzle and returns `Operation` objects. Parameters use Drizzle's `sql.placeholder()` for prepared-statement-style parameterization:

```ts
import { createDb } from "@cfast/db";

const db = createDb({
  d1: env.DB,
  schema,
  permissions,
  user: currentUser,
});

// Read — permissions compile to additional where clauses
const visiblePosts = db.query(posts).findMany({
  where: eq(posts.category, sql.placeholder("category")),
});
visiblePosts.permissions;
// → [{ action: "read", table: posts }]
visiblePosts.run({ category: "tech" });
// → appends role-based where clause (e.g., published = true for anonymous)

// Update
const updatePost = db.update(posts)
  .set({ published: true })
  .where(eq(posts.id, sql.placeholder("postId")));
updatePost.permissions;
// → [{ action: "update", table: posts }]
updatePost.run({ postId: "abc" });
// → checks permission, executes prepared statement

// Insert
const insertAuditLog = db.insert(auditLogs).values({
  action: sql.placeholder("action"),
  targetId: sql.placeholder("targetId"),
});
insertAuditLog.permissions;
// → [{ action: "create", table: auditLogs }]

// Delete
const removePost = db.delete(posts)
  .where(eq(posts.id, sql.placeholder("postId")));
removePost.permissions;
// → [{ action: "delete", table: posts }]
```

Under the hood, each operation calls Drizzle's `.prepare()` — users get prepared statement performance for free.

### Composing Operations with `compose`

`compose` is an applicative combinator: it takes multiple operations, merges their permissions, and provides executor functions that bind params and run individual operations.

```ts
import { compose } from "@cfast/db";

const publishPost = compose(
  [updatePost, insertAuditLog],
  (doUpdate, doAudit) => {
    doUpdate({ postId: "abc" });
    doAudit({ action: "publish", targetId: "abc" });
    return { published: true };
  },
);

publishPost.permissions;
// → [
//   { action: "update", table: posts },
//   { action: "create", table: auditLogs },
// ]
// Deduplicated union of all sub-operation permissions.

publishPost.run();
// → checks ALL permissions upfront, then executes the composed function
```

Key properties:
- Permissions are merged (deduplicated) from all sub-operations
- All permissions are checked before any operation executes
- The callback receives executor functions, not raw results — you decide when/how to call them
- Returns a new `Operation` with combined permissions

### Integration with `@cfast/actions`

Actions no longer have separate `requires` and `handler`. Just `operations`:

```ts
import { createAction } from "@cfast/actions";

const publishPost = createAction({
  input: { postId: "" as string },

  operations: (db, input) =>
    compose(
      [updatePost, insertAuditLog],
      (doUpdate, doAudit) => {
        doUpdate({ postId: input.postId });
        doAudit({ action: "publish", targetId: input.postId });
        return { published: true };
      },
    ),
});
```

The framework:
1. Calls `operations(db, input)` to get the composed `Operation`
2. Reads `.permissions` to determine what the action requires
3. On the server: `.run()` checks permissions and executes
4. On the client: `permitted: boolean` is pre-computed by the server and sent via loader data

### Client-Side Permission Checks

The server pre-computes permission results and serializes them as booleans. The client never sees permission descriptors.

```tsx
import { useAction } from "@cfast/actions";
import { publishPost } from "~/actions/posts";

function PublishButton({ postId }: { postId: string }) {
  const publish = useAction(publishPost, { postId });

  // publish.permitted — server pre-computed from operation permissions
  // publish.reason   — which permission failed (if any)
  // publish.submit() — calls the action

  return (
    <button
      onClick={publish.submit}
      disabled={!publish.permitted || publish.pending}
      hidden={publish.invisible}
    >
      {publish.pending ? "Publishing..." : "Publish"}
    </button>
  );
}
```

Multi-action routes work the same — each action in a `compose()` gets its own `permitted` boolean:

```tsx
export const action = compose(deletePost, publishPost, unpublishPost);
// Each action's permissions are checked independently
```

### Reads with Role-Based Filtering

For read operations, permissions compile to additional Drizzle `where` clauses (application-level RLS):

```ts
const visiblePosts = db.query(posts).findMany({
  where: eq(posts.category, sql.placeholder("category")),
});

// Anonymous user → WHERE published = true AND category = ?
// Editor user   → WHERE category = ?
// Admin user    → WHERE category = ?
```

The permission-derived where clause is merged with the user-supplied where clause automatically.

### Escape Hatch

```ts
const op = db.unsafe().update(posts).set({ ... }).where(...);
// Returns an Operation with empty permissions — .run() executes without checks
```

`db.unsafe()` is explicit and greppable.

### Nesting `compose`

Composed operations are themselves `Operation` objects, so they nest:

```ts
const archivePost = compose(
  [publishPost, markArchived],
  (doPublish, doArchive) => {
    doPublish();
    doArchive({ postId: "abc" });
  },
);
// archivePost.permissions = union of publishPost.permissions + markArchived.permissions
```

## Architecture

```
@cfast/permissions (isomorphic core)
├── Permission definitions (definePermissions, grant)
├── Role hierarchy resolution
├── PermissionDescriptor type
└── Permission checking logic (role + descriptors → boolean)

@cfast/db (server only)
├── createDb() → secured db instance
├── Operation<TParams, TResult> type
├── Lazy query/insert/update/delete builders → Operation
├── compose() combinator
├── Prepared statement integration (Drizzle .prepare())
├── Permission-to-where-clause compilation (reads)
├── Permission checking (mutations)
└── Cache layer (unchanged)

@cfast/actions (isomorphic)
├── createAction({ input, operations }) — no more requires/handler split
├── compose() for multi-action routes
├── Server: extracts permissions, runs operations
└── Client: useAction() with pre-computed permitted boolean
```

## Key Design Decisions

1. **Applicative, not monadic.** Permissions are collected statically from all operations before any execute. An operation's permissions cannot depend on the result of a previous operation. This is intentional — it enables upfront checking and client-side introspection.

2. **Prepared statements for free.** Since operations use `sql.placeholder()` and are lazy, they map directly to Drizzle's `.prepare()`. Users get query plan caching without thinking about it.

3. **Server computes, client consumes.** Permission descriptors never reach the client. The server resolves them to booleans. This keeps the client bundle small and avoids leaking permission implementation details.

4. **Single source of truth.** The operation definition is both the permission declaration and the execution logic. No duplication, no drift.

5. **Composition via `compose`.** The applicative combinator merges permissions and sequences execution. Composed operations are themselves operations, enabling nesting.
