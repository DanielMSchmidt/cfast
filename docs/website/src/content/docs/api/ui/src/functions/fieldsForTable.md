---
editUrl: false
next: false
prev: false
title: "fieldsForTable"
---

> **fieldsForTable**(`table`): `Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`\>\>

Defined in: [packages/ui/src/fields/field-for-column.ts:58](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/fields/field-for-column.ts#L58)

Given a Drizzle table, returns a map of column names to field components.

## Parameters

### table

`object` & `Record`\<`string`, `unknown`\>

## Returns

`Record`\<`string`, `ComponentType`\<[`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`\>\>
