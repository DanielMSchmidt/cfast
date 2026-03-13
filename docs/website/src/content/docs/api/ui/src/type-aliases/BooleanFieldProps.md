---
editUrl: false
next: false
prev: false
title: "BooleanFieldProps"
---

> **BooleanFieldProps** = [`BaseFieldProps`](/api/ui/src/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:457](https://github.com/DanielMSchmidt/cfast/blob/60210f6cd0c5f887dfbc9d3f753414b329cae974/packages/ui/src/types.ts#L457)

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
