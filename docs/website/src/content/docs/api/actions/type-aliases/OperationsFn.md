---
editUrl: false
next: false
prev: false
title: "OperationsFn"
---

> **OperationsFn**\<`TInput`, `TResult`, `TUser`\> = (`db`, `input`, `ctx`) => [`Operation`](/api/db/type-aliases/operation/)\<`TResult`\>

Defined in: [packages/actions/src/types.ts:107](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L107)

A function that builds a database [Operation](/api/db/type-aliases/operation/) for an action.

Receives the Drizzle database, the parsed input, and the full
[ActionContext](/api/actions/type-aliases/actioncontext/). Returns an `Operation` (from `@cfast/db`) that
encapsulates both the query/mutation and its permission descriptors.

## Type Parameters

### TInput

`TInput`

The expected input shape for this action.

### TResult

`TResult`

The return type of the operation.

### TUser

`TUser`

The shape of the authenticated user object.

## Parameters

### db

[`Db`](/api/db/type-aliases/db/)

### input

`TInput`

### ctx

[`ActionContext`](/api/actions/type-aliases/actioncontext/)\<`TUser`\>

## Returns

[`Operation`](/api/db/type-aliases/operation/)\<`TResult`\>

## Example

```ts
const deletePostOps: OperationsFn<{ postId: string }, Response, AppUser> =
  (db, input, ctx) =>
    compose(
      [db.delete(posts).where(eq(posts.id, input.postId))],
      async (runDelete) => {
        await runDelete({});
        return redirect("/");
      },
    );
```
