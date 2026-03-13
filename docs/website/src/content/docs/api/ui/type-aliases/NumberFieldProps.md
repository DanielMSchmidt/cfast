---
editUrl: false
next: false
prev: false
title: "NumberFieldProps"
---

> **NumberFieldProps** = [`BaseFieldProps`](/api/ui/type-aliases/basefieldprops/) & `object`

Defined in: [packages/ui/src/types.ts:714](https://github.com/DanielMSchmidt/cfast/blob/782808738c565da003cedd8bc6a734755e681fc7/packages/ui/src/types.ts#L714)

Props for the NumberField read-only display component.

Formats numbers using `Intl.NumberFormat` with optional currency and decimal
precision. Used by [DataTableProps](/api/ui/type-aliases/datatableprops/) cell renderers for numeric columns.

## Type Declaration

### currency?

> `optional` **currency**: `string`

ISO 4217 currency code for monetary formatting (e.g. "USD").

### decimals?

> `optional` **decimals**: `number`

Number of decimal places to display.

### locale?

> `optional` **locale**: `string`

Locale for number formatting. Defaults to "en".

### value

> **value**: `number` \| `null` \| `undefined`

Numeric value to display.

## See

[BaseFieldProps](/api/ui/type-aliases/basefieldprops/) for inherited label and className props.
