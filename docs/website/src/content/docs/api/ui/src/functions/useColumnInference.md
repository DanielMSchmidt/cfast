---
editUrl: false
next: false
prev: false
title: "useColumnInference"
---

> **useColumnInference**(`table`, `columns?`): `InferredColumn`[]

Defined in: [packages/ui/src/hooks/use-column-inference.ts:37](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/hooks/use-column-inference.ts#L37)

Inspects a Drizzle table's columns and returns inferred column definitions
with appropriate TypedField components.

Memoized -- only recomputes when the table or columns array changes.

## Parameters

### table

A Drizzle table object (columns accessible via iteration)

`Record`\<`string`, `unknown`\> | `undefined`

### columns?

`string`[]

Optional subset of column names to include; preserves the given order

## Returns

`InferredColumn`[]

Array of inferred column definitions with field components

## Example

```ts
const cols = useColumnInference(posts, ["title", "createdAt", "published"]);
// cols[0].field === TextField
// cols[1].field === DateField
// cols[2].field === BooleanField
```
