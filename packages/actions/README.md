# @cfast/actions

**Reusable, type-safe, permission-aware actions for React Router. Define your operations once — permissions and execution come from the same place.**

React Router gives you one `action` per route. If a page has "Create Post", "Delete Post", and "Toggle Published", you end up writing a switch statement over a hidden form field. Every project. Every route. Every time.

`@cfast/actions` fixes this with two primitives:

- **`createAction`** — Define a single action with typed, serializable input and database operations. The operations carry their own permission requirements. No separate `requires` block, no `db.guarded()` calls, no duplication.
- **`composeActions`** — Combine multiple actions into one route `action` export. The dispatcher is generated, not hand-written.

## Design Goals

- **Actions are values.** A `createAction` call returns a reusable action that can be exported, imported, passed to UI components, and composed with other actions. Not bound to a specific route.
- **Serializable by construction.** Input and output types are constrained to JSON-serializable data at the type level. If it can't cross the server/client boundary, TypeScript tells you.
- **Single source of truth.** An action's operations define both what permissions are needed and what SQL runs. You never declare permissions in one place and repeat the operations in another.
- **Composable.** A single action can require multiple permissions across multiple tables. A single `permitted` boolean tells you if the whole thing is allowed.
- **React Router native.** Works with React Router's `action` export, `useActionData`, `useFetcher`, and file-based routing.

## API

### `createAction(config)`

Creates a reusable, permission-aware action.

```typescript
import { createAction } from "@cfast/actions";

const createPost = createAction({
  input: {
    title: "" as string,
    content: "" as string,
  },

  operations: (db, input, ctx) => {
    const insert = db.insert(posts).values({
      id: sql.placeholder("id"),
      title: sql.placeholder("title"),
      content: sql.placeholder("content"),
      authorId: sql.placeholder("authorId"),
    });

    return compose([insert], (doInsert) => {
      const post = doInsert({
        id: crypto.randomUUID(),
        title: input.title,
        content: input.content,
        authorId: ctx.user.id,
      });
      return redirect(`/posts/${post.slug}`);
    });
  },
});
```

**Parameters:**

| Field | Type | Description |
|---|---|---|
| `input` | `Serializable` | A type exemplar that defines the action's input shape. TypeScript infers the type from this. Functions, Dates, and other non-serializable values are compile-time errors. |
| `operations` | `(db, input, ctx) => Operation` | A function that receives the secured db, the validated input, and the request context. Returns an `Operation` (from `@cfast/db`) — either a single operation or a `compose()`'d workflow. |

**Returns:** An `Action` object with:
- `.permissions` — extracted from the returned `Operation`, available without executing
- Server-side: callable as a React Router action handler
- Client-side: introspectable via `useAction()`

**The `operations` function receives:**

| Argument | Type | Description |
|---|---|---|
| `db` | `Db` | The secured database instance (from `@cfast/db`). All operations on it return lazy `Operation` objects. |
| `input` | `TInput` | The validated, deserialized action input. |
| `ctx` | `ActionContext` | Request context including `ctx.user`, `ctx.request`, `ctx.params`. |

**The `Serializable` type constraint:**

Input types must be JSON-serializable. The type system enforces this:

```typescript
const broken = createAction({
  input: {
    callback: () => {},  // Type error: () => void is not assignable to Serializable
    date: new Date(),    // Type error: Date is not assignable to Serializable
  },
  operations: (db, input) => { /* ... */ },
});
```

### Simple Actions (Single Operation)

When an action only needs one database operation, you can return it directly without `compose`:

```typescript
const deletePost = createAction({
  input: { postId: "" as string },

  operations: (db, input) =>
    db.delete(posts).where(eq(posts.id, sql.placeholder("postId"))),
});

// The action's permissions are derived from the single operation:
deletePost.permissions;
// → [{ action: "delete", table: posts }]
```

When the action runs, `.run({ postId: input.postId })` is called automatically, mapping input fields to placeholders by name.

### Multi-Operation Actions with `compose`

When an action needs multiple database operations, use `compose` from `@cfast/db`:

```typescript
import { compose } from "@cfast/db";

const publishPost = createAction({
  input: { postId: "" as string },

  operations: (db, input, ctx) => {
    const update = db.update(posts)
      .set({ published: true, publishedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(posts.id, sql.placeholder("postId")));

    const audit = db.insert(auditLogs).values({
      action: sql.placeholder("auditAction"),
      targetId: sql.placeholder("targetId"),
      userId: sql.placeholder("userId"),
    });

    return compose([update, audit], async (doUpdate, doAudit) => {
      await doUpdate({ postId: input.postId });
      await doAudit({
        auditAction: "publish",
        targetId: input.postId,
        userId: ctx.user.id,
      });
      return { published: true };
    });
  },
});

publishPost.permissions;
// → [{ action: "update", table: posts }, { action: "create", table: auditLogs }]
```

**What happens when the action runs on the server:**

1. `operations(db, input, ctx)` is called to get the composed `Operation`
2. All `.permissions` are checked against the user's role
3. If any permission is denied → `ForbiddenError` is thrown, no SQL executes
4. If all pass → the executor function runs, calling each sub-operation

### Actions That Reuse Other Actions' Operations

Since operations are just values, one action can include another's operations:

```typescript
const archivePost = createAction({
  input: { postId: "" as string },

  operations: (db, input, ctx) => {
    // Get the publish operation (which is itself a compose'd Operation)
    const publishOp = publishPost.buildOperations(db, input, ctx);

    const archive = db.update(posts)
      .set({ archived: true })
      .where(eq(posts.id, sql.placeholder("postId")));

    return compose([publishOp, archive], async (doPublish, doArchive) => {
      await doPublish();
      await doArchive({ postId: input.postId });
      return { archived: true };
    });
  },
});

archivePost.permissions;
// → union of publishPost.permissions + [{ action: "update", table: posts }]
// After dedup: [{ action: "update", table: posts }, { action: "create", table: auditLogs }]
```

### Single Action Route

If a route only has one action, export it directly:

```typescript
// app/routes/posts.new.tsx
import { createPost } from "~/actions/posts";

export const action = createPost;
```

### Multi-Action Route with `composeActions`

When a route needs multiple actions, `composeActions` handles discrimination automatically:

```typescript
// app/routes/posts.$slug.tsx
import { composeActions } from "@cfast/actions";
import { deletePost, publishPost, unpublishPost, addComment } from "~/actions/posts";

export const action = composeActions(deletePost, publishPost, unpublishPost, addComment);
```

No switch statement, no hidden `_action` field to manage. `composeActions` generates the dispatcher, serializes/deserializes inputs, and routes to the right handler.

Note: This is `composeActions` (for combining multiple actions into a route handler), not `compose` from `@cfast/db` (for combining multiple operations within a single action). They serve different purposes:

| Function | Package | Purpose |
|---|---|---|
| `compose` | `@cfast/db` | Combine multiple DB operations into one `Operation` with merged permissions |
| `composeActions` | `@cfast/actions` | Combine multiple actions into one React Router route handler |

### How `composeActions` Works

`composeActions` assigns each action a stable discriminator derived from its name. When a form is submitted or `submit()` is called:

1. The discriminator is included automatically (hidden field for forms, part of the payload for programmatic calls)
2. `composeActions` reads the discriminator and routes to the correct action
3. The input is deserialized and validated against the action's input type
4. The action's `operations` function is called to build the `Operation`
5. Permissions are checked (via `Operation.run()`)
6. The executor runs

The client never sees the discrimination mechanism. It just calls `submit()` or renders a `<Form>`.

### Using Actions in Components

#### `useAction(action, input?)`

The primary hook for consuming actions on the client. Returns permission status (pre-computed by the server) and submission controls.

```typescript
import { useAction } from "@cfast/actions";
import { publishPost } from "~/actions/posts";

function PublishButton({ postId }: { postId: string }) {
  const publish = useAction(publishPost, { postId });

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

**Return value:**

| Property | Type | Description |
|---|---|---|
| `permitted` | `boolean` | `true` if the current user has all permissions required by this action's operations. Pre-computed by the server — no permission descriptors are sent to the client. |
| `reason` | `string \| null` | If `permitted` is `false`, a human-readable explanation of which permission failed. `null` if permitted. |
| `invisible` | `boolean` | `true` if the action should be completely hidden (not just disabled). This is `true` when the user lacks a structural permission — e.g., they have no `delete` grant on `posts` at all, not just for this specific row. |
| `submit` | `() => void` | Triggers the action. Serializes the input and sends it to the server. |
| `pending` | `boolean` | `true` while the action is being submitted. |
| `data` | `TOutput \| undefined` | The action's return value after successful execution. |
| `error` | `ActionError \| undefined` | The error if the action failed (including `ForbiddenError` if permissions were denied at execution time). |

**How `permitted` is computed:**

The server extracts `.permissions` from the action's `Operation` and checks them against the user's role via `checkPermissions()` from `@cfast/permissions`. The result (`true`/`false` + reason) is serialized and sent to the client via loader data. The client never receives permission descriptors — just booleans.

This means:
- The client bundle doesn't include permission-checking logic
- Permission descriptors (which reference Drizzle tables) don't cross the server/client boundary
- The `permitted` check is instantaneous on the client — no async call needed

**When `permitted` is `true` but `.run()` still throws:**

`permitted` checks the structural layer ("does this role have an `update` grant on `posts`?"). But the grant might have a row-level `where` clause ("only posts where `authorId = user.id`"). If the user has the structural permission but the specific row doesn't match the `where` clause, `.run()` will throw `ForbiddenError` at execution time.

This is intentional. The client can optimistically show the button (the user *can* update *some* posts), and the server enforces the row-level constraint. The `error` property on `useAction` captures this case.

#### Form submission

```typescript
import { Form } from "@cfast/actions";
import { createPost } from "~/actions/posts";

function NewPostForm() {
  return (
    <Form action={createPost}>
      <input name="title" />
      <textarea name="content" />
      <button type="submit">Create</button>
    </Form>
  );
}
```

The `Form` component type-checks the form fields against the action's input type. Missing or extra fields are compile-time errors.

#### With `@cfast/ui`

```typescript
import { ActionButton } from "@cfast/ui/joy";
import { publishPost } from "~/actions/posts";

<ActionButton action={publishPost} input={{ postId }}>
  Publish
</ActionButton>
```

`ActionButton` consumes `useAction` internally and handles `permitted`, `pending`, `invisible`, and error display automatically.

### Actions Without Permissions

Permissions are optional. If you don't pass `permissions` to `createDb()`, operations have empty `.permissions` and `.run()` executes without checking. `createAction` and `composeActions` are still useful for typed, reusable actions and automatic route dispatching:

```typescript
const subscribe = createAction({
  input: { email: "" as string },
  operations: (db, input) =>
    db.insert(subscribers).values({ email: sql.placeholder("email") }),
});

const unsubscribe = createAction({
  input: { email: "" as string },
  operations: (db, input) =>
    db.delete(subscribers).where(eq(subscribers.email, sql.placeholder("email"))),
});

export const action = composeActions(subscribe, unsubscribe);
```

## Complete Example

A blog with publishing and archiving workflows:

```typescript
// actions/posts.ts
import { createAction } from "@cfast/actions";
import { compose } from "@cfast/db";
import { sql, eq } from "drizzle-orm";
import { posts, auditLogs } from "~/schema";

export const createPost = createAction({
  input: { title: "" as string, content: "" as string },

  operations: (db, input, ctx) =>
    db.insert(posts).values({
      title: sql.placeholder("title"),
      content: sql.placeholder("content"),
      authorId: sql.placeholder("authorId"),
    }),
});

export const publishPost = createAction({
  input: { postId: "" as string },

  operations: (db, input, ctx) => {
    const update = db.update(posts)
      .set({ published: true, publishedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(posts.id, sql.placeholder("postId")));

    const audit = db.insert(auditLogs).values({
      action: sql.placeholder("auditAction"),
      targetId: sql.placeholder("targetId"),
      userId: sql.placeholder("userId"),
    });

    return compose([update, audit], async (doUpdate, doAudit) => {
      await doUpdate({ postId: input.postId });
      await doAudit({
        auditAction: "publish",
        targetId: input.postId,
        userId: ctx.user.id,
      });
      return { published: true };
    });
  },
});

export const deletePost = createAction({
  input: { postId: "" as string },

  operations: (db, input) =>
    db.delete(posts).where(eq(posts.id, sql.placeholder("postId"))),
});
```

```typescript
// app/routes/posts.$slug.tsx
import { composeActions } from "@cfast/actions";
import { useAction } from "@cfast/actions";
import { publishPost, deletePost } from "~/actions/posts";

export const action = composeActions(publishPost, deletePost);

export default function PostPage() {
  const { post } = useLoaderData();
  const publish = useAction(publishPost, { postId: post.id });
  const remove = useAction(deletePost, { postId: post.id });

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>

      <div>
        {!post.published && (
          <button
            onClick={publish.submit}
            disabled={!publish.permitted || publish.pending}
            hidden={publish.invisible}
          >
            {publish.pending ? "Publishing..." : "Publish"}
          </button>
        )}

        <button
          onClick={remove.submit}
          disabled={!remove.permitted || remove.pending}
          hidden={remove.invisible}
        >
          {remove.pending ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}
```

## Integration

- **`@cfast/db`** — Actions use `db` operations and `compose()` to define their work. The `Operation` type is the bridge between actions and the database.
- **`@cfast/permissions`** — Permission definitions flow through `@cfast/db` operations. Actions never call `checkPermissions()` directly — it happens inside `Operation.run()`.
- **`@cfast/ui`** — `ActionButton` consumes `useAction()` for automatic show/hide/disable based on permissions.
- **`@cfast/admin`** — Admin table/row actions are `createAction` instances. The admin UI's CRUD operations go through the same permission pipeline.
- **`@cfast/pagination`** — Independent. Pagination and actions don't depend on each other.
