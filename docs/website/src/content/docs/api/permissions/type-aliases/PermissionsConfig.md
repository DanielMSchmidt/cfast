---
editUrl: false
next: false
prev: false
title: "PermissionsConfig"
---

> **PermissionsConfig**\<`TRoles`, `TUser`\> = `object`

Defined in: [packages/permissions/src/types.ts:142](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L142)

Configuration object for [definePermissions](/api/permissions/functions/definepermissions/).

## Type Parameters

### TRoles

`TRoles` *extends* readonly `string`[]

Tuple of role name string literals (use `as const`).

### TUser

`TUser` = `unknown`

The user type for typed `where` clauses (defaults to `unknown`).

## Properties

### grants

> **grants**: `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/type-aliases/grant/)[]\> \| (`grant`) => `Record`\<`TRoles`\[`number`\], [`Grant`](/api/permissions/type-aliases/grant/)[]\>

Defined in: [packages/permissions/src/types.ts:149](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L149)

A map from role to grant arrays, or a callback that receives a typed `grant` function.

***

### hierarchy?

> `optional` **hierarchy**: `Partial`\<`Record`\<`TRoles`\[`number`\], `TRoles`\[`number`\][]\>\>

Defined in: [packages/permissions/src/types.ts:153](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L153)

Optional role hierarchy declaring which roles inherit from which.

***

### roles

> **roles**: `TRoles`

Defined in: [packages/permissions/src/types.ts:147](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/permissions/src/types.ts#L147)

All roles in the application, declared with `as const` for type inference.
