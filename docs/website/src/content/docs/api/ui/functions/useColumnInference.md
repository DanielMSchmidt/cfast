---
editUrl: false
next: false
prev: false
title: "useColumnInference"
---

> **useColumnInference**(`table`, `columns?`): `InferredColumn`[]

Defined in: [packages/ui/src/hooks/use-column-inference.ts:47](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/hooks/use-column-inference.ts#L47)

Inspects a Drizzle table's columns and returns inferred [ColumnDef](/api/ui/type-aliases/columndef/) entries
with appropriate TypedField components attached.

Uses [fieldForColumn](/api/ui/functions/fieldforcolumn/) internally to map each Drizzle column's `dataType`
to a display component (e.g., `DateField`, `BooleanField`, `TextField`).
Labels are auto-derived from camelCase column keys.

Memoized -- only recomputes when the `table` reference or `columns` array changes.

## Parameters

### table

A Drizzle table object whose entries expose `dataType` and `name` metadata.
  Pass `undefined` to return an empty array (safe for conditional rendering).

`Record`\<`string`, `unknown`\> | `undefined`

### columns?

`string`[]

Optional subset of column names to include. When provided,
  only matching columns are returned and their order is preserved.

## Returns

`InferredColumn`[]

Array of InferredColumn definitions, each containing a `field`
  component ready for rendering.

## Example

```ts
import { useColumnInference } from "@cfast/ui";
import { posts } from "~/db/schema";

const cols = useColumnInference(posts, ["title", "createdAt", "published"]);
// cols[0].field === TextField
// cols[1].field === DateField
// cols[2].field === BooleanField
```
