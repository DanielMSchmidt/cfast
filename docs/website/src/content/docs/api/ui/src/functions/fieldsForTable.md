---
editUrl: false
next: false
prev: false
title: "fieldsForTable"
---

> **fieldsForTable**(`table`): `Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`\>\>

Defined in: [packages/ui/src/fields/field-for-column.ts:58](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/fields/field-for-column.ts#L58)

Given a Drizzle table, returns a map of column names to field components.

## Parameters

### table

`object` & `Record`\<`string`, `unknown`\>

## Returns

`Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`\>\>
