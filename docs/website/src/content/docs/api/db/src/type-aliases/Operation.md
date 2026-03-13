---
editUrl: false
next: false
prev: false
title: "Operation"
---

> **Operation**\<`TResult`\> = `object`

Defined in: [packages/db/src/types.ts:13](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L13)

A lazy, permission-aware database operation.

Every method on `Db` returns an `Operation` instead of a promise. The operation exposes
its permission requirements via `.permissions` and executes with permission checking via `.run()`.

## Type Parameters

### TResult

`TResult`

The type of the result returned by `.run()`.

## Properties

### permissions

> **permissions**: [`PermissionDescriptor`](/api/permissions/src/type-aliases/permissiondescriptor/)[]

Defined in: [packages/db/src/types.ts:15](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L15)

Structural permission requirements. Available immediately without execution.

***

### run()

> **run**: (`params`) => `Promise`\<`TResult`\>

Defined in: [packages/db/src/types.ts:17](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L17)

Checks permissions, applies WHERE clauses, executes via Drizzle, and returns results.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`TResult`\>
