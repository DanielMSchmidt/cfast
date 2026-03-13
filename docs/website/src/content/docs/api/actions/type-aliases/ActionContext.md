---
editUrl: false
next: false
prev: false
title: "ActionContext"
---

> **ActionContext**\<`TUser`\> = `object`

Defined in: [packages/actions/src/types.ts:35](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L35)

Context provided to every action's [OperationsFn](/api/actions/type-aliases/operationsfn/).

Created by the `getContext` callback in [ActionsConfig](/api/actions/type-aliases/actionsconfig/) and passed
alongside the database instance and parsed input to each action.

## Example

```ts
const ctx: ActionContext<{ id: string; role: string }> = {
  db,
  user: { id: "u_1", role: "author" },
  grants: [{ action: "manage", subject: "all" }],
};
```

## Type Parameters

### TUser

`TUser`

The shape of the authenticated user object.

## Properties

### db

> **db**: [`Db`](/api/db/type-aliases/db/)

Defined in: [packages/actions/src/types.ts:37](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L37)

The Drizzle database instance from `@cfast/db`.

***

### grants

> **grants**: [`Grant`](/api/permissions/type-aliases/grant/)[]

Defined in: [packages/actions/src/types.ts:41](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L41)

The user's permission [grants](/api/permissions/type-aliases/grant/), used for permission checking.

***

### user

> **user**: `TUser`

Defined in: [packages/actions/src/types.ts:39](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/actions/src/types.ts#L39)

The authenticated user for the current request.
