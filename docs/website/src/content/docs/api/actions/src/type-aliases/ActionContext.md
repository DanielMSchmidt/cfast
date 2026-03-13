---
editUrl: false
next: false
prev: false
title: "ActionContext"
---

> **ActionContext**\<`TUser`\> = `object`

Defined in: [packages/actions/src/types.ts:18](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L18)

Context provided to every action's operations function.

## Type Parameters

### TUser

`TUser`

## Properties

### db

> **db**: [`Db`](/api/db/src/type-aliases/db/)

Defined in: [packages/actions/src/types.ts:20](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L20)

The Drizzle database instance.

***

### grants

> **grants**: [`Grant`](/api/permissions/src/type-aliases/grant/)[]

Defined in: [packages/actions/src/types.ts:24](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L24)

The user's permission grants, used for permission checking.

***

### user

> **user**: `TUser`

Defined in: [packages/actions/src/types.ts:22](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/actions/src/types.ts#L22)

The authenticated user.
