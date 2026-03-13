---
editUrl: false
next: false
prev: false
title: "fieldForColumn"
---

> **fieldForColumn**(`column`): `ComponentType`\<`any`\>

Defined in: [packages/ui/src/fields/field-for-column.ts:22](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/fields/field-for-column.ts#L22)

Maps a Drizzle column's metadata to the appropriate TypedField component.

Uses `getTableColumns(table)` from drizzle-orm to get column metadata,
then maps the `dataType` to a field component.

## Parameters

### column

`ColumnMeta`

## Returns

`ComponentType`\<`any`\>
