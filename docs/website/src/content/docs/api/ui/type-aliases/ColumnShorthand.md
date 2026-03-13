---
editUrl: false
next: false
prev: false
title: "ColumnShorthand"
---

> **ColumnShorthand**\<`T`\> = `string` \| [`ColumnDef`](/api/ui/type-aliases/columndef/)\<`T`\>

Defined in: [packages/ui/src/types.ts:420](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/types.ts#L420)

Column definition shorthand: either a plain column key string or a full [ColumnDef](/api/ui/type-aliases/columndef/).

When a string is provided, the label is auto-derived from the key (e.g., `"createdAt"`
becomes "Created At") and column behavior (sorting, rendering) is inferred from the
Drizzle schema column type.

## Type Parameters

### T

`T` = `unknown`

The row object type, forwarded to [ColumnDef](/api/ui/type-aliases/columndef/) for type-safe rendering.

## Example

```ts
// Mix strings and full definitions:
const columns: ColumnShorthand<Post>[] = [
  "title",
  { key: "author", label: "Written by" },
  { key: "createdAt", sortable: false },
];
```
