---
editUrl: false
next: false
prev: false
title: "createActions"
---

> **createActions**\<`TUser`\>(`config`): `object`

Defined in: [packages/actions/src/create-actions.ts:106](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/create-actions.ts#L106)

Creates a scoped action factory bound to a shared context provider.

Returns two functions — `createAction` and `composeActions` — that share the
same `getContext` callback. This ensures every action in the application resolves
its database, user, and grants consistently.

## Type Parameters

### TUser

`TUser` = `any`

The shape of the authenticated user object.

## Parameters

### config

[`ActionsConfig`](/api/actions/type-aliases/actionsconfig/)\<`TUser`\>

The [ActionsConfig](/api/actions/type-aliases/actionsconfig/) providing the `getContext` callback.

## Returns

An object with `createAction` and `composeActions` functions.

### composeActions()

> **composeActions**: \<`TActions`\>(`actions`) => [`ComposedActions`](/api/actions/type-aliases/composedactions/)\<`TActions`\>

Combines multiple [action definitions](/api/actions/type-aliases/actiondefinition/) into a single
route handler that dispatches by the `_action` discriminator field.

The returned [ComposedActions](/api/actions/type-aliases/composedactions/) object provides a unified `.action` handler,
a `.loader()` wrapper that checks permissions for all actions at once,
and a `.client` descriptor covering every action name.

#### Type Parameters

##### TActions

`TActions` *extends* `Record`\<`string`, [`ActionDefinition`](/api/actions/type-aliases/actiondefinition/)\<`any`, `any`, `any`\>\>

A record mapping action names to their definitions.

#### Parameters

##### actions

`TActions`

An object of named action definitions to compose.

#### Returns

[`ComposedActions`](/api/actions/type-aliases/composedactions/)\<`TActions`\>

A [ComposedActions](/api/actions/type-aliases/composedactions/) object with combined handler, loader, and client descriptor.

#### Example

```ts
const composed = composeActions({
  deletePost,
  publishPost,
  unpublishPost,
});

export const action = composed.action;
export const loader = composed.loader(async ({ request, params }) => {
  return { post: await getPost(params.slug) };
});
```

### createAction()

> **createAction**: \<`TInput`, `TResult`\>(`operationsFn`) => [`ActionDefinition`](/api/actions/type-aliases/actiondefinition/)\<`TInput`, `TResult`, `TUser`\>

Defines a single permission-aware action.

Takes an [OperationsFn](/api/actions/type-aliases/operationsfn/) that builds a database `Operation` from
the parsed input and action context. Returns an [ActionDefinition](/api/actions/type-aliases/actiondefinition/)
with `.action`, `.loader()`, `.client`, and `.buildOperation` facets.

#### Type Parameters

##### TInput

`TInput`

The expected input shape for this action.

##### TResult

`TResult`

The return type of the action handler.

#### Parameters

##### operationsFn

[`OperationsFn`](/api/actions/type-aliases/operationsfn/)\<`TInput`, `TResult`, `TUser`\>

A function that builds the database operation for this action.

#### Returns

[`ActionDefinition`](/api/actions/type-aliases/actiondefinition/)\<`TInput`, `TResult`, `TUser`\>

An [ActionDefinition](/api/actions/type-aliases/actiondefinition/) with action handler, loader wrapper, client descriptor, and build method.

#### Example

```ts
const deletePost = createAction<{ postId: string }, Response>(
  (db, input, ctx) =>
    compose(
      [db.delete(posts).where(eq(posts.id, input.postId))],
      async (runDelete) => {
        await runDelete({});
        return redirect("/");
      },
    ),
);

export const action = deletePost.action;
```

## Example

```ts
import { createActions } from "@cfast/actions";

export const { createAction, composeActions } = createActions({
  getContext: async ({ request }) => {
    const ctx = await requireAuthContext(request);
    const db = createCfDb(env.DB, ctx);
    return { db, user: ctx.user, grants: ctx.grants };
  },
});
```
