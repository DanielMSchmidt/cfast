---
editUrl: false
next: false
prev: false
title: "Db"
---

> **Db** = `object`

Defined in: [packages/db/src/types.ts:173](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L173)

A permission-aware database instance bound to a specific user.

All query and mutation methods return lazy `Operation` objects that check permissions at `.run()` time.

## Properties

### batch()

> **batch**: (`operations`) => [`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`[]\>

Defined in: [packages/db/src/types.ts:185](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L185)

Groups multiple operations into a single operation with merged, deduplicated permissions.

#### Parameters

##### operations

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`\>[]

#### Returns

[`Operation`](/api/db/src/type-aliases/operation/)\<`unknown`[]\>

***

### cache

> **cache**: `object`

Defined in: [packages/db/src/types.ts:187](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L187)

Cache control methods for manual invalidation.

#### invalidate()

> **invalidate**: (`options`) => `Promise`\<`void`\>

Invalidate cached queries by tag names and/or table names.

##### Parameters

###### options

###### tables?

`string`[]

###### tags?

`string`[]

##### Returns

`Promise`\<`void`\>

***

### delete()

> **delete**: (`table`) => [`DeleteBuilder`](/api/db/src/type-aliases/deletebuilder/)

Defined in: [packages/db/src/types.ts:181](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L181)

Creates a delete builder for the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)

#### Returns

[`DeleteBuilder`](/api/db/src/type-aliases/deletebuilder/)

***

### insert()

> **insert**: (`table`) => [`InsertBuilder`](/api/db/src/type-aliases/insertbuilder/)

Defined in: [packages/db/src/types.ts:177](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L177)

Creates an insert builder for the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)

#### Returns

[`InsertBuilder`](/api/db/src/type-aliases/insertbuilder/)

***

### query()

> **query**: (`table`) => [`QueryBuilder`](/api/db/src/type-aliases/querybuilder/)

Defined in: [packages/db/src/types.ts:175](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L175)

Creates a query builder for reading rows from the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)

#### Returns

[`QueryBuilder`](/api/db/src/type-aliases/querybuilder/)

***

### unsafe()

> **unsafe**: () => `Db`

Defined in: [packages/db/src/types.ts:183](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L183)

Returns a new `Db` instance that skips all permission checks.

#### Returns

`Db`

***

### update()

> **update**: (`table`) => [`UpdateBuilder`](/api/db/src/type-aliases/updatebuilder/)

Defined in: [packages/db/src/types.ts:179](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/db/src/types.ts#L179)

Creates an update builder for the given table.

#### Parameters

##### table

[`DrizzleTable`](/api/permissions/src/type-aliases/drizzletable/)

#### Returns

[`UpdateBuilder`](/api/db/src/type-aliases/updatebuilder/)
