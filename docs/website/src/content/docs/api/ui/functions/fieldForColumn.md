---
editUrl: false
next: false
prev: false
title: "fieldForColumn"
---

> **fieldForColumn**(`column`): `ComponentType`\<`any`\>

Defined in: [packages/ui/src/fields/field-for-column.ts:40](https://github.com/DanielMSchmidt/cfast/blob/411313cb52fffba4d319391ba8501eaf3ea7c30b/packages/ui/src/fields/field-for-column.ts#L40)

Maps a Drizzle column's metadata to the appropriate TypedField component.

Inspects the column's `dataType` and `name` to determine the best display
component. The mapping follows these rules:

- `boolean` or integer columns named `is*` -> [BooleanField](/api/ui/functions/booleanfield/)
- Columns containing `timestamp`, `date`, or `datetime` -> [DateField](/api/ui/functions/datefield/)
- Numeric types (`integer`, `real`, `float`, etc.) -> [NumberField](/api/ui/functions/numberfield/)
- Columns named `email` or `*Email` -> [EmailField](/api/ui/functions/emailfield/)
- `json`, `jsonb`, or `blob` -> [JsonField](/api/ui/functions/jsonfield/)
- Everything else -> [TextField](/api/ui/functions/textfield/)

## Parameters

### column

`ColumnMeta`

Drizzle column metadata with `dataType` and `name` properties.

## Returns

`ComponentType`\<`any`\>

A React component suitable for displaying the column's values.

## Example

```ts
import { fieldForColumn } from "@cfast/ui";

const Field = fieldForColumn({ dataType: "timestamp", name: "createdAt" });
// Field === DateField
```
