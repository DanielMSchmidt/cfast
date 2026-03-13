---
editUrl: false
next: false
prev: false
title: "Operation"
---

> **Operation**\<`TResult`\> = `object`

Defined in: [packages/db/src/types.ts:27](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L27)

A lazy, permission-aware database operation.

Every method on [Db](/api/db/type-aliases/db/) returns an `Operation` instead of a promise. The operation
exposes its permission requirements via `.permissions` for inspection and executes with
full permission checking via `.run()`. This two-phase design enables UI adaptation,
upfront composition via [compose](/api/db/functions/compose/), and introspection before any SQL is executed.

## Example

```ts
const op = db.query(posts).findMany();

// Inspect permissions without executing
console.log(op.permissions);
// => [{ action: "read", table: "posts" }]

// Execute with permission checks
const rows = await op.run({});
```

## Type Parameters

### TResult

`TResult`

The type of the result returned by `.run()`.

## Properties

### permissions

> **permissions**: [`PermissionDescriptor`](/api/permissions/type-aliases/permissiondescriptor/)[]

Defined in: [packages/db/src/types.ts:29](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L29)

Structural permission requirements. Available immediately without execution.

***

### run()

> **run**: (`params`) => `Promise`\<`TResult`\>

Defined in: [packages/db/src/types.ts:36](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/db/src/types.ts#L36)

Checks permissions, applies permission WHERE clauses, executes the query via Drizzle,
and returns the result. Throws `ForbiddenError` if the user's role lacks a required grant.

#### Parameters

##### params

`Record`\<`string`, `unknown`\>

Placeholder values for `sql.placeholder()` calls. Pass `{}` when no placeholders are used.

#### Returns

`Promise`\<`TResult`\>
