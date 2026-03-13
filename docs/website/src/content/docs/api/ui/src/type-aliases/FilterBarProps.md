---
editUrl: false
next: false
prev: false
title: "FilterBarProps"
---

> **FilterBarProps** = `object`

Defined in: [packages/ui/src/types.ts:350](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L350)

Props for the FilterBar component.
Renders URL-synced filter controls derived from column types.

## Properties

### filters

> **filters**: [`FilterDef`](/api/ui/src/type-aliases/filterdef/)[]

Defined in: [packages/ui/src/types.ts:354](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L354)

Filter definitions specifying which columns to filter and how.

***

### onChange()?

> `optional` **onChange**: (`values`) => `void`

Defined in: [packages/ui/src/types.ts:360](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L360)

Callback when filter values change (controlled mode).

#### Parameters

##### values

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### searchable?

> `optional` **searchable**: `string`[]

Defined in: [packages/ui/src/types.ts:356](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L356)

Column names that support full-text search.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:352](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L352)

Drizzle table for filter type inference.

***

### values?

> `optional` **values**: `Record`\<`string`, `unknown`\>

Defined in: [packages/ui/src/types.ts:358](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L358)

Current filter values (controlled mode).
