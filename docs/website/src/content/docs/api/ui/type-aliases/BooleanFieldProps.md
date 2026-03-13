---
editUrl: false
next: false
prev: false
title: "BooleanFieldProps"
---

> **BooleanFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:693](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L693)

Props for the BooleanField read-only display component.

Renders a colored chip indicating true/false status with customizable labels
and colors. Used by [DataTableProps](/api/ui/type-aliases/datatableprops/) cell renderers for boolean columns.

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

## See

 - [BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
 - [ChipSlotProps](/api/ui/type-aliases/chipslotprops/) for the underlying chip slot.
