# @cfast/actions

**Reusable, type-safe, permission-aware actions for React Router.**

React Router gives you one `action` per route. If a page has "Create Post", "Delete Post", and "Toggle Published", you end up writing a switch statement over a hidden form field. Every project. Every route. Every time.

`@cfast/actions` fixes this with two primitives:

- **`createAction`** — Define a single action with typed, serializable input/output and optional permission requirements. Actions are first-class values: reusable across routes, introspectable on the client.
- **`compose`** — Combine multiple actions into one route `action` export. The dispatcher is generated, not hand-written. If you only have one action, export it directly — no wrapper needed.

## Design Goals

- **Actions are values.** A `createAction` call returns a reusable action that can be exported, imported, passed to UI components, and composed with other actions. Not bound to a specific route.
- **Serializable by construction.** Input and output types are constrained to JSON-serializable data at the type level. If it can't cross the server/client boundary, TypeScript tells you.
- **Permissions are declared, not checked.** An action says what it needs. The framework enforces it on the server and exposes it to the client. The developer never writes an `if (!can(...))` guard.
- **Composable.** A single action can require multiple permissions across multiple tables. A single `permitted` boolean tells you if the whole thing is allowed.
- **React Router native.** Works with React Router's `action` export, `useActionData`, `useFetcher`, and file-based routing.

## Planned API

### Creating an Action

```typescript
import { createAction } from "@cfast/actions";

const createPost = createAction({
  //    Input must be serializable — TypeScript enforces this.
  //    Functions, classes, Dates, etc. are compile-time errors.
  input: {
    title: "" as string,
    content: "" as string,
  },

  handler: async (input, ctx) => {
    const post = await db.guarded(posts).insert({
      id: nanoid(),
      title: input.title,
      content: input.content,
      authorId: ctx.user.id,
    });
    return redirect(`/posts/${post.slug}`);
  },
});
```

The `Serializable` type constraint rejects non-serializable data at compile time:

```typescript
const broken = createAction({
  input: {
    callback: () => {},  // Type error: () => void is not assignable to Serializable
    date: new Date(),    // Type error: Date is not assignable to Serializable
  },
  handler: async (input) => { /* ... */ },
});
```

### Single Action Route

If a route only has one action, export it directly:

```typescript
// app/routes/posts.new.tsx
import { createPost } from "~/actions/posts";

export const action = createPost;
```

### Multi-Action Route with `compose`

When a route needs multiple actions, `compose` handles discrimination automatically:

```typescript
// app/routes/posts.$slug.tsx
import { compose } from "@cfast/actions";
import { deletePost, publishPost, unpublishPost, addComment } from "~/actions/posts";

export const action = compose(deletePost, publishPost, unpublishPost, addComment);
```

That's it. No switch statement, no hidden `_action` field to manage. `compose` generates the dispatcher, serializes/deserializes inputs, and routes to the right handler.

### Permission-Aware Actions

Actions can declare permission requirements. These are enforced on the server and introspectable on the client:

```typescript
const publishPost = createAction({
  input: { postId: "" as string },

  // This action needs: update the post + create an audit log
  requires: (ctx) => [
    ctx.can("update", posts, { where: (p) => p.id === ctx.input.postId }),
    ctx.can("create", auditLogs),
  ],

  handler: async (input, ctx) => {
    await db.guarded(posts)
      .update({ published: true, publishedAt: new Date() })
      .where(eq(posts.id, input.postId));
    await db.guarded(auditLogs).insert({
      id: nanoid(),
      action: "publish",
      targetId: input.postId,
    });
    return { published: true };
  },
});

const deletePost = createAction({
  input: { postId: "" as string },

  requires: (ctx) => [
    ctx.can("delete", posts, { where: (p) => p.id === ctx.input.postId }),
  ],

  handler: async (input, ctx) => {
    await db.guarded(posts).delete().where(eq(posts.id, input.postId));
    return redirect("/posts");
  },
});
```

### Using Actions in Components

#### Programmatic submission

```typescript
import { useAction } from "@cfast/actions";
import { publishPost } from "~/actions/posts";

function PublishButton({ postId }: { postId: string }) {
  const publish = useAction(publishPost, { postId });

  // publish.permitted  — can the user do this?
  // publish.reason     — if not, why? (which permission failed)
  // publish.invisible  — should the button be hidden entirely?
  // publish.submit()   — execute the action
  // publish.pending    — is the action currently executing?

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

### Composing Permission Requirements

An action can build on other actions' permission requirements:

```typescript
const archivePost = createAction({
  input: { postId: "" as string },

  requires: (ctx) => [
    // Include everything unpublish needs...
    ...unpublishPost.requires(ctx),
    // ...plus our own requirements
    ctx.can("update", posts, { where: (p) => p.id === ctx.input.postId }),
    ctx.can("execute", notifications),
  ],

  handler: async (input, ctx) => {
    await unpublishPost.execute(input, ctx);
    await db.guarded(posts).update({ archived: true }).where(eq(posts.id, input.postId));
    await notify(input.postId, "archived");
  },
});
```

### Actions Without Permissions

Permissions are optional. `createAction` and `compose` are useful even without `@cfast/permissions` — they still give you typed, reusable actions and automatic route dispatching:

```typescript
const subscribe = createAction({
  input: { email: "" as string },
  handler: async (input) => {
    await db.insert(subscribers).values({ email: input.email });
    return { subscribed: true };
  },
});

const unsubscribe = createAction({
  input: { email: "" as string },
  handler: async (input) => {
    await db.delete(subscribers).where(eq(subscribers.email, input.email));
    return { unsubscribed: true };
  },
});

// Route:
export const action = compose(subscribe, unsubscribe);
```

## How `compose` Works

`compose` assigns each action a stable discriminator derived from its name. When a form is submitted or `submit()` is called:

1. The discriminator is included automatically (hidden field for forms, part of the payload for programmatic calls)
2. `compose` reads the discriminator and routes to the correct action's handler
3. The input is deserialized and validated against the action's input type
4. Permissions are checked (if declared)
5. The handler runs

The client never sees the discrimination mechanism. It just calls `submit()` or renders a `<Form>`.

## Integration

- **@cfast/permissions** — Actions declare permission requirements using the same `can()` API
- **@cfast/ui** — `ActionButton` consumes action introspection for automatic show/hide/disable
- **@cfast/admin** — Admin table/row actions are `createAction` instances
- **@cfast/pagination** — Independent. Pagination and actions don't depend on each other.
