---
editUrl: false
next: false
prev: false
title: "PermissionsConfig"
---

> **PermissionsConfig**\<`TRoles`, `TUser`\> = `object`

Defined in: [packages/permissions/src/types.ts:102](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L102)

Configuration object for [definePermissions](/api/permissions/src/functions/definepermissions/).

## Type Parameters

### TRoles

`TRoles` *extends* readonly `string`[]

Tuple of role name string literals (use `as const`).

### TUser

`TUser` = `unknown`

The user type for typed `where` clauses (defaults to `unknown`).

## Properties

### grants

> **grants**: `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/src/type-aliases/grant/)[]\> \| (`grant`) => `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/src/type-aliases/grant/)[]\>

Defined in: [packages/permissions/src/types.ts:109](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L109)

A map from role to grant arrays, or a callback that receives a typed `grant` function.

***

### hierarchy?

> `optional` **hierarchy**: `Partial`\<`Record`\<`TRoles`\[`number`\], `TRoles`\[`number`\][]\>\>

Defined in: [packages/permissions/src/types.ts:113](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L113)

Optional role hierarchy declaring which roles inherit from which.

***

### roles

> **roles**: `TRoles`

Defined in: [packages/permissions/src/types.ts:107](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/permissions/src/types.ts#L107)

All roles in the application, declared with `as const` for type inference.
