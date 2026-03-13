---
editUrl: false
next: false
prev: false
title: "FilterDef"
---

> **FilterDef** = `object`

Defined in: [packages/ui/src/types.ts:293](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L293)

Definition of a single filter in a FilterBar.

## Properties

### column

> **column**: `string`

Defined in: [packages/ui/src/types.ts:295](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L295)

Column name this filter applies to.

***

### display?

> `optional` **display**: `string`

Defined in: [packages/ui/src/types.ts:305](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L305)

Display field name for relation filters.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/ui/src/types.ts:299](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L299)

Optional label override (defaults to column name).

***

### options?

> `optional` **options**: [`FilterOption`](/api/ui/src/type-aliases/filteroption/)[]

Defined in: [packages/ui/src/types.ts:301](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L301)

Options for select/multiSelect filters.

***

### placeholder?

> `optional` **placeholder**: `string`

Defined in: [packages/ui/src/types.ts:307](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L307)

Placeholder text for the filter input.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:303](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L303)

Drizzle table for relation filters (async select).

***

### type

> **type**: [`FilterType`](/api/ui/src/type-aliases/filtertype/)

Defined in: [packages/ui/src/types.ts:297](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L297)

Input type determining the filter UI.
