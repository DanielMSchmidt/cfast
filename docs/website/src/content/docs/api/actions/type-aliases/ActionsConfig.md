---
editUrl: false
next: false
prev: false
title: "ActionsConfig"
---

> **ActionsConfig**\<`TUser`\> = `object`

Defined in: [packages/actions/src/types.ts:78](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L78)

Configuration for the [createActions](/api/actions/functions/createactions/) factory.

Provides a `getContext` callback that resolves the per-request
[ActionContext](/api/actions/type-aliases/actioncontext/) (database, user, grants) for every action invocation.

## Example

```ts
const config: ActionsConfig<AppUser> = {
  getContext: async ({ request }) => {
    const ctx = await requireAuthContext(request);
    const db = createCfDb(env.DB, ctx);
    return { db, user: ctx.user, grants: ctx.grants };
  },
};
```

## Type Parameters

### TUser

`TUser`

The shape of the authenticated user object.

## Properties

### getContext()

> **getContext**: (`args`) => `Promise`\<[`ActionContext`](/api/actions/type-aliases/actioncontext/)\<`TUser`\>\>

Defined in: [packages/actions/src/types.ts:80](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/actions/src/types.ts#L80)

Resolves the per-request action context from the route handler arguments.

#### Parameters

##### args

[`RequestArgs`](/api/actions/type-aliases/requestargs/)

#### Returns

`Promise`\<[`ActionContext`](/api/actions/type-aliases/actioncontext/)\<`TUser`\>\>
