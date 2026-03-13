---
editUrl: false
next: false
prev: false
title: "GrantFn"
---

> **GrantFn**\<`TUser`\> = (`action`, `subject`, `options?`) => [`Grant`](/api/permissions/src/type-aliases/grant/)

Defined in: [packages/permissions/src/types.ts:65](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L65)

Type-safe grant builder function, parameterized by the user type.

Used when `grants` is provided as a callback in [PermissionsConfig](/api/permissions/src/type-aliases/permissionsconfig/)
so that `where` clauses receive a correctly typed `user` parameter.

## Type Parameters

### TUser

`TUser`

## Parameters

### action

[`PermissionAction`](/api/permissions/src/type-aliases/permissionaction/)

### subject

[`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/) | `"all"`

### options?

#### where?

(`columns`, `user`) => `DrizzleSQL` \| `undefined`

## Returns

[`Grant`](/api/permissions/src/type-aliases/grant/)
