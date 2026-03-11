# @cfast/actions

Reusable, type-safe, permission-aware actions for React Router. Define operations once — permissions and execution come from the same place.

## Setup

Create a factory that provides context (db, user, grants) for all actions:

```typescript
// app/actions.server.ts
import { createActions } from "@cfast/actions";

export const { createAction, composeActions } = createActions({
  getContext: async ({ request }) => {
    const ctx = await requireAuthContext(request);
    const db = createCfDb(env.DB, ctx);
    return { db, user: ctx.user, grants: ctx.grants };
  },
});
```

`createActions` returns two functions scoped to your context provider: `createAction` and `composeActions`.

## Defining Actions

`createAction<TInput, TResult>(operationsFn)` takes an operations function and returns an action definition with four facets:

- `.action` — React Router action handler
- `.loader(loaderFn)` — wraps a loader to inject `_actionPermissions`
- `.client` — descriptor for the `useActions` hook
- `.buildOperation(db, input, ctx)` — builds the raw `Operation` (for composition)

```typescript
// app/actions/posts.ts
import { compose } from "@cfast/db";
import { eq } from "drizzle-orm";
import { createAction } from "~/actions.server";
import { posts, auditLogs } from "~/db/schema";

export const deletePost = createAction<{ postId: string }, Response>(
  (db, input, ctx) =>
    compose(
      [
        db.delete(posts).where(eq(posts.id, input.postId)),
        db.insert(auditLogs).values({
          id: nanoid(),
          userId: ctx.user.id,
          action: "post.deleted",
          targetType: "post",
          targetId: input.postId,
          metadata: JSON.stringify({ title: input.title }),
        }),
      ],
      async (runDelete, runAudit) => {
        await runDelete({});
        await runAudit({});
        return redirect("/");
      },
    ),
);
```

The operations function receives `(db, input, ctx)` where `ctx` has `{ db, user, grants }`. It returns an `Operation<TResult>` from `@cfast/db` — either a single operation or a `compose()`'d workflow.

## Composing Multiple Actions

When a route needs multiple actions, use `composeActions` with a named object:

```typescript
// app/routes/posts.$slug.tsx
import { composeActions } from "~/actions.server";
import { deletePost, publishPost, unpublishPost, addComment } from "~/actions/posts";

const composed = composeActions({
  deletePost,
  publishPost,
  unpublishPost,
  addComment,
});

export const action = composed.action;
```

The object keys become the action discriminators. When a form submits with `<input type="hidden" name="_action" value="deletePost" />`, `composeActions` routes to the correct handler. JSON requests use `{ _action: "deletePost", ...input }`.

`composeActions` returns the same four facets as `createAction`: `.action`, `.loader()`, `.client`, and `.actions` (the original definitions).

## Loader Integration

Wrap your loader with `.loader()` to inject permission status for the client:

```typescript
// Single action
export const loader = deletePost.loader(async ({ request, params }) => {
  // ... your normal loader logic
  return { post, author };
});

// Composed actions
export const loader = composed.loader(async ({ request, params }) => {
  return { post, author };
});
```

The wrapper calls `getContext`, builds each action's `Operation` to extract permission descriptors, checks them against the user's grants, and merges `_actionPermissions` into the loader data. The client never receives raw permission descriptors.

## Client Usage

The `useActions` hook reads `_actionPermissions` from loader data and provides submission controls per action:

```typescript
import { useActions } from "@cfast/actions/client";

function PostActions({ postId }: { postId: string }) {
  const actions = useActions(composed.client);

  const remove = actions.deletePost({ postId });
  const publish = actions.publishPost({ postId });

  return (
    <>
      <button
        onClick={publish.submit}
        disabled={!publish.permitted || publish.pending}
        hidden={publish.invisible}
      >
        Publish
      </button>
      <button
        onClick={remove.submit}
        disabled={!remove.permitted || remove.pending}
      >
        Delete
      </button>
    </>
  );
}
```

Each action function returns:

| Property | Type | Description |
|---|---|---|
| `permitted` | `boolean` | Whether the user has the required structural permissions |
| `invisible` | `boolean` | `true` when the user lacks all permissions (hide the UI entirely) |
| `reason` | `string \| null` | Human-readable explanation when `permitted` is `false` |
| `submit` | `() => void` | Submits the action via fetcher with `_action` discriminator |
| `pending` | `boolean` | `true` while the fetcher is in flight |
| `data` | `unknown` | The action's return value after execution |
| `error` | `unknown` | Error if the action failed |

## Input Parsing

Actions accept input from both FormData and JSON. The `_action` field is stripped automatically:

- **FormData**: `<input name="_action" value="deletePost" />` + other fields
- **JSON**: `{ _action: "deletePost", postId: "123" }`

## Exports

Server (`@cfast/actions`):

```typescript
export { createActions, checkPermissionStatus } from "./create-actions.js";
export type {
  Serializable, ActionContext, RequestArgs, ActionsConfig,
  OperationsFn, ActionPermissionStatus, ActionPermissionsMap,
  ClientDescriptor, ActionDefinition, ComposedActions,
} from "./types.js";
```

Client (`@cfast/actions/client`):

```typescript
export { useActions } from "./client/use-actions.js";
export type { ActionHookResult } from "./client/use-actions.js";
```

## Integration

- **`@cfast/db`** — Actions use `Operation` and `compose()` from `@cfast/db`. Permission descriptors are extracted from operations.
- **`@cfast/permissions`** — Grants flow through `getContext`. `checkPermissionStatus` matches grants against operation permission descriptors.
- **`@cfast/ui`** — UI components can consume `useActions()` for automatic permission-aware rendering.
