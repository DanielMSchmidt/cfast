---
editUrl: false
next: false
prev: false
title: "GrantFn"
---

> **GrantFn**\<`TUser`\> = (`action`, `subject`, `options?`) => [`Grant`](/api/permissions/type-aliases/grant/)

Defined in: [packages/permissions/src/types.ts:96](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/permissions/src/types.ts#L96)

Type-safe grant builder function, parameterized by the user type.

Used when `grants` is provided as a callback in [PermissionsConfig](/api/permissions/type-aliases/permissionsconfig/)
so that `where` clauses receive a correctly typed `user` parameter.

## Type Parameters

### TUser

`TUser`

The user type passed to `where` clause callbacks.

## Parameters

### action

[`PermissionAction`](/api/permissions/type-aliases/permissionaction/)

### subject

[`DrizzleTable`](/api/permissions/type-aliases/drizzletable/) | `"all"`

### options?

#### where?

(`columns`, `user`) => `DrizzleSQL` \| `undefined`

## Returns

[`Grant`](/api/permissions/type-aliases/grant/)
