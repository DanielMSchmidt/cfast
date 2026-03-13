---
editUrl: false
next: false
prev: false
title: "fieldsForTable"
---

> **fieldsForTable**(`table`): `Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`\>\>

Defined in: [packages/ui/src/fields/field-for-column.ts:58](https://github.com/DanielMSchmidt/cfast/blob/9cc20c03745c81d3c35a3df2245735fc00e8f884/packages/ui/src/fields/field-for-column.ts#L58)

Given a Drizzle table, returns a map of column names to field components.

## Parameters

### table

`object` & `Record`\<`string`, `unknown`\>

## Returns

`Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`\>\>
