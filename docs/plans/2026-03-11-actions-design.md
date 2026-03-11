# @cfast/actions Design

**Goal:** Type-safe, permission-aware, reusable actions for React Router with automatic multi-action dispatch, loader-injected permissions, and client hooks.

**Architecture:** App-level factory configures context once. Actions are pure operation definitions. Each action (or composed set) produces three facets: `.action` (route handler), `.loader()` (permission-injecting wrapper), and `.client` (descriptor for client hooks).

## Factory — App-level Setup

```typescript
// app/actions.server.ts
import { createActions } from "@cfast/actions";
import { requireAuthContext } from "~/auth.helpers.server";
import { createCfDb } from "~/db/cfast.server";
import { env } from "~/env";

export const { createAction, composeActions } = createActions({
  getContext: async (request) => {
    const e = env.get();
    const ctx = await requireAuthContext(request);
    const db = createCfDb(e.DB, ctx);
    return { db, user: ctx.user, grants: ctx.grants };
  },
});
```

Called once per app. `getContext` runs per-request when an action fires or when the loader wrapper computes permissions. The return type of `getContext` defines the `db`, `ctx.user`, and `ctx.grants` types for all actions.

## Action Definitions

```typescript
// app/actions/posts.ts
import { createAction } from "~/actions.server";
import { compose } from "@cfast/db";
import { posts, auditLogs } from "~/db/schema";
import { eq } from "drizzle-orm";

export const deletePost = createAction<{ postId: string }>(
  (db, input, ctx) =>
    db.delete(posts).where(eq(posts.id, input.postId)),
);

export const publishPost = createAction<{ postId: string }>(
  (db, input, ctx) =>
    compose(
      [
        db.update(posts).set({ published: true }).where(eq(posts.id, input.postId)),
        db.insert(auditLogs).values({
          id: crypto.randomUUID(),
          userId: ctx.user.id,
          action: "post.published",
          targetType: "post",
          targetId: input.postId,
        }),
      ],
      async (doUpdate, doAudit) => {
        await doUpdate({});
        await doAudit({});
        return { published: true };
      },
    ),
);
```

No string name required. Names come from object keys in `composeActions` or are unnecessary for single actions.

### What `createAction` returns

An action object with three facets:

- `.action` — A React Router-compatible `action` export. Parses input from `formData` or JSON body, calls `getContext(request)`, runs `operations(db, input, ctx)`.
- `.loader(loaderFn)` — Wraps a loader function, injecting `_actionPermissions` into its response.
- `.client` — A descriptor consumed by `useActions()` on the client.

## Route Usage

### Single action

```typescript
// routes/posts.new.tsx
import { createPost } from "~/actions/posts";

export const action = createPost.action;

export const loader = createPost.loader(async ({ request }) => {
  // normal loader logic
  return { categories };
});
```

No discriminator needed — there's only one handler.

### Multi-action route

```typescript
// routes/posts.$slug.tsx
import { composeActions } from "~/actions.server";
import { deletePost, publishPost, addComment } from "~/actions/posts";

const composed = composeActions({ deletePost, publishPost, addComment });

export const action = composed.action;

export const loader = composed.loader(async ({ request, params }) => {
  const post = await loadPost(params.slug);
  return { post };
});
```

`composeActions` derives discriminator names from object keys (`"deletePost"`, `"publishPost"`, `"addComment"`). A hidden `_action` field routes requests to the correct handler.

## Loader Permission Injection

The `.loader()` wrapper:

1. Runs the wrapped loader function normally
2. Calls `getContext(request)` to get the user's grants
3. For each action, extracts `.permissions` from the `Operation` and checks against grants
4. Merges `_actionPermissions` into the loader response:

```typescript
{
  post: { ... },            // from your loader
  _actionPermissions: {     // injected automatically
    deletePost: { permitted: true, invisible: false, reason: null },
    publishPost: { permitted: false, invisible: false, reason: "Cannot update on 'posts'" },
    addComment: { permitted: true, invisible: false, reason: null },
  },
}
```

- `permitted` — Does the user have the structural permission for this action's operations?
- `invisible` — Should the UI hide this entirely? True when the user has zero grants matching the action's required permissions (not just row-level denial).
- `reason` — Human-readable denial reason, or null if permitted.

## Client Usage

```typescript
// @cfast/actions/client
import { useActions } from "@cfast/actions/client";

function PostActions({ postId }: { postId: string }) {
  const { deletePost, publishPost } = useActions(composed.client);

  const del = deletePost({ postId });
  const pub = publishPost({ postId });

  return (
    <>
      <button
        onClick={pub.submit}
        disabled={!pub.permitted || pub.pending}
        hidden={pub.invisible}
      >
        Publish
      </button>
      <button
        onClick={del.submit}
        disabled={!del.permitted || del.pending}
        hidden={del.invisible}
      >
        Delete
      </button>
    </>
  );
}
```

### `useActions(clientDescriptor)` return value

Returns an object keyed by action name. Each value is a function `(input) => ActionHook`:

| Property | Type | Description |
|---|---|---|
| `permitted` | `boolean` | User has structural permission for all operations |
| `invisible` | `boolean` | User has no matching grants at all — hide the UI |
| `reason` | `string \| null` | Denial reason, null if permitted |
| `submit` | `() => void` | Fires the action via React Router fetcher |
| `pending` | `boolean` | True while submitting |
| `data` | `TOutput \| undefined` | Return value after success |
| `error` | `unknown \| undefined` | Error if failed |

`useActions` reads `useLoaderData()` internally to get the `_actionPermissions` data.

## Discrimination Mechanism

For `composeActions`, when `submit()` is called on the client:

1. A hidden `_action` field is included in the submission (the object key name)
2. `composed.action` reads `_action` from formData/JSON
3. Routes to the correct handler
4. Parses remaining fields as the action's typed input

For single actions, no `_action` field is needed.

## Permission Flow

```
Server (loader):
  getContext(request) → { grants }
  action.permissions → [{ action: "delete", table: posts }]
  check grants against permissions → { permitted, invisible, reason }
  inject into loader response as _actionPermissions

Client:
  useActions reads useLoaderData()._actionPermissions
  Returns pre-computed permitted/invisible per action
  No permission logic in client bundle

Server (action):
  getContext(request) → { db, user, grants }
  Parse input from formData/JSON
  operations(db, input, ctx) → Operation
  Operation.run() enforces row-level permissions
  ForbiddenError if denied at row level
```

## Package Exports

```
@cfast/actions
├── .          → Server: createActions, Serializable type
└── /client    → Client: useActions
```

Server code stays out of client bundles.

## Dependencies

- `@cfast/permissions` — for checking grants against operation permissions
- `@cfast/db` — peer dep for `Db` and `Operation` types
- `react-router` — peer dep for loader/action types and `useFetcher`
- `react` — peer dep for hooks
