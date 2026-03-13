---
editUrl: false
next: false
prev: false
title: "FilterDef"
---

> **FilterDef** = `object`

Defined in: [packages/ui/src/types.ts:474](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L474)

Definition of a single filter in a [FilterBarProps](/api/ui/type-aliases/filterbarprops/).

Each filter maps a Drizzle column to a UI control. The filter state is serialized
to URL search params so that `@cfast/pagination`'s `parseParams()` can apply them
as Drizzle `where` clauses in the loader.

## See

 - [FilterType](/api/ui/type-aliases/filtertype/) for the supported input types.
 - [FilterOption](/api/ui/type-aliases/filteroption/) for select/multiSelect option entries.
 - [FilterBarProps](/api/ui/type-aliases/filterbarprops/) for the parent component props.

## Properties

### column

> **column**: `string`

Defined in: [packages/ui/src/types.ts:476](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L476)

Column name this filter applies to.

***

### display?

> `optional` **display**: `string`

Defined in: [packages/ui/src/types.ts:486](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L486)

Display field name for relation filters.

***

### label?

> `optional` **label**: `string`

Defined in: [packages/ui/src/types.ts:480](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L480)

Optional label override (defaults to column name).

***

### options?

> `optional` **options**: [`FilterOption`](/api/ui/type-aliases/filteroption/)[]

Defined in: [packages/ui/src/types.ts:482](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L482)

Options for select/multiSelect filters.

***

### placeholder?

> `optional` **placeholder**: `string`

Defined in: [packages/ui/src/types.ts:488](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L488)

Placeholder text for the filter input.

***

### table?

> `optional` **table**: `unknown`

Defined in: [packages/ui/src/types.ts:484](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L484)

Drizzle table for relation filters (async select).

***

### type

> **type**: [`FilterType`](/api/ui/type-aliases/filtertype/)

Defined in: [packages/ui/src/types.ts:478](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L478)

Input type determining the filter UI.
