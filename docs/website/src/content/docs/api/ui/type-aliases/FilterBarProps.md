---
editUrl: false
next: false
prev: false
title: "FilterBarProps"
---

> **FilterBarProps** = `object`

Defined in: [packages/ui/src/types.ts:546](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L546)

Props for the FilterBar component.

Renders URL-synced filter controls derived from Drizzle column types. On filter
change, React Router navigates with updated search params -- no client state
management required. Use `values`/`onChange` for controlled mode instead.

## See

 - [FilterDef](/api/ui/type-aliases/filterdef/) for individual filter definitions.
 - [ListViewProps](/api/ui/type-aliases/listviewprops/) which composes FilterBar with DataTable and pagination.

## Properties

### filters

> **filters**: [`FilterDef`](/api/ui/type-aliases/filterdef/)[]

Defined in: [packages/ui/src/types.ts:550](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L550)

Filter definitions specifying which columns to filter and how.

***

### onChange()?

> `optional` **onChange**: (`values`) => `void`

Defined in: [packages/ui/src/types.ts:556](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L556)

Callback when filter values change (controlled mode).

#### Parameters

##### values

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### searchable?

> `optional` **searchable**: `string`[]

Defined in: [packages/ui/src/types.ts:552](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L552)

Column names that support full-text search.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:548](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L548)

Drizzle table for filter type inference.

***

### values?

> `optional` **values**: `Record`\<`string`, `unknown`\>

Defined in: [packages/ui/src/types.ts:554](https://github.com/DanielMSchmidt/cfast/blob/6bcebbe4adbcfa0ffe6c8ae5f4c6584a3a0c2eee/packages/ui/src/types.ts#L554)

Current filter values (controlled mode).
