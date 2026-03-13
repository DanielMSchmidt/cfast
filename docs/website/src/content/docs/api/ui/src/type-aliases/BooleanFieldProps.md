---
editUrl: false
next: false
prev: false
title: "BooleanFieldProps"
---

> **BooleanFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:457](https://github.com/DanielMSchmidt/cfast/blob/6dc004d45e4fa573b48d45d682b12e9a15c348c8/packages/ui/src/types.ts#L457)

Props for the BooleanField read-only display component.

## Type Declaration

### falseColor?

> `optional` **falseColor**: `string`

Chip color when value is false. Defaults to "neutral".

### falseLabel?

> `optional` **falseLabel**: `string`

Label shown when value is false. Defaults to "No".

### trueColor?

> `optional` **trueColor**: `string`

Chip color when value is true. Defaults to "success".

### trueLabel?

> `optional` **trueLabel**: `string`

Label shown when value is true. Defaults to "Yes".

### value

> **value**: `boolean` \| `null` \| `undefined`

Boolean value to display.
